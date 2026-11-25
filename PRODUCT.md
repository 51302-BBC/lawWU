# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React (Vite, TypeScript) frontend; Python FastAPI backend and PostgreSQL planned. Everything must ship in Docker. Current phase: frontend with a mock API layer whose function shapes match the future backend.

## Users

Staff of a small Taiwanese accounting firm (about 14 people: owner, one manager, two team supervisors, auditors and bookkeepers). They mostly sit at office desktops. Some users are older (e.g. the owner), so legibility and generous click targets matter.

- **Employees** apply for and cancel leave, check remaining hours per leave type, track where a request is in approval, see their history and the firm calendar (holidays, colleagues' approved leave).
- **Supervisors / manager** are employees too, plus they approve their reports' leave and see team leave and balances.

## Product Purpose

Replace paper/chat leave requests with a clear, humane internal tool that also produces records compliant with Taiwan's Labor Standards Act (hours-based leave, statutory leave types). Success: an employee files leave in under a minute and always knows who it is waiting on; a supervisor clears the queue with full context (deputy, team overlap, busy season).

## Positioning

Built around how an accounting firm actually works: client coverage by a named deputy, tax-season awareness, and statutory leave rules — not a generic HR suite.

## Operating Context

- Approval: ≤ 3 days (24 h) direct supervisor only; > 3 days adds the next level up.
- Every request names a deputy (notified, not an approver); the UI warns if the deputy is also away.
- Tax season (May) triggers a reminder, never a block.
- Withdraw while pending; cancelling approved, not-yet-started leave needs supervisor confirmation; started leave cannot be cancelled.
- Leave in hours, minimum 0.5 h; workday 09:00–18:00 with 12:00–13:00 lunch.
- Business trips are not 公假; they belong to the (future) outing form.

## Capabilities and Constraints

In scope now: login, employee dashboard, apply/withdraw/cancel, records, calendar, supervisor approvals, team overview. Out of scope now: admin settings and reports, owner view, outing/overtime forms, clock-in, expenses, tasks. Login is mock auth (shared demo password).

## Brand Commitments

No firm name, logo or brand color yet — use a neutral name ("事務所") as placeholder. User asked for an Apple-like, humane UI/UX. Interface language: Traditional Chinese, conversational.

## Evidence on Hand

Demo data only (`frontend/src/mock/`). No real employee data; do not fabricate firm names or real people.

## Product Principles

1. Always show who a request is waiting on and what happens next.
2. Show consequences before commitment (hours, remaining balance, approval path) — never surprise after submit.
3. Warn, don't block, where the law allows discretion; block only what rules forbid.
4. Legible for older eyes: comfortable type sizes, strong contrast, large targets.

## Accessibility & Inclusion

Older users on desktop: body text ≥ 16px, WCAG AA contrast, visible focus, keyboard-operable sheets and dialogs, reduced-motion support.
