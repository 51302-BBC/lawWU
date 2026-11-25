import { describe, expect, it } from 'vitest'
import { durationLabel, phaseOf, signOff, workedMinutes, type Punch } from './attendance'

const p = (inT: string, out?: string): Punch => ({ employeeId: 'A005', date: '2026-11-25', in: `2026-11-25T${inT}`, out: out && `2026-11-25T${out}` })

describe('attendance', () => {
  it('knows the phase of the day', () => {
    expect(phaseOf(null)).toBe('before')
    expect(phaseOf(p('09:00'))).toBe('working')
    expect(phaseOf(p('09:00', '18:00'))).toBe('done')
  })

  it('leaves the lunch hour out of time worked', () => {
    expect(workedMinutes(p('09:00', '18:00'))).toBe(8 * 60)
    expect(workedMinutes(p('08:52', '18:11'))).toBe(8 * 60 + 19)
    expect(workedMinutes(p('12:30', '14:00'))).toBe(60)
    expect(workedMinutes(p('09:00', '11:00'))).toBe(120)
  })

  it('counts up to now while still working', () => {
    expect(workedMinutes(p('09:00'), new Date(2026, 10, 25, 10, 15))).toBe(75)
  })

  it('says durations in words', () => {
    expect(durationLabel(45)).toBe('45 分')
    expect(durationLabel(480)).toBe('8 小時')
    expect(durationLabel(489)).toBe('8 小時 9 分')
  })

  it('wishes a good weekend on Fridays only', () => {
    expect(signOff(new Date(2026, 10, 27))).toContain('週末')
    expect(signOff(new Date(2026, 10, 25))).toContain('明天見')
  })
})
