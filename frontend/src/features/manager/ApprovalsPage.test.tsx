import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { login } from '../../api/authApi'
import { listMyRequests, resetDemoData } from '../../api/leaveApi'
import { SessionProvider } from '../../app/session'
import { ToastProvider } from '../../ui/components'
import { ApprovalsPage } from './ApprovalsPage'

async function setup(no: string) {
  await login(no, 'demo1234')
  render(
    <SessionProvider>
      <ToastProvider>
        <MemoryRouter>
          <ApprovalsPage />
        </MemoryRouter>
      </ToastProvider>
    </SessionProvider>,
  )
  await screen.findByRole('heading', { level: 1, name: '待審核' })
  return userEvent.setup()
}

const cards = () => screen.findAllByRole('article')
// match on the card's accessible name (applicant), not its text — a card also names the deputy
const cardOf = async (name: RegExp) => (await cards()).find((c) => name.test(c.getAttribute('aria-label') ?? ''))!

beforeEach(() => resetDemoData())

describe('ApprovalsPage', () => {
  it('supervisor sees requests waiting on them, including a cancel request', async () => {
    await setup('A003')
    const list = await cards()
    expect(list).toHaveLength(3)
    expect(await cardOf(/蔡承翰/)).toHaveTextContent('撤銷申請')
  })

  it('approving a single-step request removes it and approves it', async () => {
    const user = await setup('A003')
    const card = await cardOf(/吳宜蓁/)
    await user.click(within(card).getByRole('button', { name: '核准' }))
    await waitFor(async () => expect(await cards()).toHaveLength(2))
    const r = (await listMyRequests('s3')).find((x) => x.typeId === 'personal')!
    expect(r.status).toBe('approved')
  })

  it('returning needs a reason before it can be confirmed', async () => {
    const user = await setup('A003')
    const card = await cardOf(/李佳穎/)
    await user.click(within(card).getByRole('button', { name: '退回' }))
    const confirm = within(card).getByRole('button', { name: '確認退回' })
    expect(confirm).toBeDisabled()
    await user.type(within(card).getByLabelText('退回原因'), '月底結帳，改下週好嗎？')
    expect(confirm).toBeEnabled()
    await user.click(confirm)
    await waitFor(async () => expect(await cards()).toHaveLength(2))
    const r = (await listMyRequests('s1')).find((x) => x.status === 'rejected' && x.typeId === 'personal')
    expect(r?.steps[0].note).toBe('月底結帳，改下週好嗎？')
  })

  it('manager sees second-level requests and which level it is', async () => {
    await setup('A002')
    const card = await cardOf(/李佳穎/)
    expect(card).toHaveTextContent('第 2 關，共 2 關')
    expect(await cards()).toHaveLength(2)
  })

  it('shows an encouraging empty state when the queue is clear', async () => {
    const user = await setup('A004')
    const card = await cardOf(/許家豪/)
    await user.click(within(card).getByRole('button', { name: '核准' }))
    expect(await screen.findByText('都處理完了')).toBeInTheDocument()
  })
})
