# termnotes (tn)

Zero-config daily notes and tasks CLI for your terminal. Each day is a Markdown file with `## Tasks` and `## Notes`.

## Setup (dev)
- Install deps:
```bash
bun install
```
- Run:
```bash
bun run dev -- --help
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

## Defaults
- Notes directory: `~/.termnotes/notes`
- Alias: primary `tn` (fallback `qn`)

## License
MIT
