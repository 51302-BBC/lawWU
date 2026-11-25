export type LeaveTypeId =
  | 'annual'
  | 'personal'
  | 'sick'
  | 'menstrual'
  | 'marriage'
  | 'funeral'
  | 'official'
  | 'family_care'
  | 'maternity'
  | 'paternity'

export type LeaveStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'withdrawn'
  | 'cancel_pending'
  | 'cancelled'

export type Role = 'staff' | 'supervisor' | 'manager' | 'owner'

export interface Employee {
  id: string
  employeeNo: string
  name: string
  title: string
  teamId: string
  managerId: string | null
  role: Role
  avatarColor: string
}

export interface LeaveType {
  id: LeaveTypeId
  name: string
  /** 給薪說明，例如「全薪」「半薪」「不給薪」 */
  paid: string
  /** 每年上限（小時）；null 表示依實際需要、不檢查餘額 */
  capHours: number | null
  needsProof: boolean
  note: string
}

export interface ApprovalStep {
  approverId: string
  status: 'waiting' | 'approved' | 'rejected'
  decidedAt?: string
  note?: string
}

/** 時間字串一律為本地時間 'YYYY-MM-DDTHH:mm' */
export interface LeaveRequest {
  id: string
  employeeId: string
  typeId: LeaveTypeId
  start: string
  end: string
  hours: number
  deputyId: string
  reason: string
  status: LeaveStatus
  steps: ApprovalStep[]
  createdAt: string
  cancelSteps?: ApprovalStep[]
}

export interface Balance {
  typeId: LeaveTypeId
  grantedHours: number | null
  usedHours: number
  pendingHours: number
}

export interface Holiday {
  date: string
  name: string
}
