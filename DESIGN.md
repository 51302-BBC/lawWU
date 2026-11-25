---
name: 事務所請假
description: Leave management for a small accounting firm in a mission-control idiom after SpaceX's web design (v3, branch design/spacex)
colors:
  ground: "#000000"
  surface: "#0a0a0b"
  inset: "#121214"
  label: "#ffffff"
  label-secondary: "rgba(255,255,255,0.82)"
  label-tertiary: "rgba(255,255,255,0.64)"
  label-quaternary: "rgba(255,255,255,0.5)"
  rule: "rgba(255,255,255,0.28)"
  separator: "rgba(255,255,255,0.16)"
  accent: "#ffffff"
  on-accent: "#000000"
  green: "#3ddc84"
  orange: "#ffa31a"
  red: "#ff4d42"
  red-fill: "#d92d20"
  purple: "#b98cff"
typography:
  display:
    fontFamily: "'D-DIN', 'Bahnschrift', 'DIN Alternate', 'Barlow', 'Helvetica Neue', Arial, 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif"
    fontWeight: 700
    letterSpacing: "0.06em"
    textTransform: "uppercase"
  stat-number:
    fontSize: "64px"
    fontWeight: 700
    lineHeight: 1
  caps-label:
    fontSize: "13px"
    fontWeight: 700
    letterSpacing: "0.14em"
    textTransform: "uppercase"
  body:
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  all: "0px"
spacing:
  bar-height: "84px (68px solid)"
  content-max: "1160px"
  section: "64px"
  row-min: "64px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.all}"
    height: "44px / 54px"
  button-outline:
    border: "2px solid currentColor"
    hover: "white fill rises from the bottom edge, text turns black"
  status:
    border: "1px solid currentColor"
    marker: "7px square in the state color"
  sheet:
    placement: "full-height panel from the right, 660px max"
---

# Design System: 事務所請假 (v3)

## Overview

**Creative North Star: "Flight Manifest"**

Every leave request is a mission with waypoints: you → 林主管 → 王經理. v3 borrows SpaceX's web language — black ground, white type, tracked capitals, square edges, hairline rules — as a visual idiom only: no logo, no company name, no imagery. Mission control is quiet so the one thing in motion, a request moving toward approval, is the only thing lit.

Earlier versions: v1 `v1-classic` tag (2018 iOS); v2 Liquid Glass (branch `design/liquid-glass`, saved as the stash entry "v2 liquid-glass working state").

**Key characteristics**
- Black ground, no cards: content is separated by hairline rules and space.
- White is the only accent. Color appears only as request state, as a small square marker plus words.
- Square corners on everything. Buttons are outlined rectangles whose white fill rises on hover; the main action is solid white.
- Numbers are the heroes: remaining hours at 64px over small tracked labels.
- Chrome is a top bar (transparent over the page, solid on scroll) and full-height right panels.

## Colors

- **Ground** #000, **Surface** #0a0a0b (panels), **Inset** #121214 (callouts, fact cells). Depth on black comes from these steps and rules, never shadow.
- **Text** white and three steps (82%, 64%, 50%); every step is ≥4.5:1 on black.
- **Rules** 28% white for structure (page header, list tops), 16% for separators between rows.
- **State** green #3ddc84 approved · amber #ffa31a pending (its marker blinks slowly) · red #ff4d42 returned / today / badges · violet #b98cff cancel requests.

**The One Light Rule.** White is the accent. A second accent color is never added; state colors mean state only.

## Typography

One family: Bahnschrift (Windows' built-in DIN) / D-DIN / DIN Alternate, falling back to the system CJK fonts. Hierarchy comes from size, weight and tracking.
- Page titles 40px (30px mobile), 700, tracked 0.06em, uppercase for Latin.
- Stat numerals 64px / 40px, 700.
- Caps labels 13px, 700, tracked 0.14em: section titles, field labels, nav, buttons.
- Body 17px; secondary 15px.

**The Hours Are Words Rule.** Quantities always carry their unit: 「120 小時」「等於 15 天」.

## Layout

Top bar 84px (68px once scrolled), padding 40px. Content max 1160px, starting 140px from the top. Sections 64px apart. The page header carries a 28% rule under it that doubles as the stat strip's top rule. Below 960px the nav becomes a full-height panel from the right with numbered items (01–05) and the apply button.

## Components

- **Buttons:** square; outline with a rising white fill on hover (320ms, `cubic-bezier(.45,0,.1,1)`); primary solid white with black text; plain buttons underline on hover.
- **Nav:** tracked caps; one white underline travels to the active item (520ms).
- **Segmented:** tabs on a rule; a 2px white underline slides to the selected tab.
- **Status:** 1px outlined box, tracked caps, a 7px square marker.
- **Journey (signature):** square monograms on a dashed path; completed legs turn solid green; the current stop is held by amber corner brackets that breathe; the viewer is 「你」.
- **Sheet:** a full-height panel sliding in from the right, ruled header and footer.
- **Login hero (stageshow):** `features/auth/LeaveDemo.tsx`, built from the skill's `dark-hero` gold: a request lands in 我的紀錄 and turns 審核中 → 已核准 on the same pill, its approver waypoint fills green; 2s hold; the row closes and resets unseen. The poster (shown under reduced motion) is the approved frame. See `REHEARSAL.md` beside it.

## Do's and Don'ts

**Do**
- Keep content on the black ground with rules; use space, not boxes.
- Use tracked small caps for labels and huge numerals for the hours.
- Keep body text ≥16px and controls ≥44px tall.
- Show the journey wherever a request appears.

**Don't**
- Use SpaceX's name, logo, typeface files or photography. This is an idiom, not a copy.
- Round a corner or add a drop shadow.
- Use a second accent color or set long text in a state color.
- Animate without a cause: the only ambient motion is the pending marker and the current waypoint.
