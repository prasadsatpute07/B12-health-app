# MVP UI Improvements (Startup-ready)

This plan implements MVP-relevant UX upgrades to make the app feel **professional, calmer for health users, and more engaging** without adding major new backend features.

## Scope (MVP-relevant)
1. Micro-interactions (haptics) on key actions.
2. Persistent disclaimer strip (educational only) on major screens.
3. Progress screen chart explanation (simple tooltip/legend).
4. Better empty states (with a clear CTA).
5. Questionnaire perceived speed: “questions left” + light guidance.
6. Profile save UX: inline feedback instead of “silent save” (alerts minimized).

## Out of Scope (for this MVP pass)
- Custom font loading (expo-font) and illustration/Lottie assets.
- Push notifications reminders (Expo Notifications + backend scheduling).
- Full settings system (user preferences) for interstitial frequency.

## Implementation Steps (code changes)

### 1) Add a small feedback helper (haptics)
**New file:** `src/components/Feedback.js`
- Uses `expo-haptics`.
- Exposes functions:
  - `tap()` (light impact)
  - `select()` (selection)
  - `success()` (notification success)
  - `error()` (notification error)

**Update:**
- `src/screens/QuestionnaireScreen.js`
  - Call `tap()` or `select()` when an option is selected.
  - Call `success()` when the user hits `Continue` on interstitials.
- `src/screens/DailyCheckInScreen.js`
  - Call `select()` on option pick.
  - Call `success()` when completion screen opens.
- `src/screens/OnboardingScreen.js` (profile form)
  - Call `success()` when `handleStart` completes.
- `src/screens/ProfileScreen.js`
  - Call `success()` after save profile.
  - Call `success()` after change password.

### 2) Add a reusable disclaimer strip
**New file:** `src/components/DisclaimerStrip.js`
- A compact component:
  - icon (e.g. `⚕️`),
  - text: “Educational only. Not a medical diagnosis.”

**Update screens:**
- `src/screens/DashboardScreen.js`
  - show near bottom (before shortcuts).
- `src/screens/WeeklyProgressScreen.js`
  - show before risk context.
- `src/screens/ResultsScreen.js` and `src/screens/ScorePreviewScreen.js`
  - ensure disclaimer is present (if already present, standardize styling).

### 3) Progress charts: add simple explanation
**Update:** `src/screens/WeeklyProgressScreen.js`
- Add a tiny legend text above charts:
  - “Higher bars = better daily scores this week”
  - or for fatigue: “Higher bars = less fatigue”
- Optionally a “?” icon that toggles a short explanation (no heavy tooltip libs).

### 4) Empty states: add actionable CTA
**Update:** `src/screens/WeeklyProgressScreen.js`
- If `!hasTrend`:
  - show “No rhythm yet”
  - add a primary/secondary button:
    - “Go to Daily check-in” → navigation to `DailyCheckIn`

**Update:** `src/screens/DashboardScreen.js` (when no daily logs and no risk tip)
- Ensure there is always at least one clear CTA card (you already have one for check-in; keep it as primary).

### 5) Questionnaire: add “time left / questions left”
**Update:** `src/screens/QuestionnaireScreen.js`
- Add a small line under the progress bar:
  - `X questions left • ~Y minutes remaining`
- Use a stable estimate:
  - example formula: `minutes = Math.max(1, Math.ceil(remaining / 12))`
- When interstitial displays, change line to:
  - `Short insight • then continue`

### 6) Profile save UX: inline feedback
**Update:** `src/screens/ProfileScreen.js`
- Keep password change behavior.
- For profile save:
  - replace (or supplement) `Alert.alert('Saved', ...)` with a lightweight inline success banner:
    - “Saved successfully”
  - Keep MVP simple: do not add a full toast library.

## Visual Consistency Checklist
- All new text uses theme tokens: `colors.textPrimary/textSecondary/textMuted`.
- All new buttons reuse existing `PrimaryButton` / `SecondaryButton`.
- No additional libraries except `expo-haptics` (already in dependencies).

## Acceptance Criteria
- Dashboard feels less cluttered and more “product-like”.
- Progress graphs feel cleaner and explain themselves.
- Profile edit is fully editable for MVP data.
- Questionnaire includes interstitials every ~3 and includes “why” content.
- Empty states have clear next actions.

