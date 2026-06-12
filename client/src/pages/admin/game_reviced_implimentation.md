# Game System Revision — Full Implementation Steps

## Summary of Decisions (From User Feedback)

| Decision | Answer |
|---|---|
| Firestore collection | **Fresh `players` collection** (no migration) |
| Registration after 30 min | **Disable the registration page entirely** |
| Player identifier field | **Full Name** (so admins can easily identify them) |
| `?editable=true` param | **Remove completely** — every player controls their own game |
| 30-minute timer | **Arena closes after 30 minutes** (not a registration window — the arena itself shuts down) |
| Arena end state | **Celebration animation + final leaderboard** on AdminArenaPage when timer hits 30 min |

---

## Firestore Schema

### New collection: `players` (replaces `teams`)

Each document ID = player's full name (same as current team name logic).

```
players/{playerName}
├── registeredAt: Timestamp (server)
├── gameResults: GameResult[]        // same structure as before
├── totalTimeTaken: number           // sum of all stage times in ms
└── playerStartTime: number | null   // timestamp when THIS player clicked "Start Playing"
```

### New document: `arenaConfig/state`

```
arenaConfig/state
├── arenaStatus: "idle" | "open" | "closed"
├── arenaOpenedAt: number | null     // Date.now() when admin pressed Start
└── arenaWindowMs: 1800000           // 30 minutes (constant)
```

---

## Step-by-Step Implementation

---

### STEP 1: Update Types (`client/src/types/game.ts`)

**File**: `client/src/types/game.ts`

**Changes**:
1. Add `playerStartTime?: number` to `TeamDataType` (rename interface to `PlayerDataType`)
2. Add a new `ArenaState` interface
3. Keep `GameResult` and `GameOptions` unchanged

**New content**:
```ts
export interface GameResult {
  gameId: string;
  gameName: string;
  timeInMs: number;
  formattedTime: string;
}

export interface PlayerDataType {
  totalTimeTaken?: number;
  gameResults?: GameResult[];
  playerStartTime?: number;  // when this player clicked "Start Playing"
}

export interface ArenaState {
  arenaStatus: "idle" | "open" | "closed";
  arenaOpenedAt: number | null;
  arenaWindowMs: number; // 1800000 = 30 min
}
```

---

### STEP 2: Update Game API (`client/src/lib/gameApi.ts`)

**File**: `client/src/lib/gameApi.ts`

**Changes**:
1. Change Firestore collection from `"teams"` to `"players"` in `setGameResultsApi`
2. Add `setPlayerStartTime()` — writes the player's individual start timestamp
3. Add `getArenaStateRef()` — returns a Firestore doc reference for `arenaConfig/state`
4. Add `setArenaState()` — admin uses this to open/close the arena

**New content**:
```ts
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { GameResult, ArenaState } from "../types/game";

// Save game results for a player
export async function setGameResultsApi(
  playerName: string,
  gameResults: GameResult[],
  totalTimeTaken: number
) {
  const docRef = doc(db, "players", playerName);
  await setDoc(docRef, { gameResults, totalTimeTaken }, { merge: true });
}

// Set the player's individual start time
export async function setPlayerStartTime(playerName: string, startTime: number) {
  const docRef = doc(db, "players", playerName);
  await updateDoc(docRef, { playerStartTime: startTime });
}

// Arena state document reference
export function getArenaStateRef() {
  return doc(db, "arenaConfig", "state");
}

// Admin: set arena state
export async function setArenaState(state: Partial<ArenaState>) {
  const docRef = getArenaStateRef();
  await setDoc(docRef, state, { merge: true });
}
```

---

### STEP 3: Update Game Registration Page (`client/src/pages/public/GameRegisterPage.tsx`)

**File**: `client/src/pages/public/GameRegisterPage.tsx`

**Changes**:

1. **Collection**: Change `doc(db, "teams", ...)` → `doc(db, "players", ...)`

2. **Labels**:
   - Page title: "Arena Team Registration" → "Arena Registration"
   - Input label: "Choose Team Name" → "Enter Your Full Name"
   - Placeholder: "Enter team name (e.g. Code Knights)" → "Enter your full name (e.g. John Doe)"
   - Button: "Register Team" → "Register"
   - Help text: "Name can include letters, numbers, hyphens, and spaces."
   - Success: "Team Registered!" → "Registered Successfully!"

