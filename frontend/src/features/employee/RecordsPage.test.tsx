import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { login } from '../../api/authApi'
import { resetDemoData } from '../../api/leaveApi'
import { SessionProvider } from '../../app/session'
import { ToastProvider } from '../../ui/components'
import { RecordsPage } from './RecordsPage'

async function setup() {
  await login('A005', 'demo1234')
  render(
    <SessionProvider>
      <ToastProvider>
        <MemoryRouter>
          <RecordsPage />
        </MemoryRouter>
      </ToastProvider>
    </SessionProvider>,
  )
  await screen.findByRole('heading', { level: 1, name: '我的紀錄' })
  return userEvent.setup()
}

const list = async () => within(await screen.findByRole('list', { name: '假單' }))
const row = async (re: RegExp) => (await list()).getAllByRole('button', { name: re })[0]

beforeEach(() => resetDemoData())

describe('RecordsPage', () => {
  it('lists every request of mine', async () => {
    await setup()
    // seed for 李佳穎: 2 pending, 1 approved sick, 1 rejected
    expect((await list()).getAllByRole('button')).toHaveLength(4)
  })

  it('filters by status', async () => {
    const user = await setup()
    await screen.findAllByRole('button', { name: /小時/ })
    await user.click(within(screen.getByRole('group', { name: '篩選' })).getByRole('button', { name: /已退回/ }))
    expect((await list()).getAllByRole('button')).toHaveLength(1)
  })

  it('withdraws a pending request', async () => {
    const user = await setup()
    await user.click(await row(/事假.*審核中/))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: '撤回申請' }))
    await user.click(within(dialog).getByRole('button', { name: '撤回' }))
    expect(await within(dialog).findByText('已撤回', { selector: '.pill' })).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: '撤回申請' })).toBeNull()
  })

  it('has no cancel button for approved leave that already happened', async () => {
    const user = await setup()
    await user.click(await row(/病假/))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).queryByRole('button', { name: '申請撤銷' })).toBeNull()
    expect(within(dialog).getByText(/不能再撤銷/)).toBeInTheDocument()
  })

  it('shows the rejection reason', async () => {
    const user = await setup()
    await user.click(await row(/已退回/))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/客戶查帳/)).toBeInTheDocument()
  })
})
