import { parseLocal, toDateKey } from '../../domain/hours'

const WEEKDAY = '日一二三四五六'

export function formatDate(d: Date, withWeekday = true): string {
  const base = `${d.getMonth() + 1}月${d.getDate()}日`
  return withWeekday ? `${base}（${WEEKDAY[d.getDay()]}）` : base
}

export function formatDateLong(d: Date): string {
  return `${d.getMonth() + 1}月${d.getDate()}日 星期${WEEKDAY[d.getDay()]}`
}

const hm = (s: string) => s.split('T')[1] ?? ''

/** 「12月10日（四）全天」「12月10日（四）13:00–18:00」「12月10日（四）– 12月13日（日）」 */
export function formatRange(start: string, end: string): string {
  const s = parseLocal(start)
  const e = parseLocal(end)
  const sameDay = toDateKey(s) === toDateKey(e)
  const fullStart = hm(start) === '09:00'
  const fullEnd = hm(end) === '18:00'
  if (sameDay) {
    if (fullStart && fullEnd) return `${formatDate(s)} 全天`
    return `${formatDate(s)} ${hm(start)}–${hm(end)}`
  }
  const left = fullStart ? formatDate(s) : `${formatDate(s)} ${hm(start)}`
  const right = fullEnd ? formatDate(e) : `${formatDate(e)} ${hm(end)}`
  return `${left} – ${right}`
}

export function hoursLabel(h: number): string {
  return `${h % 1 ? h.toFixed(1) : h} 小時`
}

/** Relative day phrase: 今天 / 明天 / 3 天後 / 昨天 */
export function relativeDay(start: string, now = new Date()): string {
  const a = parseLocal(start)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = new Date(a.getFullYear(), a.getMonth(), a.getDate())
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000)
  if (diff === 0) return '今天'
  if (diff === 1) return '明天'
  if (diff === 2) return '後天'
  if (diff > 0) return `${diff} 天後`
  if (diff === -1) return '昨天'
  return `${-diff} 天前`
}

export const givenName = (name: string) => (name.length >= 3 ? name.slice(1) : name)

/** 林主管 / 王經理 — how staff refer to approvers. */
export function honorific(e: { name: string; role: string }): string {
  const surname = e.name.slice(0, 1)
  if (e.role === 'supervisor') return `${surname}主管`
  if (e.role === 'manager') return `${surname}經理`
  if (e.role === 'owner') return `${surname}所長`
  return e.name
}
