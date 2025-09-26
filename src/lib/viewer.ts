import { Console, Effect } from "effect";
import { Command } from "@effect/platform";
import { Config } from "./config";

export class Viewer extends Effect.Service<Viewer>()("tn/Viewer", {
  effect: Effect.gen(function* () {
    const config = yield* Config;

    const showFile = (path: string) =>
      Effect.gen(function* () {
        const args = config.viewer === "bat" ? ["--style=plain", path] : [path];
        const command = Command.make(config.viewer, ...args).pipe(
          Command.stdin("inherit"),
          Command.stdout("inherit"),
          Command.stderr("inherit")
        );

        yield* Command.exitCode(command);
      }).pipe(
        Effect.catchAll((e) => Console.log(`showFile failed: ${String(e)}`)),
        Effect.withSpan("showFile")
      );

    return { showFile } as const;
  }),

  dependencies: [Config.Default],
}) {}
