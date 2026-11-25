---
name: 事務所請假
description: Leave management for a small accounting firm in the current Apple idiom (Liquid Glass, iOS 27 / macOS 27)
colors:
  accent-vivid: "#0088ff"
  accent: "#0066cc"
  accent-fill: "#0071e3"
  accent-dark-text: "#4da3ff"
  window-ground: "#f2f2f7"
  window-ground-dark: "#000000"
  surface: "#ffffff"
  surface-dark: "#1c1c1e"
  glass: "rgba(255, 255, 255, 0.62)"
  glass-dark: "rgba(40, 40, 44, 0.58)"
  label: "#1c1c1e"
  label-secondary: "#3c3c43"
  label-tertiary: "#636366"
  label-quaternary: "#8e8e93"
  green-vivid: "#34c759"
  green-text: "#1d7a34"
  orange-vivid: "#ff8d28"
  orange-text: "#b04a00"
  red-vivid: "#ff383c"
  red-text: "#c8001e"
  red-fill: "#d70015"
  purple-vivid: "#cb30e0"
  purple-text: "#8a2ea3"
typography:
  large-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif"
    fontSize: "34px"
    fontWeight: 750
    lineHeight: 1.12
    letterSpacing: "-0.03em"
  hero-number:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang TC', sans-serif"
    fontSize: "44px"
    fontWeight: 750
    letterSpacing: "-0.035em"
  title3:
    fontSize: "20px"
    fontWeight: 700
    letterSpacing: "-0.02em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.47
    letterSpacing: "-0.01em"
  subhead:
    fontSize: "15px"
  footnote:
    fontSize: "13px"
    fontWeight: 600
rounded:
  sm: "10px"
  md: "14px"
  lg: "20px"
  xl: "26px"
  window: "32px"
  capsule: "999px"
spacing:
  window-inset: "10px"
  row-x: "18px"
  row-min: "58px"
  section: "40px"
components:
  button-glass-prominent:
    backgroundColor: "{colors.accent-fill}"
    textColor: "{colors.surface}"
    rounded: "{rounded.capsule}"
    height: "40px"
    padding: "0 18px"
  button-glass:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.label}"
    rounded: "{rounded.capsule}"
    height: "40px"
  surface:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
  sidebar:
    backgroundColor: "{colors.glass}"
    rounded: "{rounded.xl}"
    width: "248px"
  sheet:
    rounded: "{rounded.window}"
  input:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    height: "50px"
    padding: "11px 16px"
  status-pill:
    rounded: "{rounded.capsule}"
    height: "26px"
---

# Design System: 事務所請假

## Overview

**Creative North Star: "Glass Over the Itinerary"**

Every leave request is a trip with stops: you → 林主管 → 王經理. v2 places that itinerary under a Liquid Glass layer, as iOS 27 and macOS 27 do: navigation and actions float as translucent glass above solid, legible content. The chrome refracts a faint ambient color field; the content never sits on glass, so the firm's older users read every number on a solid surface.

Restrained and current: one blue, the iOS 26 system colors reserved for request state, capsule controls, concentric corners (window 32 → surfaces 26 → fields 14), and one signature motion — the liquid lens that slides to whatever is selected.

**Key Characteristics:**
- Glass only on chrome: floating sidebar / tab bar, sheet, toolbar buttons, menus, toasts.
- Solid content surfaces with 26px corners, no hairline borders; widgets instead of a single grouped strip.
- Capsules for every control; the selected item is a raised lens that slides between options.
- iOS 26 system colors as vivid fills, with darker text-safe shades for any colored text.
- Reduce Transparency and Reduce Motion are honored: glass becomes solid, the lens stops gliding.

## Colors

Restrained: neutral ground and surfaces, one accent, a four-color state vocabulary.

