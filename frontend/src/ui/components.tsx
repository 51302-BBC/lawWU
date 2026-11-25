import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import type { Employee, LeaveStatus } from '../domain/types'
import { Icon, type IconName } from './Icon'
import './ui.css'

/* ───────── Button ───────── */
type ButtonVariant = 'primary' | 'tinted' | 'gray' | 'plain' | 'danger' | 'danger-solid'

export function Button({
  variant = 'primary',
  size,
  block,
  loading,
  icon,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: 'lg'
  block?: boolean
  loading?: boolean
  icon?: IconName
}) {
  const cls = ['btn', `btn--${variant}`, size && `btn--${size}`, block && 'btn--block', className]
    .filter(Boolean)
    .join(' ')
  return (
    <button type="button" className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <span className="btn__spinner" aria-hidden="true" /> : icon && <Icon name={icon} size={18} strokeWidth={2.2} />}
      {children}
    </button>
  )
}

/* ───────── Avatar ───────── */
export function Avatar({ person, size = 36 }: { person: Pick<Employee, 'name' | 'avatarColor'>; size?: number }) {
  // Chinese names: show the given name's last character pair (e.g. 佳穎)
  const initials = person.name.length >= 3 ? person.name.slice(-2) : person.name
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, background: person.avatarColor, fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}

/* ───────── Status pill ───────── */
export const STATUS_LABEL: Record<LeaveStatus, string> = {
  pending: '審核中',
  approved: '已核准',
  rejected: '已退回',
  withdrawn: '已撤回',
  cancel_pending: '撤銷審核中',
  cancelled: '已撤銷',
}
const STATUS_TONE: Record<LeaveStatus, string> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
  withdrawn: 'gray',
  cancel_pending: 'purple',
  cancelled: 'gray',
}
export function StatusPill({ status }: { status: LeaveStatus }) {
  return <span className={`pill pill--${STATUS_TONE[status]}`}>{STATUS_LABEL[status]}</span>
}

/* ───────── Journey (signature) ───────── */
export interface JourneyStop {
  key: string
  person?: Pick<Employee, 'name' | 'avatarColor'>
  label: string
  note?: string
  state: 'done' | 'current' | 'todo' | 'rejected'
}

export function Journey({ stops, size = 40, compact, label }: {
  stops: JourneyStop[]
  size?: number
  compact?: boolean
  label?: string
}) {
  return (
    <ol
      className={`journey${compact ? ' journey--compact' : ''}`}
      style={{ ['--j-size' as string]: `${size}px` }}
      aria-label={label ?? '簽核進度'}
    >
      {stops.map((s, i) => {
        const prev = stops[i - 1]
        const rail = prev && prev.state === 'done' && s.state !== 'todo' ? 'done' : 'todo'
        return (
          <li key={s.key} className="journey__stop" data-state={s.state} data-rail={rail}>
            <span className="journey__dot">
              {s.person ? <Avatar person={s.person} size={size} /> : <Icon name="person" size={size * 0.5} />}
              {s.state === 'done' && (
                <span className="journey__badge journey__badge--done">
                  <Icon name="check" size={11} strokeWidth={3} />
                </span>
              )}
              {s.state === 'rejected' && (
                <span className="journey__badge journey__badge--rejected">
                  <Icon name="close" size={10} strokeWidth={3} />
                </span>
              )}
            </span>
            <span className="journey__name">{s.label}</span>
            {s.note && <span className="journey__note">{s.note}</span>}
            <span className="visually-hidden">
              {s.label}：{s.state === 'done' ? '已完成' : s.state === 'current' ? '處理中' : s.state === 'rejected' ? '已退回' : '尚未輪到'}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/* ───────── Segmented control ───────── */
export function Segmented<T extends string>({ options, value, onChange, label }: {
  options: { value: T; label: string; count?: number }[]
  value: T
  onChange: (v: T) => void
  label: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [lens, setLens] = useState<{ x: number; w: number; ready: boolean }>({ x: 0, w: 0, ready: false })
  useLayoutEffect(() => {
    const track = trackRef.current
    const on = track?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (!on) return
    const measure = () => setLens((l) => ({ x: on.offsetLeft, w: on.offsetWidth, ready: l.w > 0 }))
    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    ro?.observe(track!)
    return () => ro?.disconnect()
  }, [value, options.length])

  return (
    <div className="seg" role="group" aria-label={label} ref={trackRef}>
      <span
        className="seg__thumb"
        aria-hidden="true"
        data-ready={lens.ready}
        style={{ ['--x' as string]: `${lens.x}px`, ['--w' as string]: `${lens.w}px` }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="seg__item"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
          {o.count !== undefined && <span className="seg__count">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

/* ───────── Notice ───────── */
export function Notice({ tone, icon, children }: { tone: 'orange' | 'red' | 'blue'; icon?: IconName; children: ReactNode }) {
  return (
    <div className={`notice notice--${tone}`} role={tone === 'red' ? 'alert' : 'status'}>
      <Icon name={icon ?? (tone === 'blue' ? 'info' : 'warning')} size={18} />
      <div>{children}</div>
    </div>
  )
}

/* ───────── Empty ───────── */
export function Empty({ icon, title, children }: { icon: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <span className="empty__icon">
        <Icon name={icon} size={24} />
      </span>
      <p className="empty__title">{title}</p>
      {children && <p>{children}</p>}
    </div>
  )
}

/* ───────── Sheet ───────── */
export function Sheet({ title, onClose, children, footer, leading, trailing, width }: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  leading?: ReactNode
  trailing?: ReactNode
  width?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const onClose = () => closeRef.current()
    const prevFocus = document.activeElement as HTMLElement | null
    const node = ref.current
    const first = node?.querySelector<HTMLElement>('[data-autofocus]') ?? node
    first?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
      if (e.key === 'Tab' && node) {
        const items = node.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        )
        if (!items.length) {
          e.preventDefault()
          return
        }
        const firstEl = items[0]
        const lastEl = items[items.length - 1]
        const active = document.activeElement
        if (!node.contains(active) || active === node) {
          // Focus is on the dialog itself (initial state) or escaped: pull it back in.
          e.preventDefault()
          ;(e.shiftKey ? lastEl : firstEl).focus()
        } else if (e.shiftKey && active === firstEl) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && active === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      prevFocus?.focus?.()
    }
  }, [])

  return createPortal(
    <div className="sheet-root">
      <div className="sheet-backdrop" onClick={onClose} />
      <div
        ref={ref}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={width ? { ['--sheet-w' as string]: `${width}px` } : undefined}
      >
        <div className="sheet__bar">
          <div>{leading ?? <Button variant="plain" onClick={onClose}>取消</Button>}</div>
          <h2 id={titleId} className="sheet__title">{title}</h2>
          <div style={{ justifySelf: 'end' }}>{trailing}</div>
        </div>
        <div className="sheet__body">{children}</div>
        {footer && <div className="sheet__foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/* ───────── Toast ───────── */
interface ToastItem {
  id: number
  text: string
}
const ToastCtx = createContext<(text: string) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const show = useCallback((text: string) => {
    const id = Date.now() + Math.random()
    setItems((xs) => [...xs, { id, text }])
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3200)
  }, [])
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="toast">
            <span className="toast__icon">
              <Icon name="check" size={14} strokeWidth={3} />
            </span>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)

/* ───────── Skeleton ───────── */
export function Skeleton({ h = 16, w = '100%', r }: { h?: number; w?: number | string; r?: number }) {
  return <span className="skeleton" style={{ display: 'block', height: h, width: w, borderRadius: r }} aria-hidden="true" />
}
