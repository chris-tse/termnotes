import Bun from 'bun'
import { Console, Effect, Layer } from 'effect'
import { Args, Command } from '@effect/cli'
import { DevTools } from '@effect/experimental'
import { BunContext, BunRuntime, BunSocket } from '@effect/platform-bun'
import { Config } from '@/lib/config'
import { reduceDocument } from '@/lib/document'
import { FileStore } from '@/lib/file-store'
import { Viewer } from '@/lib/viewer'
import packageInfo from '../package.json' with { type: 'json' }

function normalizeBunArgv(): string[] {
	const argv = [...Bun.argv]

	// If the second element is a bunfs loader path, drop it
	if (argv[1]?.startsWith('/$bunfs/')) {
		argv.splice(1, 1)
	}

	return argv
}

const handleTask = Effect.fn('handleTask')(
	function* (text: string[]) {
		const store = yield* FileStore
		const viewer = yield* Viewer
		const { path, doc } = yield* store.loadTodayDocument()
		const next = yield* reduceDocument(doc, {
			_tag: 'AddTask',
			text: text.join(' '),
		})
		yield* store.saveDocument(path, next)
		yield* viewer.showFile(path)
	},
	Effect.provide(FileStore.Default),
	Effect.provide(Viewer.Default),
)

const restInputText = Args.text({ name: 'text' }).pipe(Args.atLeast(1))

const taskCommand = Command.make('task', { restInputText }, ({ restInputText: text }) => handleTask(text))

const taskShortCommand = Command.make('t', { restInputText }, ({ restInputText: text }) => handleTask(text))

const handleNote = Effect.fn('handleNote')(
	function* (text: string[]) {
		const store = yield* FileStore
		const viewer = yield* Viewer
		const { path, doc } = yield* store.loadTodayDocument()
		const next = yield* reduceDocument(doc, {
			_tag: 'AddNote',
			text: text.join(' '),
		})
		yield* store.saveDocument(path, next)
		yield* viewer.showFile(path)
	},
	Effect.provide(FileStore.Default),
	Effect.provide(Viewer.Default),
)

const noteCommand = Command.make('note', { restInputText }, ({ restInputText: text }) => handleNote(text))

const noteShortCommand = Command.make('n', { restInputText }, ({ restInputText: text }) => handleNote(text))

const handleToggle = Effect.fn('handleToggle')(
	function* (index: number) {
		const store = yield* FileStore
		const viewer = yield* Viewer
		const { path, doc } = yield* store.loadTodayDocument()
		const zeroIndex = index - 1
		const next = yield* reduceDocument(doc, {
			_tag: 'ToggleTask',
			index: zeroIndex,
		})
		yield* store.saveDocument(path, next)
		yield* viewer.showFile(path)
	},
	Effect.catchTag('InvalidTaskIndex', (error) => Console.warn(`Invalid task index: ${error.index + 1}`)),
	Effect.provide(FileStore.Default),
	Effect.provide(Viewer.Default),
)

const toggleCommand = Command.make('x', { index: Args.integer({ name: 'index' }) }, ({ index }) => handleToggle(index))

const command = Command.make(
	'tn',
	{},
	Effect.fn('tn')(
		function* () {
			const store = yield* FileStore
			const viewer = yield* Viewer
			yield* store.ensureTodayFile()
			const { path } = yield* store.loadTodayDocument()
			return yield* viewer.showFile(path)
		},
		Effect.provide(FileStore.Default),
		Effect.provide(Viewer.Default),
	),
).pipe(Command.withSubcommands([taskCommand, taskShortCommand, noteCommand, noteShortCommand, toggleCommand]))

const cli = Command.run(command, {
	name: 'tn - TermNotes CLI',
	version: packageInfo.version,
})

const AppLayer = Layer.mergeAll(BunContext.layer, Config.Default)
const DevToolsLive = DevTools.layerWebSocket().pipe(Layer.provide(BunSocket.layerWebSocketConstructor))

cli(normalizeBunArgv()).pipe(
	Effect.provide(AppLayer),
	Effect.provide(DevToolsLive),
	Effect.tapErrorCause((cause) => Console.warn(`Error: ${String(cause)}`)),
	BunRuntime.runMain,
)
