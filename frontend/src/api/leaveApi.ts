/**
 * Leave API. Same shapes the FastAPI backend will expose; for now backed by
 * localStorage demo data. Swap these bodies for fetch() calls later.
 */
import { calcLeaveHours, toLocalString } from '../domain/hours'
import {
  applyDecision,
  buildApprovalRoute,
  canRequestCancel,
  canWithdraw,
  currentApproverId,
  overlaps,
  remainingHours,
  validateRequest,
} from '../domain/rules'
import type { Balance, Employee, Holiday, LeaveRequest, LeaveType, LeaveTypeId } from '../domain/types'
import { ANNUAL_DAYS, EMPLOYEES, HOLIDAYS, HOLIDAY_SET, LEAVE_TYPES } from '../mock/seed'
import { delay } from './delay'
import { readState, resetState, writeState } from './store'

const clone = <T>(v: T): T => structuredClone(v)
const ACTIVE_STATUSES = new Set<LeaveRequest['status']>(['pending', 'approved', 'cancel_pending'])

export function listLeaveTypes(): Promise<LeaveType[]> {
  return delay(clone(LEAVE_TYPES))
}

export function listEmployees(): Promise<Employee[]> {
  return delay(clone(EMPLOYEES))
}

export function getHolidays(): Promise<Holiday[]> {
  return delay(clone(HOLIDAYS))
}

const thisYear = () => new Date().getFullYear()

/** Hours of a request that fall inside calendar year `year`. */
export function hoursInYear(r: Pick<LeaveRequest, 'start' | 'end' | 'hours'>, year: number): number {
  const from = `${year}-01-01T00:00`
  const to = `${year + 1}-01-01T00:00`
  if (r.start >= from && r.end <= to) return r.hours
  if (r.end <= from || r.start >= to) return 0
  return calcLeaveHours(r.start < from ? from : r.start, r.end > to ? to : r.end, HOLIDAY_SET)
}

/**
 * Balances for one calendar year, derived from requests (never stored).
 * 家庭照顧假 is counted inside 事假 (勞工請假規則): its hours also use up 事假,
 * and it can never exceed what is left of 事假.
 */
function computeBalances(employeeId: string, requests: LeaveRequest[], year: number): Balance[] {
  const mine = requests.filter((r) => r.employeeId === employeeId)
  const sum = (typeId: LeaveTypeId, statuses: LeaveRequest['status'][]) =>
    mine
      .filter((r) => r.typeId === typeId && statuses.includes(r.status))
      .reduce((a, r) => a + hoursInYear(r, year), 0)
  const USED: LeaveRequest['status'][] = ['approved', 'cancel_pending']
  const PENDING: LeaveRequest['status'][] = ['pending']

  const personalCap = LEAVE_TYPES.find((t) => t.id === 'personal')!.capHours!
  const pOwnUsed = sum('personal', USED)
  const pOwnPending = sum('personal', PENDING)
  const fUsed = sum('family_care', USED)
  const fPending = sum('family_care', PENDING)

  return LEAVE_TYPES.map((t): Balance => {
    if (t.id === 'personal') {
      return { typeId: t.id, grantedHours: personalCap, usedHours: pOwnUsed + fUsed, pendingHours: pOwnPending + fPending }
    }
    if (t.id === 'family_care') {
      return {
        typeId: t.id,
        grantedHours: Math.min(t.capHours!, personalCap - pOwnUsed - pOwnPending),
        usedHours: fUsed,
        pendingHours: fPending,
      }
    }
    return {
      typeId: t.id,
      grantedHours: t.id === 'annual' ? (ANNUAL_DAYS[employeeId] ?? 0) * 8 : t.capHours,
      usedHours: sum(t.id, USED),
      pendingHours: sum(t.id, PENDING),
    }
  })
}

export function getBalances(employeeId: string, year: number = thisYear()): Promise<Balance[]> {
  return delay(computeBalances(employeeId, readState().requests, year))
}

const newestFirst = (a: LeaveRequest, b: LeaveRequest) => b.start.localeCompare(a.start)

export function listMyRequests(employeeId: string): Promise<LeaveRequest[]> {
  return delay(clone(readState().requests.filter((r) => r.employeeId === employeeId).sort(newestFirst)))
}

/** Requests that keep someone away (pending / approved / cancel_pending) overlapping [from, to). */
export function listActiveRequests(from: string, to: string): Promise<LeaveRequest[]> {
  const active = new Set(['pending', 'approved', 'cancel_pending'])
  return delay(clone(readState().requests.filter((r) => active.has(r.status) && overlaps(from, to, r.start, r.end))))
}

/** Approved leave of the whole firm in [from, to), for the calendar. */
export function listTeamApproved(from: string, to: string): Promise<LeaveRequest[]> {
  return delay(
    clone(readState().requests.filter((r) => (r.status === 'approved' || r.status === 'cancel_pending') && overlaps(from, to, r.start, r.end))),
  )
}

