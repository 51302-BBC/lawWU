import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getBalances, listEmployees, listLeaveTypes, listMyRequests, listTeamApproved } from '../../api/leaveApi'
import { useAsync, useUser } from '../../app/session'
import { HOURS_PER_DAY, parseLocal, toLocalString } from '../../domain/hours'
import { remainingHours } from '../../domain/rules'
import type { Balance, LeaveRequest, LeaveType } from '../../domain/types'
import { TEAMS } from '../../mock/seed'
import { Avatar, Button, Empty, Journey, Sheet, Skeleton, StatusPill } from '../../ui/components'
import { Icon } from '../../ui/Icon'
import { formatDateLong, formatRange, givenName, hoursLabel, relativeDay } from '../shared/format'
import { requestJourney, waitingSentence } from '../shared/journey'
import { ApplySheet } from './ApplySheet'
import { RequestDetail } from './RequestDetail'
import './dashboard.css'

export function greeting(d = new Date()): string {
  const h = d.getHours()
  return h < 11 ? '早安' : h < 18 ? '午安' : '晚安'
}

function daysWords(h: number): string {
  const d = Math.floor(h / HOURS_PER_DAY)
  const rest = h - d * HOURS_PER_DAY
  if (!d) return ''
  return rest ? `約 ${d} 天又 ${rest} 小時` : `等於 ${d} 天`
}

function Meter({ b }: { b: Balance }) {
  const total = b.grantedHours ?? 0
  if (!total) return null
  const pct = (v: number) => `${Math.min(100, (v / total) * 100)}%`
  return (
    <div className="meter" aria-hidden="true">
      <span className="meter__used" style={{ width: pct(b.usedHours) }} />
      <span className="meter__pending" style={{ width: pct(b.pendingHours) }} />
    </div>
  )
}

function BalanceStrip({ balances, types, onAll }: { balances: Balance[]; types: LeaveType[]; onAll: () => void }) {
  const get = (id: string) => balances.find((b) => b.typeId === id)!
  const name = (id: string) => types.find((t) => t.id === id)?.name ?? ''
  const annual = get('annual')
  const annualLeft = remainingHours(annual) ?? 0
  return (
    <section className="balances group" aria-label="剩餘假別時數">
      <div className="bal bal--hero">
        <p className="bal__label">{name('annual')}還有</p>
        <p className="bal__value num">{hoursLabel(annualLeft)}</p>
        <p className="bal__words">{daysWords(annualLeft) || ' '}</p>
        <Meter b={annual} />
        <p className="bal__legend num">
          <span className="dot dot--used" />已休 {annual.usedHours}
          <span className="dot dot--pending" />審核中 {annual.pendingHours}
          <span className="bal__total">今年共 {annual.grantedHours} 小時</span>
        </p>
      </div>
      {(['personal', 'sick'] as const).map((id) => {
        const b = get(id)
        return (
          <div key={id} className="bal">
            <p className="bal__label">{name(id)}還有</p>
            <p className="bal__value bal__value--sm num">{hoursLabel(remainingHours(b) ?? 0)}</p>
            <Meter b={b} />
            <p className="bal__legend num">已用 {b.usedHours + b.pendingHours}／{b.grantedHours}</p>
          </div>
        )
      })}
      <button type="button" className="bal bal--more" onClick={onAll}>
        <span>全部假別</span>
        <Icon name="chevronRight" size={18} />
      </button>
    </section>
  )
}

function AllBalancesSheet({ balances, types, onClose }: { balances: Balance[]; types: LeaveType[]; onClose: () => void }) {
  return (
    <Sheet title="全部假別" onClose={onClose} leading={<Button variant="plain" onClick={onClose}>完成</Button>} width={560}>
      <div className="group">
        {types.map((t) => {
          const b = balances.find((x) => x.typeId === t.id)!
          const left = remainingHours(b)
          return (
            <div key={t.id} className="row allbal">
              <div className="row__main">
                <p className="row__title">{t.name}</p>
                <p className="row__sub">{t.paid}・{t.note}</p>
              </div>
              <div className="allbal__num num">
                <strong>{left === null ? '依需要' : hoursLabel(Math.max(left, 0))}</strong>
                {b.pendingHours > 0 && <span>審核中 {b.pendingHours}</span>}
              </div>
            </div>
          )
        })}
      </div>
      <p className="group__footer">時數以小時計，1 天 = 8 小時。特休依年資給假。</p>
    </Sheet>
  )
}

function InFlightRow({ req, employees, typeName, meId, onOpen }: {
  req: LeaveRequest
  employees: Parameters<typeof requestJourney>[1]
  typeName: string
  meId: string
  onOpen: () => void
}) {
  const s = parseLocal(req.start)
  return (
    <button type="button" className="row flight" onClick={onOpen}>
      <span className="datechip" aria-hidden="true">
        <span className="datechip__m">{s.getMonth() + 1}月</span>
        <span className="datechip__d num">{s.getDate()}</span>
      </span>
      <span className="row__main flight__main">
        <span className="flight__title">
          <span className="row__title">{typeName}</span>
          <span className="flight__hours num">{hoursLabel(req.hours)}</span>
          <StatusPill status={req.status} />
        </span>
        <span className="row__sub">
          {relativeDay(req.start)}・{formatRange(req.start, req.end)}
        </span>
        <span className="flight__waiting">{waitingSentence(req, employees)}</span>
      </span>
      <span className="flight__journey">
        <Journey stops={requestJourney(req, employees, meId)} size={34} />
      </span>
      <Icon name="chevronRight" size={18} className="row__chev" />
    </button>
  )
}

