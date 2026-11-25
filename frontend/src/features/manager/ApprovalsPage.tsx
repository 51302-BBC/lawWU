import { useState } from 'react'
import {
  decide,
  getBalancesOf,
  listActiveRequests,
  listEmployees,
  listLeaveTypes,
  listPendingFor,
} from '../../api/leaveApi'
import { useAsync, useSession, useUser } from '../../app/session'
import { busySeasonOverlap, findDeputyConflicts, overlaps, remainingHours } from '../../domain/rules'
import type { Balance, Employee, LeaveRequest, LeaveType } from '../../domain/types'
import { Avatar, Button, Empty, Journey, Notice, Skeleton, useToast } from '../../ui/components'
import { formatRange, givenName, hoursLabel, relativeDay } from '../shared/format'
import { requestJourney } from '../shared/journey'
import './approvals.css'

const QUICK_REASONS = ['那幾天客戶多，能改期嗎？', '請先跟代理人確認交接', '時間太接近申報截止日']

interface Ctx {
  employees: Employee[]
  types: LeaveType[]
  active: LeaveRequest[]
  balances: Record<string, Balance[]>
}

function ApprovalCard({ req, ctx, meId, onDone }: { req: LeaveRequest; ctx: Ctx; meId: string; onDone: (msg: string) => void }) {
  const [mode, setMode] = useState<'idle' | 'reject'>('idle')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState<null | 'approve' | 'reject'>(null)
  const [error, setError] = useState('')
  const [leaving, setLeaving] = useState(false)

  const applicant = ctx.employees.find((e) => e.id === req.employeeId)!
  const deputy = ctx.employees.find((e) => e.id === req.deputyId)
  const type = ctx.types.find((t) => t.id === req.typeId)
  const isCancel = req.status === 'cancel_pending'
  const steps = isCancel ? (req.cancelSteps ?? []) : req.steps
  const level = steps.findIndex((s) => s.approverId === meId && s.status === 'waiting') + 1
  const deputyAway = deputy ? findDeputyConflicts(deputy.id, req.start, req.end, ctx.active) : []
  const teamOverlap = ctx.active.filter(
    (r) =>
      r.id !== req.id &&
      r.employeeId !== req.employeeId &&
      ctx.employees.find((e) => e.id === r.employeeId)?.teamId === applicant.teamId &&
      overlaps(req.start, req.end, r.start, r.end),
  )
  const bal = ctx.balances[applicant.id]?.find((b) => b.typeId === req.typeId)
  const left = bal ? remainingHours(bal) : null
  const busySeason = busySeasonOverlap(req.start, req.end)

  const act = async (decision: 'approve' | 'reject') => {
    setBusy(decision)
    setError('')
    try {
      await decide(req.id, meId, decision, decision === 'reject' ? note : undefined)
      setLeaving(true)
      const who = givenName(applicant.name)
      const msg = isCancel
        ? decision === 'approve' ? `已同意${who}撤銷` : `已婉拒${who}的撤銷申請`
        : decision === 'approve'
          ? level < steps.length ? `已核准，接著送下一關` : `已核准${who}的${type?.name}`
          : `已退回${who}的假單`
      setTimeout(() => onDone(msg), 260)
    } catch (e) {
      setError((e as Error).message)
      setBusy(null)
    }
  }

  return (
    <article className={`acard group${leaving ? ' is-leaving' : ''}`} aria-label={`${applicant.name}的${isCancel ? '撤銷申請' : type?.name}`}>
      <header className="acard__head">
        <Avatar person={applicant} size={44} />
        <div className="acard__who">
          <p className="acard__name">{applicant.name}</p>
          <p className="acard__title">{applicant.title}</p>
        </div>
        <span className={`acard__kind${isCancel ? ' is-cancel' : ''}`}>
          {isCancel ? '撤銷申請' : steps.length > 1 ? `第 ${level} 關，共 ${steps.length} 關` : '請假申請'}
        </span>
      </header>

      <div className="acard__body">
        <div className="acard__what">
          <p className="acard__type">
            {type?.name} <span className="num">{hoursLabel(req.hours)}</span>
          </p>
          <p className="acard__range">
            {formatRange(req.start, req.end)}・{relativeDay(req.start)}
          </p>
          {req.reason && <p className="acard__reason">「{req.reason}」</p>}
          {isCancel && <p className="acard__reason">已核准的假想取消。同意後時數會退回給{givenName(applicant.name)}。</p>}
        </div>

        <dl className="acard__facts">
          <div>
            <dt>代理人</dt>
            <dd>
              {deputy?.name ?? '—'}
              {deputyAway.length > 0 && <span className="acard__flag">同時請假</span>}
            </dd>
          </div>
          <div>
            <dt>同組同時請假</dt>
            <dd>
              {teamOverlap.length === 0
                ? '沒有'
                : teamOverlap
                    .map((r) => ctx.employees.find((e) => e.id === r.employeeId)?.name)
                    .filter(Boolean)
                    .join('、')}
            </dd>
          </div>
          {!isCancel && left !== null && (
            <div>
              <dt>核准後{type?.name}剩</dt>
              <dd className="num">{hoursLabel(Math.max(left, 0))}</dd>
            </div>
          )}
        </dl>

        {busySeason && (
          <Notice tone="orange" icon="clock">
            在{busySeason.name}期間（{busySeason.range}）。
          </Notice>
        )}

        <div className="acard__journey">
          <Journey stops={requestJourney(req, ctx.employees, meId)} size={34} />
        </div>
      </div>

      {error && (
        <div className="acard__err">
          <Notice tone="red">{error}</Notice>
        </div>
      )}

      {mode === 'idle' ? (
        <footer className="acard__actions">
          <Button variant="gray" size="lg" onClick={() => setMode('reject')} disabled={!!busy}>
            {isCancel ? '不同意' : '退回'}
          </Button>
          <Button size="lg" icon="check" loading={busy === 'approve'} onClick={() => act('approve')}>
            {isCancel ? '同意撤銷' : '核准'}
          </Button>
        </footer>
      ) : (
        <footer className="acard__reject">
          <label className="field-label" htmlFor={`note-${req.id}`}>
            退回原因
          </label>
          <div className="acard__quick">
            {QUICK_REASONS.map((q) => (
              <button key={q} type="button" className="chip" onClick={() => setNote(q)}>
                {q}
              </button>
            ))}
          </div>
          <textarea
            id={`note-${req.id}`}
            className="input"
            placeholder={`讓${givenName(applicant.name)}知道為什麼，以及可以怎麼調整`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            autoFocus
          />
          <div className="acard__actions">
            <Button variant="gray" size="lg" onClick={() => setMode('idle')}>
              取消
            </Button>
            <Button
              variant="danger-solid"
              size="lg"
              disabled={!note.trim()}
              loading={busy === 'reject'}
              onClick={() => act('reject')}
            >
              確認退回
            </Button>
          </div>
        </footer>
      )}
    </article>
  )
}

export function ApprovalsPage() {
  const me = useUser()
  const { bump } = useSession()
  const toast = useToast()
  const data = useAsync(async () => {
    const [pending, employees, types] = await Promise.all([listPendingFor(me.id), listEmployees(), listLeaveTypes()])
    const span = pending.length
      ? [pending.reduce((a, r) => (r.start < a ? r.start : a), pending[0].start), pending.reduce((a, r) => (r.end > a ? r.end : a), pending[0].end)]
      : null
    const active = span ? await listActiveRequests(span[0], span[1]) : []
    const balances = await getBalancesOf([...new Set(pending.map((r) => r.employeeId))])
    return { pending, ctx: { employees, types, active, balances } }
  }, [me.id])

  const n = data.data?.pending.length ?? 0

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">待審核</h1>
          <p className="page-sub">
            {data.data ? (n ? `有 ${n} 張假單等你決定，依請假日期排序` : '目前沒有等你處理的假單') : ' '}
          </p>
        </div>
      </header>

      {!data.data ? (
        <div className="acards">
          <div className="group" style={{ padding: 20, display: 'grid', gap: 12 }}>
            <Skeleton h={44} w={200} />
            <Skeleton h={80} />
          </div>
        </div>
      ) : n === 0 ? (
        <div className="group">
          <Empty icon="check" title="都處理完了">
            有新的假單時，左側「待審核」會出現紅色數字。
          </Empty>
        </div>
      ) : (
        <div className="acards">
          {data.data.pending.map((r) => (
            <ApprovalCard
              key={r.id}
              req={r}
              ctx={data.data!.ctx}
              meId={me.id}
              onDone={(msg) => {
                toast(msg)
                bump()
              }}
            />
          ))}
        </div>
      )}
    </>
  )
}
