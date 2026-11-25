/**
 * 上下班打卡. A punch is one employee's one working day: the moment they
 * clocked in and, once they leave, the moment they clocked out. Times are
 * local 'YYYY-MM-DDTHH:mm' strings, like every other time in this app.
 */
import { parseLocal } from './hours'

export interface Punch {
  employeeId: string
  /** 'YYYY-MM-DD' */
  date: string
  in: string
  out?: string
}

export type PunchPhase = 'before' | 'working' | 'done'

/** The scheduled day, in minutes from midnight: 09:00–18:00 with lunch 12:00–13:00. */
export const SCHEDULE_START = 9 * 60
export const SCHEDULE_END = 18 * 60
const LUNCH: [number, number] = [12 * 60, 13 * 60]

/** How long the punch button has to be held. Long enough to mean it. */
export const HOLD_MS = 1200

export function phaseOf(p: Punch | null | undefined): PunchPhase {
  if (!p) return 'before'
  return p.out ? 'done' : 'working'
}

/** Minutes from midnight of a local time string or Date. */
export function minuteOfDay(t: string | Date): number {
  const d = typeof t === 'string' ? parseLocal(t) : t
  return d.getHours() * 60 + d.getMinutes()
}

/** Minutes worked between clocking in and clocking out (or `now`), lunch hour not counted. */
export function workedMinutes(p: Punch, now: Date = new Date()): number {
  const from = parseLocal(p.in).getTime()
  const to = p.out ? parseLocal(p.out).getTime() : now.getTime()
  if (!(to > from)) return 0
  const day = parseLocal(p.date).getTime()
  const lunchFrom = day + LUNCH[0] * 60_000
  const lunchTo = day + LUNCH[1] * 60_000
  const lunch = Math.max(0, Math.min(to, lunchTo) - Math.max(from, lunchFrom))
  return Math.floor((to - from - lunch) / 60_000)
}

/** 「8 小時 9 分」「45 分」 */
export function durationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!h) return `${m} 分`
  return m ? `${h} 小時 ${m} 分` : `${h} 小時`
}

/** 'HH:mm' of a local time string. */
export const clockOf = (t: string) => t.split('T')[1] ?? ''

/** The line said when someone clocks out: plain thanks, and the weekend on Fridays. */
export function signOff(out: Date): string {
  return out.getDay() === 5 ? '好好休息，週末愉快。' : '好好休息，明天見。'
}
