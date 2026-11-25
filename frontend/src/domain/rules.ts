import { parseLocal, toLocalString } from './hours'
import type { ApprovalStep, Balance, Employee, LeaveRequest, LeaveTypeId } from './types'

/** 超過此時數（3 天）需再送上一層。 */
export const SECOND_LEVEL_THRESHOLD_HOURS = 24

export function buildApprovalRoute(
  applicant: Employee,
  hours: number,
  employees: Employee[],
): ApprovalStep[] {
  const byId = new Map(employees.map((e) => [e.id, e]))
  const steps: ApprovalStep[] = []
  const direct = applicant.managerId ? byId.get(applicant.managerId) : undefined
  if (!direct) return steps
  steps.push({ approverId: direct.id, status: 'waiting' })
  if (hours > SECOND_LEVEL_THRESHOLD_HOURS && direct.managerId && byId.has(direct.managerId)) {
    steps.push({ approverId: direct.managerId, status: 'waiting' })
  }
  return steps
}

export function canWithdraw(req: LeaveRequest): boolean {
  return req.status === 'pending'
}

export function canRequestCancel(req: LeaveRequest, now: Date): boolean {
  return req.status === 'approved' && parseLocal(req.start) > now
}

const ACTIVE = new Set<LeaveRequest['status']>(['pending', 'approved', 'cancel_pending'])

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return parseLocal(aStart) < parseLocal(bEnd) && parseLocal(bStart) < parseLocal(aEnd)
}

export function findDeputyConflicts(
  deputyId: string,
  start: string,
  end: string,
  requests: LeaveRequest[],
): LeaveRequest[] {
  return requests.filter(
    (r) => r.employeeId === deputyId && ACTIVE.has(r.status) && overlaps(start, end, r.start, r.end),
  )
}

/** 報稅季：每年 5/1–5/31。 */
export function busySeasonOverlap(start: string, end: string): { name: string; range: string } | null {
  const s = parseLocal(start)
  const e = parseLocal(end)
  for (let y = s.getFullYear(); y <= e.getFullYear(); y++) {
    const from = new Date(y, 4, 1)
    const to = new Date(y, 5, 1)
    if (s < to && from < e) return { name: '綜所稅申報期', range: `${y}/5/1 – 5/31` }
  }
  return null
}

export function remainingHours(b: Balance): number | null {
  return b.grantedHours === null ? null : b.grantedHours - b.usedHours - b.pendingHours
}

export function validateRequest(
  input: {
    typeId: LeaveTypeId
    start: string
    end: string
    deputyId: string
    applicantId: string
    hours: number
    /** The applicant already has an active request over this time. */
    overlapping?: boolean
  },
  balance: Balance,
): string[] {
  const errors: string[] = []
  if (!(input.hours > 0)) errors.push('請選擇有效的時間')
  if (input.overlapping) errors.push('這段時間你已經有假單了')
  if (!input.deputyId) errors.push('請選擇職務代理人')
  else if (input.deputyId === input.applicantId) errors.push('代理人不能是自己')
  const left = remainingHours(balance)
  if (left !== null && input.hours > left) errors.push('剩餘時數不足')
  return errors
}

function activeSteps(req: LeaveRequest): ApprovalStep[] {
  return req.status === 'cancel_pending' ? (req.cancelSteps ?? []) : req.steps
}

export function currentApproverId(req: LeaveRequest): string | null {
  if (req.status !== 'pending' && req.status !== 'cancel_pending') return null
  return activeSteps(req).find((s) => s.status === 'waiting')?.approverId ?? null
}

export function applyDecision(
  req: LeaveRequest,
  approverId: string,
  decision: 'approve' | 'reject',
  note: string | undefined,
  now: Date,
): LeaveRequest {
  if (currentApproverId(req) !== approverId) {
    throw new Error('這張單目前不是由你審核')
  }
  const isCancel = req.status === 'cancel_pending'
  if (isCancel && decision === 'approve' && parseLocal(req.start) <= now) {
    throw new Error('請假已經開始，不能再撤銷')
  }
  const decidedAt = toLocalString(now)
  let done = false
  const steps = activeSteps(req).map((s) => {
    if (done || s.status !== 'waiting') return s
    done = true
    return { ...s, status: decision === 'approve' ? 'approved' : 'rejected', decidedAt, note } as ApprovalStep
  })
  const allApproved = steps.every((s) => s.status === 'approved')

  if (isCancel) {
    const status = decision === 'reject' ? 'approved' : allApproved ? 'cancelled' : 'cancel_pending'
    return { ...req, cancelSteps: steps, status }
  }
  const status = decision === 'reject' ? 'rejected' : allApproved ? 'approved' : 'pending'
  return { ...req, steps, status }
}