### Primary
- **System Blue** (vivid #0088ff for marks and icons; #0066cc for text; #0071e3 for filled buttons so white text stays ≥4.5:1): primary actions, selection, focus, nav icons, used-hours meters.

### Neutral
- **Window Ground** (#f2f2f7 / dark #000): page ground, carrying faint blue / lilac / teal blooms (≤11% alpha) for the glass to refract.
- **Surface** (#ffffff / dark #1c1c1e): every content container.
- **Glass** (white 62% / dark #28282c 58%, blur 26px, saturate 190%): chrome only.
- **Label → Quaternary** (#1c1c1e, #3c3c43, #636366, #8e8e93): text hierarchy; quaternary never for readable text.

### State
- **Green** (#34c759 fill / #1d7a34 text): approved, completed journey stops.
- **Orange** (#ff8d28 fill / #b04a00 text): pending, the pulsing current stop, busy-season notices.
- **Red** (#ff383c fill / #c8001e text / #d70015 solid behind white): returned, errors, holidays, badges, today.
- **Purple** (#cb30e0 fill / #8a2ea3 text): cancel requests.

### Named Rules
**The Glass Is Chrome Rule.** Glass is for things that float above content (navigation, toolbars, sheets, menus, toasts). Content — balances, rows, cards, forms — always sits on a solid surface.
**The Two Shades Rule.** Each system color has a vivid shade for fills and dots and a darker shade for text. Never set text in the vivid shade.

## Typography

**Font:** the platform system stack (SF Pro / PingFang TC / Noto Sans TC / Microsoft JhengHei). One family; hierarchy by size and weight.

### Hierarchy
- **Large Title** (750, 34px, -0.03em): page titles and the greeting; 32px on mobile.
- **Hero Number** (750, 44px / 28px): remaining hours in widgets and the apply-sheet tally; tabular numerals.
- **Title 3** (700, 20px): section headers.
- **Headline / Body** (600 / 400, 17px): row titles / default text.
- **Subhead / Footnote** (15px / 13px 600): secondary lines, field labels.

### Named Rules
**The Hours Are Words Rule.** Quantities always carry their unit in plain words: 「24 小時」「等於 3 天」.

## Layout

Desktop: the sidebar floats 10px inside the window (248px wide, 26px radius); content is centered in the remaining width (max ~1080px), 44px from the top. Sections are 40px apart. Below 760px the sidebar becomes a floating glass tab-bar capsule 12px above the bottom edge, with a separate 64px round glass-prominent ＋ (申請請假) beside it; the avatar becomes a small glass circle top-right; header 申請 buttons hide (`.only-desktop`).

## Elevation & Depth

Two layers. Content surfaces rest with a barely-there raise (`0 1px 2px rgba(20,30,60,.04), 0 4px 16px -6px rgba(20,30,60,.08)`). The glass layer floats: specular top rim (`inset 0 1px 0 rgba(255,255,255,.95)`), 0.5px edge, and a soft cool shadow (`0 12px 32px -12px rgba(30,40,80,.22)`). Sheets and menus add the float shadow (`0 24px 60px -16px rgba(20,30,60,.3)`).

## Shapes

Concentric corners: window/sheet 32px → surfaces and widgets 26px → type tiles 20px → fields 14px → small chips 10px. Every control is a capsule. Avatars are circles with a soft top highlight.

## Components

### Buttons
- **Glass-prominent:** accent fill #0071e3, white text, inner specular rim, colored soft shadow. Main action per view.
- **Glass:** translucent glass with rim, for controls that sit on the glass layer (sheet 取消/完成, icon buttons).
- **Tinted / Gray / Plain / Danger:** secondary actions on solid surfaces.
- **States:** hover deepens; press scales to 0.96 on the lens curve; disabled 38%.

### Segmented control & navigation — the liquid lens
- Capsule track; the selected option is a raised white lens that slides (340–380ms, `cubic-bezier(.3,.9,.25,1)`) to the new option. The sidebar and tab bar use the same lens, tinted with System Blue.

### Surfaces and rows
- 26px solid surfaces; rows ≥58px with 18px padding and hairlines inset 18px (66px after an avatar).

### Sheet
- Floating glass panel with 32px corners on all sides, inset 8px from the screen on mobile, centered on desktop. Glass capsule bar buttons; the primary action lives in a floating glass footer capsule.

### Journey (signature)
- Avatars on a 5px capsule rail; completed segments glow green; the current stop has an orange ring pulsing outward; the viewer is labeled 「你」.

## Do's and Don'ts

### Do:
- **Do** keep glass to chrome and content on solid surfaces.
- **Do** use capsules for every control and concentric radii for nested containers.
- **Do** show the Journey wherever a request appears and say in words who it waits on.
- **Do** keep body text ≥16px and controls ≥40px tall.

### Don't:
- **Don't** put readable text directly on the ambient bloom or on glass without a solid backing behind long text.
- **Don't** set text in the vivid system colors; use the text shades.
- **Don't** return to flat gray grouped lists with hairline-bordered sidebars (that is v1, tag `v1-classic`).
- **Don't** add a second accent color.
