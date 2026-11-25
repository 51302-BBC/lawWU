import { describe, expect, it } from 'vitest'
import { calcLeaveHours } from './hours'

const none = new Set<string>()

describe('calcLeaveHours', () => {
  it('full working day is 8 hours', () => {
    expect(calcLeaveHours('2026-12-01T09:00', '2026-12-01T18:00', none)).toBe(8)
  })

  it('morning and afternoon halves', () => {
    expect(calcLeaveHours('2026-12-01T09:00', '2026-12-01T12:00', none)).toBe(3)
    expect(calcLeaveHours('2026-12-01T13:00', '2026-12-01T18:00', none)).toBe(5)
  })

  it('excludes the lunch break', () => {
    expect(calcLeaveHours('2026-12-01T11:00', '2026-12-01T14:00', none)).toBe(2)
  })

  it('skips the weekend across days', () => {
    expect(calcLeaveHours('2026-12-04T09:00', '2026-12-07T18:00', none)).toBe(16)
  })

  it('skips national holidays', () => {
    expect(calcLeaveHours('2026-12-24T09:00', '2026-12-28T18:00', new Set(['2026-12-25']))).toBe(16)
  })

  it('returns 0 when end is not after start', () => {
    expect(calcLeaveHours('2026-12-01T18:00', '2026-12-01T09:00', none)).toBe(0)
    expect(calcLeaveHours('2026-12-01T09:00', '2026-12-01T09:00', none)).toBe(0)
  })

  it('returns 0 for a range entirely on the weekend', () => {
    expect(calcLeaveHours('2026-12-05T09:00', '2026-12-06T18:00', none)).toBe(0)
  })

  it('rounds up to the next half hour', () => {
    expect(calcLeaveHours('2026-12-01T09:00', '2026-12-01T09:20', none)).toBe(0.5)
    expect(calcLeaveHours('2026-12-01T09:00', '2026-12-01T10:10', none)).toBe(1.5)
  })

  it('ignores time outside working hours', () => {
    expect(calcLeaveHours('2026-12-01T07:00', '2026-12-01T20:00', none)).toBe(8)
  })
})
