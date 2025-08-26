import Bun from "bun";
import { findHeaderIndices, readFileLines } from "./file";
import { isBlank } from "./util";

export async function addTask(
  filePath: string,
  taskText: string
): Promise<void> {
  if (taskText.trim().length === 0) {
    throw new Error("Empty text for task");
  }
  let lines = await readFileLines(filePath);
  if (lines.length === 0) {
    lines = ["## Tasks", "", "## Notes", ""]; // normalize
  }
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
  while (
    insertIndex - 1 > (tHeader as number) &&
    isBlank(lines[insertIndex - 1])
  ) {
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
