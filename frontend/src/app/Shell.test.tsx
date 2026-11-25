import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { login } from '../api/authApi'
import { resetDemoData } from '../api/leaveApi'
import { AppRoutes } from './App'
import { SessionProvider } from './session'

function renderAt(path: string) {
  return render(
    <SessionProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </SessionProvider>,
  )
}

beforeEach(() => resetDemoData())

describe('app shell', () => {
  it('redirects to login when signed out', async () => {
    renderAt('/')
    expect(await screen.findByRole('heading', { name: '登入' })).toBeInTheDocument()
  })

  it('logs in from the login page and lands on the dashboard', async () => {
    renderAt('/')
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('員工編號'), 'A005')
    await user.type(screen.getByLabelText('密碼'), 'demo1234')
    await user.click(screen.getByRole('button', { name: '登入' }))
    expect(await screen.findByRole('heading', { level: 1, name: /佳穎/ })).toBeInTheDocument()
  })

  it('shows an error on a wrong password', async () => {
    renderAt('/login')
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('員工編號'), 'A005')
    await user.type(screen.getByLabelText('密碼'), 'wrong')
    await user.click(screen.getByRole('button', { name: '登入' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('帳號或密碼不正確')
  })

  it('staff does not see approval navigation', async () => {
    await login('A005', 'demo1234')
    renderAt('/')
    const nav = await screen.findByRole('navigation', { name: '主選單' })
    expect(nav).toHaveTextContent('總覽')
    expect(nav).not.toHaveTextContent('待審核')
  })

  it('supervisor sees approvals with a pending count badge', async () => {
    await login('A003', 'demo1234')
    renderAt('/')
    const nav = await screen.findByRole('navigation', { name: '主選單' })
    expect(nav).toHaveTextContent('待審核')
    expect(nav).toHaveTextContent('團隊概況')
    // seed: 李佳穎 personal, 吳宜蓁 personal, 蔡承翰 cancel request → 3 waiting on 林建宏
    await waitFor(() => expect(screen.getByLabelText('3 件待審核')).toBeInTheDocument())
  })

  it('staff visiting /approvals is sent back to the dashboard', async () => {
    await login('A005', 'demo1234')
    renderAt('/approvals')
    expect(await screen.findByRole('heading', { level: 1, name: /佳穎/ })).toBeInTheDocument()
  })
})
