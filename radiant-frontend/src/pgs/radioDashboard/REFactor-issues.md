# radioDashboard — Issues & Fixes

Analysis of `src/pgs/radioDashboard/` for simplification, modularity, and clarity.

---

## Issue 1: TopBar.tsx is dead code

- **File**: `TopBar.tsx`
- **Severity**: Medium
- **Problem**: `TopBar` is never imported by any file in the codebase. It shares the same `RadiantLogo + Badge("BETA")` pattern as `DashboardShell`'s inline header, creating confusion about which is the "real" top bar.
- **Fix**: Delete `TopBar.tsx`. If its "Go Live" button or user info is needed later, recreate it intentionally.

---

## Issue 2: MediaLibrary.tsx is a pointless re-export

- **File**: `MediaLibrary.tsx`
- **Severity**: Low
- **Problem**: The entire file is `export { MediaLibrary } from "@/features/mediaLibrary/MediaLibrary"`. Adds indirection with zero value.
- **Fix**: Import directly from `@/features/mediaLibrary/MediaLibrary` in the root component, then delete `MediaLibrary.tsx`.

---

## Issue 3: DashboardShell.tsx and DashboardSidebar.tsx — not used by radioDashboard, but used elsewhere

- **Files**: `DashboardShell.tsx`, `DashboardSidebar.tsx`
- **Severity**: Medium
- **Problem**: `RadioManagementDashboardRoot` doesn't use `DashboardShell` (it defines its own `GridLayout`). However, `DashboardShell` IS imported by `app/dashboard/page.tsx` and `app/dashboard/radios/[radioId]/page.tsx`. `DashboardSidebar` is imported by `DashboardShell`. These components are not dead code — they belong to a different route's layout. Their presence in `radioDashboard/` creates confusion about what this directory actually owns.
- **Fix**: Keep the files (they're needed), but consider moving them to a shared location if they're only used as layout shell for `/dashboard` routes.

---

## Issue 14: Schedule code lives in radioDashboard/ instead of features/schedule/

- **Files**: `WeekCalendar.tsx`, `weekCalendarLayout.ts`, `TimeSpanGrid.tsx`, `BlockOverlay.tsx`, `blockLayout.ts`, `ScheduleBlockCard.tsx`, `useWeekCalendarZoom.ts`, `useGridMeasurement.ts`
- **Severity**: Medium
- **Problem**: Schedule-specific components (calendar grid, block layout, time calculations) were mixed into the page-specific `radioDashboard/` directory instead of living in `features/schedule/`. This violates the project convention (`features/<domain>/` for domain-specific code) and makes the schedule logic harder to find and reuse.
- **Fix**: Moved all 8 schedule files to `src/features/schedule/`. Updated imports in `RadioManagementDashboardRoot.tsx` and removed a dead `WeekCalendar` import from `app/dashboard/radios/[radioId]/page.tsx`.

---

## Issue 4: Atom state handling — no Result.match, manual _tag checks

- **Files**: `RadioManagementDashboardRoot.tsx`, `WeekCalendar.tsx`
- **Severity**: **High**
- **Problem**: State is handled with ad-hoc `._tag` checks instead of `Result.match`. The `Failure` case is either ignored or lumped with `Initial`. `WeekCalendar` receives a `Result` atom, re-reads it, uses placeholder values when not loaded, then early-returns 120 lines later — running all hooks for nothing.
- **Sub-problems**:
  - `RadioManagementDashboardRoot` does `if (radio._tag !== "Success")` — ignores `Failure` entirely.
  - `WeekCalendar` receives `radioAtom` (a Result), derives `timezone` with a fallback, passes `"radio_placeholder" as RadioId` when not loaded, then bails out mid-component.
  - `scheduleBlocks` is handled with a three-way ternary in JSX instead of `Result.match`.
- **Fix**: Use `Result.match` everywhere. Parent handles loading/failure states. `WeekCalendar` receives only the resolved `Radio.RadioInfo` value. `scheduleBlocks` uses `Result.match` with named sub-components for each state.

---

## Issue 5: Direct mutation of useElementSize's internal ref

- **File**: `WeekCalendar.tsx`, line 85
- **Severity**: **High**
- **Problem**:
  ```ts
  (calendarViewportSize.ref as React.MutableRefObject<HTMLElement | null>).current = viewport;
  ```
  Force-casts the hook's internal ref to manually set the element, violating the hook's abstraction boundary. Breaks if `useElementSize` changes its ref strategy.
- **Fix**: Add a `setElement` method to `useElementSize` so external callers can assign elements without reaching into internals.

---

## Issue 6: Magic string "radio_placeholder" with type assertion

- **File**: `WeekCalendar.tsx`, line 37
- **Severity**: Medium
- **Problem**: When radio isn't loaded, `"radio_placeholder" as Radio.RadioId` is passed to `useGenerateScheduleBlocksAtom`. Creates a false type contract, may trigger API calls or cache pollution.
- **Fix**: Eliminated by Issue 4 fix — `WeekCalendar` only renders when radio is loaded, so it always has the real ID.

---

## Issue 7: Fragile Radix ScrollArea internal DOM dependency

- **File**: `WeekCalendar.tsx`, line 84
- **Severity**: **High**
- **Problem**:
  ```ts
  el?.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]")
  ```
  Depends on a Radix internal DOM attribute (`data-radix-scroll-area-viewport`) not part of the public API. A Radix upgrade could silently break zoom/scroll.
- **Fix**: Centralize into a named utility (`getRadixScrollViewport`) with a JSDoc comment documenting the fragility and flagging it for testing after Radix upgrades.

---

## Issue 8: WeekCalendar.tsx is a god component (~200 lines, 8+ concerns)

- **File**: `WeekCalendar.tsx`
- **Severity**: **High**
- **Problem**: Handles timezone resolution, week calculation, ISO range generation, schedule data fetching, zoom state, scroll anchoring, grid DOM measurement, Radix viewport patching, DST adjustment, and rendering. All interleaved at the top of the function body with no documentation.
- **Fix**: Extract into focused hooks:
  - `useWeekCalendarZoom` — zoom state, wheel event, scroll anchor math
  - `useGridMeasurement` — gridRef, row/column measurements, measureGrid callback
  - `useScrollAreaViewport` — Radix ScrollArea viewport detection (encapsulates fragility)
  - `WeekCalendar` becomes a thin orchestrator composing these hooks.

---

## Issue 9: BlockOverlay takes 11 props, mixes data transformation with rendering

- **File**: `BlockOverlay.tsx`
- **Severity**: Medium
- **Problem**: Accepts 11 props including raw rules/occurrences/blocks plus measurement data. Does significant `useMemo` computation (building `blocksByDay`, splitting one-off blocks across midnight) inline.
- **Fix**: Extract `buildBlocksByDay` into `weekCalendar/blockLayout.ts`. `BlockOverlay` then only needs `blocksByDay`, measurements, and DST info (~5 props instead of 11). Data pipeline becomes testable in isolation.

---

## Issue 10: No documentation anywhere

- **All files**
- **Severity**: **High** (readability/maintainability)
- **Problem**: Zero JSDoc comments across all 11 files. Critical undocumented concepts:
  - `displayDayDuration` — why it varies from 24 (DST)
  - `spanDurationMinutes` — what grid row time span represents
  - Zoom anchor math — geometric explanation
  - `measureGrid` — why it queries `data-time-span` / `data-day-col` attributes
  - Relationship between `weeklyRules`, `weeklyOccurrences`, and `oneOffBlocks`
  - `WeekDay` enum convention (JS/Effect 0=Sunday, vs ISO 1=Monday)
- **Fix**: Add targeted JSDoc at critical points. Not every function, just the non-obvious ones.

---

## Issue 11: ScheduleBlockCard doesn't handle unknown targetType

- **File**: `ScheduleBlockCard.tsx`
- **Severity**: Low
- **Problem**: `targetTypeStyles` only maps `audio_file` and `playlist`. A new API type gets `undefined` background — silent visual regression.
- **Fix**: Add a fallback: `targetTypeStyles[block.target.targetType] ?? "bg-neutral-200"`.

---

## Issue 12: DashboardSidebar hardcodes route matching

- **File**: `DashboardSidebar.tsx`
- **Severity**: Low (file is deleted in Issue 3 fix)
- **Problem**: `isActive` logic is inline and hardcoded. Adding routes requires editing the array.
- **Fix**: N/A — file is deleted as dead code.

---

## Issue 13: WeekDay enum convention

- **File**: `weekCalendarLayout.ts`
- **Severity**: Low (documentation only)
- **Problem**: `WeekDay` enum uses JS/Effect convention (0=Sunday), while `BlockOverlay.WEEKDAY_TO_INDEX` uses ISO convention (1=Monday). Two different number systems with no documentation.
- **Fix**: Add JSDoc on the enum clarifying the convention. No structural change needed — the enum is a good readability aid.

---

## Applied Fixes Summary

| # | Issue | Action Taken |
|---|-------|-------------|
| 1 | TopBar.tsx dead code | Deleted |
| 2 | MediaLibrary.tsx re-export | Deleted, import updated |
| 3 | DashboardShell/Sidebar used elsewhere | Kept (used by app/dashboard routes) |
| 4 | Atom state handling | Result.match + subcomponents |
| 5 | useElementSize ref mutation | Added setElement method |
| 6 | radio_placeholder magic string | Eliminated by Issue 4 fix |
| 7 | Radix DOM fragility | Centralized into utility |
| 8 | WeekCalendar god component | Extracted 3 hooks |
| 9 | BlockOverlay 11 props | Extracted buildBlocksByDay |
| 10 | No documentation | Added JSDoc to critical points |
| 11 | Unknown targetType | Added fallback style |
| 12 | Sidebar route matching | N/A — file deleted |
| 13 | WeekDay convention | Added JSDoc |
