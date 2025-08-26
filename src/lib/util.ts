export function isBlank(s?: string): boolean {
	return (s ?? '').trim() === ''
}
