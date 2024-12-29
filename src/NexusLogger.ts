import { writeFile } from 'fs/promises';

enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
}

export class NexusLogger {
    private readonly logFilePath: string;
    private readonly logPrefix: string;
    private readonly writeQueue: string[] = [];
    private isWriting: boolean = false;

    constructor(logFilePath: string, logPrefix?: string) {
        this.logFilePath = logFilePath;
        this.logPrefix = logPrefix ?? 'NexusLogger';
        this.initLogFile();
    }

    private async initLogFile(): Promise<void> {
        try {
            await writeFile(this.logFilePath, '', { flag: 'w' });
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

    private writeGenericLog(message: string, level: LogLevel): void {
        const timestamp = new Date().toISOString();
        const formattedMsg = `[${timestamp}] [${this.logPrefix}] [${level}]: ${message}`;
        console.error(formattedMsg); 
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
