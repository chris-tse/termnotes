# termnotes (tn)

Zero-config daily notes and tasks CLI for your terminal. Each day is a Markdown file with `## Tasks` and `## Notes`.

## Installation

Requires [Bun](https://bun.sh) runtime.

```bash
npm install -g @bunkalabs/termnotes
pnpm install -g @bunkalabs/termotes
bun add -g @bunkalabs/termnotes
```

## Usage (MVP)

```bash
# Show today’s file (prefers glow → bat → cat)
tn

# Add a note
tn "some text here"

# Add a task
tn -t "fix css bug"

# Show only tasks / only notes
tn -t
tn -n

# Pass text that looks like flags
tn -t -- "task starting with - or --"
```

## Setup (dev)

- Install deps:

```bash
bun install
```

- Run:

```bash
bun run dev -- --help
```

## Defaults

- Notes directory: `~/.termnotes/notes`
- Alias: primary `tn`

## License

MIT
