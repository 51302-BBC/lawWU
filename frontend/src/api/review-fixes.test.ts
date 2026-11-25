import { beforeEach, describe, expect, it } from 'vitest'
import { applyDecision } from '../domain/rules'
import type { LeaveRequest } from '../domain/types'
import { decide, getBalances, requestCancel, resetDemoData, submitRequest } from './leaveApi'

const bal = async (id: string, typeId: string, year: number) =>
  (await getBalances(id, year)).find((b) => b.typeId === typeId)!

beforeEach(() => resetDemoData())

describe('balances are per calendar year', () => {
  it('a request only counts in the year it falls in', async () => {
    await submitRequest({ employeeId: 's3', typeId: 'annual', start: '2030-01-08T09:00', end: '2030-01-08T18:00', deputyId: 's1', reason: '' })
    expect((await bal('s3', 'annual', 2030)).pendingHours).toBe(8)
    expect((await bal('s3', 'annual', 2031)).pendingHours).toBe(0)
  })

  it('a request crossing new year is split between the years', async () => {
    await submitRequest({ employeeId: 's3', typeId: 'annual', start: '2030-12-31T09:00', end: '2031-01-02T18:00', deputyId: 's1', reason: '' })
    expect((await bal('s3', 'annual', 2030)).pendingHours).toBe(8)
    expect((await bal('s3', 'annual', 2031)).pendingHours).toBe(16)
  })
})

describe('家庭照顧假 counts toward 事假', () => {
  it('family care hours show up in the 事假 balance', async () => {
    await submitRequest({ employeeId: 's10', typeId: 'family_care', start: '2030-01-08T09:00', end: '2030-01-08T18:00', deputyId: 's9', reason: '' })
    expect((await bal('s10', 'personal', 2030)).pendingHours).toBe(8)
  })

  it('family care is refused once 事假 is used up', async () => {
    // 2030-01-01 .. 01-18 = 14 workdays = 112 h of 事假
    await submitRequest({ employeeId: 's10', typeId: 'personal', start: '2030-01-01T09:00', end: '2030-01-18T18:00', deputyId: 's9', reason: '' })
    await expect(
      submitRequest({ employeeId: 's10', typeId: 'family_care', start: '2030-01-22T09:00', end: '2030-01-22T18:00', deputyId: 's9', reason: '' }),
    ).rejects.toThrow('剩餘時數不足')
  })
})

describe('overlapping requests', () => {
  it('refuses a second request over the same time', async () => {
    await submitRequest({ employeeId: 's3', typeId: 'personal', start: '2030-01-08T09:00', end: '2030-01-08T18:00', deputyId: 's1', reason: '' })
    await expect(
      submitRequest({ employeeId: 's3', typeId: 'annual', start: '2030-01-08T13:00', end: '2030-01-08T18:00', deputyId: 's1', reason: '' }),
    ).rejects.toThrow('這段時間你已經有假單了')
  })
})

describe('no approver', () => {
  it('refuses a request that nobody could approve (the owner)', async () => {
    await expect(
      submitRequest({ employeeId: 'o1', typeId: 'annual', start: '2030-01-08T09:00', end: '2030-01-08T18:00', deputyId: 'g1', reason: '' }),
    ).rejects.toThrow('沒有可以審核')
  })
})

describe('cancel after leave started', () => {
  it('cannot approve a cancel request once the leave has begun', () => {
    const req: LeaveRequest = {
      id: 'x', employeeId: 's1', typeId: 'annual', start: '2026-12-10T09:00', end: '2026-12-11T18:00', hours: 16,
      deputyId: 's2', reason: '', status: 'cancel_pending', createdAt: '2026-12-01T09:00',
      steps: [{ approverId: 'm1', status: 'approved' }], cancelSteps: [{ approverId: 'm1', status: 'waiting' }],
    }
    expect(() => applyDecision(req, 'm1', 'approve', undefined, new Date(2026, 11, 10, 14, 0))).toThrow('已經開始')
    // declining still works after start
    expect(applyDecision(req, 'm1', 'reject', '已開始', new Date(2026, 11, 10, 14, 0)).status).toBe('approved')
  })

  it('requestCancel works end to end for a future approved leave', async () => {
    const r = await submitRequest({ employeeId: 's3', typeId: 'annual', start: '2030-01-08T09:00', end: '2030-01-08T18:00', deputyId: 's1', reason: '' })
    await decide(r.id, 'm1', 'approve')
    expect((await requestCancel(r.id, 's3')).cancelSteps?.[0].approverId).toBe('m1')
  })
})
