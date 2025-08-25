## Product Requirements Document — termnotes (CLI)

### Working name and identifiers
- App name placeholder: `$APP_NAME` (current working name: `termnotes`).
- Primary binary alias target: `tn` (confirmed); documented fallback: `qn` (quick-note).
- Package distribution name: `termnotes` (subject to change with final naming).

---

## 1) Purpose and Goals

### Problem
Developers and terminal-heavy users need a zero-friction way to jot down tasks and notes throughout the day, with context resetting daily while preserving historical notes.

### Goals (MVP)
- Be the go-to method for jotting quick notes and tasks from the terminal.
- 0-config install and immediate first success.
- Daily use; each day is isolated in its own file for focus, historical files remain accessible.

### Success Metrics
- Time-to-first-success: user can install and add a note/task in < 30 seconds.
- Daily usage by primary user (self) sustained for 2 weeks.
- Error-free runs for core flows (> 99% of invocations).

### Non-goals (MVP)
- No date overrides (`--date`, `--yesterday`).
- No search across notes.
- No config file beyond defaults.
- No stdin input for add.
- No atomic writes or backup copies.
- No viewer installer command.
- No git sync.

---

## 2) Users and Context
- Primary persona: the author (developer), with intent to open-source.
- Environment: local terminal first; should also work over SSH without extra steps.
- Shells: zsh and bash.
- Platforms: macOS and Linux (unofficial support; Windows is out of scope for MVP).

---

## 3) Scope (MVP)
- Add note and add task to today’s file.
- View today’s file, or only Notes/Tasks sections.
- Interactive mode to toggle task completion.
- Auto-create today’s file on any command if it does not exist.
- Clear, friendly-leaning-neutral errors and a single-screen help with examples.

Out-of-scope items are captured under Roadmap.

---

## 4) Naming, Install, Distribution, License
- Binary name: `tn`. Document `qn` as a supported fallback alias.
- Install method (MVP): Bun global install (e.g., `bun add -g termnotes` or equivalent publish target).
- Future installs: `curl` script and Homebrew formula.
- License: MIT for MVP. Note: MIT permits commercial use; if a copyleft license is desired, revisit prior to 1.0.0.

---

## 5) Platform Support
- macOS (Apple Silicon and Intel) and Linux distributions commonly used by developers.
- Shells: zsh, bash.

---

## 6) Storage and Data Model
- Default directory: `~/.termnotes/notes`.
- File naming: `YYYY-MM-DD.md` using system local timezone.
- File template on first create:

```md
## Tasks

## Notes
```

- Notes: single-line entries `- text` (MVP); multi-line and editor integration come after MVP.
- Tasks: markdown checkboxes (`- [ ] task`, `- [x] task`).
- Allow duplicates (no deduping in MVP).
- No timestamps in MVP.
- Size expectation: small markdown files; emit a non-fatal warning at ~1 MB to signal unusual growth.

---

## 7) Functional Requirements

### FR1: Show today’s file
- Command: `tn`
- Behavior: detect and use a viewer in order `glow` → `bat` → `cat`.
- If file does not exist, create it with the template before display.
- Acceptance:
  - If `glow` exists, file renders with markdown; else fallback works.
  - Exit code 0 on success.

### FR2: Add a note
- Commands:
  - `tn "note text"`
  - `tn -- "note text starting with - or --"`
- Behavior: append `- note text` under the Notes section, creating file if needed.
- Acceptance:
  - Line is appended in Notes; file remains valid with one blank line between sections.
  - Empty or whitespace-only text errors with guidance; exit code 2.

### FR3: Add a task
- Commands:
  - `tn -t "task text"`
  - `tn -t -- "task that starts with -"`
- Behavior: append `- [ ] task text` under the Tasks section.
- Acceptance:
  - Line appended in Tasks; structure preserved; empty text errors with exit code 2.

### FR4: View only sections
- Commands:
  - `tn -t` → show only Tasks
  - `tn -n` → show only Notes
- Behavior: print only the selected section to stdout (no external viewer); create file if missing.
- Acceptance:
  - Prints exactly the section content (excluding header) or a friendly message if empty.

