// termnotes (tn) — minimal MVP CLI scaffold
import { parseArgs } from "util";

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
	const textJoined = positionals.length > 0 ? positionals.join(" ") : null;

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
			printError("-n with text is invalid. To add a note, pass text without -n.");
			printHelpSummary();
			process.exit(2);
		}
		const notes = await readSection(filePath, "Notes");
		if (notes.length === 0) {
			console.log("(no notes)");
			process.exit(0);
		}
		console.log(notes.join("\n"));
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

async function readFileLines(filePath: string): Promise<string[]> {
	const text = await Bun.file(filePath).text();
	// Normalize to \n for processing; we will write with \n
	return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

function isBlank(s?: string): boolean {
	return (s ?? "").trim() === "";
}

function findHeaderIndices(lines: string[]): { tasksHeader: number | null; notesHeader: number | null } {
	let tasksHeader: number | null = null;
	let notesHeader: number | null = null;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? "";
		if (line.trim() === "## Tasks" && tasksHeader === null) tasksHeader = i;
		if (line.trim() === "## Notes" && notesHeader === null) notesHeader = i;
	}
	return { tasksHeader, notesHeader };
}

function sliceSection(lines: string[], headerIndex: number, nextHeaderIndex: number | null): string[] {
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

async function readSection(filePath: string, sectionName: "Tasks" | "Notes"): Promise<string[]> {
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

async function addTask(filePath: string, taskText: string): Promise<void> {
	if (taskText.trim().length === 0) {
		throw new Error("Empty text for task");
	}
	let lines = await readFileLines(filePath);
	if (lines.length === 0) lines = ["## Tasks", "", "## Notes", ""]; // normalize
	const { tasksHeader, notesHeader } = findHeaderIndices(lines);
	if (tasksHeader === null || notesHeader === null) {
		lines = ["## Tasks", "", "## Notes", ""];
		const content = lines.join("\n");
		await Bun.write(filePath, content);
		return addTask(filePath, taskText);
	}
	const tHeader = tasksHeader;
	let notesHeaderIdx = notesHeader; // will adjust after mutations
	// Insert at end of tasks section (just before notes header), ensuring a blank line separates sections
	let insertIndex = notesHeaderIdx;
	// Walk back over blank lines to find last real task line
	while (insertIndex - 1 > (tHeader as number) && isBlank(lines[insertIndex - 1])) {
		insertIndex--;
	}
	lines.splice(insertIndex, 0, `- [ ] ${taskText}`);
	// Recompute notes header index and enforce exactly one blank line before it
	notesHeaderIdx = lines.findIndex((l) => (l ?? "").trim() === "## Notes");
	let k = notesHeaderIdx - 1;
	while (k >= 0 && isBlank(lines[k])) {
		lines.splice(k, 1);
		notesHeaderIdx--;
		k--;
	}
	lines.splice(notesHeaderIdx, 0, "");
	await Bun.write(filePath, lines.join("\n"));
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
	const proc = Bun.spawn({ cmd: [viewer, ...args], stdin: "inherit", stdout: "inherit", stderr: "inherit" });
	await proc.exited;
}

async function detectViewer(): Promise<"glow" | "bat" | "cat"> {
	if (await commandExists(["glow", "--version"])) return "glow";
	if (await commandExists(["bat", "--version"])) return "bat";
	return "cat";
}

async function commandExists(cmd: string[]): Promise<boolean> {
	try {
		const proc = Bun.spawn({ cmd, stdout: "ignore", stderr: "ignore" });
		await proc.exited;
		return proc.exitCode === 0;
	} catch {
		return false;
	}
}

main().catch((err) => {
	printError(String(err?.message ?? err));
	process.exit(1);
});