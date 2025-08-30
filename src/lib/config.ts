import { Context, Effect, Equal, Layer } from "effect";
import { Command } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";

export class Config extends Context.Tag("Config")<
  Config,
  {
    readonly notesDir: string;
    readonly viewer: "glow" | "bat" | "cat";
  }
>() {}

export const ConfigLive = Layer.effect(
  Config,
  Effect.gen(function* () {
    const notesDir = `${process.env.HOME}/.termnotes/notes`;
    const viewer = yield* detectViewer;
    return { notesDir, viewer } as const;
  })
).pipe(Layer.provide(BunContext.layer));

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
