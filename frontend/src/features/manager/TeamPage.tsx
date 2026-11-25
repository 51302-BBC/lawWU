import { useMemo, useState } from 'react'
import { getBalancesOf, getHolidays, listLeaveTypes, listRequestsOf, listSubordinates } from '../../api/leaveApi'
import { useAsync, useUser } from '../../app/session'
import { calcLeaveHours, toDateKey } from '../../domain/hours'
import { remainingHours } from '../../domain/rules'
import type { LeaveRequest } from '../../domain/types'
import { TEAMS } from '../../mock/seed'
import { Avatar, Button } from '../../ui/components'
import { Icon } from '../../ui/Icon'
import { formatDate } from '../shared/format'
import './team.css'

function mondayOf(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dow = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - dow)
  return x
}

const ACTIVE = new Set(['pending', 'approved', 'cancel_pending'])

export function TeamPage() {
  const me = useUser()
  const [week, setWeek] = useState(() => mondayOf(new Date()))
  const days = useMemo(
    () => Array.from({ length: 5 }, (_, i) => new Date(week.getFullYear(), week.getMonth(), week.getDate() + i)),
    [week],
  )

  const data = useAsync(async () => {
    const subs = await listSubordinates(me.id)
    const people = [me, ...subs]
    const ids = people.map((p) => p.id)
    const [requests, balances, types, holidays] = await Promise.all([
      listRequestsOf(ids),
      getBalancesOf(ids),
      listLeaveTypes(),
      getHolidays(),
    ])
    return { people, requests, balances, types, holidays: new Set(holidays.map((h) => h.date)) }
  }, [me.id])

  const d = data.data
  const cell = (personId: string, day: Date): { hours: number; req: LeaveRequest } | null => {
    if (!d) return null
    const k = toDateKey(day)
    for (const r of d.requests) {
      if (r.employeeId !== personId || !ACTIVE.has(r.status)) continue
      const s = r.start > `${k}T00:00` ? r.start : `${k}T00:00`
      const e = r.end < `${k}T23:59` ? r.end : `${k}T23:59`
      const h = calcLeaveHours(s, e, d.holidays)
      if (h > 0) return { hours: h, req: r }
    }
    return null
  }
  const typeName = (id: string) => d?.types.find((t) => t.id === id)?.name ?? ''
  const shift = (n: number) => setWeek(new Date(week.getFullYear(), week.getMonth(), week.getDate() + n * 7))
  const awayCount = d ? d.people.filter((p) => days.some((day) => cell(p.id, day))).length : 0
  const todayKey = toDateKey(new Date())

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">團隊概況</h1>
          <p className="page-sub">你和{me.role === 'manager' ? '各組' : TEAMS[me.teamId]}同事的請假狀況</p>
        </div>
      </header>

      <section className="group team-week" aria-label="本週請假">
        <div className="team-week__bar">
          <div>
            <h2 className="group__title">
              {formatDate(days[0], false)} – {formatDate(days[4], false)}
            </h2>
            <p className="page-sub">{d ? (awayCount ? `這週有 ${awayCount} 人會請假` : '這週大家都在') : ' '}</p>
          </div>
          <div className="cal__nav">
            <button type="button" className="icon-btn" onClick={() => shift(-1)} aria-label="上一週">
              <Icon name="chevronLeft" size={18} />
            </button>
            <Button variant="gray" onClick={() => setWeek(mondayOf(new Date()))}>
              本週
            </Button>
            <button type="button" className="icon-btn" onClick={() => shift(1)} aria-label="下一週">
              <Icon name="chevronRight" size={18} />
            </button>
          </div>
        </div>

        <div className="tw" role="table" aria-label="本週請假表">
          <div className="tw__row tw__row--head" role="row">
            <span role="columnheader" className="tw__name-h">同事</span>
            {days.map((day) => (
              <span
                key={day.toISOString()}
                role="columnheader"
                className={`tw__day-h${toDateKey(day) === todayKey ? ' is-today' : ''}`}
              >
                <span className="tw__dow">週{'日一二三四五六'[day.getDay()]}</span>
                <span className="tw__date num">{day.getDate()}</span>
              </span>
            ))}
          </div>
          {d?.people.map((p) => (
            <div key={p.id} className="tw__row" role="row">
              <span role="cell" className="tw__name">
                <Avatar person={p} size={30} />
                <span>
                  {p.name}
                  {p.id === me.id && <span className="tw__me">你</span>}
                </span>
              </span>
              {days.map((day) => {
                const c = cell(p.id, day)
                const holiday = d.holidays.has(toDateKey(day))
                return (
                  <span key={day.toISOString()} role="cell" className="tw__cell">
                    {holiday ? (
                      <span className="tw__holiday">國定假日</span>
                    ) : c ? (
                      <span
                        className={`tw__leave${c.req.status === 'approved' ? '' : ' is-pending'}${c.hours < 8 ? ' is-part' : ''}`}
                        style={{ ['--c' as string]: p.avatarColor }}
                        title={`${typeName(c.req.typeId)} ${c.hours} 小時`}
                      >
                        {typeName(c.req.typeId)}
                        {c.hours < 8 && <span className="num"> {c.hours}h</span>}
                        {c.req.status !== 'approved' && <span className="visually-hidden">（審核中）</span>}
                      </span>
                    ) : null}
                  </span>
                )
              })}
            </div>
          ))}
        </div>
        <p className="group__footer tw__foot">實心為已核准，框線為審核中。</p>
      </section>

      <section className="section">
        <div className="group__header">
          <h2 className="group__title">剩餘時數</h2>
        </div>
        <div className="group bt-wrap">
          <table className="bt">
            <thead>
              <tr>
                <th scope="col">同事</th>
                <th scope="col">特休</th>
                <th scope="col">事假</th>
                <th scope="col">病假</th>
                <th scope="col">審核中</th>
              </tr>
            </thead>
            <tbody>
              {d?.people.map((p) => {
                const b = d.balances[p.id] ?? []
                const left = (id: string) => {
                  const x = b.find((y) => y.typeId === id)
                  return x ? (remainingHours(x) ?? 0) : 0
                }
                const pending = b.reduce((a, x) => a + x.pendingHours, 0)
                const annual = b.find((x) => x.typeId === 'annual')
                const low = annual?.grantedHours ? left('annual') / annual.grantedHours < 0.25 : false
                return (
                  <tr key={p.id}>
                    <th scope="row">
                      <span className="tw__name">
                        <Avatar person={p} size={28} />
                        <span>
                          {p.name}
                          <span className="bt__title">{p.title}</span>
                        </span>
                      </span>
                    </th>
                    <td className={`num${low ? ' is-low' : ''}`}>{left('annual')}</td>
                    <td className="num">{left('personal')}</td>
                    <td className="num">{left('sick')}</td>
                    <td className="num">{pending ? <span className="bt__pending">{pending}</span> : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="group__footer">單位：小時。特休剩不到四分之一的同事以紅色標示。</p>
      </section>
    </>
  )
}
