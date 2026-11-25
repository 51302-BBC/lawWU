---
version: 1
slug: "frontend-src"
primary_target: "frontend/src"
related_targets: []
---

# Surface: 請假 app (frontend/src)

Mode: Operate. Build path: code-led (Operate surface).

Audience & job: firm staff at office desktops (some older) file leave in under a minute and always know who it waits on; supervisors clear an approval queue with full context (deputy, team overlap, busy season).
Constraints: Traditional Chinese, conversational copy; body ≥16px; AA contrast on all text; keyboard-operable sheets; light/dark follow system; reduced motion AND reduced transparency honored.

History: v1 (tag v1-classic) used the 2018-era iOS idiom (flat gray grouped lists, opaque sidebar). User asked for a version based on the current iPhone / Mac design (Liquid Glass, iOS 26–27 / macOS 26–27).

## Direction contract

THESIS: Leave as a journey, not a form — now on a Liquid Glass layer. Navigation and actions float as glass above solid, legible content, so the task is always in front and the chrome never competes. Refuses both the ERP status table and the 2018 flat-gray grouped-list look.

OWN-WORLD: iOS 27 / macOS 27 system idiom. Window ground #f2f2f7 with faint ambient color blooms (blue/teal/lilac at ≤10%) that the glass refracts; dark #000 with deep indigo blooms. Floating glass chrome: translucent white 60% (dark #1c1c1e 55%), 24px blur + saturate 180%, 0.5px light rim, inset specular top highlight. Content surfaces are solid white (#fff / dark #1c1c1e) with 26px concentric radii. iOS 26 system colors as fills: blue #0088ff, green #34c759, orange #ff8d28, red #ff383c, purple #cb30e0; text-safe darker shades for colored text. Capsule everything that is a control.

STORY: The employee lands in a window whose sidebar floats as a glass pane; sees remaining 特休 hours as a big number and each in-flight request's journey; presses the glass-prominent 申請請假 capsule, a floating glass sheet rises with rounded corners on all sides; type, time and deputy update hours, balance and approval path live; submits and sees the journey begin. A supervisor sees a badge on the glass sidebar, opens 待審核, reads each request with deputy and overlap context, approves in one click or returns with a reason.

FIRST VIEWPORT: Desktop: floating glass sidebar inset 10px from the window edges (radius 26px, 248px wide): app name, nav capsules 總覽/我的紀錄/行事曆, 審核 section for approvers with count badge, user chip at the bottom. Content: large title greeting「午安，佳穎」+ date; glass-prominent 申請請假 capsule top-right of the title row; balance strip as one solid 26px-radius surface (特休 large, 事假, 病假, 全部假別); below, 「進行中的假單」 surface where each row carries the journey line. Mobile: floating glass tab-bar capsule inset 16px from the bottom with a separate round glass "+" button beside it for 申請請假; avatar as a small glass circle top-right.

FORM: pinned direction (user: 「參考現在 iphone / MAC 的設計再出一版」 = Liquid Glass), Operate mode with standard web controls. Signature move: the liquid selection — the selected capsule (nav item, segmented thumb) is a raised glass lens that slides between options; plus the Journey line restyled as avatars on a glass rail. seed: none (pinned) — 「參考現在 iphone / MAC 的設計再出一版」

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
