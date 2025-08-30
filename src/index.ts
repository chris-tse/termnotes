import Bun from "bun";
import { Console, Effect, Layer } from "effect";
import { Args, Command } from "@effect/cli";
import { DevTools } from "@effect/experimental";
import { BunContext, BunRuntime, BunSocket } from "@effect/platform-bun";
import { FileStore } from "./lib/file-store";
import { ConfigLive } from "./lib/config";
import { reduceDocument } from "./lib/document";
import { Viewer } from "./lib/viewer";

const packageInfo = await import("../package.json");

function normalizeBunArgv(): string[] {
  const argv = [...Bun.argv];
  console.log(argv);

  // If the second element is a bunfs loader path, drop it
  if (argv[1]?.startsWith("/$bunfs/")) {
    argv.splice(1, 1);
  }

  return argv;
}

const text = Args.text({ name: "text" }).pipe(Args.atLeast(1));

const handleTask = (text: string[]) =>
  Effect.gen(function* () {
    const store = yield* FileStore;
    const viewer = yield* Viewer;
    const { path, doc } = yield* store.loadTodayDocument;
    const next = yield* reduceDocument(doc, {
      _tag: "AddTask",
      text: text.join(" "),
    });
    yield* store.saveDocument(path, next);
    yield* viewer.showFile(path);
  }).pipe(Effect.provide(FileStore.Default), Effect.provide(Viewer.Default));

const taskCommand = Command.make("task", { text }, ({ text }) => {
  return handleTask(text);
});

const taskShortCommand = Command.make("t", { text }, ({ text }) => {
  return handleTask(text);
});

const handleNote = (text: string[]) =>
  Effect.gen(function* () {
    const store = yield* FileStore;
    const viewer = yield* Viewer;
    const { path, doc } = yield* store.loadTodayDocument;
    const next = yield* reduceDocument(doc, {
      _tag: "AddNote",
      text: text.join(" "),
    });
    yield* store.saveDocument(path, next);
    yield* viewer.showFile(path);
  }).pipe(Effect.provide(FileStore.Default), Effect.provide(Viewer.Default));

const noteCommand = Command.make("note", { text }, ({ text }) => {
  return handleNote(text);
});

const noteShortCommand = Command.make("n", { text }, ({ text }) => {
  return handleNote(text);
});

const command = Command.make("tn", {}, () => {
  return Effect.gen(function* () {
    yield* Console.log("bun");
    const store = yield* FileStore;
    const viewer = yield* Viewer;
    yield* store.ensureTodayFile;
    const { path } = yield* store.loadTodayDocument;
    yield* viewer.showFile(path);
    Effect.die("done");
  }).pipe(Effect.provide(FileStore.Default), Effect.provide(Viewer.Default));
}).pipe(
  Command.withSubcommands([
    taskCommand,
    taskShortCommand,
    noteCommand,
    noteShortCommand,
  ])
);

const cli = Command.run(command, {
  name: "tn - TermNotes CLI",
  version: packageInfo.default.version,
});

const AppLayer = Layer.mergeAll(BunContext.layer, ConfigLive);
const DevToolsLive = DevTools.layerWebSocket().pipe(
  Layer.provide(BunSocket.layerWebSocketConstructor)
);

cli(normalizeBunArgv()).pipe(
  Effect.provide(AppLayer),
  Effect.provide(DevToolsLive),
  BunRuntime.runMain
);

// async function main() {
//   const { values, positionals } = parseArgs({
//     args: normalizeBunArgv(),
//     strict: true,
//     allowPositionals: true,
//     options: {
//       tasks: { type: "boolean", short: "t" },
//       notes: { type: "boolean", short: "n" },
//       version: { type: "boolean", short: "v" },
//     },
//   });

//   const showTasks = Boolean(values.tasks);
//   const showNotes = Boolean(values.notes);
//   const showVersion = Boolean(values.version);
//   const textJoined =
//     positionals.length > 2 ? positionals.slice(2).join(" ") : null;

//   if (showVersion) {
//     try {
//       const packageInfo = await import("../package.json");
//       // biome-ignore lint/style/noConsoleLog: print version
//       console.log(packageInfo.default.version);
//       process.exit(0);
//     } catch (err) {
//       console.error(err);
//       process.exit(1);
//     }
//   }

//   if (showTasks && showNotes) {
//     printError("Cannot combine -t and -n. Use one or the other.");
//     printHelpSummary();
//     process.exit(2);
//   }

