# termnotes (tn)

![npm](https://img.shields.io/npm/v/termnotes-cli?logo=npm)
![Bun](https://img.shields.io/badge/Bun-powered-orange?logo=bun&logoColor=white)
![License](https://img.shields.io/github/license/chris-tse/termnotes)

Zero‑config daily notes + tasks in your terminal.
Each day is one Markdown file with two sections: Tasks and Notes

## Installation
Requires [Bun](https://bun.sh).

```bash
npm install -g termnotes-cli
pnpm install -g termnotes-cli
bun add -g termnotes-cli
```

## Quick Start
Both `tn` and `termnotes` work. The first run creates today’s file if missing.

```bash
# Add a task (shorthand for `tn task`)
tn t Ship the new feature

# Add a note (shorthand for `tn note`)
tn n ChatGPT said I was absolutely right

# Mark task as complete (starting at 1)
tn x 1

# View today's notes
tn
```
Output:
```md
## Tasks

[x] Ship the new feature

## Notes

- ChatGPT said I was absolutely right

```

## Commands
| Command | Shorthand | Description |
|---------|-----------|-------------|
| `tn` | — | View today’s note |
| `tn task [text]` | `tn t [text]` | Append a task |
| `tn note [text]` | `tn n [text]` | Append a note bullet |
| `tn x <number>` | — | Toggle task status at 1‑based index |
| `tn --help` | — | Show help / usage |

## Features
- **Focus on Today:** Always opens today’s Daily Note. A new file is created on first use each day.
  - Planned feature for importing previous day uncompleted tasks and viewing historical notes
- **Viewer auto-detect:** Prefers `glow`, then `bat`, else falls back to `cat`.
- **Location:** Default location: `~/.termnotes/notes/YYYY-MM-DD.md` (configurable in a future release).


## Uninstall

Use the uninstall command from the package manager used to install the CLI.

Manually delete `~/.termnotes`.


## Development
```bash
bun install
bun dev
```

---
## Planned Enhancements
- Configurable notes directory
- Task carry‑over from previous day
- Archiving and search
