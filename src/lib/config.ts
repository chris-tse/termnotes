import { homedir } from 'node:os'
import { Effect } from 'effect'
import { BunContext } from '@effect/platform-bun'
import { CommandChecker } from './command-checker'

export class Config extends Effect.Service<Config>()('tn/Config', {
	effect: Effect.gen(function* () {
		const notesDir = yield* getNotesDir
		const viewer = yield* detectViewer()
		return { notesDir, viewer } as const
	}),
	dependencies: [BunContext.layer, CommandChecker.Default],
}) {}

const getNotesDir = Effect.fn('getNotesDir')(function* () {
	// TODO: implement configuring this
	return yield* Effect.succeed(`${homedir()}/.termnotes/notes`)
})()

export const detectViewer = Effect.fn('detectViewer')(function* () {
	// TODO: add checking from config first
	const checker = yield* CommandChecker
	if (yield* checker.commandExists('glow')) {
		return 'glow'
	}
	if (yield* checker.commandExists('bat')) {
		return 'bat'
	}
	return 'cat'
})
