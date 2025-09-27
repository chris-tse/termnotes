import { Effect } from 'effect'
import { Command } from '@effect/platform'
import { BunContext } from '@effect/platform-bun'

export class CommandChecker extends Effect.Service<CommandChecker>()('tn/CommandChecker', {
	effect: Effect.gen(function* () {
		return {
			commandExists: Effect.fn('commandExists')(function* (cmd: string) {
				const command = Command.make(cmd, '--version')
				const exitCode = yield* Command.exitCode(command).pipe(Effect.catchAll(() => Effect.succeed(1)))
				return exitCode === 0
			}),
		}
	}),
	dependencies: [BunContext.layer],
}) {}
