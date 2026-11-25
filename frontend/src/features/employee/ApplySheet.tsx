import { useMemo, useState } from 'react'
import { getBalances, getHolidays, listActiveRequests, listEmployees, listLeaveTypes, submitRequest } from '../../api/leaveApi'
import { useAsync, useSession, useUser } from '../../app/session'
import { calcLeaveHours, isWorkday, toDateKey } from '../../domain/hours'
import {
  SECOND_LEVEL_THRESHOLD_HOURS,
  buildApprovalRoute,
  busySeasonOverlap,
  findDeputyConflicts,
  remainingHours,
  validateRequest,
} from '../../domain/rules'
import type { Employee, LeaveRequest, LeaveTypeId } from '../../domain/types'
import { Button, Journey, Notice, Segmented, Sheet, Skeleton, useToast } from '../../ui/components'
import { Icon } from '../../ui/Icon'
import { formatRange, honorific, hoursLabel } from '../shared/format'
import { previewJourney } from '../shared/journey'
import './apply.css'

type Mode = 'full' | 'am' | 'pm' | 'custom'

function nextWorkday(holidays: Set<string>): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  while (!isWorkday(d, holidays)) d.setDate(d.getDate() + 1)
  return toDateKey(d)
}

export function ApplySheet({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: (r: LeaveRequest) => void }) {
  const me = useUser()
  const { bump } = useSession()
  const toast = useToast()

  const base = useAsync(
    async () => {
      const [types, employees, holidays, balances] = await Promise.all([
        listLeaveTypes(),
        listEmployees(),
        getHolidays(),
        getBalances(me.id),
      ])
      return { types, employees, holidaySet: new Set(holidays.map((h) => h.date)), balances }
    },
    [me.id],
  )

  const [typeId, setTypeId] = useState<LeaveTypeId | null>(null)
  const [mode, setMode] = useState<Mode>('full')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [deputyId, setDeputyId] = useState('')
  const [reason, setReason] = useState('')
  const [file, setFile] = useState('')
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const holidaySet = base.data?.holidaySet
  const defaultDay = useMemo(() => (holidaySet ? nextWorkday(holidaySet) : ''), [holidaySet])
  const sDate = startDate || defaultDay
  const eDate = endDate && endDate >= sDate ? endDate : sDate

  const [start, end] = useMemo((): [string, string] => {
    switch (mode) {
      case 'full':
        return [`${sDate}T09:00`, `${eDate}T18:00`]
      case 'am':
        return [`${sDate}T09:00`, `${sDate}T12:00`]
      case 'pm':
        return [`${sDate}T13:00`, `${sDate}T18:00`]
      case 'custom':
        return [customStart || `${sDate}T09:00`, customEnd || `${sDate}T18:00`]
    }
  }, [mode, sDate, eDate, customStart, customEnd])

  const active = useAsync(() => (sDate ? listActiveRequests(start, end) : Promise.resolve([])), [start, end])
  // Balances are per calendar year: use the year the leave starts in.
  const leaveYear = sDate ? Number(sDate.slice(0, 4)) : new Date().getFullYear()
  const yearBalances = useAsync(() => getBalances(me.id, leaveYear), [me.id, leaveYear])

  if (!base.data) {
    return (
      <Sheet title="申請請假" onClose={onClose} width={660}>
        <div style={{ display: 'grid', gap: 12 }}>
          <Skeleton h={22} w={120} />
          <Skeleton h={120} />
          <Skeleton h={80} />
        </div>
      </Sheet>
    )
  }

  const { types, employees } = base.data
  const balances = yearBalances.data ?? base.data.balances
  const hours = sDate ? calcLeaveHours(start, end, base.data.holidaySet) : 0
  const type = types.find((t) => t.id === typeId)
  const balance = balances.find((b) => b.typeId === typeId)
  const left = balance ? remainingHours(balance) : null
  const ownOverlap = (active.data ?? []).some((r) => r.employeeId === me.id)
  const route = buildApprovalRoute(me, hours, employees)
  const errors = type && balance
    ? validateRequest({ typeId: type.id, start, end, deputyId, applicantId: me.id, hours, overlapping: ownOverlap }, balance)
    : ['請選擇假別']
  if (!route.length) errors.push('沒有可以審核這張假單的人')
  const overBalance = errors.includes('剩餘時數不足')
  const busySeason = hours > 0 ? busySeasonOverlap(start, end) : null
  const conflicts = deputyId ? findDeputyConflicts(deputyId, start, end, active.data ?? []) : []
  const awayIds = new Set((active.data ?? []).map((r) => r.employeeId))
  const deputy = employees.find((e) => e.id === deputyId)

  const colleagues = employees.filter((e) => e.id !== me.id && e.role !== 'owner')
  const sameTeam = colleagues.filter((e) => e.teamId === me.teamId)
  const others = colleagues.filter((e) => e.teamId !== me.teamId)
  const optionLabel = (e: Employee) => `${e.name}・${e.title}${awayIds.has(e.id) ? '・請假中' : ''}`

  const submit = async () => {
    if (!type) return
    setBusy(true)
    setSubmitError('')
    try {
      const req = await submitRequest({ employeeId: me.id, typeId: type.id, start, end, deputyId, reason })
      bump()
      const first = employees.find((e) => e.id === req.steps[0]?.approverId)
      toast(first ? `已送出，${honorific(first)}會收到通知` : '已送出')
      onSubmitted(req)
    } catch (e) {
      setSubmitError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const firstApprover = employees.find((e) => e.id === route[0]?.approverId)
  const secondApprover = employees.find((e) => e.id === route[1]?.approverId)

  return (
    <Sheet
      title="申請請假"
      onClose={onClose}
      width={660}
      footer={
        <div className="apply__foot">
          <div className="apply__foot-sum" aria-live="polite">
            {type && hours > 0 ? (
              <>
                <strong>{type.name}</strong> · <span className="num">{hoursLabel(hours)}</span>
              </>
            ) : (
              <span className="apply__foot-hint">選好假別和時間就能送出</span>
            )}
          </div>
          <Button size="lg" onClick={submit} loading={busy} disabled={errors.length > 0}>
            送出申請
          </Button>
        </div>
      }
    >
      <div className="apply">
        {/* 1 — type */}
        <fieldset className="apply__block">
          <legend className="field-label">假別</legend>
          <div className="types" role="radiogroup" aria-label="假別">
            {types.map((t) => {
              const b = balances.find((x) => x.typeId === t.id)!
              const r = remainingHours(b)
              const empty = r !== null && r <= 0
              return (
                <label key={t.id} className={`type${t.id === typeId ? ' is-on' : ''}${empty ? ' is-empty' : ''}`}>
                  <input
                    type="radio"
                    name="leave-type"
                    value={t.id}
                    checked={t.id === typeId}
                    onChange={() => setTypeId(t.id)}
                    className="visually-hidden"
                  />
                  <span className="type__name">{t.name}</span>
                  <span className="type__left num">{r === null ? '依實際需要' : `剩 ${hoursLabel(Math.max(r, 0))}`}</span>
                </label>
              )
            })}
          </div>
          {type && (
            <p className="apply__type-note">
              {type.paid}。{type.note}
            </p>
          )}
        </fieldset>

        {/* 2 — time */}
        <div className="apply__block">
          <span className="field-label">時間</span>
          <Segmented<Mode>
            label="時段"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'full', label: '全天' },
              { value: 'am', label: '上午' },
              { value: 'pm', label: '下午' },
              { value: 'custom', label: '自訂時段' },
            ]}
          />
          <div className="apply__dates">
            {mode === 'full' && (
              <>
                <label className="date-field">
                  <span>開始日期</span>
                  <input
                    className="input"
                    type="date"
                    aria-label="開始日期"
                    value={sDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </label>
                <span className="apply__to" aria-hidden="true">
                  <Icon name="chevronRight" size={18} />
                </span>
                <label className="date-field">
                  <span>結束日期</span>
                  <input
                    className="input"
                    type="date"
                    aria-label="結束日期"
                    min={sDate}
                    value={eDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </label>
              </>
            )}
            {(mode === 'am' || mode === 'pm') && (
              <label className="date-field">
                <span>{mode === 'am' ? '上午 09:00–12:00' : '下午 13:00–18:00'}</span>
                <input
                  className="input"
                  type="date"
                  aria-label="日期"
                  value={sDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
            )}
            {mode === 'custom' && (
              <>
                <label className="date-field">
                  <span>開始時間</span>
                  <input
                    className="input"
                    type="datetime-local"
                    aria-label="開始時間"
                    step={1800}
                    value={start}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                </label>
                <span className="apply__to" aria-hidden="true">
                  <Icon name="chevronRight" size={18} />
                </span>
                <label className="date-field">
                  <span>結束時間</span>
                  <input
                    className="input"
                    type="datetime-local"
                    aria-label="結束時間"
                    step={1800}
                    value={end}
                    onChange={(e) => setCustomEnd(e.target.value)}
                  />
                </label>
              </>
            )}
          </div>

          <div className={`tally${hours === 0 ? ' is-zero' : ''}${overBalance ? ' is-over' : ''}`}>
            <div className="tally__main">
              <span className="tally__value num" data-testid="hours-total">
                {hoursLabel(hours)}
              </span>
              <span className="tally__range">{hours > 0 ? formatRange(start, end) : '這段時間沒有需要請假的工作時數'}</span>
            </div>
            {type && left !== null && hours > 0 && (
              <div className="tally__after">
                <span>申請後{type.name}剩</span>
                <strong className="num">{hoursLabel(Math.max(left - hours, 0))}</strong>
              </div>
            )}
          </div>
          <p className="apply__hint">只計算工作日 09:00–18:00，午休 12:00–13:00、週末和國定假日不扣時數。</p>

          {overBalance && left !== null && (
            <Notice tone="red">
              剩餘時數不足：{type?.name}還剩 {hoursLabel(Math.max(left, 0))}，這次需要 {hoursLabel(hours)}。可以縮短時間，或改用其他假別。
            </Notice>
          )}
          {ownOverlap && (
            <Notice tone="red">這段時間你已經有假單了。如果要改時間，請先到「我的紀錄」撤回原本那張。</Notice>
          )}
          {hours === 0 && mode === 'custom' && start >= end && (
            <Notice tone="red">結束時間要晚於開始時間。</Notice>
          )}
          {busySeason && (
            <Notice tone="orange" icon="clock">
              這段時間在{busySeason.name}（{busySeason.range}），是事務所最忙的時候。仍然可以送出，建議先和主管、代理人確認交接。
            </Notice>
          )}
        </div>

        {/* 3 — deputy */}
        <div className="apply__block">
          <label className="field-label" htmlFor="deputy">
            職務代理人
          </label>
          <select id="deputy" className="input" value={deputyId} onChange={(e) => setDeputyId(e.target.value)}>
            <option value="" disabled>
              選一位同事幫你處理客戶
            </option>
            <optgroup label="同組同事">
              {sameTeam.map((e) => (
                <option key={e.id} value={e.id}>
                  {optionLabel(e)}
                </option>
              ))}
            </optgroup>
            <optgroup label="其他同事">
              {others.map((e) => (
                <option key={e.id} value={e.id}>
                  {optionLabel(e)}
                </option>
              ))}
            </optgroup>
          </select>
          {deputy && conflicts.length > 0 ? (
            <Notice tone="orange">{`${deputy.name} 這段時間也請假，可能沒辦法幫你接手。可以換一位，或先跟對方確認。`}</Notice>
          ) : deputy ? (
            <p className="apply__hint">送出後 {deputy.name} 會收到通知，不需要對方同意。</p>
          ) : null}
        </div>

        {/* 4 — reason + proof */}
        <div className="apply__block">
          <label className="field-label" htmlFor="reason">
            事由（選填）
          </label>
          <textarea
            id="reason"
            className="input"
            placeholder="簡單說明，讓主管更快了解"
            maxLength={200}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          {type?.needsProof && (
            <div className="proof">
              <label className="btn btn--gray proof__btn">
                <Icon name="paperclip" size={18} />
                {file ? '更換附件' : '加入證明文件'}
                <input type="file" className="visually-hidden" onChange={(e) => setFile(e.target.files?.[0]?.name ?? '')} />
              </label>
              <span className="apply__hint">{file || `${type.name}可能需要附上證明，也可以之後再補。`}</span>
            </div>
          )}
        </div>

        {/* 5 — path */}
        {route.length > 0 && (
          <div className="apply__block">
            <span className="field-label">送出後會經過</span>
            <div className="pathcard">
              <Journey stops={previewJourney(me, route, employees)} label="簽核路徑" size={44} />
              <p className="pathcard__text">
                {secondApprover && firstApprover
                  ? `超過 ${SECOND_LEVEL_THRESHOLD_HOURS / 8} 天，${honorific(firstApprover)}核准後還會送${honorific(secondApprover)}。`
                  : firstApprover
                    ? `${honorific(firstApprover)}核准後就生效。`
                    : ''}
              </p>
            </div>
          </div>
        )}

        {route.length === 0 && (
          <Notice tone="blue">你是事務所最上層，系統裡沒有人可以審核你的假單。請直接告知行政登記。</Notice>
        )}
        {submitError && <Notice tone="red">{submitError}</Notice>}
      </div>
    </Sheet>
  )
}
