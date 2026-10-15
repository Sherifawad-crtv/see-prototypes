# SEE Padel — Training Session: PWA Test Build

Handoff to Claude Code. One file, four parts plus a live test script.

- **Part A** — Kickoff and rules
- **Part B** — Function spec (what the feature does)
- **Part C** — UI / HIG spec (how it looks and feels)
- **Part D** — Mock-data contract (typed data layer the frontend is built against)
- **Appendix** — Live test script (definition of done)

Read these before writing code. They ship with this brief in the `reference/` folder next to this file (copy it to the repo root as `./reference/`). `reference/brand/` (Obviously fonts, SEE logo) is **optional**; everything else is included:

| File | Use |
|---|---|
| `Training_Sessions_Design_Flow.pdf` | Original spec. Source of the flow and the shot library. |
| `Live_Session_Screen_inspo.pdf` | Coworker mockups: Live Session, Shot Cart, Add a Shot. Follow their structure; Part C owns the visual details. |
| `Container-1.png` | Shot placement dot map. **Use** as the style reference for the court and dots. |
| `Container.png` | Radar chart. **Do not build.** See decision D10. |
| `design-foundation/` (21 PNG sheets) | **Locked design foundation**: color palette, typography, spacing, grid, components. Part C is built on it. |
| `Frame 1707480085.png` | Heat map. **Do not build.** See decision D10. |

---

# PART A — Kickoff and rules

## A1. Goal
Build a mobile-first PWA so Sherif and his team can use the Training Session feature live on their phones and judge the flow before it goes to the dev team. The feature: a player builds a cart of shot drills, trains while the camera tracks, ends the session, and reviews results. Two modes per drill: **Free** and **Targeted**.

## A2. Stage and stack
- Pipeline step: Claude Code builds the locked design, **frontend only, against a typed mock data layer** (Part D). No Supabase or backend in this build.
- Going live later must be a one-file swap: only `src/services/index.ts` changes (mock → real implementations).
- Stack: Vite + React + TypeScript, plain CSS with design tokens, hand-built SVG for the court and bars. State is React context + reducer. **Ask Sherif before adding any other dependency**, including a chart library, UI kit or state library.
- Production-ready: typed, no dead code, no commented-out code.

## A3. Rules
1. **No placeholders or stubs.** Every screen and control in this brief works. Nothing outside this brief gets built: no auth, no home feed, no profile page beyond the Training screen defined here, no settings.
2. **One data pattern.** Every screen reads and writes through a single store (`useTraining()`) that talks to the service interfaces in Part D. No screen touches `localStorage` or the simulator directly.
3. **Do not change the spec.** If something conflicts or you think it should change, build exactly what this brief says and list it under "Side notes" in your final message.
4. **Locked decisions (B2) are final.** Do not re-ask them.
5. **Sherif is a UI/UX designer, not a coder.** Every message to him is plain language, no code, no jargon. Final message format is in A5.
6. **Deploy:** one repo, one deploy, one URL. Repo `see-training-session-pwa` on GitHub → Vercel. `main` is production, other branches get previews. If you need credentials or access you don't have, stop and tell Sherif exactly what you need.
7. **Design is locked.** Build only from the foundation in `./reference/design-foundation/` and Part C. Do not invent or restyle components. Fonts and logo: use the files in `./reference/brand` if present (see C2). If that folder is missing, **do not stop**: use the fallbacks in C2 and C8, and list them in your final message. Don't substitute silently.

## A4. Definition of done
- Every scenario in the Appendix passes, checked with Playwright screenshots at 360, 390 and 430 px width.
- Installable PWA (iOS Add to Home Screen and Android install), opens standalone, app shell loads offline.
- Live URL working on a real phone.

## A5. Final message to Sherif
1. The live URL and how to install it on his phone, in plain steps.
2. What he can try, in three lines.
3. A pass/fail table of the Appendix scenarios.
4. Side notes (deviations, questions, anything you noticed).

---

# PART B — Function spec

## B1. What the feature is
A structured practice mode. The player builds a cart of drills (shot type + amount, optionally a target), starts, trains while tracking runs, ends, and sees results. Past sessions stay viewable.

**Entry point:** a single **Training** screen that stands in for the Training section of the player profile. It has a primary **Start Training** button and the history list (B7). Nothing else.

## B2. Locked decisions

