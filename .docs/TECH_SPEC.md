## termnotes (tn) — Technical Specification (MVP)

### Overview
Command-line tool to manage daily notes and tasks. Each day is stored in its own Markdown file with two sections: `## Tasks` and `## Notes`.

### Goals (MVP)
- Add note or task to today’s file.
- View today’s file or only Tasks/Notes sections.
- Interactive mode to toggle task completion.
- Auto-create today’s file on any command if it does not exist.
- Clear errors and helpful usage text.

Future items (post-MVP) are listed at the end.

---

## Runtime and Tooling
- Runtime: Bun (TypeScript). Use Bun’s standard APIs (`Bun.spawn`, `Bun.file`, `Bun.write`).
- No Node/npm/pnpm/vite usage (workspace rule).
- Platform: macOS/Linux. Windows support is out of scope for MVP.

## Defaults and Paths
- Default notes directory: `~/.termnotes/notes`.
  - Rationale: avoids cluttering `~/notes`, keeps app data scoped.
  - Expand `~` via `$HOME` (do not assume shells).
- File naming: `YYYY-MM-DD.md` (local time).
- Auto-create the directory tree and file on any command if missing.

## Time and Date (MVP)
- Use system local timezone.
- Only “today” is supported in MVP (no `--date`, `--yesterday` yet).

## File Template and Format
When creating a new daily file, initialize with:

```md
## Tasks

## Notes
```

- Tasks: markdown checkboxes
  - Incomplete: `- [ ] task description`
  - Complete: `- [x] task description`
- Notes: markdown list items `- note text`
- Maintain exactly one `## Tasks` and one `## Notes`, in that order, separated by a blank line.
- Do not add horizontal rules or hidden markers (keep the file clean). Programmatic safety is achieved by parsing headers.

## Section Parsing Strategy
- Parse file into lines once.
- Find exact header lines matching `## Tasks` and `## Notes`.
- Determine section ranges as:
  - Tasks: from the `## Tasks` line (exclusive) up to the `## Notes` line (exclusive), trimming a single blank line at edges.
  - Notes: from the `## Notes` line (exclusive) to end of file, trimming a single blank line at edges.
- If a header is missing:
  - Rebuild a valid canonical file in memory: insert both headers in correct order, preserving any recoverable content below the nearest matching header if feasible; otherwise start from the template.
- If duplicate headers exist: collapse into a single section preserving content in order of appearance.

## CLI Commands and Behavior (MVP)

### Invocation Summary
- `tn` → display today’s file using viewer detection.
- `tn "note text"` → append a note under Notes.
- `tn -t "task text"` → append an unchecked task under Tasks.
- `tn -t` → display only Tasks section.
- `tn -n` → display only Notes section.
- `tn -it` → interactive toggle of task completion.
- `tn --help` → usage and examples.

### Flags and Parsing Rules
- Mutually exclusive:
  - `-t` (tasks) and `-n` (notes) may not be combined. If both are present (e.g., `-tn` or `-nt`), error with guidance.
- Text vs view:
  - `-t` with text → add a task.
  - `-t` with no text → view only the Tasks section.
  - no `-t`/`-n` with text → add a note.
  - `-n` with no text → view only the Notes section.
- `--` end-of-options delimiter is supported: anything after `--` is treated as text input.
- If both positional text and `--` text appear, prefer text after `--`.
- If no flags and no text → show today’s file.

### Input Sources (MVP)
- Primary: command arguments/`--` text.
- Stdin support: defer to post-MVP to reduce complexity.

### Output Viewer Detection
- Preferred order:
  1) `glow` (if installed)
  2) `bat` (if installed)
  3) `cat` (always fallback)
- Detection strategy: try to spawn viewer with `--version` to confirm availability, otherwise fall through.
- Optional helper (post-MVP): `tn --install-viewer glow` can attempt platform-appropriate install (e.g., Homebrew on macOS: `brew install glow`). Not part of MVP logic.

### Interactive Mode (`-it`)
- Render a checkbox list of all tasks (in file order):
  - Pre-select completed tasks to reflect current state.
  - User can toggle selection; on submit, apply the toggles (flip `[ ]`/`[x]`).