### FR5: Interactive toggle of tasks
- Command: `tn -it`
- Behavior: list all tasks with checkboxes, pre-select completed tasks; allow multi-select to toggle. Preserve order; only flip `[ ]` ↔ `[x]`.
- Display indices next to tasks in interactive list and in `-t` output for reference.
- Acceptance:
  - Toggling updates corresponding lines and writes back; other content unchanged.
  - If no tasks exist, print friendly message and exit 0.

### FR6: Section parsing and normalization
- Maintain exactly one `## Tasks` and one `## Notes`, in this order, separated by a single blank line.
- If headers are missing/duplicated, normalize in memory to the canonical shape while preserving existing content order as reasonably as possible.
- Only treat items within the Tasks section as toggleable tasks.

### FR7: Errors and help
- Mutually exclusive flags: `-t` and `-n` cannot be combined (e.g., `-nt`, `-tn`). Error with guidance and exit code 2.
- Single-screen `--help` includes examples and flag summary.
- Tone: friendly-leaning-neutral; concise and actionable.

---

## 8) CLI Specification (MVP)

### Commands and Flags
- `tn` → show today’s file via viewer.
- `tn "note"` → add note to Notes.
- `tn -t "task"` → add unchecked task to Tasks.
- `tn -t` → show Tasks section only (with indices).
- `tn -n` → show Notes section only.
- `tn -it` → interactive toggle of task completion.
- `tn --help` → show help with examples.

### Parsing rules
- `-t` with text → add task; without text → show Tasks only.
- No `-t`/`-n` with text → add note; `-n` with text is invalid (notes are default add).
- `-t` and `-n` together → error.
- `--` marks end of options; everything after is treated as text.

### Color and output
- Color enabled by default for CLI messages.
- Quiet by default (no verbose/quiet flags). Consider `--debug` post-MVP.

---

## 9) Non-Functional Requirements
- Performance: CLI cold start to action < 200 ms on modern dev machines for simple add operations.
- Reliability: warn on file sizes > 1 MB; otherwise normal operation. Atomic writes and backups are post-MVP.
- Security/Privacy: no network access; all local file operations; no telemetry.

---

## 10) Dependencies
- Runtime: Bun (TypeScript).
- Argument parser: `sade` (preferred for MVP) or `commander` if needed.
- Interactive prompts: `@clack/prompts`.
- Viewer detection: spawn `glow`/`bat`/`cat`.

---

## 11) Installation and Distribution
- MVP: publish to a Bun-friendly registry and support `bun add -g termnotes` (or final package name).
- Note that `bn` may be unavailable; primary alias is `tn`, fallback is `qn`.
- Future: Homebrew formula and curl installer.

---

## 12) Documentation Deliverables
- README with:
  - Quick start (install + first commands)
  - Feature examples
  - Viewer notes and fallback behavior
  - Troubleshooting (binary alias collisions)
- `.docs/TECH_SPEC.md` for technical reference (exists).

---

## 13) Testing and Release
- Tests: minimal for MVP; basic unit tests for section parsing and toggle.
- CI: GitHub Actions running `bun test` on supported platforms.
- Versioning: SemVer starting at `0.1.0`.

---

## 14) Acceptance Criteria Checklist (MVP)
- Install via `bun add -g` and run `tn` successfully.
- `tn` creates today’s file if missing and displays it via viewer.
- `tn "note"` adds a note under Notes.
- `tn -t "task"` adds an unchecked task under Tasks.
- `tn -t` prints Tasks section with indices.
- `tn -n` prints Notes section.
- `tn -it` toggles selected tasks and persists changes.
- Errors for `-tn`/`-nt`, and for empty text, include help guidance.
- Files remain in canonical format with one Tasks and one Notes section.

---

## 15) Roadmap (Post-MVP, prioritized)
0. `--open` editor flag support
1. Search (refine UX by date, etc.)
2. Open note by date (`--date`, `--yesterday`)
3. Stdin support for add
4. Atomic writes
5. Viewer installer hints/command
6. Config file with preferences (timestamps, viewer, dir)
7. Completed-only view `-x` and auto-move options
8. Git integration for syncing notes
 9. Interactive `tn --setup` wizard to guide config using `@clack/prompts`

---

## 16) Open Questions
- Final name and binary alias policy: confirm whether `bn` is acceptable or default to `qn`.
- License: MIT is set for MVP; if copyleft intent remains, consider GPL-3.0 before wider release.


