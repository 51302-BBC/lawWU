---
name: 事務所請假
description: Humane, Apple-idiom leave management for a small accounting firm
colors:
  accent: "#0066cc"
  accent-fill: "#0066cc"
  accent-dark: "#3d9bff"
  accent-fill-dark: "#0068d6"
  grouped-bg: "#f5f5f7"
  grouped-bg-dark: "#000000"
  elevated: "#ffffff"
  elevated-dark: "#1c1c1e"
  label: "#1d1d1f"
  label-secondary: "#4a4a4f"
  label-tertiary: "#6e6e73"
  label-quaternary: "#8e8e93"
  approved-green: "#1f7a35"
  pending-orange: "#b34700"
  returned-red: "#c4001a"
  red-fill: "#d70015"
  cancel-purple: "#8944ab"
typography:
  large-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  title2:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang TC', 'Noto Sans TC', sans-serif"
    fontSize: "22px"
    fontWeight: 700
    letterSpacing: "-0.02em"
  title3:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang TC', 'Noto Sans TC', sans-serif"
    fontSize: "20px"
    fontWeight: 700
    letterSpacing: "-0.02em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.47
    letterSpacing: "-0.01em"
  callout:
    fontSize: "16px"
  subhead:
    fontSize: "15px"
  footnote:
    fontSize: "13px"
    fontWeight: 600
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "22px"
  pill: "980px"
spacing:
  row-x: "16px"
  row-min: "56px"
  section: "36px"
  page-x: "24px–56px"
components:
  button-primary:
    backgroundColor: "{colors.accent-fill}"
    textColor: "{colors.elevated}"
    rounded: "{rounded.pill}"
    height: "40px"
    padding: "0 16px"
  button-primary-lg:
    backgroundColor: "{colors.accent-fill}"
    textColor: "{colors.elevated}"
    rounded: "{rounded.pill}"
    height: "50px"
    padding: "0 24px"
  grouped-list:
    backgroundColor: "{colors.elevated}"
    rounded: "{rounded.md}"
  input:
    backgroundColor: "{colors.elevated}"
    rounded: "{rounded.md}"
    height: "48px"
    padding: "10px 14px"
  status-pill:
    rounded: "{rounded.pill}"
    height: "26px"
    padding: "0 10px"
---

# Design System: 事務所請假

## Overview

**Creative North Star: "The Itinerary"**

Every leave request is a trip with stops: you → 林主管 → 王經理. The system's job is to make "who is it waiting on, and what happens next" impossible to miss, the way a parcel tracker or a boarding pass does. Everything else is borrowed from the macOS / iOS system idiom so nobody has to learn the tool: grouped inset lists on a soft gray ground, a translucent sidebar, pill buttons, large titles, one blue.

Density is calm, not sparse: rows are 56px tall, body text is 17px, and the type is large enough for the firm's older users at office desktops. Color is restrained to one accent plus a small semantic vocabulary for request state. Light and dark follow the system.

**Key Characteristics:**
- System font stack (SF / PingFang TC / Noto Sans TC), large bold titles, 17px body.
- Inset grouped lists on #f5f5f7, white surfaces, 0.5px hairline separators.
- One accent blue for actions and selection; green / orange / red / purple only for request state.
- The Journey line — avatars on a rail with the current stop pulsing — wherever a request appears.
- Sheets rise from the bottom (mobile) or float centered (desktop); confirms are inline, not nested modals.

## Colors

Restrained: neutral system grays with one accent and a state vocabulary.

