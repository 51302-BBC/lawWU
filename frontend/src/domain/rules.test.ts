import { describe, expect, it } from 'vitest'
import type { Balance, Employee, LeaveRequest } from './types'
import {
  applyDecision,
  buildApprovalRoute,
  busySeasonOverlap,
  canRequestCancel,
  canWithdraw,
  currentApproverId,
  findDeputyConflicts,
  validateRequest,
} from './rules'

const emp = (id: string, managerId: string | null, role: Employee['role']): Employee => ({
  id, employeeNo: id, name: id, title: role, teamId: 't1', managerId, role, avatarColor: '#000',
})
const o1 = emp('o1', null, 'owner')
const g1 = emp('g1', 'o1', 'manager')
const m1 = emp('m1', 'g1', 'supervisor')
const s1 = emp('s1', 'm1', 'staff')
const employees = [o1, g1, m1, s1]

const req = (over: Partial<LeaveRequest> = {}): LeaveRequest => ({
  id: 'r1', employeeId: 's1', typeId: 'annual',
  start: '2026-12-10T09:00', end: '2026-12-10T18:00', hours: 8,
  deputyId: 's2', reason: '', status: 'pending',
  steps: [{ approverId: 'm1', status: 'waiting' }],
  createdAt: '2026-12-01T10:00',
  ...over,
})

describe('buildApprovalRoute', () => {
  it('≤ 24h goes to the direct manager only', () => {
    expect(buildApprovalRoute(s1, 24, employees).map((s) => s.approverId)).toEqual(['m1'])
  })
  it('> 24h adds the next level up', () => {
    expect(buildApprovalRoute(s1, 24.5, employees).map((s) => s.approverId)).toEqual(['m1', 'g1'])
  })
  it('never produces a null approver when there is no further level', () => {
    expect(buildApprovalRoute(g1, 40, employees).map((s) => s.approverId)).toEqual(['o1'])
  })
  it('all steps start waiting', () => {
    expect(buildApprovalRoute(s1, 40, employees).every((s) => s.status === 'waiting')).toBe(true)
  })
})

describe('withdraw / cancel', () => {
  const now = new Date(2026, 11, 5, 12, 0)
  it('pending can be withdrawn', () => {
    expect(canWithdraw(req())).toBe(true)
    expect(canWithdraw(req({ status: 'approved' }))).toBe(false)
  })
  it('approved and not yet started can request cancel', () => {
    expect(canRequestCancel(req({ status: 'approved' }), now)).toBe(true)
  })
  it('approved but already started cannot', () => {
    expect(canRequestCancel(req({ status: 'approved', start: '2026-12-05T09:00' }), now)).toBe(false)
  })
  it('pending cannot request cancel', () => {
    expect(canRequestCancel(req(), now)).toBe(false)
  })
})

describe('findDeputyConflicts', () => {
  const others = [
    req({ id: 'a', employeeId: 's2', status: 'approved', start: '2026-12-10T13:00', end: '2026-12-11T18:00' }),
    req({ id: 'b', employeeId: 's2', status: 'rejected' }),
    req({ id: 'c', employeeId: 's2', status: 'withdrawn' }),
    req({ id: 'd', employeeId: 's2', status: 'approved', start: '2026-12-20T09:00', end: '2026-12-20T18:00' }),
  ]
  it('returns overlapping active requests of the deputy', () => {
    expect(findDeputyConflicts('s2', '2026-12-10T09:00', '2026-12-10T18:00', others).map((r) => r.id)).toEqual(['a'])
  })
})

describe('busySeasonOverlap', () => {
  it('flags May (tax season)', () => {
    expect(busySeasonOverlap('2027-05-10T09:00', '2027-05-10T18:00')).not.toBeNull()
  })
  it('flags a range that ends inside May', () => {
    expect(busySeasonOverlap('2027-04-29T09:00', '2027-05-02T18:00')).not.toBeNull()
  })
  it('ignores December', () => {
    expect(busySeasonOverlap('2026-12-10T09:00', '2026-12-10T18:00')).toBeNull()
  })
})

describe('validateRequest', () => {
  const bal: Balance = { typeId: 'annual', grantedHours: 56, usedHours: 16, pendingHours: 8 }
  const base = { typeId: 'annual' as const, start: '2026-12-10T09:00', end: '2026-12-10T18:00', deputyId: 's2', applicantId: 's1', hours: 8 }
  it('valid input has no errors', () => {
    expect(validateRequest(base, bal)).toEqual([])
  })
  it('zero hours', () => {
    expect(validateRequest({ ...base, hours: 0 }, bal)).toContain('請選擇有效的時間')
  })
  it('deputy cannot be self', () => {
    expect(validateRequest({ ...base, deputyId: 's1' }, bal)).toContain('代理人不能是自己')
  })
  it('missing deputy', () => {
    expect(validateRequest({ ...base, deputyId: '' }, bal)).toContain('請選擇職務代理人')
  })
  it('exceeds remaining balance (granted − used − pending = 32)', () => {
    expect(validateRequest({ ...base, hours: 32 }, bal)).toEqual([])
    expect(validateRequest({ ...base, hours: 32.5 }, bal)).toContain('剩餘時數不足')
  })
  it('uncapped types skip the balance check', () => {
    const official: Balance = { typeId: 'official', grantedHours: null, usedHours: 0, pendingHours: 0 }
    expect(validateRequest({ ...base, typeId: 'official', hours: 200 }, official)).toEqual([])
  })
})

describe('applyDecision', () => {
  const now = new Date(2026, 11, 2, 10, 0)
  const twoStep = req({ hours: 32, steps: [{ approverId: 'm1', status: 'waiting' }, { approverId: 'g1', status: 'waiting' }] })

  it('rejects a decision by someone who is not the current approver', () => {
    expect(() => applyDecision(twoStep, 'g1', 'approve', undefined, now)).toThrow()
    expect(() => applyDecision(req(), 's1', 'approve', undefined, now)).toThrow()
  })
  it('first of two approvals keeps it pending and moves to next approver', () => {
    const r = applyDecision(twoStep, 'm1', 'approve', undefined, now)
    expect(r.status).toBe('pending')
    expect(currentApproverId(r)).toBe('g1')
  })
  it('last approval approves', () => {
    const r = applyDecision(applyDecision(twoStep, 'm1', 'approve', undefined, now), 'g1', 'approve', undefined, now)
    expect(r.status).toBe('approved')
    expect(currentApproverId(r)).toBeNull()
  })
  it('cannot approve twice', () => {
    const r = applyDecision(req(), 'm1', 'approve', undefined, now)
    expect(() => applyDecision(r, 'm1', 'approve', undefined, now)).toThrow()
  })
  it('any rejection rejects and keeps the note', () => {
    const r = applyDecision(twoStep, 'm1', 'reject', '月底結帳', now)
    expect(r.status).toBe('rejected')
    expect(r.steps[0].note).toBe('月底結帳')
  })
  it('cancel request: approve → cancelled, reject → back to approved', () => {
    const cp = req({ status: 'cancel_pending', steps: [{ approverId: 'm1', status: 'approved' }], cancelSteps: [{ approverId: 'm1', status: 'waiting' }] })
    expect(currentApproverId(cp)).toBe('m1')
    expect(applyDecision(cp, 'm1', 'approve', undefined, now).status).toBe('cancelled')
    expect(applyDecision(cp, 'm1', 'reject', '人手不足', now).status).toBe('approved')
  })
})
