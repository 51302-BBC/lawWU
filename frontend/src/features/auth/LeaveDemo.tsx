import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Badge, Bar, Collapse, Spinner, Stage, Window, type Act } from '../../stageshow/kit'
import './leave-demo.css'

// The login page's hero: a leave request lands at the top of 我的紀錄 and is
// approved. Built from stageshow's `dark-hero` gold (a dark desktop hero, a
// system story with no cursor).
//
// Beats: the new request opens at the top and pushes the list down, its
// status 審核中 with a spinner, waiting on 林主管; the pill turns to 已核准 on
// the same pill and the waypoint fills green. After a 2s hold the new row
// closes the way it opened and resets while closed.
//
// Real strings: the wordmark, the page title, the new request (type, date,
// hours, approver, status) and the one older request it lands above. The
// rest is placeholder at real line heights.

type S = { open: boolean; approved: boolean }

const initial: S = { open: false, approved: false }
const poster: S = { open: true, approved: true }

async function script(a: Act<S>) {
  await a.wait(900)
  a.mark('submit')
  a.put({ open: true })
  await a.wait(2600)
  a.mark('approve')
  a.put({ approved: true })
  await a.wait(2400)
  // What the loop added leaves in one motion; its status goes back unseen.
  a.put({ open: false })
  await a.wait(700)
  await a.snap({ approved: false })
}

const FILLER = [
  [150, 96],
  [124, 112],
  [168, 84],
]

export function LeaveDemo() {
  return (
    <Stage<S>
      width={760}
      height={460}
      theme="dark"
      initial={initial}
      poster={poster}
      script={script}
      className="ld"
      fill
      tokens={{ '--ss-font': 'var(--font)', '--ss-accent': '#ffffff' }}
    >
      {(s) => (
        <Window url="leave.firm.local/records" className="ld-win">
          <div className="ld-app">
            <div className="ld-top">
              <span className="ld-brand">
                事務所
                <i />
                LEAVE
              </span>
              <span className="ld-nav">
                <Bar w={34} h={6} tone={2} />
                <span className="ld-nav__on">
                  <Bar w={50} h={6} tone={4} />
                </span>
                <Bar w={40} h={6} tone={2} />
              </span>
              <Bar w={22} h={22} r={0} tone={2} />
            </div>

            <div className="ld-body">
              <div className="ld-title">我的紀錄</div>
              <div className="ld-list">
                <Collapse open={s.open} reveal="drop">
                  <Row
                    lead
                    day="3"
                    month="12月"
                    title="特休"
                    meta={
                      <>
                        <span>星期三・全天</span>
                        <span className="ld-hours">8 小時</span>
                      </>
                    }
                    waypoint={<Waypoint approved={s.approved} />}
                    status={
                      <Badge tone={s.approved ? 'success' : 'warning'} className="ld-badge" icon={<Mark approved={s.approved} />}>
                        <Label approved={s.approved} />
                      </Badge>
                    }
                  />
                </Collapse>
                <Row
                  day="18"
                  month="11月"
                  title="病假"
                  meta={
                    <>
                      <span>星期二・上午</span>
                      <span className="ld-hours">3 小時</span>
                    </>
                  }
                  status={
                    <Badge tone="neutral" className="ld-badge ld-badge--old" icon={<Mark approved />}>
                      已核准
                    </Badge>
                  }
                />
                {FILLER.map(([a, b], i) => (
                  <div key={i} className="ld-row ld-row--filler">
                    <Bar w={44} h={44} r={0} tone={1} />
                    <span className="ld-lines">
                      <Bar w={a} h={8} tone={2} />
                      <Bar w={b} h={7} tone={1} />
                    </span>
                    <span />
                    <Bar w={64} h={22} r={0} tone={1} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Window>
      )}
    </Stage>
  )
}

// The approver waypoint: a square monogram whose corner brackets hold while
// it waits, and which fills green once 林主管 approves.
function Waypoint({ approved }: { approved: boolean }) {
  return (
    <span className="ld-way" data-on={approved || undefined}>
      <span className="ld-way__box">林</span>
      <span className="ld-way__name">林主管</span>
    </span>
  )
}

// The status mark: spinner and dot share one 8px cell and crossfade, so the
// word beside it never moves.
function Mark({ approved }: { approved: boolean }) {
  return (
    <span className="ld-mark" data-on={approved || undefined}>
      <Spinner size={8} />
      <i className="ld-dot" />
    </span>
  )
}

// The status word. Both words are three characters, so the pill keeps its
// width; the old word fades before the new one arrives in the same cell.
function Label({ approved }: { approved: boolean }) {
  const words = useRef<HTMLSpanElement[]>([])
  const [w, setW] = useState<number>()
  useLayoutEffect(() => setW(Math.max(...words.current.map((e) => e.offsetWidth))), [])
  return (
    <span className="ld-label" style={w ? { width: w } : undefined}>
      {['審核中', '已核准'].map((t, i) => (
        <span
          key={t}
          ref={(e) => {
            if (e) words.current[i] = e
          }}
          className="ld-word"
          data-on={(i === 1) === approved || undefined}
        >
          {t}
        </span>
      ))}
    </span>
  )
}

function Row({ lead, day, month, title, meta, status, waypoint }: {
  lead?: boolean
  day: string
  month: string
  title: string
  meta: ReactNode
  status: ReactNode
  waypoint?: ReactNode
}) {
  return (
    <div className="ld-row" data-lead={lead || undefined}>
      <span className="ld-date">
        <span className="ld-date__m">{month}</span>
        <span className="ld-date__d">{day}</span>
      </span>
      <span className="ld-lines">
        <span className="ld-msg">{title}</span>
        <span className="ld-meta">{meta}</span>
      </span>
      {waypoint ?? <span />}
      {status}
    </div>
  )
}
