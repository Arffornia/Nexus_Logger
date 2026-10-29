import fs from 'fs';
import os from 'os';
import path from 'path';
import { DEFAULT_MAX_PREVIOUS_LOGS, NexusLogger } from "../src/NexusLogger";

describe("NexusLogger log rotation", () => {
    let dir: string;
    let file: string;
    const rotated = (i: number) => path.join(dir, `launcher_log.${i}.txt`);
    const read = (p: string) => fs.readFileSync(p, 'utf-8');

    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-logger-rot-'));
        file = path.join(dir, "launcher_log.txt");
    });

    afterEach(() => {
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it("names rotated files <name>.<n><ext>", () => {
        expect(NexusLogger.getRotatedLogPath("/a/launcher_log.txt", 2)).toEqual(path.join("/a", "launcher_log.2.txt"));
        expect(NexusLogger.getRotatedLogPath("/a/log", 1)).toEqual(path.join("/a", "log.1"));
    });

    it("keeps the previous session as <name>.1 and starts an empty file", () => {
        fs.writeFileSync(file, "session 1 crash\n");

        new NexusLogger(file);

        expect(read(file)).toEqual("");
        expect(read(rotated(1))).toEqual("session 1 crash\n");
    });

    it("shifts older logs and drops the ones beyond the default count", () => {
        for (let session = 1; session <= DEFAULT_MAX_PREVIOUS_LOGS + 2; session++) {
            fs.writeFileSync(file, `session ${session}\n`);
            new NexusLogger(file);
        }

        // 5 sessions written, default keeps 3 previous ones: 5, 4, 3
        expect(DEFAULT_MAX_PREVIOUS_LOGS).toBe(3);
        expect(read(rotated(1))).toEqual("session 5\n");
        expect(read(rotated(2))).toEqual("session 4\n");
        expect(read(rotated(3))).toEqual("session 3\n");
        expect(fs.existsSync(rotated(4))).toBe(false);
        expect(fs.readdirSync(dir).sort()).toEqual(
            ["launcher_log.1.txt", "launcher_log.2.txt", "launcher_log.3.txt", "launcher_log.txt"]);
    });

    it("honours a custom maxPreviousLogs", () => {
        for (let session = 1; session <= 3; session++) {
            fs.writeFileSync(file, `session ${session}\n`);
            new NexusLogger(file, "P", { maxPreviousLogs: 1 });
        }

        expect(read(rotated(1))).toEqual("session 3\n");
        expect(fs.existsSync(rotated(2))).toBe(false);
    });

    it("does not rotate an empty or missing file", () => {
        new NexusLogger(file);
        fs.writeFileSync(file, "");
        new NexusLogger(file);

        expect(fs.readdirSync(dir)).toEqual(["launcher_log.txt"]);
    });

    it("maxPreviousLogs: 0 keeps the old truncate-only behaviour", () => {
        fs.writeFileSync(file, "old\n");
        new NexusLogger(file, undefined, { maxPreviousLogs: 0 });

        expect(read(file)).toEqual("");
        expect(fs.readdirSync(dir)).toEqual(["launcher_log.txt"]);
    });

    it("does not throw when rotation fails", () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        fs.writeFileSync(file, "old\n");
        // a directory where the rotated file should go makes the rename fail
        fs.mkdirSync(rotated(1));
        fs.writeFileSync(path.join(rotated(1), "blocker"), "");

        expect(() => new NexusLogger(file, undefined, { maxPreviousLogs: 1 })).not.toThrow();
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Unable to rotate log files"));
        errorSpy.mockRestore();
    });
});
