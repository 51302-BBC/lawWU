import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clockIn, clockOut, getTodayPunch, listWeekPunches } from '../../api/attendanceApi'
import { login } from '../../api/authApi'
import { resetDemoData } from '../../api/leaveApi'
import { SessionProvider } from '../../app/session'
import { HOLD_MS } from '../../domain/attendance'
import { ToastProvider } from '../../ui/components'
import { HoldButton, PunchCard } from './PunchCard'

beforeEach(() => resetDemoData())

describe('attendance api', () => {
  it('clocks in once and out once a day', async () => {
    const wed = new Date(2026, 10, 25, 8, 57)
    const p = await clockIn('A005', wed)
    expect(p.in).toBe('2026-11-25T08:57')
    await expect(clockIn('A005', wed)).rejects.toThrow('已經上班')
    const out = await clockOut('A005', new Date(2026, 10, 25, 18, 6))
    expect(out.out).toBe('2026-11-25T18:06')
    await expect(clockOut('A005', wed)).rejects.toThrow('已經下班')
    expect((await getTodayPunch('A005', wed))?.out).toBe('2026-11-25T18:06')
  })

  it('cannot clock out before clocking in', async () => {
    await expect(clockOut('A005', new Date(2026, 10, 25, 18))).rejects.toThrow('還沒有上班')
  })

  it('fills in the earlier workdays of the week for the demo', async () => {
    const week = await listWeekPunches('A005', new Date(2026, 10, 26, 10)) // Thursday
    expect(week.map((p) => p.date)).toEqual(['2026-11-23', '2026-11-24', '2026-11-25'])
    expect(week.every((p) => p.out)).toBe(true)
  })
})

describe('HoldButton', () => {
  it('fires only after being held long enough', () => {
    vi.useFakeTimers()
    const done = vi.fn()
    render(<HoldButton label="按住上班" onDone={done} />)
    const btn = screen.getByRole('button', { name: '按住上班' })

    fireEvent.keyDown(btn, { key: 'Enter' })
    act(() => vi.advanceTimersByTime(HOLD_MS / 2))
    fireEvent.keyUp(btn, { key: 'Enter' })
    act(() => vi.advanceTimersByTime(HOLD_MS))
    expect(done).not.toHaveBeenCalled()

    fireEvent.keyDown(btn, { key: ' ' })
    expect(btn).toHaveTextContent('繼續按住')
    act(() => vi.advanceTimersByTime(HOLD_MS))
    expect(done).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})

describe('PunchCard', () => {
  it('holds to clock in, then marks the moment', async () => {
    await login('A005', 'demo1234')
    render(
      <SessionProvider>
        <ToastProvider>
          <PunchCard />
        </ToastProvider>
      </SessionProvider>,
    )
    const btn = await screen.findByRole('button', { name: '按住上班' })
    expect(screen.getByRole('heading', { name: '準備上班' })).toBeInTheDocument()

    fireEvent.keyDown(btn, { key: 'Enter' }) // held for real: HOLD_MS

    expect(await screen.findByText(/佳穎，今天開始了/, undefined, { timeout: HOLD_MS + 2000 })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: '工作中' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '按住下班' })).toBeInTheDocument()
  })
})
