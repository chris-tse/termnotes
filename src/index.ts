import Bun from 'bun'
import { Console, Effect, Layer } from 'effect'
import { Args, CliConfig, Command, HelpDoc } from '@effect/cli'
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

const taskCommand = Command.make('task', { restInputText }, ({ restInputText: text }) => handleTask(text)).pipe(
	Command.withDescription('Append a task'),
)

const taskShortCommand = Command.make('t', { restInputText }, ({ restInputText: text }) => handleTask(text)).pipe(
	Command.withDescription('Append a task'),
)

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

const noteCommand = Command.make('note', { restInputText }, ({ restInputText: text }) => handleNote(text)).pipe(
	Command.withDescription('Append a note bullet'),
)

const noteShortCommand = Command.make('n', { restInputText }, ({ restInputText: text }) => handleNote(text)).pipe(
	Command.withDescription('Append a note bullet'),
)

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

const toggleCommand = Command.make('x', { index: Args.integer({ name: 'index' }) }, ({ index }) =>
	handleToggle(index),
).pipe(Command.withDescription('Toggle task status at 1-based index'))

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
).pipe(
	Command.withSubcommands([taskCommand, taskShortCommand, noteCommand, noteShortCommand, toggleCommand]),
	Command.withDescription(
		HelpDoc.blocks([
			HelpDoc.p(
				'Zero‑config daily notes + tasks in your terminal. Each day is one Markdown file with two sections: Tasks and Notes',
			),
		]),
	),
)

const cli = Command.run(command, {
	name: 'tn - TermNotes CLI',
	version: packageInfo.version,
})

const AppLayer = Layer.mergeAll(BunContext.layer, Config.Default)
const enableDevTools = process.env.TERMNOTES_DEVTOOLS === '1'
const DevToolsLive = DevTools.layerWebSocket().pipe(Layer.provide(BunSocket.layerWebSocketConstructor))

let program = cli(normalizeBunArgv()).pipe(
	Effect.provide(AppLayer),
	Effect.provide(CliConfig.layer({ showBuiltIns: false })),
	Effect.tapErrorCause((cause) => Console.warn(`Error: ${String(cause)}`)),
)

if (enableDevTools) {
	program = program.pipe(Effect.provide(DevToolsLive))
}

program.pipe(BunRuntime.runMain)