export function DashboardPage() {
  const me = useUser()
  const location = useLocation()
  const navigate = useNavigate()
  const applying = location.pathname === '/apply'
  const [showAll, setShowAll] = useState(false)
  const [openReq, setOpenReq] = useState<LeaveRequest | null>(null)

  const data = useAsync(async () => {
    const now = new Date()
    const weekEnd = new Date(now)
    weekEnd.setDate(now.getDate() + 7)
    const [balances, types, mine, employees, away] = await Promise.all([
      getBalances(me.id),
      listLeaveTypes(),
      listMyRequests(me.id),
      listEmployees(),
      listTeamApproved(toLocalString(new Date(now.getFullYear(), now.getMonth(), now.getDate())), toLocalString(weekEnd)),
    ])
    return { balances, types, mine, employees, away }
  }, [me.id])

  const now = new Date()
  const d = data.data
  const inFlight = (d?.mine ?? [])
    .filter((r) => r.status === 'pending' || r.status === 'cancel_pending' || (r.status === 'approved' && parseLocal(r.end) >= now))
    .sort((a, b) => a.start.localeCompare(b.start))
  const awayOthers = (d?.away ?? []).filter((r) => r.employeeId !== me.id).sort((a, b) => a.start.localeCompare(b.start))

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">
            {greeting()}，{givenName(me.name)}
          </h1>
          <p className="page-sub">
            {formatDateLong(now)}・{TEAMS[me.teamId]}
          </p>
        </div>
        <Button size="lg" icon="plus" className="only-desktop" onClick={() => navigate('/apply')}>
          申請請假
        </Button>
      </header>

      {d ? (
        <BalanceStrip balances={d.balances} types={d.types} onAll={() => setShowAll(true)} />
      ) : (
        <div className="balances group" aria-busy="true">
          <div className="bal bal--hero"><Skeleton h={18} w={80} /><Skeleton h={40} w={160} /><Skeleton h={8} /></div>
          <div className="bal"><Skeleton h={18} w={60} /><Skeleton h={28} w={100} /></div>
          <div className="bal"><Skeleton h={18} w={60} /><Skeleton h={28} w={100} /></div>
        </div>
      )}

      <section className="section">
        <div className="group__header">
          <h2 className="group__title">進行中的假單</h2>
          {inFlight.length > 0 && (
            <Button variant="plain" onClick={() => navigate('/records')}>
              全部紀錄
            </Button>
          )}
        </div>
        <div className="group">
          {!d ? (
            <div className="row"><Skeleton h={56} /></div>
          ) : inFlight.length === 0 ? (
            <Empty icon="calendar" title="目前沒有進行中的假單">
              要休息的時候，按右上角「申請請假」，一分鐘就能送出。
            </Empty>
          ) : (
            inFlight.map((r) => (
              <InFlightRow
                key={r.id}
                req={r}
                employees={d.employees}
                meId={me.id}
                typeName={d.types.find((t) => t.id === r.typeId)?.name ?? ''}
                onOpen={() => setOpenReq(r)}
              />
            ))
          )}
        </div>
      </section>

      <section className="section">
        <div className="group__header">
          <h2 className="group__title">這 7 天不在辦公室的同事</h2>
          <Button variant="plain" onClick={() => navigate('/calendar')}>
            看行事曆
          </Button>
        </div>
        <div className="group">
          {d && awayOthers.length === 0 && (
            <Empty icon="people" title="大家都在">這 7 天沒有同事請假。</Empty>
          )}
          {d &&
            awayOthers.map((r) => {
              const p = d.employees.find((e) => e.id === r.employeeId)!
              return (
                <div key={r.id} className="row row--inset">
                  <Avatar person={p} size={32} />
                  <div className="row__main">
                    <p className="row__title">{p.name}</p>
                    <p className="row__sub">
                      {d.types.find((t) => t.id === r.typeId)?.name}・{formatRange(r.start, r.end)}
                    </p>
                  </div>
                  <span className="away__when">{relativeDay(r.start)}</span>
                </div>
              )
            })}
        </div>
      </section>

      {applying && (
        <ApplySheet
          onClose={() => navigate('/')}
          onSubmitted={(req) => {
            navigate('/')
            setOpenReq(req)
          }}
        />
      )}
      {showAll && d && <AllBalancesSheet balances={d.balances} types={d.types} onClose={() => setShowAll(false)} />}
      {openReq && <RequestDetail request={openReq} onClose={() => setOpenReq(null)} />}
    </>
  )
}
