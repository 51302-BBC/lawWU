import type { LeaveRequest } from '../domain/types'
import { seedRequests } from '../mock/seed'

const KEY = 'leave-demo-v1'

interface DemoState {
  requests: LeaveRequest[]
}

let cache: DemoState | null = null

export function readState(): DemoState {
  if (cache) return cache
  const raw = localStorage.getItem(KEY)
  if (raw) {
    try {
      cache = JSON.parse(raw) as DemoState
      return cache
    } catch {
      /* fall through to reseed */
    }
  }
  cache = { requests: seedRequests(new Date()) }
  writeState(cache)
  return cache
}

export function writeState(state: DemoState): void {
  cache = state
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function resetState(): void {
  cache = null
  localStorage.removeItem(KEY)
}
