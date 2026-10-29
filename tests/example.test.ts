import fs from 'fs';
import os from 'os';
import path from 'path';
import { NexusLogger } from "../src/NexusLogger";

async function waitFor(predicate: () => boolean, timeoutMs = 2000): Promise<void> {
    const start = Date.now();
    while (!predicate()) {
        if (Date.now() - start > timeoutMs) throw new Error('timeout');
        await new Promise((r) => setTimeout(r, 10));
    }
}

describe("NexusLogger", () => {
    let dir: string;

    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-logger-'));
        jest.spyOn(console, 'debug').mockImplementation(() => {});
        jest.spyOn(console, 'info').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it("prints every level to the matching console method with prefix and level", async () => {
        const file = path.join(dir, "log.txt");
        const logger = new NexusLogger(file, "TestPrefix");

        logger.info("This is a Info message.");
        logger.warn("This is a Warn message.");
        logger.error("This is a Error message.");
        logger.debug("This is a Debug message.");

        await waitFor(() => fs.existsSync(file) && fs.readFileSync(file, 'utf-8').includes("Debug message"));

        expect(console.info).toHaveBeenCalledWith(expect.stringMatching(/^\[.+\] \[TestPrefix\] \[INFO\]: This is a Info message\.$/));
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("[TestPrefix] [WARN]: This is a Warn message."));
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining("[TestPrefix] [ERROR]: This is a Error message."));
        expect(console.debug).toHaveBeenCalledWith(expect.stringContaining("[TestPrefix] [DEBUG]: This is a Debug message."));
    });

    it("appends every message to the log file in order", async () => {
        const file = path.join(dir, "log.txt");
        const logger = new NexusLogger(file, "TestPrefix");

        logger.info("first");
        logger.error("second");

        await waitFor(() => fs.existsSync(file) && fs.readFileSync(file, 'utf-8').includes("second"));
        const lines = fs.readFileSync(file, 'utf-8').trim().split('\n');
        expect(lines).toHaveLength(2);
        expect(lines[0]).toMatch(/\[TestPrefix\] \[INFO\]: first$/);
        expect(lines[1]).toMatch(/\[TestPrefix\] \[ERROR\]: second$/);
    });

    it("uses NexusLogger as the default prefix", async () => {
        const file = path.join(dir, "log.txt");
        const logger = new NexusLogger(file);
        logger.info("hello");
        expect(console.info).toHaveBeenCalledWith(expect.stringContaining("[NexusLogger] [INFO]: hello"));
        await waitFor(() => fs.existsSync(file) && fs.readFileSync(file, 'utf-8').includes("hello"));
    });

    it("creates the log file", async () => {
        const file = path.join(dir, "log.txt");
        new NexusLogger(file);
        await waitFor(() => fs.existsSync(file));
        expect(fs.existsSync(file)).toBe(true);
    });
});
