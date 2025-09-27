# termnotes (tn)

Zero-config daily notes and tasks CLI for your terminal. Each day is a Markdown file with `## Tasks` and `## Notes`.

## Installation

Requires [Bun](https://bun.sh) runtime.

```bash
npm install -g termnotes-cli
pnpm install -g termnotes-cli
bun add -g termnotes-cli
```

## Usage

Both `tn` and `termnotes` CLI entrypoints are available:

```bash
# Show help
tn --help
termnotes --help
```

### Show today's notes
Run `tn` to show the day's notes. If it's the first time you've run this on a day, it will create a new empty set of notes.
```bash
tn

# Output (starts day with empty template)
# ## Tasks
#
# ## Notes
#
```

### Create a task
Use the `task` action or shorthand `t` to append a new task item to the list.

```bash
tn t ship the feature

# Output:
# ## Tasks
# 
# [ ] ship the feature
#
# ## Notes
#
```

### Create a note
Use the `note` action or shorthand `n` to append a new note to the list.

```bash
tn n a random thought

# Output:
# ## Tasks
# 
# [ ] ship the feature
#
# ## Notes
#
# - a random thought
```

### Toggle a task
Use the `x` action to toggle a task's completion status.

```bash
tn x 1

# Output:
# ## Tasks
# 
# [x] ship the feature
#
# ## Notes
#
# - a random thought
```

## Setup (dev)

Install dependencies and run the dev script

```bash
bun install
bun dev
```