3. **Remove leader/member link distinction**:
   - Generate only ONE link: `${origin}/game?player=${encodeURIComponent(name)}`
   - Remove the "Leader Play Link" and "Teammates Link" boxes
   - Show a single "Your Game Link" box
   - Remove `copiedType` state for leader/member distinction

4. **Block registration when arena is closed**:
   - On mount, subscribe to `arenaConfig/state` using `onSnapshot`
   - If `arenaStatus === "closed"`, show a message: "The arena has ended. Registration is closed." with a "Return to Homepage" button
   - If `arenaStatus === "open"`, check if `Date.now() > arenaOpenedAt + arenaWindowMs` — if yes, treat as closed
   - If `arenaStatus === "idle"`, allow registration normally (player will wait on WaitingScreen)

5. **Launch button**: Navigate to `/game?player=${encodeURIComponent(name)}` (no `editable` param)

---

### STEP 4: Update Game Page (`client/src/pages/public/GamePage.tsx`)

**File**: `client/src/pages/public/GamePage.tsx`

This is the **largest change**. Break it down into sub-steps:

#### STEP 4a: Remove `editable` concept

- Remove: `const isEditable = searchParams.get("editable") === "true";`
- Change: `searchParams.get("team")` → `searchParams.get("player")`
- Remove all `isEditable` checks from the "Next Game" button — always allow submission
- The button condition changes from `isCurrentGameWon() && isEditable` to just `isCurrentGameWon()`
- Remove the "Leader Only" disabled label

#### STEP 4b: Change Firestore collection

- Change: `doc(db, "teams", teamNameState)` → `doc(db, "players", playerName)`
- Rename internal variables: `teamNameState` → `playerName`, `teamName` → `playerNameParam`

#### STEP 4c: Subscribe to `arenaConfig/state`

Add a new `useEffect` that listens to `arenaConfig/state`:

```ts
const [arenaState, setArenaStateLocal] = useState<ArenaState | null>(null);

useEffect(() => {
  const stateRef = getArenaStateRef();
  const unsub = onSnapshot(stateRef, (snap) => {
    if (snap.exists()) {
      setArenaStateLocal(snap.data() as ArenaState);
    } else {
      // Default: arena is idle
      setArenaStateLocal({ arenaStatus: "idle", arenaOpenedAt: null, arenaWindowMs: 1800000 });
    }
  });
  return unsub;
}, []);
```

#### STEP 4d: New game state flow

Replace the current game state transition logic:

