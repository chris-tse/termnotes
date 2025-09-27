# NOTE / TASK PARSING — TECH SPEC (CURRENT STATE)

Status: Draft (pre-release)
Scope: Documents how the existing (MVP WIP) parsing / rendering / persistence pipeline works today, its fragilities, and improvement directions. Assumes no backward compatibility guarantees yet (product unreleased, files only produced by this codebase).

---
## 1. Purpose
Provide an onboarding overview so a new contributor can reason about how a daily markdown file is:
1. Ensured / created
2. Parsed into an in-memory `Document`
3. Mutated via high-level actions
4. Rendered back to canonical markdown

---
## 2. High-Level Flow
```
CLI command → FileStore.loadTodayDocument
             ↳ ensure directory + file (template)
             ↳ read whole file as string
             ↳ parseDocument(text)  => { tasks[], notes[] }
             ↳ reduceDocument(doc, Action) (e.g. AddTask)
             ↳ renderDocument(nextDoc) -> markdown string
             ↳ saveDocument(path, content)
             ↳ Viewer.showFile(path)
```
All operations are whole-document (no incremental edits). The file is fully re-rendered on each mutation.

---
## 3. Data Model (`src/lib/document.ts`)
```ts
export type TaskItem = { text: string; done: boolean };
export type NoteItem = { text: string };
export type Document = { tasks: TaskItem[]; notes: NoteItem[] };

// Mutation intents (domain-level actions)
AddTask(text)
AddNote(text)
ToggleTask(index)
```
- No IDs; position = identity.
- No timestamps, metadata, or multi-line support.

---
## 4. Parsing Rules (Current Implementation)
File must have two markdown H2 headers:
```
## Tasks
(optional task lines ...)
## Notes
(optional note lines ...)
```
Recognition:
- Task line regex: `^-\s\[( |x)\]\s(.*)$` → captures completion + text.
- Note line regex: `^-\s(.*)$` (BUT only lines **after** `## Notes`).
- Lines not matching the patterns are ignored (and lost upon save).
- If either header is missing → parser returns an empty `Document` (drops all existing content silently). The save step then emits a minimal canonical file if mutated.
- Line ending normalization: all CRLF/CR → `\n` before splitting.

Implication: Parsing is NOT lossless. Original spacing, comments, blank lines, and unknown bullets are discarded on first mutation.

---
## 5. Rendering Rules
`renderDocument` produces a canonical string:
```
## Tasks
<task lines or blank>
## Notes
<note lines or blank>
```
Details:
- Each task: `- [ ] text` or `- [x] text`.
- Each note: `- text`.
- Always includes a blank line between sections (implemented via an empty line after tasks block, even if no tasks).
- Appends a trailing newline after last note if notes exist.
- Collapses any original vertical spacing to this canonical shape.

---
## 6. Mutation (`reduceDocument`)
- AddTask / AddNote: trim input; ignore if empty after trim.
- ToggleTask: bounds-checked index flip of `done` boolean.
- Pure transformation with no side effects; all persistence is outside in `FileStore`.

---
## 7. FileStore (`src/lib/file-store.ts`)
Responsibilities:
1. Build today’s path (local time) → `YYYY-MM-DD.md` under `Config.notesDir`.
2. Ensure directory & file (template if new): `## Tasks\n\n## Notes\n`.
3. Load: read entire file string, invoke `parseDocument`.
4. Save: call `renderDocument` and write full contents (overwrite).

No atomic write (direct overwrite) and no diffing; every save rewrites entire file.

---
## 8. Viewer (`src/lib/viewer.ts`)
Post-save display step spawns external tool (glow → bat → cat). Failures are logged, not fatal.

