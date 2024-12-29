import { NexusLogger } from "../src/NexusLogger";


describe("This is an example test suite", () => {
    beforeAll(async () => {
        // Do something before all tests of this file
    });

    afterAll(async () => {
        // Do something after all tests of this file
    }, 1 * 1000); // You also can set a different timeout

    const logger = new NexusLogger("log.txt");

    it("A test of the test suite", () => {
        // Do some procress here

        logger.info("This is a Info message.");
        logger.warn("This is a Warn message.");
        logger.error("This is a Error message.");
        logger.debug("This is a Debug message.");

        // Check the test result
        expect(true).toEqual(true);
        expect(true).not.toEqual(false);
    });
});