---
version: 1
slug: "frontend-src"
primary_target: "frontend/src"
related_targets: []
---

# Surface: 請假 app (frontend/src)

Mode: Operate. Build path: code-led (Operate surface).

Audience & job: firm staff at office desktops (some older) file leave in under a minute and always know who it waits on; supervisors clear an approval queue with full context (deputy, team overlap, busy season).
Constraints: Traditional Chinese, conversational copy; body ≥16px; AA contrast on all text; keyboard-operable sheets; reduced motion honored (the login demo shows its poster).

History: v1 (tag v1-classic) = 2018-era iOS idiom. v2 (branch design/liquid-glass, saved as stash "v2 liquid-glass working state") = Liquid Glass. v3 (branch design/spacex): the user asked for a version after SpaceX's web design, built with the stageshow skill (benji.org/stageshow) as the guide.

## Direction contract

THESIS: Leave as a flight manifest. Every request is a mission with waypoints (you → 林主管 → 王經理); the app reads like mission control — black, quiet, exact — so the one thing in motion (a request moving toward approval) is the only thing that glows. Refuses both the ERP status table and Apple's soft glass.

OWN-WORLD: SpaceX web idiom, borrowed as a visual language only (no logo, no name, no imagery). Pure black ground; white type; Bahnschrift / D-DIN-style condensed sans; Latin labels in uppercase with wide tracking, Chinese labels tracked 0.06–0.14em; square corners everywhere; hairline rules instead of cards; outlined rectangular buttons whose fill rises on hover, solid white for the main action; huge numerals over tracked small labels (mission stats); full-height panels that slide in from the right. White is the only accent; color is reserved for request state (green approved, amber pending, red returned, violet cancel), each as a small square marker.

STORY: The employee signs in beside a hero that shows the product working (a stageshow faux-UI loop: a request lands in 我的紀錄 and turns from 審核中 to 已核准). Lands on 總覽: a mission title greeting, remaining hours as giant numerals in a ruled stat strip, in-flight requests with their waypoint journey. 申請請假 opens a full-height panel from the right; submits and sees the journey begin. A supervisor sees a red count in the top bar, opens 待審核, approves in one click or returns with a reason.

FIRST VIEWPORT: Desktop: transparent top bar over black (turns solid on scroll): wordmark 事務所 | LEAVE, tracked nav 總覽 / 我的紀錄 / 行事曆 | 待審核 (count) / 團隊概況 with one white underline that travels to the active item, user chip right. Content: uppercase-tracked mission title, white 申請請假 button, ruled stat strip with 64px numerals. Mobile: wordmark + avatar + menu button; the nav opens as a full-height panel from the right with numbered items 01–05 and the apply button.

FORM: pinned direction (user: 「請用這份指南/skill 重新照 spaceX 的 design 設計一份新版本」). Signature moves: the waypoint journey (square monograms on a dashed path, corner brackets acquiring the current stop) and the login hero built with stageshow. seed: none (pinned) — 「請用這份指南/skill 重新照 spaceX 的 design 設計一份新版本」

FINISH: unreviewed and undocumented is unfinished; this build ends with the film gate (stageshow), the verdict, DESIGN.md, and REHEARSAL.md beside the demo.
