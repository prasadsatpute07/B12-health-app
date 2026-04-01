# 🩺 B12 Health Tracker — Backend

Production-ready backend for the **B12 Health Tracker React Native app** ([github.com/prasadsatpute07/B12-health-app](https://github.com/prasadsatpute07/B12-health-app)).

## Architecture

```
Android App  →  Node.js/Express (port 3000)  ←→  PostgreSQL
                        ↕
              Python/FastAPI (port 8000)
              (Rule-based scoring engine)
```

| Service | Technology | Port |
|---|---|---|
| API Gateway | Node.js + Express | 3000 |
| Scoring Engine | Python + FastAPI | 8000 |
| Database | PostgreSQL 16 | 5432 |

## Setup: Persistent Windows Auto-Start

We use PM2 (a production process manager) so the backend **runs automatically in the background every time you turn on your PC**.

### 1. One-Time Setup Script
Right-click `setup.ps1` in the `d:\B12\backend-v2\` folder and select **Run with PowerShell**. 

This script will automatically:
- Install PostgreSQL via winget (if missing)
- Create the database and run all migrations & seed data
- Install Python and Node.js dependencies
- Install PM2 and start both services
- **Register PM2 as a Windows startup service**

> *Note: If the script fails on PostgreSQL, download and install it manually from [postgresql.org](https://www.postgresql.org/download/windows/), use `B12Health` as your password, and run `setup.ps1` again.*

### 2. Daily Management Scripts
In the `d:\B12\backend-v2\` folder, you'll find handy scripts to manage the background services:

- `status.bat` — Double-click to see if the APIs are running.
- `logs.bat` — Double-click to view the live logs from both services.
- `restart.bat` — Double-click if you need to quickly restart everything.

### 3. Manual Verification
Open your browser and check:
```
http://localhost:3000/health  →  Node.js API is alive
http://localhost:8000/health  →  Python API is alive
```

---

## API Reference

All endpoints are prefixed with `/api`. Authenticated routes require `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Register new user, returns JWT |
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| POST | `/api/auth/refresh` | ❌ | Refresh JWT |

### Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/users/profile` | ✅ | Save/update profile (age, gender, diet, conditions) |
| GET | `/api/users/profile` | ✅ | Get own profile |

### Questionnaire
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/questionnaire/questions` | ✅ | Get adaptive question set (filtered by age + gender) |
| POST | `/api/questionnaire/submit` | ✅ | Submit answers → scoring → store ML data |
| GET | `/api/questionnaire/latest` | ✅ | Get most recent assessment result |
| GET | `/api/questionnaire/history` | ✅ | List all past assessments |

#### Submit Payload
```json
{
  "answers": [
    { "questionId": 1, "answerValue": "few_week" },
    { "questionId": 3, "answerValue": "often" }
  ]
}
```

#### Submit Response
```json
{
  "success": true,
  "risk_level": "medium",
  "percentage": 48.5,
  "breakdown": { "diet": 60.0, "neurological": 25.0, "energy": 50.0 },
  "suggestions": ["Consider taking a regular Vitamin B12 supplement."]
}
```

### Daily Check-In
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/checkin/daily` | ✅ | Submit daily 5-score check-in, auto-updates streak |
| GET | `/api/checkin/history?days=7` | ✅ | Fetch history for trend charts |

#### Check-in Payload
```json
{
  "energyScore": 2,
  "fatigueScore": 3,
  "moodScore": 2,
  "sleepScore": 1,
  "focusScore": 2
}
```

### Insights & Notifications
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/insights` | ✅ | Personalized insights from latest assessment + trends |
| POST | `/api/notifications/token` | ✅ | Register Expo push token |

---

## Android App Connection

1. Find your PC's local IP: `ipconfig` → look for **IPv4 Address** (e.g., `192.168.1.5`)
2. In your React Native app (`AppContext.js`), set the base URL:
   ```js
   const BASE_URL = 'http://192.168.1.5:3000';
   ```
3. Make sure your phone and PC are on the **same Wi-Fi network**
4. Test: open `http://192.168.1.5:3000/health` in your phone's browser

---

## Running Tests

```bash
# Node.js tests
cd node-service
npm test

# Python tests
cd python-service
pytest -v
```

---

## ML Data Export

When you're ready to train a model, export the full training dataset:

```sql
SELECT
  aa.user_id, aa.question_id, aa.question_category,
  aa.answer_value, aa.answer_score, aa.question_weight, aa.weighted_score,
  a.age_at_assessment, a.age_group, a.gender, a.diet_type, a.diet_penalty_score,
  a.has_pernicious_anemia, a.takes_metformin,
  a.normalized_score, a.risk_level,
  a.ml_label            -- fill this with ground truth (lab results etc.)
FROM assessment_answers aa
JOIN assessments a ON aa.assessment_id = a.id
ORDER BY aa.answered_at;
```

Save as CSV: `\COPY (...) TO 'training_data.csv' CSV HEADER;`

---

## Project Structure

```
backend-v2/
├── node-service/           Express API Gateway
│   ├── src/
│   │   ├── config/         db.js
│   │   ├── middleware/     auth.js, errorHandler.js
│   │   ├── models/         User, UserProfile, Assessment, AssessmentAnswer, Question, DailyCheckin
│   │   ├── routes/         auth, users, questionnaire, checkin, insights, notifications
│   │   ├── services/       scoringProxy.js
│   │   └── utils/          response.js
│   ├── tests/              auth.test.js
│   └── server.js
├── python-service/         FastAPI Scoring Engine
│   ├── app/
│   │   ├── routers/        scoring.py, trends.py
│   │   ├── schemas/        schemas.py
│   │   └── services/       risk_engine.py, trend_analyzer.py
│   ├── tests/              test_risk_engine.py
│   └── main.py
├── database/
│   ├── migrations/         001_core, 002_questionnaire, 003_checkin_streak
│   └── seeds/              questions_seed.sql (25 adaptive questions)
└── docker-compose.yml
```
