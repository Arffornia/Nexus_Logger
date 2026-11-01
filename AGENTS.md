# AGENTS.md — Nexus_Logger

Guide for AI agents and newcomers. Read it before changing anything.

## Purpose

TypeScript library published to npm as `@arffornia/nexus_logger`. `NexusLogger` writes
`[ISO timestamp] [prefix] [LEVEL]: message` to the console and appends it to a log file.
Main consumer: the Arffornia launcher (`Arffornia/Arffornia_Launcher_V.5.2`, `src/main/index.js`), which writes
`launcher_log.txt` in the game directory. Players paste that file in support channels, so it must never contain secrets.

## Repo map

| Path | What |
|---|---|
| `src/index.ts` | Public exports |
| `src/NexusLogger.ts` | The logger (file init, write queue, levels) |
| `tests/*.test.ts` | Jest tests |
| `dist/` | Build output (ignored; `main` is `dist/index.js`) |

## Commands

```bash
npm ci          # install (lockfile is committed)
make check      # tsc --noEmit + jest + build — must pass before any PR
make test       # jest only
make build      # tsc && tsc-alias -> dist/
```

## Conventions

- English everywhere (code, comments, docs, commits, PRs).
- Conventional Commits; one PR per issue; PR body: What / Why / How it was tested / Risk & revert.
- Keep the public API backward compatible: `new NexusLogger(path, prefix?)` and `debug/info/warn/error(message)`
  are used by the launcher. New options go in an optional extra argument.
- Do not bump `version` or publish: the maintainer releases.

## Hard rules

- Never replace this library (or Nexus_Java / Nexus_Saver / Nexus_Mods) with a third-party one. Improve it.
- Never commit secrets. Never merge, tag, publish or push to `main`.
- Behaviour changes need an issue.

## Testing strategy

- Tests write into a temp dir (`fs.mkdtempSync(os.tmpdir() …)`), never into the repo.
- File writes are asynchronous: wait for the queue to drain (poll the file) before asserting its content.

## Gotchas (from the 2026-10-29 audit)

- Keep `src/` the only source of what is on npm: 1.0.1/1.0.2 were once published from unpushed code (sync
  `initLogFile`). The constructor must prepare the file synchronously, before the first queued write.
- The file is truncated on every start, so the previous session (often the crash) is lost. No rotation.
- No redaction: the launcher forwards third-party debug output that can contain tokens.
- Never add `fs`/`path` (or other Node built-ins) to `dependencies`: they resolve to unrelated npm packages.

## Related repos

- `Arffornia/Arffornia_Launcher_V.5.2` (consumer)
- `Arffornia/Nexus_Java`, `Arffornia/Nexus_Saver`, `Arffornia/Nexus_Mods` (sibling libraries)
