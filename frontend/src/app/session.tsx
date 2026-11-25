import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { getSession, logout } from '../api/authApi'
import type { Employee } from '../domain/types'

interface SessionValue {
  user: Employee | null
  setUser: (u: Employee | null) => void
  signOut: () => Promise<void>
  /** Bumped after any mutation so views refetch. */
  version: number
  bump: () => void
}

const Ctx = createContext<SessionValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Employee | null>(() => getSession())
  const [version, setVersion] = useState(0)
  const bump = useCallback(() => setVersion((v) => v + 1), [])
  const signOut = useCallback(async () => {
    await logout()
    setUser(null)
  }, [])
  return <Ctx.Provider value={{ user, setUser, signOut, version, bump }}>{children}</Ctx.Provider>
}

export function useSession(): SessionValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSession outside SessionProvider')
  return v
}

export function useUser(): Employee {
  const { user } = useSession()
  if (!user) throw new Error('not signed in')
  return user
}

/** Run an async loader; refetches when deps or the data version change. */
export function useAsync<T>(load: () => Promise<T>, deps: unknown[]): {
  data: T | undefined
  loading: boolean
  error: Error | null
} {
  const { version } = useSession()
  const [state, setState] = useState<{ data: T | undefined; loading: boolean; error: Error | null }>({
    data: undefined,
    loading: true,
    error: null,
  })
  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true }))
    load().then(
      (data) => alive && setState({ data, loading: false, error: null }),
      (error: Error) => alive && setState((s) => ({ ...s, loading: false, error })),
    )
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])
  return state
}
