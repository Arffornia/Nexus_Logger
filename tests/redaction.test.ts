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

const redactToken = (message: string) => message.replace(/(--accessToken\s+)\S+/g, '$1[REDACTED]');

describe("NexusLogger redaction hook", () => {
    let dir: string;
    let file: string;
    const content = () => (fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : '');

    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-logger-redact-'));
        file = path.join(dir, "log.txt");
        for (const level of ['debug', 'info', 'warn', 'error'] as const) {
            jest.spyOn(console, level).mockImplementation(() => {});
        }
    });

    afterEach(() => {
        jest.restoreAllMocks();
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it("redacts the message in the file and on the console, for every level", async () => {
        const logger = new NexusLogger(file, "Test", { redact: redactToken });

        logger.debug("[MCLC]: Launching with arguments --username Steve --accessToken eyJsecret123 --version 1.21.1");
        logger.info("--accessToken a1");
        logger.warn("--accessToken a2");
        logger.error("--accessToken a3");

        await waitFor(() => content().split('\n').filter(Boolean).length === 4);

        expect(content()).not.toMatch(/eyJsecret123|a1|a2|a3/);
        expect(content()).toContain("--username Steve --accessToken [REDACTED] --version 1.21.1");
        for (const level of ['debug', 'info', 'warn', 'error'] as const) {
            const printed = (console[level] as jest.Mock).mock.calls.map((c) => c[0]).join('\n');
            expect(printed).toContain("--accessToken [REDACTED]");
            expect(printed).not.toMatch(/eyJsecret123|a1|a2|a3/);
        }
    });

    it("never writes the raw message when the callback throws", async () => {
        const logger = new NexusLogger(file, "Test", { redact: () => { throw new Error("boom"); } });

        expect(() => logger.info("--accessToken topsecret")).not.toThrow();

        await waitFor(() => content().includes("[INFO]"));
        expect(content()).not.toContain("topsecret");
        expect(content()).toContain("[message hidden: redact callback failed]");
    });

    it("never writes the raw message when the callback returns a non-string", async () => {
        const logger = new NexusLogger(file, "Test", { redact: (() => undefined) as unknown as (m: string) => string });

        logger.info("topsecret");

        await waitFor(() => content().includes("[INFO]"));
        expect(content()).not.toContain("topsecret");
    });

    it("leaves messages untouched without a callback", async () => {
        const logger = new NexusLogger(file);
        logger.info("--accessToken visible");
        await waitFor(() => content().includes("visible"));
        expect(content()).toContain("--accessToken visible");
    });
});
