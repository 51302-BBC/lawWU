import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { isApprover } from '../api/authApi'
import { listPendingFor, resetDemoData } from '../api/leaveApi'
import { Avatar } from '../ui/components'
import { Icon } from '../ui/Icon'
import { useAsync, useSession, useUser } from './session'
import './shell.css'

function NavItem({ to, label, index, badge, end }: { to: string; label: string; index: string; badge?: number; end?: boolean }) {
  return (
    <NavLink to={to} end={end} className="nav__item">
      <span className="nav__index num" aria-hidden="true">{index}</span>
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
      <button type="button" className="usermenu__trigger" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Avatar person={user} size={32} />
        <span className="usermenu__who">
          <span className="usermenu__name">{user.name}</span>
          <span className="usermenu__title">{user.title}</span>
        </span>
        <Icon name="chevronDown" size={14} strokeWidth={2} className="usermenu__chev" />
      </button>
      {open && (
        <div className="usermenu__pop">
          <button
            type="button"
            className="usermenu__item"
            onClick={() => {
              resetDemoData()
              bump()
              setOpen(false)
            }}
          >
            <Icon name="refresh" size={16} />
            重設示範資料
          </button>
          <button
            type="button"
            className="usermenu__item usermenu__item--danger"
            onClick={async () => {
              await signOut()
              navigate('/login', { replace: true })
            }}
          >
            <Icon name="logout" size={16} />
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
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const navRef = useRef<HTMLElement>(null)
  const [lineReady, setLineReady] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Close the mobile menu whenever the page changes.
  useEffect(() => setMenuOpen(false), [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  // The bar is transparent over the top of the page and turns solid once content scrolls under it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // One underline that travels to the active item.
  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const place = () => {
      const active = nav.querySelector<HTMLElement>('.nav__item.active .nav__label')
      if (!active) {
        nav.style.setProperty('--lo', '0')
        return
      }
      // Measure against the nav itself: the label's offsetParent is its own link.
      const n = nav.getBoundingClientRect()
      const a = active.getBoundingClientRect()
      nav.style.setProperty('--lo', '1')
      nav.style.setProperty('--lx', `${a.left - n.left}px`)
      nav.style.setProperty('--lw', `${a.width}px`)
    }
    place()
    const raf = requestAnimationFrame(() => setLineReady(true))
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(place) : null
    ro?.observe(nav)
    return () => {
      cancelAnimationFrame(raf)
      ro?.disconnect()
    }
  }, [pathname, approver, pending.data?.length])

  return (
    <div className="shell">
      <header className="topbar" data-solid={scrolled || menuOpen || undefined}>
        <NavLink to="/" className="brand" aria-label="事務所請假 首頁">
          <span className="brand__name">事務所</span>
          <span className="brand__rule" aria-hidden="true" />
          <span className="brand__app">LEAVE</span>
        </NavLink>

        <nav className="nav" aria-label="主選單" ref={navRef} data-open={menuOpen || undefined}>
          <span className="nav__line" aria-hidden="true" data-ready={lineReady} />
          <NavItem to="/" end index="01" label="總覽" />
          <NavItem to="/records" index="02" label="我的紀錄" />
          <NavItem to="/calendar" index="03" label="行事曆" />
          {approver && (
            <>
              <span className="nav__divider" aria-hidden="true" />
              <NavItem to="/approvals" index="04" label="待審核" badge={pending.data?.length} />
              <NavItem to="/team" index="05" label="團隊概況" />
            </>
          )}
          {menuOpen && (
            <button type="button" className="btn btn--primary btn--lg nav__apply" onClick={() => navigate('/apply')}>
              <Icon name="plus" size={18} strokeWidth={2.2} />
              申請請假
            </button>
          )}
        </nav>

        <div className="topbar__end">
          <UserMenu />
          <button
            type="button"
            className="menu-btn"
            aria-label={menuOpen ? '關閉選單' : '開啟選單'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={24} strokeWidth={2} />
          </button>
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  )
}
