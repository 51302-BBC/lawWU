import { calcLeaveHours, isWorkday, toDateKey } from '../domain/hours'
import type { Employee, Holiday, LeaveRequest, LeaveType, LeaveTypeId } from '../domain/types'

export const DEMO_PASSWORD = 'demo1234'

export const TEAMS: Record<string, string> = {
  exec: '所務',
  audit: '審計組',
  books: '記帳組',
}

const e = (
  id: string, employeeNo: string, name: string, title: string, teamId: string,
  managerId: string | null, role: Employee['role'], avatarColor: string,
): Employee => ({ id, employeeNo, name, title, teamId, managerId, role, avatarColor })

export const EMPLOYEES: Employee[] = [
  e('o1', 'A001', '陳志明', '所長', 'exec', null, 'owner', '#8e8e93'),
  e('g1', 'A002', '王雅婷', '經理', 'exec', 'o1', 'manager', '#af52de'),
  e('m1', 'A003', '林建宏', '審計組主管', 'audit', 'g1', 'supervisor', '#007aff'),
  e('m2', 'A004', '張美玲', '記帳組主管', 'books', 'g1', 'supervisor', '#ff9500'),
  e('s1', 'A005', '李佳穎', '審計員', 'audit', 'm1', 'staff', '#34c759'),
  e('s2', 'A006', '黃冠宇', '審計員', 'audit', 'm1', 'staff', '#5ac8fa'),
  e('s3', 'A007', '吳宜蓁', '資深審計員', 'audit', 'm1', 'staff', '#ff2d55'),
  e('s4', 'A008', '蔡承翰', '審計員', 'audit', 'm1', 'staff', '#5856d6'),
  e('s5', 'A009', '鄭雅雯', '審計助理', 'audit', 'm1', 'staff', '#ffcc00'),
  e('s6', 'A010', '周品妤', '記帳員', 'books', 'm2', 'staff', '#30b0c7'),
  e('s7', 'A011', '許家豪', '記帳員', 'books', 'm2', 'staff', '#a2845e'),
  e('s8', 'A012', '謝欣怡', '資深記帳員', 'books', 'm2', 'staff', '#ff6482'),
  e('s9', 'A013', '洪子軒', '記帳員', 'books', 'm2', 'staff', '#64d2ff'),
  e('s10', 'A014', '曾詩涵', '記帳助理', 'books', 'm2', 'staff', '#32ade6'),
]

/** 特休天數（依年資，示範值） */
export const ANNUAL_DAYS: Record<string, number> = {
  o1: 30, g1: 20, m1: 15, m2: 14, s1: 7, s2: 10, s3: 14, s4: 7, s5: 3,
  s6: 10, s7: 7, s8: 14, s9: 3, s10: 7,
}

export const LEAVE_TYPES: LeaveType[] = [
  { id: 'annual', name: '特休', paid: '全薪', capHours: null, needsProof: false, note: '依年資給假，年度未休完可遞延或折發工資。' },
  { id: 'personal', name: '事假', paid: '不給薪', capHours: 14 * 8, needsProof: false, note: '一年 14 日以內。' },
  { id: 'sick', name: '病假', paid: '半薪', capHours: 30 * 8, needsProof: true, note: '未住院一年 30 日以內，連續請 3 日以上可能需附診斷證明。' },
  { id: 'menstrual', name: '生理假', paid: '半薪', capHours: 12 * 8, needsProof: false, note: '每月 1 日，全年 3 日內不併入病假。' },
  { id: 'family_care', name: '家庭照顧假', paid: '不給薪', capHours: 7 * 8, needsProof: false, note: '一年 7 日，併入事假計算。' },
  { id: 'marriage', name: '婚假', paid: '全薪', capHours: 8 * 8, needsProof: true, note: '8 日，原則上於結婚前 10 日起 3 個月內請畢。' },
  { id: 'funeral', name: '喪假', paid: '全薪', capHours: 8 * 8, needsProof: true, note: '依親等 3、6 或 8 日。' },
  { id: 'paternity', name: '陪產檢及陪產假', paid: '全薪', capHours: 7 * 8, needsProof: true, note: '共 7 日。' },
  { id: 'maternity', name: '產假', paid: '全薪（依年資）', capHours: 40 * 8, needsProof: true, note: '分娩前後 8 週。' },
  { id: 'official', name: '公假', paid: '全薪', capHours: null, needsProof: true, note: '兵役、選務、法院傳喚等法定義務，依實際需要給假。' },
]

