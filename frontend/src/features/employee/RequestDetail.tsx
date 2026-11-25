import { useState } from 'react'
import { listEmployees, listLeaveTypes, requestCancel, withdrawRequest } from '../../api/leaveApi'
import { useAsync, useSession, useUser } from '../../app/session'
import { canRequestCancel, canWithdraw } from '../../domain/rules'
import type { LeaveRequest } from '../../domain/types'
import { Avatar, Button, Journey, Notice, Sheet, StatusPill, useToast } from '../../ui/components'
import { formatRange, honorific, hoursLabel } from '../shared/format'
import { requestJourney, waitingSentence } from '../shared/journey'
import './records.css'

type Confirm = null | 'withdraw' | 'cancel'

export function RequestDetail({ request, onClose }: { request: LeaveRequest; onClose: () => void }) {
  const me = useUser()
  const { bump } = useSession()
  const toast = useToast()
  const meta = useAsync(async () => ({ employees: await listEmployees(), types: await listLeaveTypes() }), [])
  const [req, setReq] = useState(request)
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const employees = meta.data?.employees ?? []
  const type = meta.data?.types.find((t) => t.id === req.typeId)
  const deputy = employees.find((e) => e.id === req.deputyId)
  const mine = req.employeeId === me.id
  const showWithdraw = mine && canWithdraw(req)
  const showCancel = mine && canRequestCancel(req, new Date())
  const firstApprover = employees.find((e) => e.id === req.steps[0]?.approverId)
  const notes = [...req.steps, ...(req.cancelSteps ?? [])].filter((s) => s.note)

  const act = async () => {
    setBusy(true)
    setError('')
    try {
      const next = confirm === 'withdraw' ? await withdrawRequest(req.id, me.id) : await requestCancel(req.id, me.id)
      setReq(next)
      setConfirm(null)
      bump()
      toast(confirm === 'withdraw' ? '已撤回，時數已退回' : `已送出撤銷申請${firstApprover ? `給${honorific(firstApprover)}` : ''}`)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet title="假單內容" onClose={onClose} leading={<Button variant="plain" onClick={onClose}>完成</Button>} width={600}>
      <div className="detail">
        <header className="detail__head">
          <div>
            <h3 className="detail__type">{type?.name ?? ''}</h3>
            <p className="detail__range">{formatRange(req.start, req.end)}</p>
          </div>
          <StatusPill status={req.status} />
        </header>

        <section className="detail__journey" aria-label="簽核進度">
          <p className="detail__waiting">{waitingSentence(req, employees)}</p>
          {employees.length > 0 && <Journey stops={requestJourney(req, employees, me.id)} size={44} />}
        </section>

        {notes.map((s, i) => {
          const by = employees.find((e) => e.id === s.approverId)
          return (
            <blockquote key={i} className={`detail__note detail__note--${s.status}`}>
              {by && <Avatar person={by} size={28} />}
              <div>
                <p className="detail__note-who">{by ? honorific(by) : ''}{s.status === 'rejected' ? ' 退回時說' : ' 留言'}</p>
                <p>{s.note}</p>
              </div>
            </blockquote>
          )
        })}

        <dl className="group detail__facts">
          <div className="row">
            <dt>時數</dt>
            <dd className="num">{hoursLabel(req.hours)}</dd>
          </div>
          <div className="row">
            <dt>代理人</dt>
            <dd>{deputy ? `${deputy.name}・${deputy.title}` : '—'}</dd>
          </div>
          <div className="row">
            <dt>給薪</dt>
            <dd>{type?.paid ?? '—'}</dd>
          </div>
          <div className="row">
            <dt>事由</dt>
            <dd>{req.reason || <span className="detail__muted">沒有填寫</span>}</dd>
          </div>
        </dl>

        {error && <Notice tone="red">{error}</Notice>}

        {(showWithdraw || showCancel) && !confirm && (
          <div className="detail__actions">
            {showWithdraw && (
              <Button variant="danger" size="lg" block icon="undo" onClick={() => setConfirm('withdraw')}>
                撤回申請
              </Button>
            )}
            {showCancel && (
              <Button variant="danger" size="lg" block icon="undo" onClick={() => setConfirm('cancel')}>
                申請撤銷
              </Button>
            )}
          </div>
        )}

        {confirm && (
          <div className="confirm" role="alertdialog" aria-label={confirm === 'withdraw' ? '確認撤回' : '確認撤銷'}>
            <p className="confirm__title">{confirm === 'withdraw' ? '要撤回這張假單嗎？' : '要申請撤銷這次請假嗎？'}</p>
            <p className="confirm__text">
              {confirm === 'withdraw'
                ? '主管還沒審核，撤回後時數會立刻退回，之後可以重新申請。'
                : `這張假單已經核准，撤銷需要${firstApprover ? honorific(firstApprover) : '主管'}確認。確認前，假單仍然有效。`}
            </p>
            <div className="confirm__row">
              <Button variant="gray" size="lg" block onClick={() => setConfirm(null)}>
                先不要
              </Button>
              <Button variant="danger-solid" size="lg" block loading={busy} onClick={act}>
                {confirm === 'withdraw' ? '撤回' : '送出撤銷申請'}
              </Button>
            </div>
          </div>
        )}

        {mine && req.status === 'approved' && !showCancel && (
          <p className="detail__muted detail__foot">請假已經開始或結束，不能再撤銷。有問題請直接找主管。</p>
        )}
      </div>
    </Sheet>
  )
}
