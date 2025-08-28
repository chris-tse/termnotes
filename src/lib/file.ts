// NOTE TO AGENT: still needs to be converted to Effect

import Bun from "bun";

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

async function ensureTodayFile(baseDir: string): Promise<string> {
  const fileName = `${formatDateYmdLocal()}.md`;
  const filePath = `${baseDir}/${fileName}`;
  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    const content = "## Tasks\n\n## Notes\n";
    await Bun.write(filePath, content);
  }
  return filePath;
}

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
