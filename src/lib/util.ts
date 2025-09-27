// NOTE TO AGENT: still needs to be converted to Effect

export function isBlank(s?: string): boolean {
	return (s ?? '').trim() === ''
}