---
## 9. Known Fragilities / Brittleness
| Area | Issue | Impact |
|------|-------|--------|
| Header dependency | Missing either header returns empty doc | Silent data loss on malformed file |
| Non-lossless parse | Unrecognized lines (comments, extra blanks, other markdown) dropped | User edits outside CLI are destroyed |
| Regex strictness | Only exact `- [ ]` / `- [x]` recognized; uppercase X or extra spaces ignored | Potential user confusion / lost tasks |
| Notes regex scope | Generic `- ` pattern after Notes; items like tasks mistakenly placed under Notes remain notes forever | Hard to promote/move without manual edit |
| No error surfacing | Malformed structure doesn’t warn; just empties | Hidden corruption |
| Full overwrite | Concurrent invocations race; later one wins (last write wins) | Possible lost updates |
| Lack of atomicity | Crash mid-write could truncate file | Data corruption edge cases |
| No bounds feedback | Toggle out-of-range silently no-ops | Debug difficulty |
| Lack of extensibility hooks | Adding metadata (timestamps, priorities) requires changing regex & rendering simultaneously | Higher refactor cost |
| Shadowed legacy code | Legacy `task.ts`, `note.ts`, `file.ts` partial duplicates & a recursion bug in `Task` service | Confusion for newcomers |

---
## 10. Short-Term Improvement Candidates
1. Graceful Header Repair: If one header missing, reconstruct minimal structure while preserving detectable content; emit warning once.
2. Lossless Preservation Layer: Track and re-emit unknown lines (e.g., store `rawPreamble`, `rawBetweenSections`, `rawNotesTail`).
3. Atomic Writes: Write to `path.tmp` + rename for durability.
4. Concurrency Guard: Simple lock file (`<path>.lock`) or timestamp/hash check before write.
5. Explicit Parse Result Type: `{ doc, diagnostics: Diagnostic[] }` where each diagnostic contains severity + message + span.
6. Defensive Toggle: Return `Effect.fail` on out-of-range index instead of silent no-op.
7. Normalize Headers on Parse: If duplicates, merge sequentially; keep first ordering.
8. Consolidate Code: Remove legacy imperative modules after migrating any still-needed helpers (e.g., `isBlank`).

---
## 11. Medium-Term Improvements
- Extensible Tokenizer: Minimal line-oriented tokenizer producing a sequence of typed nodes (Header, Task, Note, Unknown, Blank) → allows richer future features (timestamps, priorities, groups) without regex sprawl.
- Structured Rendering with Idempotency: Rendering a parsed file then parsing again yields identical `Document` + node sequence (round-trip fidelity tests).
- Metadata Support: Optional `@created: ISO8601` trailing annotation handled transparently.
- Multi-Line Notes / Tasks: Fold continuation lines (indented or blank-separated) while preserving original formatting.
- Configurable Date Source: Inject clock / timezone for deterministic tests.

---
## 12. Example Round Trip (Today)
Input file:
```
## Tasks
- [ ] ship something

## Notes
- random idea
(LOST LINE) This explanatory line will be dropped
```
parseDocument →
```
{ tasks: [ { text: 'ship something', done: false } ],
  notes: [ { text: 'random idea' } ] }
```
After adding note "another": rendered file becomes:
```
## Tasks
- [ ] ship something

## Notes
- random idea
- another
```
Lost elements: blank line after notes bullet kept? (Yes). The stray `(LOST LINE)` line is gone permanently.

---
## 13. Glossary
- Canonical Form: Minimal normalized markdown produced by `renderDocument`.
- Lossless Parsing: Ability to parse → render without dropping unrelated user-authored lines.
- Diagnostic: Machine-readable parse warning or error (not yet implemented).

---
## 14. Onboarding Summary
If you need to add a new mutation:
1. Add a new `DocumentAction` variant.
2. Extend `reduceDocument` switch.
3. (Maybe) extend regex (if it introduces a new line type) — current system is simplistic.
4. Regenerate file always through `renderDocument`.

If you need to preserve new formatting constructs → current parser will discard them; implement lossless layer first.

---
## 15. Immediate Next Steps (Recommended Order)
1. Introduce diagnostics & graceful header repair.
2. Implement atomic write wrapper in `FileStore.saveDocument`.
3. Remove / refactor legacy modules to avoid contributor confusion.
4. Add unit tests: parse edge cases, render idempotency, action reducers.
5. Design lossless representation (node sequence) before adding richer syntax.

---
## 16. Open Questions
- Do we want to treat malformed / unknown lines as notes instead of dropping? (Lean toward preserving verbatim.)
- Should toggling tasks rely on stable indices or eventually stable IDs (GUID / timestamp)?
- Minimum acceptable performance overhead for a tokenizing parser? (Likely negligible; files are small.)

---
Prepared for: termnotes contributors
Maintainer: (fill in)
