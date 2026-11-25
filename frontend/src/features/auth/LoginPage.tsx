import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { login } from '../../api/authApi'
import { useSession } from '../../app/session'
import { EMPLOYEES } from '../../mock/seed'
import { Avatar, Button } from '../../ui/components'
import { Icon } from '../../ui/Icon'
import { LeaveDemo } from './LeaveDemo'
import './login.css'

const DEMO = ['A005', 'A003', 'A004', 'A002']

/** The hero demo only mounts where the layout shows it (and never without matchMedia, as in tests). */
function useMedia(query: string) {
  const get = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(query).matches
  const [match, setMatch] = useState(get)
  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}

export function LoginPage() {
  const { user, setUser } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [no, setNo] = useState('')
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(0)
  const [demoOpen, setDemoOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const wide = useMedia('(min-width: 1100px)')

  if (user) return <Navigate to={from} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!no.trim() || !pw) {
      setError('請輸入員工編號和密碼')
      setShake((s) => s + 1)
      return
    }
    setBusy(true)
    setError('')
    try {
      const me = await login(no, pw)
      setUser(me)
      navigate(from, { replace: true })
    } catch (err) {
      setError((err as Error).message)
      setShake((s) => s + 1)
      setPw('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <section className="login__hero" aria-label="系統介紹">
        <p className="login__eyebrow">事務所內部系統<i aria-hidden="true" />LEAVE</p>
        <p className="login__headline">
          每一張假單，
          <br />
          都看得見它走到哪。
        </p>
        <p className="login__lede">送出之後，主管核准到哪一站、還要等誰，一眼就知道。</p>
        {wide && (
          <div className="login__stage">
            <LeaveDemo />
          </div>
        )}
      </section>
      <div className="login__panel">
        <p className="login__step">SIGN IN</p>
        <h1 className="login__title">登入</h1>
        <p className="login__sub">用你的員工編號登入事務所請假系統</p>

        <form ref={formRef} className="login__form" onSubmit={submit} noValidate>
          <div key={shake} className={`login__fields${shake ? ' is-shaking' : ''}`} data-error={!!error || undefined}>
            <label className="login__field">
              <span className="visually-hidden">員工編號</span>
              <input

                className="login__input"
                placeholder="員工編號，例如 A005"
                autoComplete="username"
                autoCapitalize="characters"
                spellCheck={false}
                value={no}
                onChange={(e) => setNo(e.target.value)}
                autoFocus
              />
            </label>
            <label className="login__field">
              <span className="visually-hidden">密碼</span>
              <input

                className="login__input"
                type="password"
                placeholder="密碼"
                autoComplete="current-password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
            </label>
          </div>
          {error && (
            <p className="login__error" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" block loading={busy}>
            登入
          </Button>
        </form>

        <div className="login__demo">
          <button
            type="button"
            className="login__demo-toggle"
            aria-expanded={demoOpen}
            onClick={() => setDemoOpen((o) => !o)}
          >
            示範帳號
            <Icon name="chevronDown" size={14} strokeWidth={2} className={demoOpen ? 'is-open' : ''} />
          </button>
          {demoOpen && (
            <div className="login__demo-list">
              <p className="login__demo-hint">點一下自動填入。所有示範帳號的密碼都是 demo1234。</p>
              {DEMO.map((code) => {
                const e = EMPLOYEES.find((x) => x.employeeNo === code)!
                return (
                  <button
                    key={code}
                    type="button"
                    className="login__demo-item"
                    onClick={() => {
                      setNo(code)
                      setPw('demo1234')
                      setError('')
                      formRef.current?.querySelector<HTMLButtonElement>('button[type=submit]')?.focus()
                    }}
                  >
                    <Avatar person={e} size={32} />
                    <span>
                      <span className="login__demo-name">{e.name}</span>
                      <span className="login__demo-role">
                        {code} · {e.title}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <p className="login__foot">示範環境：資料只存在這台電腦的瀏覽器裡</p>
      </div>
    </div>
  )
}
