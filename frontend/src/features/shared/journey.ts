import type { ApprovalStep, Employee, LeaveRequest } from '../../domain/types'
import type { JourneyStop } from '../../ui/components'
import { honorific } from './format'

const shortDate = (s?: string) => {
  if (!s) return undefined
  const [d] = s.split('T')
  const [, m, day] = d.split('-').map(Number)
  return `${m}/${day}`
}

function stepStops(steps: ApprovalStep[], byId: Map<string, Employee>, active: boolean, viewerId?: string): JourneyStop[] {
  let currentAssigned = false
  let blocked = false
  return steps.map((s, i) => {
    const person = byId.get(s.approverId)
    const label = s.approverId === viewerId ? '你' : person ? honorific(person) : '審核者'
    let state: JourneyStop['state']
    let note: string | undefined
    if (s.status === 'approved') {
      state = 'done'
      note = `${shortDate(s.decidedAt) ?? ''} 核准`.trim()
    } else if (s.status === 'rejected') {
      state = 'rejected'
      note = '退回'
      blocked = true
    } else if (active && !currentAssigned && !blocked) {
      state = 'current'
      note = '審核中'
      currentAssigned = true
    } else {
      state = 'todo'
      note = blocked ? undefined : '待審'
    }
    return { key: `${i}-${s.approverId}`, person, label, note, state }
  })
}

/** The journey a request travels: applicant → each approver. */
export function requestJourney(req: LeaveRequest, employees: Employee[], viewerId?: string): JourneyStop[] {
  const byId = new Map(employees.map((e) => [e.id, e]))
  const applicant = byId.get(req.employeeId)
  const isCancel = req.status === 'cancel_pending' || (req.status === 'approved' && req.cancelSteps?.length)
  const first: JourneyStop = {
    key: 'applicant',
    person: applicant,
    label: req.employeeId === viewerId ? '你' : (applicant?.name ?? ''),
    note: isCancel ? '申請撤銷' : '送出',
    state: 'done',
  }
  if (req.status === 'cancel_pending' && req.cancelSteps) {
    return [first, ...stepStops(req.cancelSteps, byId, true, viewerId)]
  }
  const active = req.status === 'pending'
  const stops = stepStops(req.steps, byId, active, viewerId)
  if (req.status === 'withdrawn') {
    return [{ ...first, note: '已撤回' }, ...stops.map((s) => ({ ...s, state: 'todo' as const, note: undefined }))]
  }
  return [first, ...stops]
}

/** Preview before submitting. */
export function previewJourney(applicant: Employee, steps: ApprovalStep[], employees: Employee[]): JourneyStop[] {
  const byId = new Map(employees.map((e) => [e.id, e]))
  return [
    { key: 'me', person: applicant, label: '你', note: '送出', state: 'done' },
    ...steps.map((s, i) => {
      const p = byId.get(s.approverId)
      return {
        key: `${i}`,
        person: p,
        label: p ? honorific(p) : '審核者',
        note: i === 0 ? '先審核' : '再審核',
        state: (i === 0 ? 'current' : 'todo') as JourneyStop['state'],
      }
    }),
  ]
}

/** One sentence: who is it waiting on? */
export function waitingSentence(req: LeaveRequest, employees: Employee[]): string {
  const byId = new Map(employees.map((e) => [e.id, e]))
  const steps = req.status === 'cancel_pending' ? (req.cancelSteps ?? []) : req.steps
  const waiting = steps.find((s) => s.status === 'waiting')
  const who = waiting ? byId.get(waiting.approverId) : undefined
  switch (req.status) {
    case 'pending':
      return who ? `等${honorific(who)}審核` : '審核中'
    case 'cancel_pending':
      return who ? `撤銷申請等${honorific(who)}確認` : '撤銷審核中'
    case 'approved':
      return '已核准，記得交接給代理人'
    case 'rejected': {
      const r = req.steps.find((s) => s.status === 'rejected')
      const by = r ? byId.get(r.approverId) : undefined
      return by ? `${honorific(by)}退回了這張假單` : '已退回'
    }
    case 'withdrawn':
      return '你已撤回這張假單'
    case 'cancelled':
      return '已撤銷，時數已退回'
  }
}
