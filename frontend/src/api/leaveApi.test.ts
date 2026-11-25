import { beforeEach, describe, expect, it } from 'vitest'
import { getSession, login, logout } from './authApi'
import {
  decide,
  getBalances,
  listMyRequests,
  listPendingFor,
  listSubordinates,
  requestCancel,
  resetDemoData,
  submitRequest,
  withdrawRequest,
} from './leaveApi'

// requests below are in 2030, so read the 2030 balance
const annual = async (id: string) => (await getBalances(id, 2030)).find((b) => b.typeId === 'annual')!

// A far-future Tuesday–Wednesday so seeded requests never overlap.
const START = '2030-01-08T09:00'
const END = '2030-01-08T18:00'

beforeEach(() => {
  resetDemoData()
})

describe('auth', () => {
  it('logs in with employee number and demo password', async () => {
    const me = await login('A005', 'demo1234')
    expect(me.name).toBe('李佳穎')
    expect(getSession()?.id).toBe('s1')
  })
  it('is case-insensitive and trims the employee number', async () => {
    expect((await login(' a005 ', 'demo1234')).id).toBe('s1')
  })
  it('rejects a wrong password', async () => {
    await expect(login('A005', 'nope')).rejects.toThrow('帳號或密碼不正確')
  })
  it('logout clears the session', async () => {
    await login('A005', 'demo1234')
    await logout()
    expect(getSession()).toBeNull()
  })
})

describe('leave flow', () => {
  it('submitted request reaches the direct manager with computed hours', async () => {
    const req = await submitRequest({ employeeId: 's1', typeId: 'personal', start: START, end: END, deputyId: 's2', reason: 'x' })
    expect(req.hours).toBe(8)
    expect((await listPendingFor('m1')).map((r) => r.id)).toContain(req.id)
  })

  it('pending hours are held, approval moves them to used', async () => {
    const before = await annual('s3')
    const req = await submitRequest({ employeeId: 's3', typeId: 'annual', start: START, end: END, deputyId: 's1', reason: '' })
    expect((await annual('s3')).pendingHours).toBe(before.pendingHours + 8)
    await decide(req.id, 'm1', 'approve')
    const after = await annual('s3')
    expect(after.usedHours).toBe(before.usedHours + 8)
    expect(after.pendingHours).toBe(before.pendingHours)
  })

  it('withdraw returns the held hours', async () => {
    const before = await annual('s3')
    const req = await submitRequest({ employeeId: 's3', typeId: 'annual', start: START, end: END, deputyId: 's1', reason: '' })
    const w = await withdrawRequest(req.id, 's3')
    expect(w.status).toBe('withdrawn')
    expect((await annual('s3')).pendingHours).toBe(before.pendingHours)
  })

  it('> 3 days goes through supervisor then manager', async () => {
    const req = await submitRequest({ employeeId: 's3', typeId: 'annual', start: '2030-01-07T09:00', end: '2030-01-10T18:00', deputyId: 's1', reason: '' })
    expect(req.steps.map((s) => s.approverId)).toEqual(['m1', 'g1'])
    await decide(req.id, 'm1', 'approve')
    expect((await listPendingFor('g1')).map((r) => r.id)).toContain(req.id)
  })

  it('refuses invalid input with the validation message', async () => {
    await expect(
      submitRequest({ employeeId: 's1', typeId: 'personal', start: START, end: END, deputyId: 's1', reason: '' }),
    ).rejects.toThrow('代理人不能是自己')
  })

  it('cancel request on an approved future leave goes back to the manager', async () => {
    const req = await submitRequest({ employeeId: 's3', typeId: 'annual', start: START, end: END, deputyId: 's1', reason: '' })
    await decide(req.id, 'm1', 'approve')
    const c = await requestCancel(req.id, 's3')
    expect(c.status).toBe('cancel_pending')
    await decide(req.id, 'm1', 'approve')
    expect((await listMyRequests('s3')).find((r) => r.id === req.id)?.status).toBe('cancelled')
  })

  it('resetDemoData restores the seed', async () => {
    const req = await submitRequest({ employeeId: 's1', typeId: 'personal', start: START, end: END, deputyId: 's2', reason: '' })
    resetDemoData()
    expect((await listMyRequests('s1')).some((r) => r.id === req.id)).toBe(false)
  })

  it('subordinates include indirect reports', async () => {
    const ids = (await listSubordinates('g1')).map((e) => e.id)
    expect(ids).toContain('m1')
    expect(ids).toContain('s1')
    expect(ids).not.toContain('g1')
  })
})
