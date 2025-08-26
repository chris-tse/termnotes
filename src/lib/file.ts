export async function readFileLines(filePath: string): Promise<string[]> {
  const text = await Bun.file(filePath).text();
  // Normalize to \n for processing; we will write with \n
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}
