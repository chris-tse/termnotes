import { Console, Effect } from 'effect'
import { Command } from '@effect/platform'
import { Config } from './config'

export class Viewer extends Effect.Service<Viewer>()('tn/Viewer', {
	effect: Effect.gen(function* () {
		const config = yield* Config
		const disableViewer = process.env.TERMNOTES_NO_VIEWER === '1' || process.env.NODE_ENV === 'test'

		const showFile = Effect.fn('showFile')(
			function* (path: string) {
				if (disableViewer) {
					// Skip spawning external viewer in test / no-viewer mode.
					return yield* Effect.void
				}
				const args = config.viewer === 'bat' ? ['--style=plain', path] : [path]
				const command = Command.make(config.viewer, ...args).pipe(
					Command.stdin('inherit'),
					Command.stdout('inherit'),
					Command.stderr('inherit'),
				)
				yield* Command.exitCode(command)
			},
			Effect.tapError((e) => Console.warn(`showFile failed: ${String(e)}`)),
		)

		return { showFile } as const
	}),

	dependencies: [Config.Default],
}) {}
