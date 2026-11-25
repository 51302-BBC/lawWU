/** Working periods in minutes from midnight: 09:00–12:00, 13:00–18:00. */
const WORK_PERIODS: Array<[number, number]> = [
  [9 * 60, 12 * 60],
  [13 * 60, 18 * 60],
]

export const HOURS_PER_DAY = 8

/** Parse local 'YYYY-MM-DDTHH:mm' (or 'YYYY-MM-DD') without timezone surprises. */
export function parseLocal(s: string): Date {
  const [d, t = '00:00'] = s.split('T')
  const [y, m, day] = d.split('-').map(Number)
  const [hh, mm] = t.split(':').map(Number)
  return new Date(y, m - 1, day, hh, mm)
}

const pad = (n: number) => String(n).padStart(2, '0')

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function toLocalString(d: Date): string {
  return `${toDateKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function isWorkday(d: Date, holidays: Set<string>): boolean {
  const dow = d.getDay()
  return dow !== 0 && dow !== 6 && !holidays.has(toDateKey(d))
}

/**
 * Hours of leave between start and end, counting only working periods on
 * working days, rounded up to the nearest 0.5 hour.
 */
export function calcLeaveHours(start: string, end: string, holidays: Set<string>): number {
  const s = parseLocal(start)
  const e = parseLocal(end)
  if (!(e > s)) return 0

  let minutes = 0
  const day = new Date(s.getFullYear(), s.getMonth(), s.getDate())
  const lastDay = new Date(e.getFullYear(), e.getMonth(), e.getDate())

  while (day <= lastDay) {
    if (isWorkday(day, holidays)) {
      const dayStart = day.getTime()
      for (const [from, to] of WORK_PERIODS) {
        const pStart = dayStart + from * 60_000
        const pEnd = dayStart + to * 60_000
        const overlap = Math.min(pEnd, e.getTime()) - Math.max(pStart, s.getTime())
        if (overlap > 0) minutes += overlap / 60_000
      }
    }
    day.setDate(day.getDate() + 1)
  }

  return Math.ceil(minutes / 30) / 2
}

/** "1 天 4 小時" style label from hours (8h/day). */
export function formatHours(hours: number): string {
  if (hours <= 0) return '0 小時'
  const days = Math.floor(hours / HOURS_PER_DAY)
  const rest = hours - days * HOURS_PER_DAY
  if (days && rest) return `${days} 天 ${rest} 小時`
  if (days) return `${days} 天`
  return `${rest} 小時`
}