| # | Decision |
|---|---|
| D1 | **Mode is per drill.** Free or Targeted is chosen at the top of the Add a Shot screen (Tab component, default Free, remembers the last choice). A cart can mix both. |
| D2 | **One target per shot type** (across Targeted drills). Adding a shot type that already has a target in the cart reuses it and skips the court step. Changing a target changes it for every not-yet-run Targeted drill of that shot type. |
| D3 | **A target is one of 6 zones** on the opponent half of the court. A shot is a **hit** when it lands inside its target zone and in bounds. Out of bounds is a miss. |
| D4 | **Basket = runs until the basket is empty.** Basket size is one dev constant (`BASKET_SIZE = 40`). **The user never sees that number.** |
| D5 | **Redo** adds another set of that drill (same shot, mode, amount, target), inserted right after the running drill, or at the end if the session is idle. All sets aggregate into one session. |
| D6 | **Cart editing:** reorder and delete work only on upcoming drills. Running and done drills are locked. |
| D7 | Results count **detected shots only**. |
| D8 | Free mode has **no score**. The "On target" score exists only for Targeted. |
| D9 | **Shot taxonomy** is the spec's 24 shots in 6 categories (Part D1). Used everywhere: library, chips, bars. |
| D10 | **No radar chart, no heat map.** Placement is dots. Distribution is ranked horizontal bars. |
| D11 | **Tracking is simulated** by the mock tracker in Part D. No real camera or ML. |
| D12 | **Labels:** short label + Spanish alias as secondary text (see Part D1). Fixes the spec/mockup differences ("Drop shot" vs "Drop shot (Dejada)"). |
| D13 | Copy is gender-neutral ("you"). |

## B3. Concepts (plain)
- **Drill**: one cart item. Shot type, mode, amount, optional target zone.
- **Cart**: ordered list of drills. Drills run top to bottom.
- **Session**: everything between Start Training and End. All drills and Redos belong to it.
- **Detected shot**: one shot the tracker saw, with where it landed.

## B4. Session phases

| Phase | Meaning |
|---|---|
| `building` | Cart being built before the first Start. |
| `running` | A drill is active and the tracker is emitting shots. |
| `paused` | Cart screen opened mid-session. Tracker is paused. |
| `idle` | Every drill is done. Waiting for the player to Redo, add a shot, or End. |
| `ended` | Session saved. Results shown. |

## B5. Flow, screen by screen

**S0 Training** (entry)
- Start Training → opens S1 Cart in `building` phase.
- History list below (B7).

**S1 Cart**
- Empty state: "Add your first shot" with an Add shot button. Start is disabled.
- Header: back chevron, title "Shot Cart", subtitle "Shots play from top to bottom".
- Each drill card shows: order number, shot name, mode tag (`Free` or `Target: back-right`), the amount control, and actions: move up, move down, Redo, delete.
- Amount control: stepper (− n +, min 1, max 50, default 10) and a **Basket** toggle. Toggle on replaces the stepper with the text "Until the basket is empty". Toggling off restores the last count.
- Locked drills show a status chip instead of actions: `Running` or `Done · 10 shots`.
- Footer: "IN CART · N drills" and a **Start** button (enabled when any drill is upcoming or a drill is paused).
- Max 20 drills; at the limit, Add shot is disabled with the hint "Cart is full".
- Back chevron: in `building`, returns to S0 (confirm sheet if the cart has drills: "Discard this cart?"). In `paused`, returns to Live and resumes.

**S2 Add a Shot** (full page, pushed from S1)
- Title "Add a Shot", subtitle "Pick one shot type to add".
- Tabs at top: **Free | Targeted**.
- Library grouped by the 6 categories, as Chips (wrapped rows, as in the coworker mockups). Alias shown as small secondary text.
- Tap a shot: Free → S4. Targeted → S3, unless that shot type already has a target in the cart (then → S4 with the reused target shown).

**S3 Target** (conditional, Targeted only)
- Title "Where should your <shot> land?". Subtitle "Tap one zone".
- Court map in select mode: opponent half has 6 tappable zones; one selectable at a time. Selected zone fills orange.
- Zone label under the court, e.g. "Back right".
- **Continue** button, enabled once a zone is picked → S4.

**S4 Amount** (bottom sheet)
- Header shows the shot name and, in Targeted, the zone as a small tag with a "Change" link back to S3.
- Stepper + Basket toggle (same behaviour as S1).
- **Add to cart** → back to S1 with the new drill at the bottom. Quick toast "Added".

