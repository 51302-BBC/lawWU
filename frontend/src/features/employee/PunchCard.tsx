import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { clockIn, clockOut, getTodayPunch, listWeekPunches, weekStart } from '../../api/attendanceApi'
import { useAsync, useSession, useUser } from '../../app/session'
import {
  clockOf,
  durationLabel,
  HOLD_MS,
  minuteOfDay,
  phaseOf,
  SCHEDULE_END,
  SCHEDULE_START,
  signOff,
  workedMinutes,
  type Punch,
  type PunchPhase,
} from '../../domain/attendance'
import { toDateKey } from '../../domain/hours'
import { useToast } from '../../ui/components'
import { givenName } from '../shared/format'
import './punch.css'

// 上下班打卡, made a small ritual: you hold the button for a moment (so it
// is meant, never a stray tap), a seal stamps the day, and a line marks the
// day's span on the schedule. Leaving gets a thank-you, not a figure.

/** The current time, ticking every `ms`. */
function useNow(ms: number): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

const pad = (n: number) => String(n).padStart(2, '0')

/* ───────── Hold to punch ───────── */
export function HoldButton({ label, onDone, busy }: { label: string; onDone: () => void; busy?: boolean }) {
  const [holding, setHolding] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const hint = useId()

  const start = () => {
    if (timer.current || busy) return
    setHolding(true)
    timer.current = setTimeout(() => {
      timer.current = undefined
      setHolding(false)
      onDone()
    }, HOLD_MS)
  }
  const cancel = () => {
    if (!timer.current) return
    clearTimeout(timer.current)
    timer.current = undefined
    setHolding(false)
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  const isKey = (k: string) => k === ' ' || k === 'Enter'
  return (
    <div className="hold-wrap">
      <button
        type="button"
        className="hold"
        data-holding={holding || undefined}
        aria-describedby={hint}
        aria-busy={busy || undefined}
        style={{ '--hold-ms': `${HOLD_MS}ms` } as CSSProperties}
        onPointerDown={(e) => {
          if (e.button !== 0) return
          e.currentTarget.setPointerCapture?.(e.pointerId)
          start()
        }}
        onPointerUp={cancel}
        onPointerCancel={cancel}
        onKeyDown={(e) => {
          if (!isKey(e.key)) return
          e.preventDefault()
          if (!e.repeat) start()
        }}
        onKeyUp={(e) => isKey(e.key) && cancel()}
        onBlur={cancel}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span className="hold__fill" aria-hidden="true" />
        <span className="hold__label">{holding ? '繼續按住…' : label}</span>
      </button>
      <p id={hint} className="hold__hint">
        按住約 1 秒
      </p>
    </div>
  )
}

/* ───────── The day on the schedule ───────── */
const TRACK_FROM = 7 * 60
const TRACK_TO = 21 * 60
const pos = (min: number) => `${(Math.min(Math.max(min, TRACK_FROM), TRACK_TO) - TRACK_FROM) / (TRACK_TO - TRACK_FROM) * 100}%`

function DayTrack({ punch, now }: { punch: Punch | null; now: Date }) {
  const from = punch ? minuteOfDay(punch.in) : null
  const to = punch ? (punch.out ? minuteOfDay(punch.out) : minuteOfDay(now)) : null
  return (
    <div className="track" aria-hidden="true">
      <div className="track__rail">
        <span className="track__band" style={{ left: pos(SCHEDULE_START), right: `calc(100% - ${pos(SCHEDULE_END)})` }} />
        {from !== null && to !== null && (
          <span
            className="track__span"
            data-live={!punch?.out || undefined}
            style={{ left: pos(from), width: `calc(${pos(to)} - ${pos(from)})` }}
          />
        )}
        {from !== null && <span className="track__pin" style={{ left: pos(from) }} />}
        {punch?.out && <span className="track__pin" style={{ left: pos(minuteOfDay(punch.out)) }} />}
        {punch && !punch.out && <span className="track__now" style={{ left: pos(minuteOfDay(now)) }} />}
      </div>
      <div className="track__ticks">
        {[9, 12, 13, 18].map((h) => (
          <span key={h} className={h === 12 || h === 13 ? 'track__minor' : undefined} style={{ left: pos(h * 60) }}>
            {pad(h)}:00
          </span>
        ))}
      </div>
    </div>
  )
}

/* ───────── This week ───────── */
const WEEKDAYS = ['一', '二', '三', '四', '五']

function WeekStrip({ punches, now }: { punches: Punch[]; now: Date }) {
  const mon = weekStart(now)
  const today = toDateKey(now)
  return (
    <ol className="week" aria-label="這週出勤">
      {WEEKDAYS.map((w, i) => {
        const day = new Date(mon)
        day.setDate(mon.getDate() + i)
        const key = toDateKey(day)
        const p = punches.find((x) => x.date === key)
        const state = p?.out ? 'done' : p ? 'working' : key === today ? 'today' : key < today ? 'missed' : 'ahead'
        const text = p ? (
          p.out ? (
            <>
              <span>{clockOf(p.in)}</span>
              <span className="week__to">{clockOf(p.out)}</span>
            </>
          ) : (
            `${clockOf(p.in)} 上班`
          )
        ) : state === 'today' ? '今天' : state === 'missed' ? '沒有紀錄' : ''
        return (
          <li key={key} className="week__day" data-state={state} aria-current={key === today ? 'date' : undefined}>
            <span className="week__mark" aria-hidden="true" />
            <span className="week__name">星期{w}</span>
            <span className="week__time num">{text}</span>
          </li>
        )
      })}
    </ol>
  )
}

/* ───────── The moment ───────── */
interface Moment {
  kind: 'in' | 'out'
  punch: Punch
}

function Ceremony({ moment, name, onDone }: { moment: Moment; name: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4200)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onDone()
    window.addEventListener('keydown', esc)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', esc)
    }
  }, [onDone])
  const { kind, punch } = moment
  const at = kind === 'in' ? punch.in : punch.out!
  return (
    <div className="ceremony" data-kind={kind} role="status" onClick={onDone}>
      <span className="seal" aria-hidden="true">
        <span>{kind === 'in' ? '上' : '下'}</span>
        <span>班</span>
      </span>
      <div className="ceremony__words">
        <p className="ceremony__title">{kind === 'in' ? `${name}，今天開始了` : `辛苦了，${name}`}</p>
        <p className="ceremony__line">
          {kind === 'in'
            ? `${clockOf(at)} 上班。一步一步來。`
            : `${clockOf(punch.in)}–${clockOf(at)}，今天工作 ${durationLabel(workedMinutes(punch))}。${signOff(new Date())}`}
        </p>
      </div>
    </div>
  )
}

