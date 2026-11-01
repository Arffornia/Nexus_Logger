import fs from 'fs';
import os from 'os';
import path from 'path';

// Async writes never complete here: whatever the constructor does to the file must be synchronous.
jest.mock('fs/promises', () => ({ writeFile: jest.fn(() => new Promise(() => {})) }));

import { NexusLogger } from "../src/NexusLogger";

describe("NexusLogger log file initialisation", () => {
    let dir: string;

    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-logger-init-'));
        jest.spyOn(console, 'info').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it("creates the file synchronously in the constructor", () => {
        const file = path.join(dir, "log.txt");
        new NexusLogger(file);
        expect(fs.existsSync(file)).toBe(true);
    });

    it("empties a previous file synchronously, so it cannot race with the first queued write", () => {
        const file = path.join(dir, "log.txt");
        fs.writeFileSync(file, "old content\n");
        new NexusLogger(file);
        expect(fs.readFileSync(file, 'utf-8')).toEqual("");
    });
});
