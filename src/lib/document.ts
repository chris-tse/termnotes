import { Console, Data, Effect } from 'effect'
export type TaskItem = {
	text: string
	done: boolean
}

export type NoteItem = {
	text: string
}

export type Document = {
	tasks: TaskItem[]
	notes: NoteItem[]
}

type AddTaskAction = { _tag: 'AddTask'; text: string }
type AddNoteAction = { _tag: 'AddNote'; text: string }
type ToggleTaskAction = { _tag: 'ToggleTask'; index: number }

export type DocumentAction = AddTaskAction | AddNoteAction | ToggleTaskAction

class InvalidTaskIndex extends Data.TaggedError('InvalidTaskIndex')<{ index: number }> {}

const TASK_LINE_REGEX = /^-\s\[( |x)\]\s(.*)$/
const NOTE_LINE_REGEX = /^-\s(.*)$/

export const parseDocument = (text: string) =>
	Effect.gen(function* () {
		const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')

		const tasksHeaderIdx = lines.findIndex((l) => (l ?? '').trim() === '## Tasks')
		const notesHeaderIdx = lines.findIndex((l) => (l ?? '').trim() === '## Notes')

		if (tasksHeaderIdx === -1 || notesHeaderIdx === -1) {
			return { tasks: [], notes: [] } as Document
		}

		const taskLines = lines.slice(tasksHeaderIdx + 1, notesHeaderIdx)
		const noteLines = lines.slice(notesHeaderIdx + 1)

		const tasks: TaskItem[] = []
		for (const line of taskLines) {
			const match = TASK_LINE_REGEX.exec(line)
			if (!match) {
				continue
			}
			tasks.push({ done: match[1] === 'x', text: match[2] ?? '' })
		}

		const notes: NoteItem[] = []
		for (const line of noteLines) {
			const match = NOTE_LINE_REGEX.exec(line)
			if (!match) {
				continue
			}
			notes.push({ text: match[1] ?? '' })
		}

		return { tasks, notes } satisfies Document
	})

export const renderDocument = (doc: Document) =>
	Effect.gen(function* () {
		const tasksRendered = doc.tasks.map((t) => `- [${t.done ? 'x' : ' '}] ${t.text}`).join('\n')
		const notesRendered = doc.notes.map((n) => `- ${n.text}`).join('\n')
		const tasksSection = tasksRendered ? `${tasksRendered}\n` : ''
		const notesSection = notesRendered ? `${notesRendered}\n` : ''
		return `## Tasks\n${tasksSection}\n## Notes\n${notesSection}`
	})

export const reduceDocument = (doc: Document, action: DocumentAction) =>
	Effect.gen(function* () {
		switch (action._tag) {
			case 'AddTask': {
				const text = action.text.trim()
				if (!text) {
					return yield* Effect.succeed(doc)
				}
				return yield* Effect.succeed({
					...doc,
					tasks: [...doc.tasks, { text, done: false }],
				})
			}
			case 'AddNote': {
				const text = action.text.trim()
				if (!text) {
					return yield* Effect.succeed(doc)
				}
				return yield* Effect.succeed({
					...doc,
					notes: [...doc.notes, { text }],
				})
			}
			case 'ToggleTask': {
				return yield* toggleTaskAction(doc, action)
			}

			default: {
				yield* Console.warn('Should never happen')
				return yield* Effect.succeed(doc)
			}
		}
	})

const toggleTaskAction = Effect.fn('toggleTaskAction')(function* (doc: Document, action: ToggleTaskAction) {
	const toggleIndex = action.index
	if (toggleIndex < 0 || toggleIndex >= doc.tasks.length) {
		return yield* Effect.fail(new InvalidTaskIndex({ index: toggleIndex }))
	}
	const nextTasks = doc.tasks.slice()
	const current = nextTasks[toggleIndex]
	if (!current) {
		return yield* Effect.succeed(doc)
	}
	nextTasks[toggleIndex] = { text: current.text, done: !current.done }
	return yield* Effect.succeed({ ...doc, tasks: nextTasks })
})