/* ───────── Card ───────── */
const TITLE: Record<PunchPhase, string> = {
  before: '準備上班',
  working: '工作中',
  done: '今天辛苦了',
}

export function PunchCard() {
  const me = useUser()
  const { bump } = useSession()
  const toast = useToast()
  const now = useNow(1000)
  const [busy, setBusy] = useState(false)
  const [moment, setMoment] = useState<Moment | null>(null)
  // stable, so the ceremony's own timer isn't restarted by the clock's tick
  const endMoment = useCallback(() => setMoment(null), [])
  const data = useAsync(async () => {
    const [today, week] = await Promise.all([getTodayPunch(me.id), listWeekPunches(me.id)])
    return { today, week }
  }, [me.id])

  const punch = data.data?.today ?? null
  const phase = phaseOf(punch)

  const act = async () => {
    setBusy(true)
    try {
      const p = phase === 'before' ? await clockIn(me.id) : await clockOut(me.id)
      setMoment({ kind: phase === 'before' ? 'in' : 'out', punch: p })
      bump()
    } catch (e) {
      toast((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const sub =
    phase === 'before'
      ? `表定 ${pad(SCHEDULE_START / 60)}:00–${pad(SCHEDULE_END / 60)}:00`
      : phase === 'working'
        ? `${clockOf(punch!.in)} 上班・已工作 ${durationLabel(workedMinutes(punch!, now))}`
        : `${clockOf(punch!.in)} 上班・${clockOf(punch!.out!)} 下班・共 ${durationLabel(workedMinutes(punch!))}`

  return (
    <section className="punch" aria-label="上下班打卡" data-phase={phase} aria-busy={!data.data || undefined}>
      <div className="punch__head">
        <p className="punch__eyebrow">今日出勤</p>
        <h2 className="punch__title">{TITLE[phase]}</h2>
        <p className="punch__sub num">{data.data ? sub : ' '}</p>
      </div>

      <p className="punch__clock num" aria-hidden="true">
        {pad(now.getHours())}:{pad(now.getMinutes())}
        <small>{pad(now.getSeconds())}</small>
      </p>

      <div className="punch__act">
        {data.data &&
          (phase === 'done' ? (
            <p className="punch__bye">{signOff(now)}</p>
          ) : (
            <HoldButton label={phase === 'before' ? '按住上班' : '按住下班'} onDone={act} busy={busy} />
          ))}
      </div>

      <DayTrack punch={punch} now={now} />
      {data.data && <WeekStrip punches={data.data.week} now={now} />}

      {moment && <Ceremony moment={moment} name={givenName(me.name)} onDone={endMoment} />}
    </section>
  )
}