| Condition | Show |
|---|---|
| `arenaState.arenaStatus === "idle"` | WaitingScreen: "Waiting for the organizer to start…" |
| `arenaState.arenaStatus === "open"` AND player has NOT started | **"🚀 Start Playing" button** |
| `arenaState.arenaStatus === "open"` AND player HAS started (`playerStartTime` exists) | Game is playing |
| `arenaState.arenaStatus === "closed"` AND player never started | "Arena has ended. You didn't start in time." |
| `arenaState.arenaStatus === "closed"` AND player already started | Continue playing (they're already in-game) |
| All games completed | Finished/results screen |

#### STEP 4e: "Start Playing" button handler

When the player presses "Start Playing":
1. Set `playerStartTime = Date.now()` in local state
2. Write `playerStartTime` to Firestore via `setPlayerStartTime(playerName, startTime)`
3. Also store in `localStorage` as `nexa_start_${playerName}` for clock-skew safety
4. Transition `gameState` to `"playing"`

#### STEP 4f: Per-player timing calculation

Update `handleGameComplete`:
- `baseTime` = the player's own `playerStartTime` (from Firestore or localStorage)
- Stage 1 time = `endTime - playerStartTime`
- Stage 2 time = `endTime - (playerStartTime + stage1TimeInMs)`
- This is essentially the same formula, just using `playerStartTime` instead of `gameStartTime`

#### STEP 4g: Remove unused state/logic

- Remove `COUNTDOWN_PERIOD_MS`
- Remove `countdownTime` state and the countdown game state
- Remove `gameOpenTime` (replaced by `playerStartTime`)
- Remove the `gameStartTime` state (this was the global admin start time)
- Remove the timer `useEffect` that checked `gameStartTime` to auto-transition to playing
- Remove the leader device tip from `GAME_TIPS` array (the one about "Only the leader device can submit scores")

#### STEP 4h: Update WaitingScreen component

Modify `WaitingScreen` props and rendering:

- Remove `gameStartTime` and `formatTimeUntilStart` props
- Add `arenaStatus` prop
- Add `onStartPlaying` callback prop (for when the button is clicked)

Rendering logic:
- If `arenaStatus === "idle"`: Show current waiting UI with "Waiting for the organizer…"
- If `arenaStatus === "open"`: Show a large, prominent **"🚀 Start Playing"** button with a pulsing animation. Include the game tips below it.
- If `arenaStatus === "closed"`: Show "The arena has ended."

#### STEP 4i: Update header labels

- "Team: {name}" → "Player: {name}"
- "NEXA Tech Arena Challenge" label stays
- Remove team-specific references from the progress display

---

### STEP 5: Update Admin Arena Page (`client/src/pages/admin/AdminArenaPage.tsx`)

**File**: `client/src/pages/admin/AdminArenaPage.tsx`

#### STEP 5a: Change Firestore collection

- Change: `collection(db, "teams")` → `collection(db, "players")`
- Update type: `ArenaTeam` → `ArenaPlayer` (add `playerStartTime` field)

#### STEP 5b: Subscribe to `arenaConfig/state`

Add a new `useEffect`:
```ts
const [arenaConfig, setArenaConfig] = useState<ArenaState | null>(null);

useEffect(() => {
  const stateRef = getArenaStateRef();
  const unsub = onSnapshot(stateRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data() as ArenaState;
      setArenaConfig(data);
      
      // Sync local arena state
      if (data.arenaStatus === "open") {
        setArenaState("running");
        setGameStartTimestamp(data.arenaOpenedAt);
      } else if (data.arenaStatus === "closed") {
        setArenaState("finished"); // new state
      }
    }
  });
  return unsub;
}, []);
```

#### STEP 5c: Replace "START GAME" with "OPEN ARENA"

Change `handleStartGame`:
- After the 3-2-1 countdown, instead of writing `gameStartTime` to every player doc, write to `arenaConfig/state`:
  ```ts
  await setArenaState({
    arenaStatus: "open",
    arenaOpenedAt: Date.now(),
    arenaWindowMs: 1800000
  });
  ```
- Button label: "START GAME" → "OPEN ARENA"
- Idle text: "Awaiting launch" → "Awaiting arena open"

#### STEP 5d: Add 30-minute countdown timer

- When arena is "running" (open), show a countdown: `30:00 - elapsed`
- Use `arenaOpenedAt` to calculate remaining time
- Display format: "Arena closes in: MM:SS"
- When countdown hits 0:
  1. Automatically write `arenaStatus: "closed"` to Firestore
  2. Transition to the **"finished"** state

#### STEP 5e: Add new "finished" arena state with celebration

Add a new arena state: `"idle" | "countdown" | "running" | "finished"`

When `arenaState === "finished"`:
- Show a **celebration animation** (confetti/particles effect, glowing borders, trophy icon)
- Display "🏆 ARENA COMPLETE" title with glow animation
- Show the **final leaderboard** (full table, same as running state but with celebratory styling)
- Top 3 players highlighted with gold/silver/bronze glow effects
- Keep the "Reset All" button available
- The elapsed timer should show the final time: "30:00" (or the actual elapsed time)

**Celebration animation CSS** to add:
```css
@keyframes celebrate {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes confettiDrop {
  0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

@keyframes goldGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.3); }
  50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.6); }
}
```

#### STEP 5f: Update labels

- "Teams" → "Players" in the top bar stats
- "Team" column → "Player" in the leaderboard table
- "No teams registered yet" → "No players registered yet"

#### STEP 5g: Update Reset All

`handleResetAll` should:
1. Reset all player docs: `gameResults: [], totalTimeTaken: 0, playerStartTime: null`
2. Reset `arenaConfig/state`: `{ arenaStatus: "idle", arenaOpenedAt: null, arenaWindowMs: 1800000 }`
3. Reset local state back to `"idle"`

---

### STEP 6: Update Admin Dashboard Page (`client/src/pages/admin/AdminDashboardPage.tsx`)

**File**: `client/src/pages/admin/AdminDashboardPage.tsx`

#### STEP 6a: Change Firestore collection

- Change: `collection(db, "teams")` → `collection(db, "players")`

#### STEP 6b: Update labels

- Tab: "Game Teams" → "Game Players"
- Page title: "Game Teams" → "Game Players"
- Subtitle: "Arena team progress & time management" → "Arena player progress & time management"
- Stats: "Total Teams" → "Total Players", icons stay the same
- Table header: "Team Name" → "Player Name"
- Empty state: "No teams found" → "No players found"
- Mobile card: Same label changes

#### STEP 6c: Remove leader/member links

- Remove `getTeamLinks()` function
- Add `getPlayerLink(name)` → returns `${origin}/game?player=${encodeURIComponent(name)}`
- Replace the two-button link column (Leader + Member) with a single "Copy Link" button
- Remove `copiedTeam` state tracking for leader/member types — simplify to just `copiedPlayer: string | null`

#### STEP 6d: Update type references

- `AdminTeamType` → `AdminPlayerType`
- Remove `gameStartTime` from the type (it's no longer per-player from admin)
- Add `playerStartTime` field

#### STEP 6e: Update reset functions

- `resetAllTeams()` → `resetAllPlayers()`: same logic but writes to `"players"` collection
- `handleResetTeam()` → `handleResetPlayer()`: same logic but for `"players"` collection
- `handleDeleteTeam()` → `handleDeletePlayer()`: same logic but for `"players"` collection

---

### STEP 7: Update Firestore Security Rules (if applicable)

If there are Firestore rules referencing `teams`, add matching rules for `players`:

```
match /players/{playerName} {
  allow read: if true;
  allow write: if true;  // or appropriate auth rules
}

match /arenaConfig/{docId} {
  allow read: if true;
  allow write: if true;  // restrict to admin auth if needed
}
```

---

### STEP 8: Final Cleanup

1. **Remove** any remaining references to `"teams"` collection in game-related code
2. **Remove** the `?editable=true` URL param handling from all files
3. **Remove** the `gameStartTime` field from player types (replaced by `playerStartTime`)
4. **Remove** the leader device tip from `GAME_TIPS` in GamePage.tsx
5. **Update** the `GAME_TIPS` tip about "Leader Device" — remove or rephrase
6. **Test** all flows end-to-end

---

## Implementation Order (Dependency-Aware)

```
1. types/game.ts           (no dependencies — foundational)
2. lib/gameApi.ts           (depends on types)
3. GameRegisterPage.tsx     (depends on gameApi, types)
4. GamePage.tsx             (depends on gameApi, types — largest change)
5. AdminArenaPage.tsx       (depends on gameApi, types)
6. AdminDashboardPage.tsx   (depends on types)
7. Firestore rules          (independent)
8. Final cleanup & testing  (after all changes)
```

---

## File Change Summary

| File | Action | Scope |
|---|---|---|
| `client/src/types/game.ts` | MODIFY | Rename types, add `ArenaState` |
| `client/src/lib/gameApi.ts` | MODIFY | New functions, change collection |
| `client/src/pages/public/GameRegisterPage.tsx` | MODIFY | Single-player labels, single link, arena check |
| `client/src/pages/public/GamePage.tsx` | MODIFY | **Major** — remove editable, per-player timing, arena state |
| `client/src/pages/admin/AdminArenaPage.tsx` | MODIFY | Arena state management, 30-min timer, celebration |
| `client/src/pages/admin/AdminDashboardPage.tsx` | MODIFY | Labels, single link, collection change |
| `client/src/components/games/SudokuGame.tsx` | NO CHANGE | — |
| `client/src/components/games/SlidingPuzzle.tsx` | NO CHANGE | — |
| `client/src/App.tsx` | NO CHANGE | Routes remain the same |
