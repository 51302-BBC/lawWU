---
version: 1
slug: "frontend-src"
primary_target: "frontend/src"
related_targets: []
---

# Surface: 請假 app (frontend/src)

Mode: Operate. Build path: code-led (Operate surface).

Audience & job: firm staff at office desktops (some older) file leave in under a minute and always know who it waits on; supervisors clear an approval queue with full context (deputy, team overlap, busy season).
Constraints: Traditional Chinese, conversational copy; body ≥16px; AA contrast; keyboard-operable sheets; light/dark follow system; reduced motion.

## Direction contract

THESIS: Leave as a journey, not a form. Every request is shown as the path it travels — you → 林主管 → 王經理 — with the current stop alive, so "who is it waiting on?" is never a question. Refuses the ERP default of a status column in a dense table.

OWN-WORLD: macOS/iOS system idiom. Grouped background #f5f5f7 (dark #000/#1c1c1e), white inset-grouped lists with hairline separators, translucent sidebar with vibrancy, system font stack (SF / PingFang TC), accent #0066cc (text-safe Apple blue), semantic green #248a3d / orange #c93400 / red #d70015 as tinted pills. Large-title headers (34px bold), 17px body, 12–14px radii, soft offset shadows only on floating sheets.

STORY: The employee lands, sees remaining 特休 hours in words and each in-flight request's journey; taps 申請請假, a sheet rises, picks a type, time and deputy while the hours, remaining balance and approval path update live; submits and sees the journey begin. A supervisor sees a badge, opens 待審核, reads each request with deputy and overlap context, approves in one click or returns with a reason.

FIRST VIEWPORT: Desktop: 240px translucent sidebar (app name, nav: 總覽/我的紀錄/行事曆, then 審核 section for approvers with count badge; user menu at bottom). Content: large title greeting「午安，佳穎」+ date; primary 申請請假 button top-right of title row; row of leave-balance tiles as one grouped strip (特休 large, 事假, 病假, others behind 全部假別); below, 「進行中」 grouped list where each row carries the journey line. Mobile: bottom tab bar, same content stacked.

FORM: pinned direction (Apple-style humane UI), Operate mode with standard web controls. Signature move: the Journey line — a horizontal track of named avatars with connecting rail, the active stop pulsing softly, reused in apply-sheet preview, dashboard rows, record detail and approval cards. seed: none (pinned) — 「有 apple 風格的人性化 UI/UX 設計」

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
