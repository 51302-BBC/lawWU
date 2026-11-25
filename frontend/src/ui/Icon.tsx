/** Authored line icons in one stroke weight (square caps to match the v3 idiom). */
const paths = {
  house: 'M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z',
  list: 'M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01',
  calendar: 'M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v10a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5zM4 10h16M8.5 3v4M15.5 3v4',
  tray: 'M4 13.5 6.2 6.2A1.8 1.8 0 0 1 7.9 5h8.2a1.8 1.8 0 0 1 1.7 1.2L20 13.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 13.5h4.5a3.5 3.5 0 0 0 7 0H20',
  people: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.8c1.7.7 2.8 2.5 3 5.2',
  plus: 'M12 5v14M5 12h14',
  close: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
  chevronRight: 'M9.5 5.5 16 12l-6.5 6.5',
  chevronLeft: 'M14.5 5.5 8 12l6.5 6.5',
  chevronDown: 'M5.5 9.5 12 16l6.5-6.5',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  logout: 'M14 4.5h3.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H14M10 16l4-4-4-4M14 12H4',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V12l3 2',
  warning: 'M12 4.5 21 19.5H3zM12 10v4.5M12 17h.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.5M12 7.8h.01',
  refresh: 'M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4',
  paperclip: 'M19 11.5l-6.8 6.8a4.5 4.5 0 0 1-6.4-6.4l7.4-7.4a3 3 0 0 1 4.3 4.3l-7.3 7.3a1.5 1.5 0 0 1-2.1-2.1l6.6-6.6',
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c.8-3.8 3.8-6 7.5-6s6.7 2.2 7.5 6',
  undo: 'M9 14 4.5 9.5 9 5M4.5 9.5H14a5.5 5.5 0 0 1 0 11h-3',
  menu: 'M4 8h16M4 16h16',
} as const

export type IconName = keyof typeof paths

export function Icon({ name, size = 20, strokeWidth = 1.75, className }: {
  name: IconName
  size?: number
  strokeWidth?: number
  className?: string
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  )
}
