import { existsSync, renameSync, rmSync, statSync, writeFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';

enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
}

export interface NexusLoggerOptions {
    /**
     * How many previous log files to keep. On start, a non-empty `log.txt` becomes `log.1.txt`,
     * `log.1.txt` becomes `log.2.txt`, and so on; the oldest one beyond this count is deleted.
     * `0` disables rotation (the file is simply emptied, as before 1.1.0). Default: 3.
     */
    maxPreviousLogs?: number;

    /**
     * Called with every message before it is written to the console and the file.
     * Return the message with secrets removed (tokens, passwords...).
     * If it throws, the message is replaced by a placeholder: the raw message is never written.
     */
    redact?: (message: string) => string;
}

export const DEFAULT_MAX_PREVIOUS_LOGS = 3;
const REDACTION_FAILED = '[message hidden: redact callback failed]';

export class NexusLogger {
    private readonly logFilePath: string;
    private readonly logPrefix: string;
    private readonly maxPreviousLogs: number;
    private readonly redact?: (message: string) => string;
    private readonly writeQueue: string[] = [];
    private isWriting: boolean = false;

    constructor(logFilePath: string, logPrefix?: string, options?: NexusLoggerOptions) {
        this.logFilePath = logFilePath;
        this.logPrefix = logPrefix ?? 'NexusLogger';
        this.maxPreviousLogs = Math.max(0, Math.floor(options?.maxPreviousLogs ?? DEFAULT_MAX_PREVIOUS_LOGS));
        this.redact = options?.redact;
        this.rotateLogFiles();
        this.initLogFile();
    }

    /** Path of the n-th previous log: `dir/name.<n>.ext` (`launcher_log.txt` -> `launcher_log.1.txt`). */
    public static getRotatedLogPath(logFilePath: string, index: number): string {
        const { dir, name, ext } = path.parse(logFilePath);
        return path.join(dir, `${name}.${index}${ext}`);
    }

    // Synchronous, like initLogFile: it must be done before the first queued write
    private rotateLogFiles(): void {
        if (this.maxPreviousLogs === 0) return;

        try {
            if (!existsSync(this.logFilePath) || statSync(this.logFilePath).size === 0) return;

            const rotated = (i: number) => NexusLogger.getRotatedLogPath(this.logFilePath, i);

            rmSync(rotated(this.maxPreviousLogs), { force: true });
            for (let i = this.maxPreviousLogs - 1; i >= 1; i--) {
                if (existsSync(rotated(i))) {
                    renameSync(rotated(i), rotated(i + 1));
                }
            }
            renameSync(this.logFilePath, rotated(1));
        } catch (error) {
            console.error(`[Logger Error]: Unable to rotate log files. Details: ${error.message}`);
        }
    }

    // Synchronous on purpose: the file must be ready before the first queued write (same as published 1.0.2)
    private initLogFile(): void {
        try {
            writeFileSync(this.logFilePath, '', { flag: 'w' });
        } catch (error) {
            console.error(`[Logger Error]: Unable to initialize log file. Details: ${error.message}`);
        }
    }

    private async processQueue(): Promise<void> {
        if (this.isWriting) return;
        this.isWriting = true;

        while (this.writeQueue.length > 0) {
            const message = this.writeQueue.shift();
            if (!message) continue;

            try {
                await writeFile(this.logFilePath, message + '\n', { flag: 'a' });
            } catch (error) {
                console.error(`[Logger Error]: Unable to write to log file. Details: ${error.message}`);
            }
        }

        this.isWriting = false;
    }

    private enqueueLog(message: string): void {
        this.writeQueue.push(message);
        this.processQueue();
    }

    private applyRedaction(message: string): string {
        if (!this.redact) return message;

        try {
            const redacted = this.redact(String(message));
            return typeof redacted === 'string' ? redacted : REDACTION_FAILED;
        } catch {
            return REDACTION_FAILED;
        }
    }

    private writeGenericLog(message: string, level: LogLevel): void {
        const timestamp = new Date().toISOString();
        const formattedMsg = `[${timestamp}] [${this.logPrefix}] [${level}]: ${this.applyRedaction(message)}`;

        switch (level) {
            case LogLevel.DEBUG:
                console.debug(formattedMsg);
                break;
            case LogLevel.INFO:
                console.info(formattedMsg);
                break;
            case LogLevel.WARN:
                console.warn(formattedMsg);
                break;
            case LogLevel.ERROR:
                console.error(formattedMsg);
                break;
            default:
                break;
        }

        this.enqueueLog(formattedMsg);
    }

    public debug(message: string): void {
        this.writeGenericLog(message, LogLevel.DEBUG);
    }

    public info(message: string): void {
        this.writeGenericLog(message, LogLevel.INFO);
    }

    public warn(message: string): void {
        this.writeGenericLog(message, LogLevel.WARN);
    }

    public error(message: string): void {
        this.writeGenericLog(message, LogLevel.ERROR);
    }
}
