import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, test } from 'vitest'
import { runCli } from '../utils/runCli'

// Global cleanup for any stray project-level test directory.
afterAll(() => {
	try {
		rmSync(join(process.cwd(), '.termnotes-test'), { recursive: true, force: true })
	} catch {}
})

function todayNotePath(base: string) {
	const today = new Date()
	const yyyy = today.getFullYear()
	const mm = String(today.getMonth() + 1).padStart(2, '0')
	const dd = String(today.getDate()).padStart(2, '0')
	return join(base, '.termnotes-test', 'notes', `${yyyy}-${mm}-${dd}.md`)
}

describe('tn CLI basic', () => {
	test('running tn creates today note file', () => {
		const tmp = mkdtempSync(join(tmpdir(), 'tn-test-'))
		try {
			const { status, stderr } = runCli([], { cwd: tmp })
			expect(status, stderr).toBe(0)
			const notePath = todayNotePath(tmp)
			expect(existsSync(notePath)).toBe(true)
			const content = readFileSync(notePath, 'utf-8')
			expect(content).toContain('## Tasks')
			expect(content).toContain('## Notes')
		} finally {
			rmSync(tmp, { recursive: true, force: true })
		}
	})

	test('adding a single task appends to Tasks section', () => {
		const tmp = mkdtempSync(join(tmpdir(), 'tn-test-'))
		try {
			// First ensure file exists
			let result = runCli([], { cwd: tmp })
			expect(result.status, result.stderr).toBe(0)
			// Add task
			result = runCli(['task', 'Write', 'tests'], { cwd: tmp })
			expect(result.status, result.stderr).toBe(0)
			const content = readFileSync(todayNotePath(tmp), 'utf-8')
			expect(content).toMatch(/## Tasks\n- \[ \] Write tests\n?/) // task line present
			expect(content).toContain('## Notes')
		} finally {
			rmSync(tmp, { recursive: true, force: true })
		}
	})

	test('adding a single note appends to Notes section', () => {
		const tmp = mkdtempSync(join(tmpdir(), 'tn-test-'))
		try {
			// Ensure file exists
			let result = runCli([], { cwd: tmp })
			expect(result.status, result.stderr).toBe(0)
			// Add note
			result = runCli(['note', 'Refactor', 'parser'], { cwd: tmp })
			expect(result.status, result.stderr).toBe(0)
			const content = readFileSync(todayNotePath(tmp), 'utf-8')
			expect(content).toMatch(/## Notes[\s\S]*- Refactor parser/) // note line present somewhere after header
			// Ensure tasks header still intact
			expect(content).toContain('## Tasks')
		} finally {
			rmSync(tmp, { recursive: true, force: true })
		}
	})

	test('adding then toggling a task updates its status', () => {
		const tmp = mkdtempSync(join(tmpdir(), 'tn-test-'))
		try {
			// Ensure file exists
			let result = runCli([], { cwd: tmp })
			expect(result.status, result.stderr).toBe(0)
			// Add task
			result = runCli(['task', 'Toggle', 'me'], { cwd: tmp })
			expect(result.status, result.stderr).toBe(0)
			// Toggle task 1
			result = runCli(['x', '1'], { cwd: tmp })
			expect(result.status, result.stderr).toBe(0)
			const content = readFileSync(todayNotePath(tmp), 'utf-8')
			expect(content).toMatch(/## Tasks[\s\S]*- \[x\] Toggle me/)
		} finally {
			rmSync(tmp, { recursive: true, force: true })
		}
	})

	test('adding both a task and a note includes both entries', () => {
		const tmp = mkdtempSync(join(tmpdir(), 'tn-test-'))
		try {
			let result = runCli([], { cwd: tmp })
			expect(result.status, result.stderr).toBe(0)
			result = runCli(['task', 'Implement', 'feature'], { cwd: tmp })
			expect(result.status, result.stderr).toBe(0)
			result = runCli(['note', 'Review', 'design'], { cwd: tmp })
			expect(result.status, result.stderr).toBe(0)
			const content = readFileSync(todayNotePath(tmp), 'utf-8')
			expect(content).toMatch(/## Tasks[\s\S]*- \[ \] Implement feature/)
			expect(content).toMatch(/## Notes[\s\S]*- Review design/)
		} finally {
			rmSync(tmp, { recursive: true, force: true })
		}
	})

	test('adding three tasks then toggling the second marks only that one done', () => {
		const tmp = mkdtempSync(join(tmpdir(), 'tn-test-'))
		try {
			let result = runCli([], { cwd: tmp })
			expect(result.status, result.stderr).toBe(0)
			result = runCli(['task', 'First'], { cwd: tmp })
			expect(result.status, result.stderr).toBe(0)
			result = runCli(['task', 'Second'], { cwd: tmp })
			expect(result.status, result.stderr).toBe(0)
			result = runCli(['task', 'Third'], { cwd: tmp })
			expect(result.status, result.stderr).toBe(0)
			result = runCli(['x', '2'], { cwd: tmp })
			expect(result.status, result.stderr).toBe(0)
			const content = readFileSync(todayNotePath(tmp), 'utf-8')
			// Expect tasks in order with only second marked x
			expect(content).toMatch(/## Tasks[\s\S]*- \[ \] First[\s\S]*- \[x\] Second[\s\S]*- \[ \] Third/)
		} finally {
			rmSync(tmp, { recursive: true, force: true })
		}
	})

	test('toggling an invalid index leaves tasks unchanged', () => {
		const tmp = mkdtempSync(join(tmpdir(), 'tn-test-'))
		try {
			let result = runCli([], { cwd: tmp })
			expect(result.status, result.stderr).toBe(0)
			result = runCli(['task', 'First'], { cwd: tmp })
			expect(result.status, result.stderr).toBe(0)
			result = runCli(['task', 'Second'], { cwd: tmp })
			expect(result.status, result.stderr).toBe(0)
			result = runCli(['task', 'Third'], { cwd: tmp })
			expect(result.status, result.stderr).toBe(0)
			// Attempt to toggle non-existent 4th task
			result = runCli(['x', '4'], { cwd: tmp })
			expect(result.status, result.stderr).toBe(0) // still succeeds with warning
			const content = readFileSync(todayNotePath(tmp), 'utf-8')
			expect(content).toMatch(/- \[ \] First/)
			expect(content).toMatch(/- \[ \] Second/)
			expect(content).toMatch(/- \[ \] Third/)
			expect(content).not.toMatch(/- \[x\]/)
		} finally {
			rmSync(tmp, { recursive: true, force: true })
		}
	})
})