**S5 Live Session**
- Status pill "Tracking live" with a pulsing dot and the line "Camera is tracking your shots".
- Block "NOW DRILLING": shot name, and progress on the right: `4 / 10` for counts, `4 shots` (count-up) for Basket.
- In Targeted the target zone is shown on the court.
- Court map in live mode: dots land as shots are detected.
- "Up next" line: next upcoming drill, or nothing.
- **Session controls** dock at the bottom (always visible):
  - **Redo** — sub-label `Repeat <shot> × <n>` (or `Repeat <shot> · Full basket`). Adds a set per D5 and shows the toast "Added <shot> × <n> to your cart".
  - **Train Another Shot** — sub-label "Open the shot cart". Moves to `paused`, opens S1.
  - **End Session** — sub-label "Your training results open next".
- `idle` state: "NOW DRILLING" becomes "Cart complete". Redo repeats the last drill and starts it right away. Train Another Shot and End behave the same.
- Browser or device back on Live opens the End confirm (S6). It never leaves the session silently.
- Keep the screen awake during Live with the Screen Wake Lock API where supported.

**S6 End confirm** (bottom sheet, only when a drill is running or drills are upcoming)
- "End session?" "Upcoming drills will be skipped. Shots so far are saved."
- **End and see results** / **Keep training**.
- If nothing is running or upcoming (`idle`), End goes straight to S7.

**S7 Results** — see B6.

## B6. Results spec

Always at the top: date and time, duration, **total shots**.

**Mode toggle** (Tabs **Free | Targeted**) appears only if the session has both. If it has one, hide the toggle and show that mode. Totals in the header cover both.

**Free view**
1. Hero: shot count for Free drills. No score.
2. Placement map: orange dots on the court.
3. Shot type chips above the map: `All` + each shot type played in this mode. Selecting one filters the dots.
4. Distribution: ranked horizontal bars, one per shot type, with count and %.

**Targeted view**
1. Hero: **On target** `18 / 25` with `72%`.
2. Placement map: hit dots orange, miss dots white. The target zones are outlined. On `All`, every targeted zone is outlined lightly; selecting a shot type highlights its zone.
3. Same chips as Free.
4. Per shot type list: name · target zone · `hits / total` · `%`.
5. **Insight line** (one line). Rule: among Targeted shot types with at least 5 misses, take the one with the most misses. Compute the average miss offset from the zone centre. If the biggest component is at least 0.15 of the court axis, say: "<Shot>: most misses land <short | long | left | right> of the target". Otherwise: "No clear miss pattern yet". (Short = closer to the net, long = deeper.)
6. Distribution bars for Targeted shots.

**Dot interaction:** tap a dot to see a small tooltip: shot name and Hit / Miss / Out (Targeted) or shot name only (Free).

## B7. Persistence, history, interruption
- Sessions save on End and appear in the Training screen history: date, duration, total shots, shot-type pills, and `On target 72%` if any Targeted drills. Tap opens S7 for that session.
- The in-progress session saves after every detected shot. On app open with an unfinished session, show a sheet: **Resume session** / **End and see results**.
- Everything goes through the repository interface (Part D). Storage is `localStorage` for now.

---

# PART C — UI / HIG spec

The design foundation is **locked**. It lives in `./reference/design-foundation/` as 21 PNG sheets (Color Palette, Typography Scale, Spacing Scale, Grid System, and component sheets). Open them before building. Where this part gives a number, it is the source of truth; where it says "match the sheet", match the PNG visually. **Do not invent components or restyle the foundation.** Build the components below from the foundation and compose everything from them.

