import Bun from 'bun'
import { findHeaderIndices, readFileLines } from './file'
import { isBlank } from './util'

export type NoteDependencies = {
	printError: (message: string) => void
	printHelpSummary: () => void
	showFileWithViewer: (filePath: string) => Promise<void>
	readSection: (filePath: string, sectionName: 'Tasks' | 'Notes') => Promise<string[]>
}

export async function addNote(filePath: string, noteText: string): Promise<void> {
	if (noteText.trim().length === 0) {
		throw new Error('Empty text for note')
	}
	let lines = await readFileLines(filePath)
	if (lines.length === 0) {
		lines = ['## Tasks', '', '## Notes', ''] // normalize
	}
	const { tasksHeader, notesHeader } = findHeaderIndices(lines)
	if (tasksHeader === null || notesHeader === null) {
		lines = ['## Tasks', '', '## Notes', '']
		await Bun.write(filePath, lines.join('\n'))
		return addNote(filePath, noteText)
	}
	// Append to end of notes section (end of file)
	// Ensure a trailing newline before appending if file doesn't end with blank line or the last line is header
	const last = lines.at(-1)
	if (!isBlank(last)) {
		lines.push('')
	}
	lines.push(`- ${noteText}`)
	await Bun.write(filePath, lines.join('\n'))
}

export async function handleNotes(filePath: string, textJoined: string | null, deps: NoteDependencies): Promise<void> {
	if (textJoined && textJoined.trim().length > 0) {
		deps.printError('-n with text is invalid. To add a note, pass text without -n.')
		deps.printHelpSummary()
		process.exit(2)
	}
	const notes = await deps.readSection(filePath, 'Notes')
	if (notes.length === 0) {
		process.exit(0)
	}
	process.exit(0)
}

export async function handleNoteAddition(filePath: string, textJoined: string, deps: NoteDependencies): Promise<void> {
	await addNote(filePath, textJoined.trim())
	await deps.showFileWithViewer(filePath)
	process.exit(0)
}
