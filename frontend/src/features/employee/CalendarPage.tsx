import { useMemo, useState } from 'react'
import { getHolidays, listEmployees, listLeaveTypes, listMyRequests, listTeamApproved } from '../../api/leaveApi'
import { useAsync, useUser } from '../../app/session'
import { parseLocal, toDateKey, toLocalString } from '../../domain/hours'
import { overlaps } from '../../domain/rules'
import type { LeaveRequest } from '../../domain/types'
import { Avatar, Button, Empty, StatusPill } from '../../ui/components'
import { Icon } from '../../ui/Icon'
import { formatDate, formatRange, givenName } from '../shared/format'
import './calendar.css'

const WEEK = ['日', '一', '二', '三', '四', '五', '六']

function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - first.getDay())
  const days: Date[] = []
  const weeks = Math.ceil((first.getDay() + new Date(year, month + 1, 0).getDate()) / 7)
  for (let i = 0; i < weeks * 7; i++) days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  return days
}

const dayRange = (d: Date): [string, string] => {
  const k = toDateKey(d)
  return [`${k}T00:00`, `${k}T23:59`]
}

export function CalendarPage() {
  const me = useUser()
  const today = new Date()
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState(() => toDateKey(today))
  const y = cursor.getFullYear()
  const m = cursor.getMonth()
  const days = useMemo(() => monthGrid(y, m), [y, m])

  const data = useAsync(async () => {
    const from = toLocalString(days[0])
    const to = toLocalString(new Date(days[days.length - 1].getTime() + 86_400_000))
    const [holidays, approved, mine, employees, types] = await Promise.all([
      getHolidays(),
      listTeamApproved(from, to),
      listMyRequests(me.id),
      listEmployees(),
      listLeaveTypes(),
    ])
    const myPending = mine.filter((r) => r.status === 'pending')
    return { holidays: new Map(holidays.map((h) => [h.date, h.name])), leaves: [...approved, ...myPending], employees, types }
  }, [y, m, me.id])

  const leavesOn = (d: Date): LeaveRequest[] => {
    const [a, b] = dayRange(d)
    const dow = d.getDay()
    if (dow === 0 || dow === 6 || data.data?.holidays.has(toDateKey(d))) return []
    return (data.data?.leaves ?? []).filter((r) => overlaps(a, b, r.start, r.end))
  }
  const person = (id: string) => data.data?.employees.find((e) => e.id === id)
  const typeName = (id: string) => data.data?.types.find((t) => t.id === id)?.name ?? ''

  const selDate = parseLocal(selected)
  const selLeaves = leavesOn(selDate)
  const selHoliday = data.data?.holidays.get(selected)
  const isBusy = (d: Date) => d.getMonth() === 4

  const go = (delta: number) => setCursor(new Date(y, m + delta, 1))

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">行事曆</h1>
          <p className="page-sub">國定假日、報稅季，以及誰哪天不在</p>
        </div>
      </header>

      <div className="cal-layout">
        <section className="group cal" aria-label={`${y} 年 ${m + 1} 月`}>
          <div className="cal__bar">
            <h2 className="cal__title">
              {y} 年 <strong>{m + 1} 月</strong>
            </h2>
            <div className="cal__nav">
              <button type="button" className="icon-btn" onClick={() => go(-1)} aria-label="上個月">
                <Icon name="chevronLeft" size={18} />
              </button>
              <Button
                variant="gray"
                onClick={() => {
                  setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
                  setSelected(toDateKey(today))
                }}
              >
                今天
              </Button>
              <button type="button" className="icon-btn" onClick={() => go(1)} aria-label="下個月">
                <Icon name="chevronRight" size={18} />
              </button>
            </div>
          </div>

          <div className="cal__grid" role="grid">
            <div className="cal__week" role="row">
              {WEEK.map((w, i) => (
                <span key={w} role="columnheader" className={`cal__wd${i === 0 || i === 6 ? ' is-weekend' : ''}`}>
                  {w}
                </span>
              ))}
            </div>
            {Array.from({ length: days.length / 7 }, (_, wi) => (
              <div key={wi} className="cal__week" role="row">
                {days.slice(wi * 7, wi * 7 + 7).map((d) => {
                  const key = toDateKey(d)
                  const holiday = data.data?.holidays.get(key)
                  const leaves = leavesOn(d)
                  const out = d.getMonth() !== m
                  const weekend = d.getDay() === 0 || d.getDay() === 6
                  const cls = [
                    'cal__day',
                    out && 'is-out',
                    weekend && 'is-weekend',
                    holiday && 'is-holiday',
                    isBusy(d) && 'is-busy',
                    key === toDateKey(today) && 'is-today',
                    key === selected && 'is-selected',
                  ]
                    .filter(Boolean)
                    .join(' ')
                  return (
                    <button
                      key={key}
                      type="button"
                      role="gridcell"
                      className={cls}
                      aria-selected={key === selected}
                      aria-label={`${formatDate(d)}${holiday ? `，${holiday}` : ''}${leaves.length ? `，${leaves.length} 人請假` : ''}`}
                      onClick={() => setSelected(key)}
                    >
                      <span className="cal__num num">{d.getDate()}</span>
                      {holiday && <span className="cal__holiday">{holiday}</span>}
                      <span className="cal__chips">
                        {leaves.slice(0, 3).map((r) => {
                          const p = person(r.employeeId)
                          if (!p) return null
                          const mine = r.employeeId === me.id
                          return (
                            <span
                              key={r.id}
                              className={`cal__chip${mine ? ' is-mine' : ''}${r.status === 'pending' ? ' is-pending' : ''}`}
                              style={{ ['--c' as string]: p.avatarColor }}
                            >
                              {mine ? '你' : givenName(p.name)}
                            </span>
                          )
                        })}
                        {leaves.length > 3 && <span className="cal__more">+{leaves.length - 3}</span>}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          <div className="cal__legend">
            <span><i className="lg lg--holiday" />國定假日</span>
            <span><i className="lg lg--busy" />報稅季（5 月）</span>
            <span><i className="lg lg--mine" />你的假</span>
            <span><i className="lg lg--pending" />你審核中的假</span>
          </div>
        </section>

        <aside className="cal-side" aria-live="polite">
          <h2 className="cal-side__date">{formatDate(selDate)}</h2>
          {selHoliday && <p className="cal-side__holiday">{selHoliday}，放假</p>}
          {isBusy(selDate) && <p className="cal-side__busy">報稅季，事務所最忙的時候</p>}
          <div className="group">
            {selLeaves.length === 0 ? (
              <Empty icon="people" title={selHoliday || selDate.getDay() % 6 === 0 ? '不用上班' : '大家都在'}>
                {selHoliday || selDate.getDay() % 6 === 0 ? '好好休息。' : '這天沒有人請假。'}
              </Empty>
            ) : (
              selLeaves.map((r) => {
                const p = person(r.employeeId)!
                return (
                  <div key={r.id} className="row row--inset">
                    <Avatar person={p} size={34} />
                    <div className="row__main">
                      <p className="row__title">{r.employeeId === me.id ? `${p.name}（你）` : p.name}</p>
                      <p className="row__sub">
                        {typeName(r.typeId)}・{formatRange(r.start, r.end)}
                      </p>
                    </div>
                    {r.status !== 'approved' && <StatusPill status={r.status} />}
                  </div>
                )
              })
            )}
          </div>
        </aside>
      </div>
    </>
  )
}
