// TODO: These tests need BunContext to be provided; why is that?

import { Effect, Layer } from 'effect'
import { BunContext } from '@effect/platform-bun'
import { expect, it } from '@effect/vitest'
import { CommandChecker } from './command-checker'
import { detectViewer } from './config'

it.effect('prefers glow if available', () => {
	const glowExistsChecker = Layer.mock(CommandChecker, {
		_tag: 'tn/CommandChecker',
		commandExists: (cmd: string) => Effect.succeed(cmd === 'glow'),
	})

	return Effect.gen(function* () {
		const result = yield* detectViewer()
		expect(result).toBe('glow')
	}).pipe(Effect.provide(glowExistsChecker), Effect.provide(BunContext.layer))
})

it.effect('prefers bat if glow is not available', () => {
	const batExistsChecker = Layer.mock(CommandChecker, {
		_tag: 'tn/CommandChecker',
		commandExists: (cmd: string) => Effect.succeed(cmd === 'bat'),
	})

	return Effect.gen(function* () {
		const result = yield* detectViewer()
		expect(result).toBe('bat')
	}).pipe(Effect.provide(batExistsChecker), Effect.provide(BunContext.layer))
})

it.effect('falls back to cat if neither are available', () => {
	const noExistsChecker = Layer.mock(CommandChecker, {
		_tag: 'tn/CommandChecker',
		commandExists: (_cmd: string) => Effect.succeed(false),
	})

	return Effect.gen(function* () {
		const result = yield* detectViewer()
		expect(result).toBe('cat')
	}).pipe(Effect.provide(noExistsChecker), Effect.provide(BunContext.layer))
})
