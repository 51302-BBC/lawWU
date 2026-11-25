import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listEmployees, listLeaveTypes, listMyRequests } from '../../api/leaveApi'
import { useAsync, useUser } from '../../app/session'
import type { LeaveRequest, LeaveStatus } from '../../domain/types'
import { Button, Empty, Segmented, Skeleton, StatusPill } from '../../ui/components'
import { Icon } from '../../ui/Icon'
import { formatRange, hoursLabel } from '../shared/format'
import { waitingSentence } from '../shared/journey'
import { RequestDetail } from './RequestDetail'
import './records.css'

type Filter = 'all' | 'pending' | 'approved' | 'rejected' | 'closed'

const FILTERS: Record<Filter, LeaveStatus[] | null> = {
  all: null,
  pending: ['pending', 'cancel_pending'],
  approved: ['approved'],
  rejected: ['rejected'],
  closed: ['withdrawn', 'cancelled'],
}

const monthKey = (r: LeaveRequest) => r.start.slice(0, 7)
const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number)
  return `${y} 年 ${m} 月`
}

export function RecordsPage() {
  const me = useUser()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<LeaveRequest | null>(null)
  const data = useAsync(
    async () => {
      const [mine, types, employees] = await Promise.all([listMyRequests(me.id), listLeaveTypes(), listEmployees()])
      return { mine, types, employees }
    },
    [me.id],
  )

  const all = data.data?.mine ?? []
  const count = (f: Filter) => (FILTERS[f] ? all.filter((r) => FILTERS[f]!.includes(r.status)).length : all.length)
  const shown = FILTERS[filter] ? all.filter((r) => FILTERS[filter]!.includes(r.status)) : all
  const months = [...new Set(shown.map(monthKey))]
  const typeName = (id: string) => data.data?.types.find((t) => t.id === id)?.name ?? ''

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">我的紀錄</h1>
          <p className="page-sub">所有申請過的假單，點一下看進度或撤回</p>
        </div>
        <Button variant="tinted" icon="plus" className="only-desktop" onClick={() => navigate('/apply')}>
          申請請假
        </Button>
      </header>

      <div className="records__filter">
        <Segmented<Filter>
          label="篩選"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: '全部', count: count('all') },
            { value: 'pending', label: '審核中', count: count('pending') },
            { value: 'approved', label: '已核准', count: count('approved') },
            { value: 'rejected', label: '已退回', count: count('rejected') },
            { value: 'closed', label: '已撤回/撤銷', count: count('closed') },
          ]}
        />
      </div>

      {!data.data ? (
        <div className="group" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="row">
              <Skeleton h={44} />
            </div>
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="group">
          <Empty icon="list" title={filter === 'all' ? '還沒有任何假單' : '這個分類目前沒有假單'}>
            {filter === 'all' ? '申請第一張假單後，就會出現在這裡。' : '換個分類看看。'}
          </Empty>
        </div>
      ) : (
        <ul aria-label="假單" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {months.map((m) => (
            <li key={m}>
              <h2 className="rec__year">{monthLabel(m)}</h2>
              <ul className="group" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {shown
                  .filter((r) => monthKey(r) === m)
                  .map((r) => (
                    <li key={r.id} style={{ display: 'contents' }}>
                      <button type="button" className="row rec" onClick={() => setOpen(r)}>
                        <span className="row__main rec__main">
                          <span className="rec__title">
                            <span className="row__title">{typeName(r.typeId)}</span>
                            <span className="rec__hours num">{hoursLabel(r.hours)}</span>
                            <StatusPill status={r.status} />
                          </span>
                          <span className="row__sub">{formatRange(r.start, r.end)}</span>
                          <span className="row__sub">{waitingSentence(r, data.data!.employees)}</span>
                        </span>
                        <Icon name="chevronRight" size={18} className="row__chev" />
                      </button>
                    </li>
                  ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {open && <RequestDetail request={open} onClose={() => setOpen(null)} />}
    </>
  )
}