function mutate(id: string, fn: (r: LeaveRequest) => LeaveRequest): LeaveRequest {
  const state = readState()
  const idx = state.requests.findIndex((r) => r.id === id)
  if (idx < 0) throw new Error('找不到這張假單')
  const next = fn(state.requests[idx])
  const requests = [...state.requests]
  requests[idx] = next
  writeState({ ...state, requests })
  return clone(next)
}

export async function submitRequest(input: {
  employeeId: string
  typeId: LeaveTypeId
  start: string
  end: string
  deputyId: string
  reason: string
}): Promise<LeaveRequest> {
  const applicant = EMPLOYEES.find((e) => e.id === input.employeeId)
  if (!applicant) throw new Error('找不到申請人')
  const hours = calcLeaveHours(input.start, input.end, HOLIDAY_SET)
  const state = readState()
  const overlapping = state.requests.some(
    (r) => r.employeeId === applicant.id && ACTIVE_STATUSES.has(r.status) && overlaps(input.start, input.end, r.start, r.end),
  )
  // Non-balance checks first (balance is checked per calendar year below).
  const errors = validateRequest(
    { ...input, applicantId: applicant.id, hours, overlapping },
    { typeId: input.typeId, grantedHours: null, usedHours: 0, pendingHours: 0 },
  )
  const startYear = Number(input.start.slice(0, 4))
  const endYear = Number(input.end.slice(0, 4))
  for (let y = startYear; y <= endYear && hours > 0; y++) {
    const portion = hoursInYear({ start: input.start, end: input.end, hours }, y)
    const b = computeBalances(applicant.id, state.requests, y).find((x) => x.typeId === input.typeId)!
    const left = remainingHours(b)
    if (left !== null && portion > left) {
      errors.push('剩餘時數不足')
      break
    }
  }
  const steps = buildApprovalRoute(applicant, hours, EMPLOYEES)
  if (!steps.length) errors.push('沒有可以審核這張假單的人，請直接告知行政')
  if (errors.length) throw new Error(errors[0])

  const req: LeaveRequest = {
    id: `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    ...input,
    reason: input.reason.trim(),
    hours,
    status: 'pending',
    steps,
    createdAt: toLocalString(new Date()),
  }
  writeState({ ...state, requests: [...state.requests, req] })
  return delay(clone(req), 600)
}

export async function withdrawRequest(id: string, employeeId: string): Promise<LeaveRequest> {
  const r = mutate(id, (r) => {
    if (r.employeeId !== employeeId || !canWithdraw(r)) throw new Error('這張假單無法撤回')
    return { ...r, status: 'withdrawn' }
  })
  return delay(r)
}

export async function requestCancel(id: string, employeeId: string): Promise<LeaveRequest> {
  const r = mutate(id, (r) => {
    if (r.employeeId !== employeeId || !canRequestCancel(r, new Date())) throw new Error('這張假單無法申請撤銷')
    const firstApprover = r.steps[0]?.approverId
    if (!firstApprover) throw new Error('這張假單沒有審核者，無法申請撤銷')
    return { ...r, status: 'cancel_pending', cancelSteps: [{ approverId: firstApprover, status: 'waiting' }] }
  })
  return delay(r)
}

export function listPendingFor(approverId: string): Promise<LeaveRequest[]> {
  return delay(
    clone(
      readState()
        .requests.filter((r) => currentApproverId(r) === approverId)
        .sort((a, b) => a.start.localeCompare(b.start)),
    ),
  )
}

export async function decide(
  id: string,
  approverId: string,
  decision: 'approve' | 'reject',
  note?: string,
): Promise<LeaveRequest> {
  return delay(mutate(id, (r) => applyDecision(r, approverId, decision, note?.trim() || undefined, new Date())))
}

/** Direct and indirect reports of a manager. */
export function listSubordinates(managerId: string): Promise<Employee[]> {
  const out: Employee[] = []
  const walk = (id: string) => {
    for (const e of EMPLOYEES.filter((e) => e.managerId === id)) {
      out.push(e)
      walk(e.id)
    }
  }
  walk(managerId)
  return delay(clone(out))
}

/** Requests of the given employees (for team overview). */
export function listRequestsOf(employeeIds: string[]): Promise<LeaveRequest[]> {
  const ids = new Set(employeeIds)
  return delay(clone(readState().requests.filter((r) => ids.has(r.employeeId)).sort(newestFirst)))
}

export function getBalancesOf(employeeIds: string[], year: number = thisYear()): Promise<Record<string, Balance[]>> {
  const { requests } = readState()
  return delay(Object.fromEntries(employeeIds.map((id) => [id, computeBalances(id, requests, year)])))
}

export function resetDemoData(): void {
  resetState()
}
