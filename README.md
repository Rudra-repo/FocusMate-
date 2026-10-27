# FocusMate — Academic Productivity & Adaptive Learning Platform 🎓

> **Your Personal Academic Productivity OS** — A full-stack MERN application combining task management, syllabus tracking, Pomodoro focus sessions with server-verified timing, learning analytics, and a rule-based adaptive study recommendation engine.

Designed with a warm peach (`#FFF0E8`), coral (`#FF8B76`), orange (`#FF9856`), and cream pastel palette, soft rounded cards, and an intuitive student workflow inspired by modern academic operating systems.

---

## 🚀 Live Demo & Video Walkthrough

- 🌐 **Live Deployed App**: [https://focusmate-snowy.vercel.app/](https://focusmate-snowy.vercel.app/)
- 🎥 **Video Demo Walkthrough**: [Watch Video on Google Drive](https://drive.google.com/file/d/1tFB_2dbH65-hQ4sBDqlzBFbNCA8Fgbbg/view?usp=sharing)
- 👤 **1-Click Demo Login**: Click the **"Demo Login"** button on the sign-in screen to instantly explore sample student **Taly**'s dashboard, quizzes, study notes, and Pomodoro focus sessions.

---

## 📸 Visual Design & Reference Alignment

FocusMate faithfully reproduces the warm pastel aesthetic and dashboard layout:
- **Rounded Navigation Rail**: Floating coral-orange sidebar (`#FF9856` / `#FF8B76`) with compact active pills and tooltips.
- **Illustrated Welcome Banner**: "Good morning, Taly!" personalized greeting, sunrise skyline vector art, "Ready!" action trigger, and integrated **Mini Calendar** with highlighted active dates and deadline markers.
- **Weekly Productivity Analysis**: Recharts bar chart showing daily focused minutes/hours for S, S, M, Tu, W, Th, F with a 10h target dashed line.
- **Task Performance Ring**: Circular indicator displaying daily completion percentage (72% productive hours).
- **Distraction Block List**: Telegram, Instagram, and X/Twitter distraction shielding with quick removal and addition.
- **Today's Tasks**: Rounded custom checkboxes, category tag indicators (• Work, • Study), due time stamps, and an integrated bottom quick-add bar.
- **Centerpiece Pomodoro Timer**: Gradient card (`#FFE7A0` to `#FF9856`), course dropdown ("Math practice"), animated hourglass graphic, `[-] 25:00 [+]` steppers, and "Start / Pause / Reset" controls.
- **Blooming Flower Celebration**: Animated blossom and confetti milestone celebration upon completing focus sessions.
- **Zen Focus Mood**: Distraction-free workspace mode with Web Audio API ambient noise generator (Rainfall, Brown noise).

---

## 🧠 Adaptive Study Recommendation Engine

FocusMate differentiates itself from simple to-do list apps through its **transparent, rule-based recommendation engine**.

### Mathematical Model
$$\text{Priority Score} = 0.35 D + 0.30 W + 0.20 P + 0.15 A$$

Where each factor is normalized to a $0\text{--}100$ scale:
- **$D$ (Deadline Urgency, 35%)**: Proximity of the exam or assignment due date.
  - $\le 0\text{h}$ (Overdue): $100$
  - $\le 12\text{h}$: $95$
  - $\le 24\text{h}$: $90$
  - $\le 48\text{h}$: $75$
  - $\le 5\text{d}$: $55$
  - $> 10\text{d}$: $15$
- **$W$ (Topic Weakness, 30%)**: Derived from actual quiz performance or self-reported syllabus mastery.
  - $\text{Weakness} = 100 - \text{average quiz accuracy \%}$ (e.g., $33\%$ accuracy $\to W = 67$).
  - If unattempted: evaluated by difficulty level and status (`revision` = 80, `learning` = 60).
- **$P$ (Task Importance, 20%)**: Combines priority level and academic impact.
  - High priority = 100, Medium = 65, Low = 35.
  - Exam = 100, Assignment = 85, Revision = 75, Quiz = 65, Study = 45.
- **$A$ (Accumulated Delay / Overdue Status, 15%)**:
  - Overdue tasks accumulate a backlog penalty: $\min(100, 30 + \text{daysOverdue} \times 18)$.

### Example Transparent Recommendation Output:
> *"SQL Joins — revise for 25 minutes today. Your recent quiz accuracy is 33%, and your DBMS assessment is in 2 days."*

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS, Lucide React, Framer Motion, Recharts, Canvas Confetti |
| **Backend** | Node.js, Express, REST APIs, JSON Web Tokens (JWT), bcryptjs, Cookie-Parser, Morgan |
| **Database** | MongoDB, Mongoose ODM |
| **Audio** | Web Audio API (real-time brown noise and rain synthesis without external downloads) |
| **Testing** | Node.js native test runner (`node:test`, `node:assert`) |

---

## 🗄️ Database Schema & Entities

The application enforces separate collections scoped strictly to the authenticated `userId`:
- `users`: Credentials, name, avatar, dailyGoalMinutes, preferences (durations, blocked apps, theme), streak counters.
- `subjects`: Course names, codes (e.g. `CS-302`), custom colors, target hours, descriptions.
- `topics`: Syllabus topics, mastery levels (`not_started`, `learning`, `revision`, `mastered`), notes, quiz accuracy.
- `tasks`: Title, description, course, dueAt, priority (`low`, `medium`, `high`), status (`pending`, `in_progress`, `completed`), estimatedMinutes, actualMinutes.
- `focusSessions`: Server-verified timer records with `startedAt`, `endedAt`, `durationSeconds` (calculated on server), `elapsedMinutes`, `completed`, and notes.
- `quizzes`: Subject/topic assessments with multiple-choice questions, difficulty, and time limits.
- `quizAttempts`: Student submissions graded **authoritatively on the server** to avoid exposing correct answers client-side.
- `goals`: Academic target metrics (e.g. 20 study hours this week).

---

## 📡 REST API Reference (`/api/v1`)

### Authentication (`/auth`)
- `POST /api/v1/auth/register` — Create a new student account
- `POST /api/v1/auth/login` — Authenticate and receive JWT cookie/token
- `POST /api/v1/auth/logout` — Clear session cookies
- `GET /api/v1/auth/me` — Get current authenticated student profile
- `PATCH /api/v1/auth/preferences` — Update timer durations, theme, and block list
- `PATCH /api/v1/auth/profile` — Update name, avatar, or daily study target

### Dashboard (`/dashboard`)
- `GET /api/v1/dashboard` — Unified payload: greetings, today's tasks, weekly chart, circular progress, block list, top adaptive recommendation.

### Tasks (`/tasks`)
- `GET /api/v1/tasks` — List tasks with filters (`status`, `priority`, `subjectId`, `search`)
- `POST /api/v1/tasks` — Create task
- `PATCH /api/v1/tasks/:id` — Update or toggle task status
- `DELETE /api/v1/tasks/:id` — Delete task

### Subjects & Topics (`/subjects` & `/topics`)
- `GET /api/v1/subjects` — List courses with accumulated hours and topic counts
- `POST /api/v1/subjects` — Create new course
- `GET /api/v1/subjects/:id` — Course details with syllabus topics
- `POST /api/v1/topics` — Add topic to subject
- `PATCH /api/v1/topics/:id` — Update topic mastery level or notes

### Focus Sessions (`/focus-sessions`)
- `POST /api/v1/focus-sessions` — Record session with `startedAt` and `endedAt` (server computes elapsed duration)
- `GET /api/v1/focus-sessions/history` — Session history log
- `GET /api/v1/focus-sessions/stats` — Study hours today and streak updates

### Quizzes (`/quizzes`)
- `GET /api/v1/quizzes` — Quiz bank (correct answers omitted to prevent cheating)
- `GET /api/v1/quizzes/:id` — Quiz details
- `POST /api/v1/quizzes/:id/attempts` — Submit answers; returns score, correctness, and question explanations
- `GET /api/v1/quizzes/attempts` — Attempt history

### Recommendations & Analytics (`/recommendations` & `/analytics`)
- `GET /api/v1/recommendations` — Scored and ranked adaptive study suggestions
- `GET /api/v1/analytics/overview` — Weekly trends, subject accuracy, weak topics, and peak study day

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- Node.js $\ge$ 18 (Tested on v22.18.0)
- MongoDB running locally on `127.0.0.1:27017` or MongoDB Atlas URI

### 1. Install Dependencies
Run from the root directory:
```bash
# Install root, backend, and frontend packages
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 2. Configure Environment Variables
Copy `.env.example` to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```
Default configuration:
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/focusmate
JWT_SECRET=focusmate_jwt_secret_super_secure_key_2026_academic
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Seed Realistic Demo Student Data
Run the database seeder to populate **Taly's** account matching the mockup:
```bash
npm --prefix backend run seed
```
Demo Credentials:
- **Email**: `taly@mail.com`
- **Password**: `focusmate123`

### 4. Run the Full Stack App
Start both frontend and backend concurrently:
```bash
npm run dev
```
Or start individually:
- **Backend Server**: `npm run server` (runs on `http://localhost:5001`)
- **Frontend Client**: `npm run client` (runs on `http://localhost:5173`)

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Automated Testing

Run the backend verification suite:
```bash
node --test backend/tests/api.test.js
```
Verified test cases:
1. Server-side elapsed duration calculation from `startedAt` and `endedAt`.
2. Rejection of invalid timer timestamps (`endedAt < startedAt`).
3. Adaptive recommendation engine scoring calculation with $D, W, P, A$ factors.
4. Task CRUD operations and authenticated user isolation.
5. Authoritative server-side quiz grading without answer leakage.

---

## 📂 Project Structure

```
focusmate/
├── frontend/                    # React + Vite Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/          # Sidebar, Header, FocusMoodOverlay, MobileNav, Celebration
│   │   │   └── dashboard/       # WelcomeBanner, WeeklyChart, PomodoroCard, etc.
│   │   ├── context/             # AuthContext (JWT, session, preferences)
│   │   ├── pages/               # Overview, Plan, Tasks, Subjects, Focus, Quizzes, Analytics, Settings
│   │   ├── services/            # Axios API client with interceptors
│   │   ├── App.jsx
│   │   ├── index.css            # Tailwind custom colors & glassmorphism
│   │   └── main.jsx
│   ├── tailwind.config.js       # Pastel palette (#FFF0E8, #FF8B76, #FF9856)
│   └── vite.config.js
├── backend/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── config/              # MongoDB connection
│   │   ├── controllers/         # Auth, Dashboard, Tasks, Subjects, Quizzes, etc.
│   │   ├── middleware/          # JWT protect, centralized errorHandler
│   │   ├── models/              # User, Subject, Topic, Task, FocusSession, Quiz, etc.
│   │   ├── routes/              # Express REST routes mounted at /api/v1
│   │   ├── services/            # AdaptivePlannerService, TimerService, AnalyticsService
│   │   ├── utils/               # Database seeder script
│   │   └── app.js               # Express application entry
│   └── tests/                   # Automated test suites
├── package.json
└── README.md
```

---

## 🏆 MVP Completion Checklist

- [x] **Secure Authentication**: Register, Login, Logout with HTTP-only cookies and JWT.
- [x] **Reference-Accurate Dashboard**: Matching peach/coral palette, welcome card with sunset art, mini calendar, weekly chart, circular performance ring, block list, tasks list, and Pomodoro timer.
- [x] **Task & Assignment CRUD**: Filters by status, priority, course, search, and overdue highlighting.
- [x] **Subjects & Topic Mastery**: Syllabus progress tracking with mastery levels (`not_started`, `learning`, `revision`, `mastered`).
- [x] **Server-Verified Pomodoro Timer**: Computes duration from timestamps, records to database, and triggers milestone celebrations.
- [x] **Server-Graded Quizzes**: Explanations and answer keys protected until submission.
- [x] **Adaptive Recommendation Engine**: Multi-factor scoring ($0.35D + 0.30W + 0.20P + 0.15A$) with transparent reasoning.
- [x] **Productivity Analytics**: Focused hours, task completion rate, weekly trends, subject accuracy, and peak days.
- [x] **Zen Focus Mood & Ambient Audio**: Web Audio API ambient sound generator.
- [x] **Data Export & Privacy**: User-scoped queries and JSON data backup.
