import type { Employee } from '../domain/types'
import { DEMO_PASSWORD, EMPLOYEES } from '../mock/seed'
import { delay } from './delay'

const SESSION_KEY = 'leave-demo-session'

export async function login(employeeNo: string, password: string): Promise<Employee> {
  const no = employeeNo.trim().toUpperCase()
  const emp = EMPLOYEES.find((e) => e.employeeNo === no)
  await delay(null, 500)
  if (!emp || password !== DEMO_PASSWORD) throw new Error('帳號或密碼不正確')
  localStorage.setItem(SESSION_KEY, emp.id)
  return emp
}

export async function logout(): Promise<void> {
  localStorage.removeItem(SESSION_KEY)
}

export function getSession(): Employee | null {
  const id = localStorage.getItem(SESSION_KEY)
  return EMPLOYEES.find((e) => e.id === id) ?? null
}

export function isApprover(e: Employee): boolean {
  return e.role !== 'staff'
}
