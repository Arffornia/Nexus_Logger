# Nexus Logger

`@arffornia/nexus_logger` is a small logger that prints timestamped, levelled messages to the console and appends
them to a log file. It is part of the Arffornia ecosystem: the
[Arffornia launcher](https://github.com/Arffornia/Arffornia_Launcher_V.5.2) uses it for `launcher_log.txt`, the file
players share when they ask for support. Architecture docs (coming soon): https://arffornia.github.io/docs/

## Requirements

- Node.js 22 (CI runs on 22)

## Install

```bash
npm i @arffornia/nexus_logger
```

## Usage

```ts
import { NexusLogger } from '@arffornia/nexus_logger';

const logger = new NexusLogger('./launcher_log.txt', 'MyApp'); // prefix is optional (default: NexusLogger)

logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warn message');
logger.error('Error message');
```

Each line looks like `[2026-10-29T10:00:00.000Z] [MyApp] [INFO]: Info message`. It goes to the matching
`console.*` method and is appended to the file through an internal queue, so writes keep their order.

The log file is created (and emptied) when the logger is constructed.

## Commands

| Command | What it does |
|---|---|
| `npm ci` | Install the exact dependency tree from `package-lock.json` |
| `make check` | Type-check, run the tests, build (what CI runs) |
| `make test` / `npm test` | Run the Jest tests |
| `make build` / `npm run build` | Compile to `dist/` (`tsc` + `tsc-alias`) |

## Configuration

None. The file path and prefix are constructor arguments. No environment variables are read.

## Release process

Releases are done by the maintainer; contributors never publish.

1. Bump `version` in `package.json` (and the lockfile: `npm version <x.y.z> --no-git-tag-version`) in a PR, merge it.
2. Tag the merge commit on `main` and push the tag: `git tag v<x.y.z> && git push origin v<x.y.z>`.
3. `.github/workflows/publish.yml` checks that the tag matches `package.json`, runs `make check` and runs
   `npm publish --provenance`. It needs the repository secret `NPM_TOKEN`.

## License

MIT, see [LICENSE](LICENSE).