### Primary
- **Firm Blue** (#0066cc; dark #3d9bff text / #0068d6 fill): primary buttons, links, selected leave type, focus rings, nav icons, "你的假" in the calendar. Button fills use the darker fill token so white text stays ≥4.5:1 in dark mode.

### Neutral
- **Grouped Gray** (#f5f5f7; dark #000000): page ground.
- **Card White** (#ffffff; dark #1c1c1e): grouped lists, sheets' inner surfaces, inputs.
- **Label** (#1d1d1f), **Secondary** (#4a4a4f), **Tertiary** (#6e6e73), **Quaternary** (#8e8e93): text hierarchy; quaternary only for disabled, weekends and placeholders.
- **Separator** (rgba(60,60,67,0.16)): 0.5px hairlines between rows, inset 16px (62px for avatar rows).

### State
- **Approved Green** (#1f7a35): 已核准 pill, completed journey stops and rail.
- **Pending Orange** (#b34700): 審核中 pill, the pulsing current stop, busy-season notices.
- **Returned Red** (#c4001a; solid fill #d70015): 已退回, errors, holidays, today marker, nav badges.
- **Cancel Purple** (#8944ab): 撤銷審核中 and cancel-request cards.

### Named Rules
**The State Owns Color Rule.** Green, orange, red and purple mean request state and nothing else. Never use them for decoration or categories.
**The Solid Red Rule.** White text sits on `--red-fill` (#d70015), never on the tint-friendly `--red`, which is too light in dark mode.

## Typography

**Display / Body Font:** the platform system stack (SF Pro / PingFang TC / Noto Sans TC / Microsoft JhengHei).
**Character:** one family, hierarchy by size and weight only — the way the OS does it.

### Hierarchy
- **Large Title** (700, 34px, 1.15, -0.025em): page titles and the greeting. 30px on mobile.
- **Hero Numbers** (700, 40px / 28px): remaining hours on the dashboard and the apply-sheet tally, tabular numerals.
- **Title 2/3** (700, 22px / 20px): section headers, card types, calendar month.
- **Headline** (600, 17px): row titles, sheet titles.
- **Body** (400, 17px, 1.47): default text.
- **Subhead / Footnote** (15px / 13px): secondary lines, field labels (600), legends.

### Named Rules
**The Hours Are Words Rule.** Quantities are always written with their unit in plain language — 「24 小時」「等於 3 天」 — never a bare number.

## Layout

Desktop: fixed 248px translucent sidebar; content column centered in the remaining width, max ~1080px, 40px top padding. Sections are 36px apart; a section header sits 8px above its grouped list. Below 760px the sidebar becomes a bottom tab bar (52px items, labels 11px), the user avatar moves to the top-right, and multi-column strips stack. Calendar: 7-column grid with a 300px day panel (stacks under 1100px).

## Elevation & Depth

Mostly tonal: surfaces separate by white-on-gray, not by shadows. Resting surfaces carry a barely-there raise; only floating things (sheets, menus, toasts) get a real shadow.

### Shadow Vocabulary
- **Raise** (`0 1px 2px rgba(0,0,0,.05), 0 2px 8px -2px rgba(0,0,0,.06)`): grouped lists, inputs, type tiles.
- **Float** (`0 12px 40px -8px rgba(0,0,0,.22), 0 2px 8px rgba(0,0,0,.06)`): sheets, user menu, toasts.

Translucency (`backdrop-filter: saturate(180%) blur(20–30px)`) is used only on chrome that content scrolls under: sidebar/tab bar, sheet bars and footers, menus, toasts.

## Shapes

Continuous rounded rectangles: 12px for lists and inputs, 16px+ for larger panels, 22px for sheets, full pills for buttons, chips and status. Avatars are circles with two-character given names.

## Components

### Buttons
- **Shape:** full pill (980px). Heights 40px, large 50px.
- **Primary:** Firm Blue fill, white text. **Tinted:** blue at 10% with blue text. **Gray:** fill-gray for secondary actions. **Plain:** text-only blue (sheet bar 取消/完成). **Danger / Danger-solid:** red tint for 撤回申請, solid red fill to confirm.
- **States:** hover darkens; press scales to 0.97; disabled 40% opacity; loading swaps the icon for a spinner.

### Grouped list rows
- White group, 12px radius, rows ≥56px, 16px side padding, hairline separators inset; whole row is the button with a trailing chevron.

### Status pill
- 26px pill with a 6px dot in currentColor on a 12–16% tint of the state color.

### Inputs
- White, 12px radius, 48px tall, Raise shadow; focus shows a blue border plus a 4px blue tint ring.

### Sheet
- Bottom sheet on mobile, centered floating panel ≥760px. Top bar: leading 取消/完成, centered title, translucent. Optional sticky footer for the primary action. Esc and backdrop close; focus is trapped and restored.

### Navigation
- Sidebar items 42px, accent-colored icons, active item on a gray fill; approver-only 審核 section with a red count badge. Mobile tab bar with the same items.

### Journey (signature)
- Ordered list of stops: avatar circle (34–44px), name, short note. Done stops get a green check badge and a green rail behind them; the current stop has an orange ring pulsing outward (2.2s); rejected stops get a red ✕ badge; future stops are desaturated. The viewer is always labeled 「你」. Used on the dashboard, record detail, apply preview and approval cards.

## Do's and Don'ts

### Do:
- **Do** show the Journey anywhere a request appears, and say in words who it is waiting on (「等林主管審核」).
- **Do** show consequences before commitment: hours, remaining balance after, and the approval path live in the apply sheet.
- **Do** warn inline with tinted notices (orange for advisories, red for blocks) and keep the submit button honest (disabled when blocked).
- **Do** keep body text ≥16px and controls ≥40px tall.

### Don't:
- **Don't** use rings or sparklines for balances; use the horizontal meter (blue used, striped orange pending).
- **Don't** open a modal on top of a sheet; confirm inline.
- **Don't** put white text on the light `--red` or `--accent` text tokens in dark mode; use the fill tokens.
- **Don't** add a second accent color.