- MVP: single-pass toggle update; keep ordering intact; do not edit task text.
- Library: `@clack/prompts` for a responsive, modern TUI.

## Dependencies (MVP)
- Argument parsing: recommend `sade` (tiny, ESM-friendly) or `commander` (mature). Choose one:
  - `sade`: minimal surface, great for small CLIs.
  - `commander`: richer API, common patterns.
- Interactive prompts: `@clack/prompts`.
- No other runtime deps required. Use Bun APIs for process spawning and filesystem.

Recommendation for MVP:
- Use `sade` for argument parsing + `@clack/prompts` for `-it`.

## Error Handling and Exit Codes
- Invalid flag combination (e.g., both `-t` and `-n`):
  - Print clear error and usage examples; exit code 2.
- Empty text on add (e.g., `bn -t "   "`):
  - Print error: "Empty text"; exit code 2.
- No tasks to show or toggle:
  - Print info message; exit code 0.
- Unexpected I/O error:
  - Print concise message to stderr; exit code 1.

## Usage/Help Text (MVP)

Examples:

```bash
# Show today’s file
tn

# Add a note
tn "some text here"

# Add a task
tn -t "fix css bug"

# Show only tasks / only notes
tn -t
tn -n

# Interactive toggle
tn -it

# Use -- to pass text that looks like flags
tn -t -- "task starting with - or --"
```

Errors show a brief cause plus a compact help summary.

## Implementation Plan (MVP)

1) Path resolution
   - Resolve base dir `~/.bun-note/notes`.
   - Ensure directory exists.
   - Compute today’s file path via local date `YYYY-MM-DD.md`.

2) File ensure + load
   - If file missing → write template.
   - Read file into memory (string → lines).
   - Parse section boundaries; normalize headers if needed.

3) Operations
   - Add note: append `- {text}` to Notes section.
   - Add task: append `- [ ] {text}` to Tasks section.
   - View only: slice corresponding section and print.
   - Interactive: list tasks with checkboxes; apply toggles.

4) Save
   - Reconstruct file string with a single blank line between sections.
   - Write back to disk.

5) Display
   - Detect viewer (`glow` → `bat` → `cat`).
   - Stream file to chosen viewer for `tn` (no flags) or to stdout when showing sections.

## Data Structures
- In-memory representation:
  - `lines: string[]`
  - `tasksStartIdx`, `tasksEndIdx`, `notesStartIdx`, `notesEndIdx`
  - `taskLines: string[]`, `noteLines: string[]`
- Helpers:
  - `findSectionRanges(lines)` → indices
  - `appendTask(lines, text)`
  - `appendNote(lines, text)`
  - `toggleTasks(lines, indicesToToggle)`
  - `renderSection(lines, start, end)`

## UX Details and Edge Cases
- Preserve trailing whitespace and original EOLs; normalize only section boundaries.
- If user inserts other headers/content, keep them in their section.
- Do not toggle items in Notes even if they look like tasks; only within Tasks range.
- If file is corrupted beyond recognition, rebuild canonical template and proceed (warn once to stderr).

## Post-MVP Roadmap
- Date selection: `--date YYYY-MM-DD`, `--yesterday`, `--open` to launch `$EDITOR`.
- Search: `-s "keyword"` across files.
- Config file `~/.config/$APP_NAME/config.json` for:
  - custom notes dir, viewer preference, timestamp on add.
- Interactive setup wizard `tn --setup` to create/update config using `@clack/prompts`.
- Stdin support for add when no text arg provided.
- Atomic writes (temp + rename) for safety.
- Viewer install helper: `tn --install-viewer glow`.
- Git integration for syncing notes.

---

### Summary of Key Decisions
- Default dir: `~/.termnotes/notes`.
- Auto-create file on any command.
- Local timezone, today-only (MVP).
- Flags: `-t`/`-n` mutually exclusive; `--` supported.
- Viewer: glow → bat → cat.
- Interactive: `@clack/prompts` with pre-selected completed tasks.
- Parser: `sade` recommended for MVP.


