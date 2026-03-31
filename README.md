# 🩺 B12 Health Tracker — Mobile App

A daily-use health companion app for detecting Vitamin B12 deficiency, built with **React Native (Expo)** — runs natively on both **iOS and Android**.

---

## 📁 Project Structure

```
b12-health-app/
├── App.js                          # Entry point
├── app.json                        # Expo config (bundle IDs, permissions, icons)
├── babel.config.js
├── package.json
└── src/
    ├── navigation/
    │   └── AppNavigator.js         # Stack + Bottom Tab navigator
    ├── screens/
    │   ├── OnboardingScreen.js     # Slides + profile setup (age/gender/diet)
    │   ├── QuestionnaireScreen.js  # 20-25 adaptive questions with scoring
    │   ├── ResultsScreen.js        # Risk analysis + category breakdown + suggestions
    │   ├── DashboardScreen.js      # Home — streak, check-in CTA, risk summary
    │   ├── DailyCheckInScreen.js   # 5 daily questions (10 seconds), streak tracking
    │   └── WeeklyProgressScreen.js # 7-day bar charts, pattern alerts, averages
    ├── components/
    │   └── UI.js                   # Reusable components (buttons, chips, cards, badges)
    ├── data/
    │   └── questions.js            # All questions + options + age/gender filters
    ├── utils/
    │   └── riskCalculator.js       # Risk scoring, streak calc, weekly trends
    ├── context/
    │   └── AppContext.js           # Global state (useReducer + AsyncStorage)
    └── theme/
        └── index.js                # Colors, fonts, spacing, radius, shadows
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (iOS/Android)

### Install & Run
```bash
cd b12-health-app
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone.

### Run on Simulator/Emulator
```bash
npx expo start --ios      # Xcode required (macOS only)
npx expo start --android  # Android Studio required
```

---

## 🗺️ App Flow (10 Screens)

```
Splash/Onboarding
   ↓  (slides → profile setup: age, gender, diet)
Questionnaire (20-25 adaptive questions)
   ↓  (personalized by age group + gender)
Results (Risk: LOW / MEDIUM / HIGH)
   ↓
Main App (Bottom Tabs)
   ├── 🏠 Dashboard   — overview, streak, daily CTA, tip
   ├── 📝 Check-in    — 5 daily questions (10 sec), streak reward
   └── 📈 Progress    — 7-day charts, averages, pattern alerts
```

---

## 🧠 Scoring Logic

### Questionnaire Risk Score
- Base penalty per diet type: Vegan (+12), Vegetarian (+8), Pescatarian (+4), Omnivore (0)
- Each question scored by `answer.score × question.weight`
- Final `percentage = totalScore / maxPossible × 100`
- Thresholds: Low < 35%, Medium 35–65%, High > 65%

### Question Adaptation
- **Common Questions**: 10 (shown to everyone)
- **Age-based**: 2–3 questions based on group (15-24, 25-40, 41-60, 60+)
- **Gender-based**: 2–5 questions based on gender (female/male)

### Daily Check-in Scoring
- 5 questions, each scored 0–4
- Scores stored per-day in AsyncStorage
- Trend computed from last 7 days

---

## 🎨 Design System

- **Theme**: Deep navy (`#0A1628`) + electric blue (`#4F8EF7`) + teal accent (`#00D4B4`)
- **Risk Colors**: Green (Low), Amber (Medium), Red (High)
- **Typography**: System fonts, weight-based hierarchy
- **Animations**: Fade + slide on question transitions, spring on result reveal

---

## 💾 State Management

- **AppContext** (React Context + useReducer)
- Persisted to device storage via `AsyncStorage`
- Restores state automatically on app re-open

**Stored data:**
```json
{
  "user":              { "name", "age", "gender", "dietType" },
  "onboardingDone":    true,
  "questionnaireDone": true,
  "riskResult":        { "level", "percentage", "breakdown", "suggestions" },
  "dailyLogs":         [{ "date", "answers", "score" }],
  "streak":            7
}
```

---

## 🔜 Backend Integration (Next Phase)

The app is structured API-ready. When connecting to your **Node.js + Express / Python** backend:

### API Endpoints to build:
```
POST /api/auth/login          # Email / Google login
POST /api/users/profile       # Save user profile
POST /api/questionnaire/submit # Submit answers, receive risk analysis
POST /api/checkin/daily       # Submit daily check-in
GET  /api/checkin/history     # Fetch history for trends
GET  /api/insights            # Server-side personalized insights
POST /api/notifications/token  # Register push token
```

### Replace in `AppContext.js`:
```js
// Current: AsyncStorage.setItem(STORAGE_KEY, state)
// Future:  await api.post('/users/sync', state)
```

---

## 📦 Production Build

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Build for both platforms
eas build --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## 📋 Features Implemented (MVP)

- [x] 3-slide onboarding with profile setup
- [x] Adaptive questionnaire (20-25 questions, age + gender personalized)
- [x] Risk scoring engine (LOW / MEDIUM / HIGH)
- [x] Category-level risk breakdown
- [x] Personalized action suggestions
- [x] Daily check-in (5 questions, 10 seconds)
- [x] Streak tracking with rewards screen
- [x] 7-day trend charts (energy, fatigue, mood, sleep)
- [x] Pattern alerts (e.g., "fatigue reported 3+ days")
- [x] State persistence (survives app close/reopen)
- [x] Medical recommendation for HIGH risk users

## 🔜 Phase 2 (Backend)
- [ ] User authentication (Email / Google)
- [ ] Cloud data sync
- [ ] Push notifications
- [ ] Female health module (period tracking)
- [ ] AI-powered personalized insights
- [ ] Doctor recommendation integration
