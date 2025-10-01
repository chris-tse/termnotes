import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

export interface CliRunResult {
	status: number | null
	stdout: string
	stderr: string
}

export function runCli(args: string[], opts: { cwd: string; env?: Record<string, string> }): CliRunResult {
	const entry = join(process.cwd(), 'src', 'index.ts')
	const proc = spawnSync('bun', ['run', entry, ...args], {
		cwd: opts.cwd,
		env: { ...process.env, NODE_ENV: 'test', TERMNOTES_NO_VIEWER: '1', ...opts.env },
		encoding: 'utf-8',
	})
	return { status: proc.status, stdout: proc.stdout, stderr: proc.stderr }
}
