import Bun from "bun";

export async function readFileLines(filePath: string): Promise<string[]> {
  const text = await Bun.file(filePath).text();
  // Normalize to \n for processing; we will write with \n
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

export function findHeaderIndices(lines: string[]): {
  tasksHeader: number | null;
  notesHeader: number | null;
} {
  let tasksHeader: number | null = null;
  let notesHeader: number | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (line.trim() === "## Tasks" && tasksHeader === null) {
      tasksHeader = i;
    }
    if (line.trim() === "## Notes" && notesHeader === null) {
      notesHeader = i;
    }
  }
  return { tasksHeader, notesHeader };
}
