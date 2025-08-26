// termnotes (tn) — minimal MVP CLI scaffold
import { $ } from "bun";
import { parseArgs } from "util";
import { detectViewer } from "./lib/viewer";
import { addTask } from "./lib/task";
import { readFileLines } from "./lib/file";

const DEFAULT_NOTES_DIR = `${process.env.HOME}/.termnotes/notes`;

// CLI main using Bun's util.parseArgs
async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: Bun.argv,
    strict: true,
    allowPositionals: true,
    options: {
      tasks: { type: "boolean", short: "t" },
      notes: { type: "boolean", short: "n" },
    },
  });

  const showTasks = Boolean(values.tasks);
  const showNotes = Boolean(values.notes);
  const textJoined =
    positionals.length > 2 ? positionals.slice(2).join(" ") : null;

  if (showTasks && showNotes) {
    printError("Cannot combine -t and -n. Use one or the other.");
    printHelpSummary();
    process.exit(2);
  }

  const notesDir = DEFAULT_NOTES_DIR;
  await ensureDirectoryExists(notesDir);
  const filePath = await ensureTodayFile(notesDir);

  if (showTasks) {
    if (textJoined && textJoined.trim().length > 0) {
      await addTask(filePath, textJoined.trim());
      await showFileWithViewer(filePath);
      process.exit(0);
    }
    const tasks = await readSection(filePath, "Tasks");
    if (tasks.length === 0) {
      console.log("(no tasks)");
      process.exit(0);
    }
    console.log(tasks.join("\n"));
    process.exit(0);
  }

  if (showNotes) {
    if (textJoined && textJoined.trim().length > 0) {
      printError(
        "-n with text is invalid. To add a note, pass text without -n."
      );
      printHelpSummary();
      process.exit(2);
    }
    const notes = await readSection(filePath, "Notes");
    if (notes.length === 0) {
      console.log("(no notes)");
      process.exit(0);
    }
    console.log(notes.join("\n"));
    $`${notes.join("\n")} | glow`;
    process.exit(0);
  }

  if (textJoined && textJoined.trim().length > 0) {
    await addNote(filePath, textJoined.trim());
    await showFileWithViewer(filePath);
    process.exit(0);
  }

  await showFileWithViewer(filePath);
  process.exit(0);
}

// printHelp handled manually

function printHelpSummary(): void {
  console.log("Try 'tn --help' for usage and examples.");
}

function printError(message: string): void {
  console.error(`Error: ${message}`);
}

function getTodayDateParts(): { year: number; month: number; day: number } {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

function formatDateYmdLocal(): string {
  const { year, month, day } = getTodayDateParts();
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

async function ensureDirectoryExists(dirPath: string): Promise<void> {
  // Using Node fs via Bun compatibility for mkdir -p behavior
  const fs = await import("fs/promises");
  await fs.mkdir(dirPath, { recursive: true });
}

async function ensureTodayFile(baseDir: string): Promise<string> {
  const fileName = `${formatDateYmdLocal()}.md`;
  const filePath = `${baseDir}/${fileName}`;
  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    const content = `## Tasks\n\n## Notes\n`;
    await Bun.write(filePath, content);
  }
  return filePath;
}

function isBlank(s?: string): boolean {
  return (s ?? "").trim() === "";
}

function findHeaderIndices(lines: string[]): {
  tasksHeader: number | null;
  notesHeader: number | null;
} {
  let tasksHeader: number | null = null;
  let notesHeader: number | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (line.trim() === "## Tasks" && tasksHeader === null) tasksHeader = i;
    if (line.trim() === "## Notes" && notesHeader === null) notesHeader = i;
  }
  return { tasksHeader, notesHeader };
}

function sliceSection(
  lines: string[],
  headerIndex: number,
  nextHeaderIndex: number | null
): string[] {
  const start = headerIndex + 1;
  const end = nextHeaderIndex === null ? lines.length : nextHeaderIndex;
  // Trim a single leading/trailing blank line
  let section = lines.slice(start, end);
  while (section.length > 0) {
    const first = section[0];
    if (!isBlank(first)) break;
    section = section.slice(1);
  }
  while (section.length > 0) {
    const last = section[section.length - 1];
    if (!isBlank(last)) break;
    section = section.slice(0, -1);
  }
  return section;
}

async function readSection(
  filePath: string,
  sectionName: "Tasks" | "Notes"
): Promise<string[]> {
  let lines = await readFileLines(filePath);
  if (lines.length === 0) lines = ["## Tasks", "", "## Notes", ""]; // normalize empty file
  const { tasksHeader, notesHeader } = findHeaderIndices(lines);
  if (tasksHeader === null || notesHeader === null) {
    // Rebuild canonical structure
    lines = ["## Tasks", "", "## Notes", ""];
    await Bun.write(filePath, lines.join("\n"));
  }
  const headers = findHeaderIndices(lines);
  const tHeader = headers.tasksHeader as number;
  const nHeader = headers.notesHeader as number;
  if (sectionName === "Tasks") {
    return sliceSection(lines, tHeader, nHeader);
  } else {
    return sliceSection(lines, nHeader, null);
  }
}

async function addNote(filePath: string, noteText: string): Promise<void> {
  if (noteText.trim().length === 0) {
    throw new Error("Empty text for note");
  }
  let lines = await readFileLines(filePath);
  if (lines.length === 0) lines = ["## Tasks", "", "## Notes", ""]; // normalize
  const { tasksHeader, notesHeader } = findHeaderIndices(lines);
  if (tasksHeader === null || notesHeader === null) {
    lines = ["## Tasks", "", "## Notes", ""];
    await Bun.write(filePath, lines.join("\n"));
    return addNote(filePath, noteText);
  }
  // Append to end of notes section (end of file)
  // Ensure a trailing newline before appending if file doesn't end with blank line or the last line is header
  const last = lines[lines.length - 1];
  if (!isBlank(last)) {
    lines.push("");
  }
  lines.push(`- ${noteText}`);
  await Bun.write(filePath, lines.join("\n"));
}

async function showFileWithViewer(filePath: string): Promise<void> {
  const viewer = await detectViewer();
  const args = viewer === "bat" ? ["--style=plain", filePath] : [filePath];
  const proc = Bun.spawn({
    cmd: [viewer, ...args],
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  await proc.exited;
}

main().catch((err) => {
  printError(String(err?.message ?? err));
  process.exit(1);
});