//   const config = yield* Config;
//   const notesDir = config.getDefaultNotesDir();
//   await ensureDirectoryExists(notesDir);
//   const filePath = await ensureTodayFile(notesDir);

//   if (showTasks) {
//     if (textJoined && textJoined.trim().length > 0) {
//       await addTask(filePath, textJoined.trim());
//       await showFileWithViewer(filePath);
//       process.exit(0);
//     }
//     const tasks = await readSection(filePath, "Tasks");
//     if (tasks.length === 0) {
//       process.exit(0);
//     }
//     process.exit(0);
//   }

//   const deps = {
//     printError,
//     printHelpSummary,
//     showFileWithViewer,
//     readSection,
//   };

//   if (showNotes) {
//     await handleNotes(filePath, textJoined, deps);
//   }

//   if (textJoined && textJoined.trim().length > 0) {
//     await handleNoteAddition(filePath, textJoined, deps);
//   }

//   await showFileWithViewer(filePath);
//   process.exit(0);
// }

// // printHelp handled manually

// function printHelpSummary(): void {
//   return;
// }

// function printError(_message: string): void {
//   return;
// }

// function getTodayDateParts(): { year: number; month: number; day: number } {
//   const d = new Date();
//   return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
// }

// function formatDateYmdLocal(): string {
//   const { year, month, day } = getTodayDateParts();
//   const mm = String(month).padStart(2, "0");
//   const dd = String(day).padStart(2, "0");
//   return `${year}-${mm}-${dd}`;
// }

// async function ensureDirectoryExists(dirPath: string): Promise<void> {
//   // Using Node fs via Bun compatibility for mkdir -p behavior
//   const fs = await import("node:fs/promises");
//   await fs.mkdir(dirPath, { recursive: true });
// }

// async function ensureTodayFile(baseDir: string): Promise<string> {
//   const fileName = `${formatDateYmdLocal()}.md`;
//   const filePath = `${baseDir}/${fileName}`;
//   const file = Bun.file(filePath);
//   if (!(await file.exists())) {
//     const content = "## Tasks\n\n## Notes\n";
//     await Bun.write(filePath, content);
//   }
//   return filePath;
// }

// function sliceSection(
//   lines: string[],
//   headerIndex: number,
//   nextHeaderIndex: number | null
// ): string[] {
//   const start = headerIndex + 1;
//   const end = nextHeaderIndex === null ? lines.length : nextHeaderIndex;
//   // Trim a single leading/trailing blank line
//   let section = lines.slice(start, end);
//   while (section.length > 0) {
//     const first = section[0];
//     if (!isBlank(first)) {
//       break;
//     }
//     section = section.slice(1);
//   }
//   while (section.length > 0) {
//     const last = section.at(-1);
//     if (!isBlank(last)) {
//       break;
//     }
//     section = section.slice(0, -1);
//   }
//   return section;
// }

// async function readSection(
//   filePath: string,
//   sectionName: "Tasks" | "Notes"
// ): Promise<string[]> {
//   let lines = await readFileLines(filePath);
//   if (lines.length === 0) {
//     lines = ["## Tasks", "", "## Notes", ""]; // normalize empty file
//   }
//   const { tasksHeader, notesHeader } = findHeaderIndices(lines);
//   if (tasksHeader === null || notesHeader === null) {
//     // Rebuild canonical structure
//     lines = ["## Tasks", "", "## Notes", ""];
//     await Bun.write(filePath, lines.join("\n"));
//   }
//   const headers = findHeaderIndices(lines);
//   const tHeader = headers.tasksHeader as number;
//   const nHeader = headers.notesHeader as number;
//   if (sectionName === "Tasks") {
//     return sliceSection(lines, tHeader, nHeader);
//   }
//   return sliceSection(lines, nHeader, null);
// }

// async function showFileWithViewer(filePath: string): Promise<void> {
//   const config = yield* Config;
//   const viewer = yield* config.detectViewer();
//   const args = viewer === "bat" ? ["--style=plain", filePath] : [filePath];
//   const proc = Bun.spawn({
//     cmd: [viewer, ...args],
//     stdin: "inherit",
//     stdout: "inherit",
//     stderr: "inherit",
//   });
//   await proc.exited;
// }

// main().catch((err) => {
//   printError(String(err?.message ?? err));
//   process.exit(1);
// });