/** 國定假日（示範資料，實際以行政院人事行政總處公告為準）。 */
export const HOLIDAYS: Holiday[] = [
  { date: '2026-01-01', name: '元旦' },
  { date: '2026-02-16', name: '除夕' },
  { date: '2026-02-17', name: '春節' },
  { date: '2026-02-18', name: '春節' },
  { date: '2026-02-19', name: '春節' },
  { date: '2026-02-20', name: '春節補假' },
  { date: '2026-02-27', name: '和平紀念日補假' },
  { date: '2026-04-03', name: '兒童節補假' },
  { date: '2026-04-06', name: '清明節補假' },
  { date: '2026-05-01', name: '勞動節' },
  { date: '2026-06-19', name: '端午節' },
  { date: '2026-09-25', name: '中秋節' },
  { date: '2026-09-28', name: '教師節' },
  { date: '2026-10-09', name: '國慶日補假' },
  { date: '2026-10-26', name: '臺灣光復節補假' },
  { date: '2026-12-25', name: '行憲紀念日' },
  { date: '2027-01-01', name: '元旦' },
  { date: '2027-02-05', name: '除夕' },
  { date: '2027-02-08', name: '春節' },
  { date: '2027-02-09', name: '春節' },
  { date: '2027-02-10', name: '春節補假' },
  { date: '2027-03-01', name: '和平紀念日補假' },
  { date: '2027-04-05', name: '兒童節及清明節' },
  { date: '2027-04-06', name: '兒童節補假' },
  { date: '2027-04-30', name: '勞動節補假' },
  { date: '2027-06-09', name: '端午節' },
  { date: '2027-09-15', name: '中秋節' },
  { date: '2027-09-28', name: '教師節' },
  { date: '2027-10-11', name: '國慶日補假' },
  { date: '2027-10-25', name: '臺灣光復節' },
  { date: '2027-12-24', name: '行憲紀念日補假' },
]

export const HOLIDAY_SET = new Set(HOLIDAYS.map((h) => h.date))

/** n-th working day from today (n may be negative). */
function workday(n: number, today: Date): string {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const step = n >= 0 ? 1 : -1
  let left = Math.abs(n)
  while (left > 0 || !isWorkday(d, HOLIDAY_SET)) {
    d.setDate(d.getDate() + step)
    if (isWorkday(d, HOLIDAY_SET)) left--
  }
  return toDateKey(d)
}

/** Seed requests, placed relative to `today` so the demo always looks current. */
export function seedRequests(today: Date): LeaveRequest[] {
  let n = 0
  const created = (offset: number) => `${workday(offset, today)}T10:12`
  const r = (
    employeeId: string, typeId: LeaveTypeId,
    from: [number, string], to: [number, string],
    deputyId: string, reason: string, status: LeaveRequest['status'],
    steps: LeaveRequest['steps'], extra: Partial<LeaveRequest> = {},
  ): LeaveRequest => {
    const start = `${workday(from[0], today)}T${from[1]}`
    const end = `${workday(to[0], today)}T${to[1]}`
    return {
      id: `seed-${++n}`, employeeId, typeId, start, end,
      hours: calcLeaveHours(start, end, HOLIDAY_SET),
      deputyId, reason, status, steps, createdAt: created(Math.min(from[0], 0) - 3),
      ...extra,
    }
  }
  const ok = (approverId: string, offset = -2) => ({ approverId, status: 'approved' as const, decidedAt: created(offset) })
  const wait = (approverId: string) => ({ approverId, status: 'waiting' as const })

  return [
    r('s1', 'annual', [10, '09:00'], [13, '18:00'], 's2', '家族旅遊，去花東四天。', 'pending', [ok('m1', 0), wait('g1')]),
    r('s1', 'personal', [3, '13:00'], [3, '18:00'], 's3', '辦理銀行貸款對保。', 'pending', [wait('m1')]),
    r('s1', 'sick', [-8, '09:00'], [-8, '18:00'], 's2', '腸胃炎，已看診。', 'approved', [ok('m1', -8)]),
    r('s1', 'annual', [-25, '09:00'], [-24, '18:00'], 's4', '想多休兩天。', 'rejected', [
      { approverId: 'm1', status: 'rejected', decidedAt: created(-28), note: '那兩天剛好是客戶查帳，能不能改到下週？' },
    ]),
    r('s2', 'annual', [5, '09:00'], [6, '18:00'], 's4', '回南部參加婚禮。', 'approved', [ok('m1')]),
    r('s3', 'personal', [2, '09:00'], [2, '18:00'], 's1', '小孩學校日。', 'pending', [wait('m1')]),
    r('s4', 'annual', [7, '09:00'], [7, '18:00'], 's5', '原定看展覽。', 'cancel_pending', [ok('m1', -5)], {
      cancelSteps: [wait('m1')],
    }),
    r('s5', 'family_care', [-3, '13:00'], [-3, '18:00'], 's4', '陪家人回診。', 'approved', [ok('m1', -4)]),
    r('s6', 'sick', [0, '09:00'], [0, '18:00'], 's7', '發燒。', 'approved', [ok('m2', 0)]),
    r('s7', 'annual', [4, '09:00'], [4, '12:00'], 's9', '上午處理私事。', 'pending', [wait('m2')]),
    r('m2', 'annual', [15, '09:00'], [17, '18:00'], 'm1', '年度休假。', 'pending', [wait('g1')]),
    r('s8', 'marriage', [20, '09:00'], [27, '18:00'], 's10', '結婚！', 'approved', [ok('m2', -1), ok('g1', -1)]),
    r('s9', 'personal', [-12, '09:00'], [-12, '18:00'], 's6', '搬家。', 'withdrawn', [wait('m2')]),
  ]
}
