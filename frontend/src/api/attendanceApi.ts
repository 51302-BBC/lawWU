/**
 * Attendance API (上下班打卡). Same shapes the FastAPI backend will expose;
 * for now backed by localStorage, apart from the leave data so neither can
 * break the other.
 */
import { minuteOfDay, type Punch } from '../domain/attendance'
import { isWorkday, toDateKey, toLocalString } from '../domain/hours'
import { HOLIDAY_SET } from '../mock/seed'
import { delay } from './delay'

const KEY = 'attendance-demo-v1'

type State = Record<string, Punch[]>

let cache: State | null = null

function read(): State {
  if (cache) return cache
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? '{}') as State
  } catch {
    cache = {}
  }
  return cache
}

function write(s: State) {
  cache = s
  localStorage.setItem(KEY, JSON.stringify(s))
}

export function resetAttendance(): void {
  cache = null
  localStorage.removeItem(KEY)
}

/** Monday of the week `d` falls in. */
export function weekStart(d: Date): Date {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7))
  return m
}

/** A small stable number from a string, so demo times differ by person and day but never flicker. */
function hash(s: string): number {
  let h = 7
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0
  // mix, so neighbouring dates don't land on neighbouring times
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0
  return (h ^ (h >>> 16)) >>> 0
}

const at = (day: Date, minutes: number) =>
  toLocalString(new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes))

/** Earlier workdays of this week get believable punches the first time someone is seen. */
function punchesOf(state: State, employeeId: string, now: Date): Punch[] {
  if (state[employeeId]) return state[employeeId]
  const seeded: Punch[] = []
  const day = weekStart(now)
  const today = toDateKey(now)
  while (toDateKey(day) < today) {
    if (isWorkday(day, HOLIDAY_SET)) {
      const h = hash(employeeId + toDateKey(day))
      seeded.push({
        employeeId,
        date: toDateKey(day),
        in: at(day, 8 * 60 + 42 + (h % 22)),
        out: at(day, 18 * 60 + 2 + ((h >>> 5) % 34)),
      })
    }
    day.setDate(day.getDate() + 1)
  }
  state[employeeId] = seeded
  write(state)
  return seeded
}

export function getTodayPunch(employeeId: string, now = new Date()): Promise<Punch | null> {
  const today = toDateKey(now)
  const p = punchesOf(read(), employeeId, now).find((x) => x.date === today)
  return delay(p ? structuredClone(p) : null, 120)
}

/** This week's punches, Monday first. */
export function listWeekPunches(employeeId: string, now = new Date()): Promise<Punch[]> {
  const from = toDateKey(weekStart(now))
  const list = punchesOf(read(), employeeId, now)
    .filter((p) => p.date >= from && p.date <= toDateKey(now))
    .sort((a, b) => a.date.localeCompare(b.date))
  return delay(structuredClone(list), 120)
}

export async function clockIn(employeeId: string, now = new Date()): Promise<Punch> {
  const state = read()
  const list = punchesOf(state, employeeId, now)
  const today = toDateKey(now)
  if (list.some((p) => p.date === today)) throw new Error('今天已經上班打卡了')
  const p: Punch = { employeeId, date: today, in: toLocalString(now) }
  list.push(p)
  write(state)
  return delay(structuredClone(p), 200)
}

export async function clockOut(employeeId: string, now = new Date()): Promise<Punch> {
  const state = read()
  const p = punchesOf(state, employeeId, now).find((x) => x.date === toDateKey(now))
  if (!p) throw new Error('今天還沒有上班打卡')
  if (p.out) throw new Error('今天已經下班打卡了')
  // Never earlier than the clock-in, even if someone taps twice in the same minute.
  p.out = minuteOfDay(now) < minuteOfDay(p.in) ? p.in : toLocalString(now)
  write(state)
  return delay(structuredClone(p), 200)
}
