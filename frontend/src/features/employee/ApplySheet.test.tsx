import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { login } from '../../api/authApi'
import { listPendingFor, resetDemoData } from '../../api/leaveApi'
import { SessionProvider } from '../../app/session'
import { ToastProvider } from '../../ui/components'
import { ApplySheet } from './ApplySheet'

async function setup() {
  await login('A005', 'demo1234')
  const onClose = vi.fn()
  const onSubmitted = vi.fn()
  render(
    <SessionProvider>
      <ToastProvider>
        <ApplySheet onClose={onClose} onSubmitted={onSubmitted} />
      </ToastProvider>
    </SessionProvider>,
  )
  await screen.findByRole('radio', { name: /事假/ })
  return { onClose, onSubmitted, user: userEvent.setup() }
}

const submitBtn = () => screen.getByRole('button', { name: '送出申請' })

beforeEach(() => resetDemoData())

describe('ApplySheet', () => {
  it('shows 8 hours for one full day of 事假', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('radio', { name: /事假/ }))
    fireEvent.change(screen.getByLabelText('開始日期'), { target: { value: '2030-01-08' } })
    fireEvent.change(screen.getByLabelText('結束日期'), { target: { value: '2030-01-08' } })
    expect(await screen.findByTestId('hours-total')).toHaveTextContent('8 小時')
  })

  it('half day (afternoon) is 5 hours', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('radio', { name: /事假/ }))
    await user.click(screen.getByRole('button', { name: '下午' }))
    fireEvent.change(screen.getByLabelText('日期'), { target: { value: '2030-01-08' } })
    expect(await screen.findByTestId('hours-total')).toHaveTextContent('5 小時')
  })

  it('enables submit once a deputy is chosen, and submits to the supervisor', async () => {
    const { user, onSubmitted } = await setup()
    await user.click(screen.getByRole('radio', { name: /事假/ }))
    fireEvent.change(screen.getByLabelText('開始日期'), { target: { value: '2030-01-08' } })
    fireEvent.change(screen.getByLabelText('結束日期'), { target: { value: '2030-01-08' } })
    expect(submitBtn()).toBeDisabled()
    await user.selectOptions(screen.getByLabelText('職務代理人'), 's2')
    expect(submitBtn()).toBeEnabled()
    await user.click(submitBtn())
    await waitFor(() => expect(onSubmitted).toHaveBeenCalled())
    expect((await listPendingFor('m1')).some((r) => r.start === '2030-01-08T09:00')).toBe(true)
  })

  it('blocks submit when hours exceed the remaining balance', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('radio', { name: /事假/ }))
    fireEvent.change(screen.getByLabelText('開始日期'), { target: { value: '2030-01-01' } })
    fireEvent.change(screen.getByLabelText('結束日期'), { target: { value: '2030-01-31' } })
    await user.selectOptions(screen.getByLabelText('職務代理人'), 's2')
    expect(await screen.findByText(/剩餘時數不足/)).toBeInTheDocument()
    expect(submitBtn()).toBeDisabled()
  })

  it('warns about tax season in May but still allows submit', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('radio', { name: /事假/ }))
    fireEvent.change(screen.getByLabelText('開始日期'), { target: { value: '2030-05-14' } })
    fireEvent.change(screen.getByLabelText('結束日期'), { target: { value: '2030-05-14' } })
    await user.selectOptions(screen.getByLabelText('職務代理人'), 's2')
    expect(await screen.findByText(/綜所稅申報期/)).toBeInTheDocument()
    expect(submitBtn()).toBeEnabled()
  })

  it('shows the two-level approval path for more than 3 days', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('radio', { name: /事假/ }))
    fireEvent.change(screen.getByLabelText('開始日期'), { target: { value: '2030-01-07' } })
    fireEvent.change(screen.getByLabelText('結束日期'), { target: { value: '2030-01-10' } })
    const path = await screen.findByRole('list', { name: '簽核路徑' })
    expect(path).toHaveTextContent('林主管')
    expect(path).toHaveTextContent('王經理')
  })

  it('flags a deputy who is away at the same time', async () => {
    // seed: 黃冠宇 (s2) has approved leave on workday +5 and +6
    const { user } = await setup()
    await user.click(screen.getByRole('radio', { name: /事假/ }))
    const option = screen.getByRole('option', { name: /黃冠宇/ }) as HTMLOptionElement
    expect(option).toBeInTheDocument()
    // pick a range that surely covers s2's leave: the next 30 days
    const today = new Date()
    const plus = (n: number) => {
      const d = new Date(today)
      d.setDate(d.getDate() + n)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }
    fireEvent.change(screen.getByLabelText('開始日期'), { target: { value: plus(1) } })
    fireEvent.change(screen.getByLabelText('結束日期'), { target: { value: plus(12) } })
    await user.selectOptions(screen.getByLabelText('職務代理人'), 's2')
    expect(await screen.findByText(/黃冠宇.*也請假/)).toBeInTheDocument()
  })
})
