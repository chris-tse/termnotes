import { Context, Effect, Equal, Layer } from "effect";
import { Command } from "@effect/platform";
import type { PlatformError } from "@effect/platform/Error";
import type { CommandExecutor } from "@effect/platform/CommandExecutor";

export class Config extends Context.Tag("Config")<
  Config,
  {
    readonly getConfig: Effect.Effect<
      {
        readonly notesDir: string;
        readonly viewer: "glow" | "bat" | "cat";
      },
      PlatformError,
      CommandExecutor
    >;
  }
>() {}

export const ConfigLive = Layer.succeed(
  Config,
  Config.of({
    getConfig: Effect.gen(function* () {
      const notesDir = `${process.env.HOME}/.termnotes/notes`;
      const viewer = yield* detectViewer;
      return { notesDir, viewer } as const;
    }),
  })
);

const commandExists = (cmd: string) =>
  Effect.gen(function* () {
    const command = Command.make(cmd, "--version");
    const exitCode = yield* Command.exitCode(command);

    return Equal.equals(exitCode, 0);
  });

const detectViewer = Effect.gen(function* () {
  if (yield* commandExists("glow")) {
    return "glow";
  }
  if (yield* commandExists("bat")) {
    return "bat";
  }
  return "cat";
});