## C1. Principles
- Apple HIG structure (spacing, margins, hierarchy), dressed in the SEE foundation.
- Native feel: bottom sheets for actions, back-chevron navigation on pushed screens, large title that condenses on scroll, **44 × 44 pt minimum touch target** on everything tappable (even when the component sheet's Small size is shown smaller, pad the hit area to 44).
- Mobile grid per the foundation: **390 px reference, 4 columns, 16 px margins, 8 px gutters.** Layout must be fluid from 360 to 440 px with no fixed max-width caps and no horizontal scroll. Respect safe areas.
- **Mobile only.** On wide screens, show the app as a centered 430 px column on a `neutral-100` background. No tablet or desktop layout (see Side note S1).
- **Light mode only.** The foundation mentions Light and Dark semantic modes but only light values are provided (see Side note S2).
- No tab bar, no floating nav. This is one feature, not an app shell.

## C2. Tokens

Exact hex values, sampled from the Color Palette sheet.

```css
:root {
  /* Blue */
  --blue-50:#E6F0FF; --blue-100:#CCE0FF; --blue-200:#99C2FF; --blue-300:#66A3FF; --blue-400:#3385FF;
  --blue-500:#0052C9; --blue-600:#003B82; --blue-700:#002D66; --blue-800:#001F4D; --blue-900:#001233;
  /* Orange */
  --orange-50:#FFF3E6; --orange-100:#FFE5CC; --orange-200:#FFCC99; --orange-300:#FFB266; --orange-400:#FF9933;
  --orange-500:#FF8B17; --orange-600:#FF551A; --orange-700:#CC4415; --orange-800:#993310; --orange-900:#66220A;
  /* Yellow */
  --yellow-50:#FFFBE6; --yellow-100:#FFF5CC; --yellow-200:#FFEC99; --yellow-300:#FFE266; --yellow-400:#FFD933;
  --yellow-500:#FFCC3B; --yellow-600:#E6B800; --yellow-700:#CC9900; --yellow-800:#997300; --yellow-900:#664D00;
  /* Neutral */
  --neutral-0:#FFFFFF; --neutral-50:#F9FAFB; --neutral-100:#F3F4F6; --neutral-200:#E5E7EB; --neutral-300:#D1D5DB;
  --neutral-400:#9CA3AF; --neutral-500:#6B7280; --neutral-600:#4B5563; --neutral-700:#374151; --neutral-800:#1F2937;
  --neutral-900:#111827; --neutral-950:#030712;
  /* Status (bg / solid) */
  --success-bg:#DCFCE7; --success:#22C55E;
  --warning-bg:#FEF3C7; --warning:#F59E0B;
  --error-bg:#FEE2E2;   --error:#EF4444;
  --info-bg:#DBEAFE;    --info:#3B82F6;
  /* Court (not in the palette; sampled from the placement map reference) */
  --court:#0156ED; --court-line:#FFFFFF;
}
```

**Semantic aliases (use these in components, not raw ramps):**

| Semantic | Maps to |
|---|---|
| `--bg` | `neutral-0` |
| `--surface` | `neutral-100` |
| `--border` | `neutral-200` |
| `--text` | `neutral-900` |
| `--text-2` | `neutral-600` |
| `--text-3` | `neutral-400` |
| `--primary` | `blue-500` |
| `--brand` | `blue-600` (cobalt) |
| `--accent` | `orange-500` (buttons, chips, stat card) |
| `--accent-strong` | `orange-600` (dots, selected zone, key numbers) |

**Spacing:** 4 pt base, 8 pt grid. Allowed values: `2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120`. Screen margin **16** (compact). Use **20** only for large titles.

**Radii:** not specified in numbers by the sheets. Match the component sheets visually: buttons and inputs small-rounded (about 8–12), cards and stat cards about 16–20, chips, badges, tooltips and progress bars fully rounded, icon buttons rounded-square. Bottom sheets: 24 on the top corners. Define each once as a token and reuse.

**Type** (Obviously for Display and Stats, Inter for everything else):

| Style | Font · weight | Size / line |
|---|---|---|
| Display Hero | Obviously Black Italic | 96/96 |
| Display XL | Obviously Black Italic | 56/60 |
| Display Large | Obviously Bold Italic | 40/44 |
| Display Medium | Obviously Bold Italic | 32/36 |
| Display Small | Obviously Bold Italic | 24/28 |
| Stat Hero | Obviously Semibold | 120/120 |
| Stat Large | Obviously Bold Italic | 48/48 |
| Stat Medium | Obviously Bold Italic | 32/32 |
| Stat Small | Obviously Bold Italic | 20/24 |
| Stat Label | Inter Semibold | 11/14 |
| H1 | Inter Bold | 28/34 |
| H2 | Inter Bold | 22/28 |
| H3 | Inter Semibold | 20/26 |
| H4 | Inter Semibold | 17/22 |
| H5 | Inter Semibold | 15/20 |
| H6 | Inter Semibold | 13/18 |
| Body Large / Large Bold | Inter Regular / Semibold | 17/24 |
| Body Default / Default Bold | Inter Regular / Semibold | 15/22 |
| Body Small / Small Bold | Inter Regular / Semibold | 13/18 |
| Label Large | Inter Medium | 17/22 |
| Label Default | Inter Medium | 15/20 |
| Label Small | Inter Medium | 13/18 |
| Label XSmall | Inter Medium | 11/16 |
| Caption Default / Bold | Inter Regular / Semibold | 12/16 |
| Caption Small | Inter Regular | 11/14 |
| Overline Default | Inter Bold, uppercase, tracked | 11/16 |
| Overline Small | Inter Bold, uppercase, tracked | 9/12 |

**Fonts:** self-host Inter (woff2, in `/public/fonts`) so the app works offline. Obviously is licensed: use the files in `./reference/brand/fonts` if present. If they are missing, **do not stop**; fall back to Inter Black Italic and Inter ExtraBold Italic for Display and Stat styles, and **tell Sherif in your final message**. Do not substitute silently.

## C3. Component map (foundation sheet → where it is used)

Build each component once, per its sheet, and reuse it.

| Foundation component | Variants used | Used for |
|---|---|---|
| **Button** | Primary L (full width), Secondary, Accent, Ghost, Disabled | Start Training, Start, Add to cart, Continue, Discard (Primary). Redo and Train Another Shot (Secondary). End Session (Accent). Cancel links (Ghost). Start with an empty cart (Disabled). |
| **Icon Button** | Primary, Secondary, Ghost | Stepper − and +, move up, move down, Redo on a drill card, delete (Secondary or Ghost), back chevron (Ghost). |
| **Tab** | Default, Active | **Mode switch Free \| Targeted** in Add a Shot, and the same switch on Results. Full width, equal columns, 44 tall. |
| **Chip** | Default, Selected, Accent | Shot library items (Default, Selected when picked), shot-type filter chips on Results (Default, Selected). Accent for the target-zone tag on S4. |
| **Badge** | Default, Brand, Accent, Success, Info | Mode tag on drill cards (`Free` = Default, `Targeted` = Accent). Status: `Upcoming` = Default, `Running` = Info, `Done` = Success. |
| **Toggle** | On, Off | Basket switch. See Side note S3. |
| **Progress Bar** | 0–100% | Distribution bars on Results, and drill progress on Live (`4 / 10`). Track `neutral-200`, fill `blue-500`, fully rounded, 8 px tall. |
| **Stat Card** | Default, Brand | Results hero. **On target** = Brand (blue-500, white text). **Total shots** = Default. Label in Overline, value in Stat Large, delta line in Caption. |
| **Tooltip** | Single | Dot tooltip on the court. Also used for toasts (neutral-900 background, white text, fully rounded). |
| **Divider** | Horizontal | Between list rows and sections. `neutral-200`, 1 px. |

**Not used by this feature:** Input, Search Bar, Checkbox, Radio, Avatar, Table Row, Nav Item. Do not build them.

**Compositions (no sheet, built from the above):**
- **Bottom sheet:** `--bg`, 24 radius top, grabber, backdrop 40% `neutral-950`. Content built from the components above.
- **Drill card:** white card, `--border` 1 px, 16–20 radius. Order number, shot name (H4), mode Badge, amount row, action row of Icon Buttons. Locked cards show a status Badge in place of the actions and a `--surface` background.
- **Stepper:** Icon Button Secondary (−), value in Stat Small, Icon Button Secondary (+).
- **Session controls dock:** persistent bottom sheet. Two Secondary Buttons side by side (Redo, Train Another Shot) each with a Caption sub-label, then the Accent Button End Session full width with its Caption sub-label.
- **Library group:** Overline heading (e.g. SERVE AND RETURN) then wrapped Chips, as in the coworker mockups. Alias in Caption `--text-2` inside the Chip.

## C4. Court component (one component, three modes)
Draw a true padel court in SVG, portrait, 10 m wide × 20 m long, per `Container-1.png`:
- Back band at each end (3.05 m).
- Service boxes between each back band and the net (6.95 m each side), split by a centre line that runs through both halves.
- Net at the middle, a thicker white line.
- Labels `OPPONENT` (top band) and `YOU` (bottom band) in Display Small, white.

Colors: fill `--court` (#0156ED), lines `--court-line` (white). Card behind the court uses `--surface`, 16–20 radius, with the Shot Placement title (H4) and subtitle (Body Small, `--text-2`) as in the reference.

Coordinates: landing `x` is 0–1 left to right across the 10 m width, `y` is 0–1 from the net (0) to the opponent's back wall (1) over the 10 m half.

Zones (opponent half): columns left `x < 0.5`, right `x ≥ 0.5`. Rows: front `y ∈ [0, 0.35)`, mid `[0.35, 0.695)`, back `[0.695, 1]`. IDs: `front-left`, `front-right`, `mid-left`, `mid-right`, `back-left`, `back-right`. Labels: "Front left" and so on.

| Mode | Behaviour |
|---|---|
| `select` | 6 zones tappable. Selected zone fills `--accent-strong` at 35% with a 2 px `--accent-strong` border. The whole zone is the tap target. |
| `live` | Optional target zone tinted the same way. Dots drop in (scale 0 → 1, 150 ms). The latest dot has a ring in `--accent` that pulses once. |
| `results` | Dots plotted. Filter by shot type. Tooltip on tap. Targeted zones outlined. |

Dots: 10 px diameter on a 390 px wide court, scaling with width. Free dots `--accent-strong` (#FF551A). Targeted: hit = `--accent-strong`, miss = white. Out of bounds: hollow ring at the court edge. Always show a small legend under the map in Targeted (Hit, Miss). The reference image uses two orange shades and two dot sizes without a meaning; do not reproduce that.

## C5. Screen composition

- **Large titles** (S0 Training, S8 Results): Display Medium. Pushed screens (Cart, Add a Shot, Target): nav bar with Ghost back chevron and H4 centered title, subtitle in Body Small `--text-2`.
- **Live Session:** status pill is a Badge (Success) with a pulsing dot and the text "Tracking live". "NOW DRILLING" is Overline; the shot name is Display Small; progress text is Stat Small with a Progress Bar below. "Up next" is Label Small `--text-2`.
- **Results hero:** two Stat Cards side by side. In Free, show **Total shots** (Default) and **Duration** (Default). In Targeted, show **On target** (Brand, `18 / 25`, delta line `72%`) and **Total shots** (Default).
- **Distribution:** each row has the shot name (Label Default), count and % (Stat Small, right aligned), and a Progress Bar underneath. Sorted descending.
- **History row (S0):** white card. Date (H5), duration and total shots (Body Small `--text-2`), shot-type Badges (Default), and an `On target 72%` Badge (Brand) for Targeted sessions.
- **Insight line:** Info-bg container (`--info-bg`) with Body Default text.

## C6. States to design for
Empty cart, cart full, paused (cart opened mid-session), idle (cart complete), Results with one mode and with two modes, Targeted with no misses ("No misses, nice."), Free with a single shot type, zero-shot session (End immediately: Results show "No shots detected" and skip chips and bars), resume sheet.

## C7. Motion
Sheets slide 250 ms ease-out. Screen pushes use the standard slide with back-chevron. Dots drop in 150 ms. Respect `prefers-reduced-motion` (no pulse, no slide, instant dot).

## C8. PWA and platform
- `manifest.webmanifest`: name "SEE Training", short name "SEE", `display: standalone`, `orientation: portrait`, theme color `--brand` (#003B82), background color `--bg`.
- Service worker caches the app shell so it opens offline.
- iOS: `apple-mobile-web-app-capable`, status bar style, **180 × 180 opaque PNG** (no transparency, no pre-rounded corners) at `/apple-touch-icon.png` on the domain root. Use the SEE logo from `./reference/brand` on a `--brand` tile. If no logo is provided, **do not stop**: use a plain `--brand` tile with a white "SEE" wordmark in the Display fallback font, and tell Sherif it is to be swapped for the real logo. Tell him to clear Safari website data before re-adding if the icon doesn't update.
- `viewport-fit=cover` with safe-area insets on the header and bottom dock. `overscroll-behavior: none`.
- Do not use `showPicker()` or other calls that break in sandboxed iframes.

## C9. Side notes to carry into your final message
- **S1.** The foundation defines Tablet (768) and Desktop (1200) grids. This build is mobile only by decision. A centered column is shown on wide screens.
- **S2.** Only light values were provided. No dark mode.
- **S3.** The Toggle sheet shows two plain rings with no knob or track. Build a standard iOS-style switch (On = `blue-500` track, Off = `neutral-300` track, white knob, 44 pt hit area) and tell Sherif.
- **S4.** The Accent Badge uses `orange-500` text on `orange-50`, which is low contrast. Build it as the sheet shows and flag it.
- **S5.** The court blue (#0156ED) comes from the placement-map reference, not the palette. `blue-500` (#0052C9) is the nearest palette color. Use `--court` as specified.

---

# PART D — Mock-data contract

All frontend code depends only on these types and interfaces. Real implementations replace the mock ones in `src/services/index.ts` later.

## D1. Shot library (24 shots)

```ts
export type Depth = 'front' | 'mid' | 'back'; // used by the simulator only

export interface ShotType {
  id: string;
  label: string;          // short label used in lists, chips, bars
  alias?: string;         // Spanish name, secondary text in the library
  category: ShotCategory;
  depth: Depth;
}

export type ShotCategory =
  | 'Serve and return' | 'Groundstrokes' | 'Volleys'
  | 'Overheads' | 'Defensive and touch' | 'Wall shots';
```

| Category | Shots (id · label · alias · depth) |
|---|---|
| Serve and return | `serve` Serve · mid / `return-of-serve` Return of serve · back |
| Groundstrokes | `forehand-drive` Forehand drive · mid / `backhand-drive` Backhand drive · mid |
| Volleys | `forehand-volley` Forehand volley · front / `backhand-volley` Backhand volley · front / `drop-volley` Drop volley · front |
| Overheads | `bandeja` Bandeja · back / `vibora` Víbora · back / `flat-smash` Flat smash · mid / `topspin-smash` Topspin smash · alias Rulo · back / `por-tres` Por tres · alias x3 smash · back / `por-cuatro` Por cuatro · alias x4 smash · back / `gancho` Gancho · back / `cuchilla` Cuchilla · mid |
| Defensive and touch | `lob` Lob · alias Globo · back / `chiquita` Chiquita · front / `drop-shot` Drop shot · alias Dejada · front |
| Wall shots | `back-wall-exit-forehand` Back wall exit forehand · mid / `back-wall-exit-backhand` Back wall exit backhand · mid / `side-wall-exit` Side wall exit · mid / `double-wall-exit` Double wall exit · alias Doble pared · back / `contrapared` Contrapared · mid / `bajada` Bajada · mid |

## D2. Types

```ts
export type Mode = 'free' | 'targeted';
export type ZoneId =
  | 'front-left' | 'front-right' | 'mid-left'
  | 'mid-right' | 'back-left' | 'back-right';

export type Amount = { kind: 'count'; n: number } | { kind: 'basket' };

export interface CartItem {
  id: string;
  shotId: string;
  mode: Mode;
  amount: Amount;
  targetZone?: ZoneId;               // required when mode === 'targeted'
  status: 'upcoming' | 'running' | 'done';
  detected: number;                  // shots detected so far for this drill
}

export interface ShotEvent {
  id: string;
  cartItemId: string;
  shotId: string;
  at: string;                        // ISO timestamp
  landing: { x: number; y: number }; // 0–1, see C4
  inBounds: boolean;
  hit?: boolean;                     // set by the tracker for targeted drills
}

export type Phase = 'building' | 'running' | 'paused' | 'idle' | 'ended';

export interface Session {
  id: string;
  startedAt: string;
  endedAt?: string;
  phase: Phase;
  cart: CartItem[];
  shots: ShotEvent[];
}

export interface SessionSummary {
  id: string;
  startedAt: string;
  durationSec: number;
  totalShots: number;
  shotIds: string[];
  onTargetPct?: number;              // present if any targeted drills
}
```

## D3. Services (swap point)

```ts
export interface TrackerService {
  start(item: CartItem): void;       // begins emitting shots for this drill
  pause(): void;
  resume(): void;
  stop(): void;
  onShot(cb: (e: ShotEvent) => void): () => void; // returns unsubscribe
  onDrillComplete(cb: (cartItemId: string) => void): () => void;
}

export interface SessionRepository {
  list(): Promise<SessionSummary[]>;
  get(id: string): Promise<Session | null>;
  save(session: Session): Promise<void>;            // on End
  saveInProgress(session: Session): Promise<void>;  // after every shot
  getInProgress(): Promise<Session | null>;
  clearInProgress(): Promise<void>;
}

export const BASKET_SIZE = 40;       // dev-only, never rendered
```

`src/services/index.ts` exports the one tracker and one repository the app uses. Nothing else imports a concrete implementation.

## D4. Mock implementations

**MockTracker** (simulated camera)
- Emits one shot every `intervalMs` (default 1800).
- A count drill completes after `n` shots. A basket drill completes after `BASKET_SIZE` shots.
- `pause()` stops emitting, `resume()` continues, no shots lost or duplicated.
- Landing sampler, normalised coordinates:
  - **Free:** `x ~ Normal(0.5, 0.22)`, `y ~ Normal(depthCenter, 0.15)` where `depthCenter` is 0.2 (front), 0.5 (mid), 0.8 (back) from the shot's `depth`.
  - **Targeted:** centred on the target zone's centre, `σ = 0.17` on both axes (about 60–70% hits). Hit is set when the point is inside the zone and in bounds.
  - `inBounds` is false when `x` or `y` falls outside 0–1.
- **Dev panel**, only with `?dev=1` in the URL: interval (ms), targeted accuracy σ, and a "Clear all history" button. Hidden otherwise.

**LocalRepository**
- Stores sessions and the in-progress session in `localStorage`, versioned key. All methods async to mirror a real backend.

## D5. Stats (pure functions, unit-tested)

`src/domain/stats.ts`, no UI imports:
- `totals(session)` → total shots, by mode.
- `distribution(session, mode)` → per shot type `{ shotId, count, pct }`, sorted descending.
- `onTarget(session)` → `{ hits, total, pct }` and the same per shot type.
- `insight(session)` → the one-line message from B6.5, or `null`.
- `summarise(session)` → `SessionSummary`.

Hit determination lives in the tracker. Stats never recompute hits.

---

# APPENDIX — Live test script

Run each in a mobile viewport. Pass or fail per line goes into the final message.

| # | Scenario | Expected |
|---|---|---|
| T1 | **Free, single drill.** Start Training → Add shot → Free → Lob → 10 → Add to cart → Start. | Live shows `Lob` and `x / 10`. After 10 shots the phase is `idle` and the label reads "Cart complete". End → Results show total 10, one bar at 100%, **no** On target score, no mode toggle. |
| T2 | **Targeted.** Add shot → Targeted → Bandeja → tap `back-right` → Continue → 10 → Add → Start. | Target zone visible on the live court. Results show **On target X / 10** with %, hit dots orange and miss dots white, target zone outlined, insight line or "No clear miss pattern yet". |
| T3 | **Mixed cart.** Free Lob × 10, Targeted Bandeja × 10, Free Víbora on Basket. | Basket shows "Until the basket is empty" and count-up during Live. The number 40 appears nowhere. Results show the toggle; totals in the header add up across modes; Free and Targeted views each show their own drills only. |
| T4 | **Redo.** During the first Lob drill, tap Redo. | Toast "Added Lob × 10 to your cart". Cart shows a second Lob right after the running drill. Final Lob frequency is 20. |
| T5 | **Locks and reordering.** With 4 drills, open the cart during drill 2. | Drill 1 shows Done, drill 2 shows Running, neither can move or delete. Drills 3 and 4 can move up/down, Redo and delete. |
| T6 | **Target reuse.** Add a second Targeted Bandeja. | Court step is skipped, the existing zone shows with a "Change" link. Changing it updates every upcoming Targeted Bandeja. |
| T7 | **Pause via cart.** Mid-drill, tap Train Another Shot. | Tracker pauses (no new dots). Back chevron returns to Live and resumes. Start after adding a drill continues the paused drill, then the new one. |
| T8 | **End early.** Tap End mid-drill. | Confirm sheet. "End and see results" opens Results with only the shots detected so far. |
| T9 | **Zero shots.** Start a drill and End immediately, confirming. | Results show "No shots detected", no chips, no bars, no crash. |
| T10 | **Interruption.** Reload the page mid-session. | Resume sheet appears. Resume continues. "End and see results" saves and opens Results. |
| T11 | **History.** After 2 sessions, open the Training screen. | Both appear with date, duration, total, shot pills (and On target % where relevant). Tap opens the same Results. |
| T12 | **Cart rules.** Try 0 shots, 51 shots, 21 drills, and Start with an empty cart. | Stepper stays within 1–50. Basket toggle off restores the last count. Add shot disables at 20 with "Cart is full". Start disabled when empty. |
| T13 | **Layout.** Check 360, 390 and 430 px, and a desktop browser. | No horizontal scroll. All touch targets at least 44 pt. Safe areas respected. Desktop shows the centered 430 px column. |
| T14 | **PWA.** Install on iOS and Android. | Standalone, correct icon, opens offline, screen stays awake during Live. |
| T15 | **Stats unit tests.** `totals`, `distribution`, `onTarget`, `insight`, `summarise`. | All pass, including empty session and a session with only out-of-bounds shots. |
| T16 | **Foundation fidelity.** Compare Live, Cart, Add a Shot, Target and Results screenshots against the foundation sheets. | Every color, type style and spacing value comes from the C2 tokens. No raw hex or ad-hoc font sizes outside the token file. Components match their sheets (Button, Chip, Tab, Badge, Progress Bar, Stat Card, Tooltip). Deviations are listed as side notes. |
