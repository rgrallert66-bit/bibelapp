// Local-calendar day helpers. A "day key" is YYYY-MM-DD in the user's local time zone.

let offsetDays = 0
/** Testing hook: shift "today" (used by ?day=+N in dev/demo). */
export function setDayOffset(n: number) {
  offsetDays = n
}

export function now(): number {
  return Date.now() + offsetDays * 86400000
}

export function dayKey(t: number = now()): string {
  const d = new Date(t)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function parseDay(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, n: number): string {
  const d = parseDay(key)
  d.setDate(d.getDate() + n)
  return dayKey(d.getTime())
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / 86400000)
}

/** Monday-based week containing `key`. */
export function weekDays(key: string = dayKey()): string[] {
  const d = parseDay(key)
  const dow = (d.getDay() + 6) % 7
  const monday = addDays(key, -dow)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}
