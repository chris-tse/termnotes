import { Clock, Console, Effect } from 'effect'
import { FileSystem } from '@effect/platform'
import { Config } from './config'
import { type Document, parseDocument, renderDocument } from './document'

const getTodayPath = Effect.fn('getTodayPath')(function* () {
	const config = yield* Config
	const nowMs = yield* Clock.currentTimeMillis
	const now = new Date(nowMs)
	const yyyy = now.getFullYear()
	const mm = String(now.getMonth() + 1).padStart(2, '0')
	const dd = String(now.getDate()).padStart(2, '0')
	return `${config.notesDir}/${yyyy}-${mm}-${dd}.md`
})

export class FileStore extends Effect.Service<FileStore>()('tn/FileStore', {
	effect: Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem

		return {
			ensureTodayFile: Effect.fn('ensureTodayFile')(
				function* () {
					const config = yield* Config
					yield* fs.makeDirectory(config.notesDir, { recursive: true })

					const filePath = yield* getTodayPath()

					if (!(yield* fs.exists(filePath))) {
						yield* fs.writeFileString(filePath, '## Tasks\n\n## Notes\n')
					}
					return filePath
				},
				Effect.tapError((e) => Console.warn(`ensureTodayFile failed: ${String(e)}`)),
			),

			loadTodayDocument: Effect.fn('loadTodayDocument')(
				function* () {
					const config = yield* Config
					yield* fs.makeDirectory(config.notesDir, { recursive: true })

					const filePath = yield* getTodayPath()

					if (!(yield* fs.exists(filePath))) {
						yield* fs.writeFileString(filePath, '## Tasks\n\n## Notes\n')
					}

					const text = yield* fs.readFileString(filePath)
					const doc = yield* parseDocument(text)
					return { path: filePath, doc }
				},
				Effect.tapError((e) => Console.warn(`loadTodayDocument failed: ${String(e)}`)),
			),

			saveDocument: Effect.fn('saveDocument')(
				function* (path: string, doc: Document) {
					const content = yield* renderDocument(doc)
					return yield* fs.writeFileString(path, content)
				},
				Effect.tapError((e) => Console.warn(`saveDocument failed: ${String(e)}`)),
			),
		}
	}),
}) {}
