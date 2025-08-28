// NOTE TO AGENT: still needs to be converted to Effect

import Bun from "bun";

export async function detectViewer(): Promise<"glow" | "bat" | "cat"> {
  if (await commandExists(["glow", "--version"])) {
    return "glow";
  }
  if (await commandExists(["bat", "--version"])) {
    return "bat";
  }
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
