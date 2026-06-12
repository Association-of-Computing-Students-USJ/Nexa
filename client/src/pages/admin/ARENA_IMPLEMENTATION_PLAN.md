# Arena Presentation Page — Implementation Plan

## Overview

Build a fullscreen-optimized admin presentation page for the NEXA Tech Arena that acts as a live scoreboard/control center during the event. Designed to be projected on a large screen during the competition.

**Route**: `/admin/arena` (standalone, no admin sidebar)  
**Access**: Requires admin session, redirected from "Game Teams" tab

---

## Architecture Decisions

| Decision | Choice |
|----------|--------|
| Page type | Standalone fullscreen (no AdminLayout sidebar/header) |
| Countdown | Default 3-2-1 countdown on Start click |
| Sorting | Stage progress first, then total time ascending |
| Buffer screen | Enhance existing GamePage waiting state with tips |
| Dashboard changes | Remove start/clear buttons, keep "Reset All Teams" |
| Start button | Single "Start Game" button, triggers 3-2-1 then writes gameStartTime |

---

## Phase 1: Create AdminArenaPage.tsx

### 1.1 — Page Scaffold & Fullscreen Layout
- Create `AdminArenaPage.tsx` at `client/src/pages/admin/`
- Admin session guard (check `ADMIN_SESSION_KEY`, redirect if not authed)
- Call `ensureFirebaseAuth()` on mount
- Full-viewport layout (`100dvh`, pure black `#000` background)
- Floating "← Back to Dashboard" button (top-left corner)
- "Fullscreen" toggle button (top-right) via Fullscreen API

### 1.2 — Firestore Teams Subscription
- Subscribe to `teams` collection via `onSnapshot`
- Parse: `id`, `registeredAt`, `gameResults[]`, `totalTimeTaken`, `gameStartTime`
- Store as `AdminTeamType[]` in local state

### 1.3 — Hero Countdown Timer (Top Section)
- **Before start**: "READY TO START" with animated pulse
- **3-2-1 countdown**: Giant numbers with glow, each lasting 1 second
- **After start**: Elapsed count-up timer (`MM:SS`) since `gameStartTime`
- Timer font: min `text-7xl`, brand cyan `#19D1E6` with drop-shadow glow

### 1.4 — Start Button & Controls
- **"Start Game"**: On click → 3-2-1 on screen → after 3s write `gameStartTime = Date.now()` to all teams via `writeBatch`
- **"Reset All Teams"**: Secondary destructive button with confirm dialog, resets `gameResults`, `totalTimeTaken`, `gameStartTime` for all teams
- Auto-hide controls after game starts

### 1.5 — Live Leaderboard (Main Section)
- Top 10 teams table
- Sorting: completed (2 games) > in-progress (1 game) > waiting (0 games), then `totalTimeTaken` ASC
- Each row: Rank (🥇🥈🥉), Team name, Stage indicator, Sudoku time, 15-Puzzle time, Total time
- Large readable fonts for projection
- Green/gold highlight for completed teams
- CSS transitions for rank changes

### 1.6 — Presentation Styling
- Pure black `#000` background
- `#19D1E6` primary accent
- Timer ≥ 6rem, leaderboard rows ≥ 1.25rem
- Background glow effects behind timer
- No scrollbars — content fits viewport

---

## Phase 2: Modify AdminDashboardPage.tsx

### 2.1 — Remove Start/Clear Buttons
- Remove `triggerGlobalStart()` function
- Remove `clearAllStartTimes()` function
- Remove "Global Arena Control" UI section (Start in 10s, 1min, 5min, Immediately, Clear Countdowns)
- **Keep** `resetAllTeams()` and its button

### 2.2 — Add "Open Arena" Button
- Add "Open Arena Control" button in Game Teams tab header
- Navigates to `/admin/arena`
- Styled with cyan accent + icon
- Only visible if `hasGameAccess`

---

## Phase 3: Enhance GamePage Waiting Screen

### 3.1 — Rotating Gameplay Tips
- Enhance `gameState === "waiting"` block in GamePage.tsx
- Tips array rotating every 5 seconds with fade transition:
  - Sudoku rules
  - Keyboard controls for 15-Puzzle
  - Leader device info
  - Speed/ranking info
- Show game order: "Game 1: Sudoku → Game 2: 15 Puzzle"

### 3.2 — Visual Enhancements
- Team name prominently displayed
- Animated waiting indicator
- "Get Ready!" message when countdown approaches

---

## Phase 4: Routing & Navigation

### 4.1 — App.tsx Route
- Add standalone route `/admin/arena → AdminArenaPage` (outside AdminLayout)
- Page handles its own auth check

### 4.2 — AdminLayout Navigation
- Add `{ icon: "sports_esports", label: "Arena", path: "/admin/arena" }` to `NAV_ITEMS`

---

## Phase 5: Polish & Verify

- Test fullscreen layout fills viewport
- Test F11 browser fullscreen
- Test Fullscreen API toggle button
- Test 3-2-1 countdown + Firestore write
- Test player countdown sync on `/game?team=...`
- Test live leaderboard updates
- Test rotating tips on player waiting screen
- Test dashboard changes (no start buttons, has reset + arena link)
- Test 1080p and 4K readability

---

## Files Changed

| Action | File |
|--------|------|
| **NEW** | `client/src/pages/admin/AdminArenaPage.tsx` |
| **MODIFY** | `client/src/pages/admin/AdminDashboardPage.tsx` |
| **MODIFY** | `client/src/pages/public/GamePage.tsx` |
| **MODIFY** | `client/src/App.tsx` |
| **MODIFY** | `client/src/layouts/AdminLayout.tsx` |
