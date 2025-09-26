import { homedir } from "node:os";
import { Effect } from "effect";
import { Command } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { CommandChecker } from "./command-checker";

export class Config extends Effect.Service<Config>()("tn/Config", {
  effect: Effect.gen(function* () {
    const notesDir = yield* getNotesDir;
    const viewer = yield* detectViewer();
    return { notesDir, viewer } as const;
  }),
  dependencies: [BunContext.layer, CommandChecker.Default],
}) {}

const getNotesDir = Effect.fn("getNotesDir")(function* () {
  // TODO: implement configuring this
  return `${homedir()}/.termnotes/notes`;
})();

export const commandExists = Effect.fn("commandExists")(function* (
  cmd: string
) {
  const command = Command.make(cmd, "--version");
  const exitCode = yield* Command.exitCode(command).pipe(
    Effect.catchAll(() => Effect.succeed(1))
  );
  return exitCode === 0;
},
Effect.provide(BunContext.layer));

export const detectViewer = Effect.fn("detectViewer")(function* () {
  const checker = yield* CommandChecker;
  if (yield* checker.commandExists("glow")) {
    return "glow";
  }
  if (yield* checker.commandExists("bat")) {
    return "bat";
  }
  return "cat";
});
