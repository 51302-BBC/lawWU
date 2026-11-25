import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { isApprover } from '../api/authApi'
import { listPendingFor, resetDemoData } from '../api/leaveApi'
import { Avatar } from '../ui/components'
import { Icon, type IconName } from '../ui/Icon'
import { useAsync, useSession, useUser } from './session'
import './shell.css'

function NavItem({ to, icon, label, badge, end }: { to: string; icon: IconName; label: string; badge?: number; end?: boolean }) {
  return (
    <NavLink to={to} end={end} className="nav__item">
      <Icon name={icon} size={22} />
      <span className="nav__label">{label}</span>
      {!!badge && (
        <span className="nav__badge num" aria-label={`${badge} 件${label}`}>
          {badge}
        </span>
      )}
    </NavLink>
  )
}

function UserMenu() {
  const user = useUser()
  const { signOut, bump } = useSession()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="usermenu" ref={ref}>
      <button
        type="button"
        className="usermenu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Avatar person={user} size={34} />
        <span className="usermenu__who">
          <span className="usermenu__name">{user.name}</span>
          <span className="usermenu__title">{user.title}</span>
        </span>
        <Icon name="chevronDown" size={16} className="usermenu__chev" />
      </button>
      {open && (
        <div className="usermenu__pop" role="menu">
          <button
            type="button"
            role="menuitem"
            className="usermenu__item"
            onClick={() => {
              resetDemoData()
              bump()
              setOpen(false)
            }}
          >
            <Icon name="refresh" size={18} />
            重設示範資料
          </button>
          <button
            type="button"
            role="menuitem"
            className="usermenu__item usermenu__item--danger"
            onClick={async () => {
              await signOut()
              navigate('/login', { replace: true })
            }}
          >
            <Icon name="logout" size={18} />
            登出
          </button>
        </div>
      )}
    </div>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  const user = useUser()
  const approver = isApprover(user)
  const pending = useAsync(() => (approver ? listPendingFor(user.id) : Promise.resolve([])), [user.id, approver])

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            <Icon name="calendar" size={18} strokeWidth={2.2} />
          </span>
          <span>
            <span className="brand__name">事務所</span>
            <span className="brand__app">請假</span>
          </span>
        </div>
        <nav className="nav" aria-label="主選單">
          <NavItem to="/" end icon="house" label="總覽" />
          <NavItem to="/records" icon="list" label="我的紀錄" />
          <NavItem to="/calendar" icon="calendar" label="行事曆" />
          {approver && (
            <>
              <span className="nav__section" aria-hidden="true">審核</span>
              <NavItem to="/approvals" icon="tray" label="待審核" badge={pending.data?.length} />
              <NavItem to="/team" icon="people" label="團隊概況" />
            </>
          )}
        </nav>
      </aside>
      {/* Outside the sidebar: its backdrop-filter would trap position: fixed on mobile. */}
      <UserMenu />
      <main className="content">{children}</main>
    </div>
  )
}
