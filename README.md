# FocusMate — Academic Productivity & Adaptive Learning Platform 🎓

> **Your Personal Academic Productivity OS** — A full-stack MERN application combining smart task management, syllabus tracking, Pomodoro focus sessions with server-verified timing, learning analytics, and a transparent rule-based study recommendation engine.

---

## 🚀 Live Demo & Video Walkthrough

- 🌐 **Live Deployed App**: [https://focusmate-snowy.vercel.app/](https://focusmate-snowy.vercel.app/)
- 🎥 **Video Demo Walkthrough**: [Watch Video on Google Drive](https://drive.google.com/file/d/1tFB_2dbH65-hQ4sBDqlzBFbNCA8Fgbbg/view?usp=sharing)
- 👤 **1-Click Demo Login**: Click the **"Demo Login"** button on the sign-in screen to instantly explore the dashboard, quizzes, study notes, and focus timer pre-loaded with sample student data.

---

## ✨ Core Features

- 🧠 **Adaptive Recommendation Engine**: Ranks your study tasks using an intelligent multi-factor algorithm based on upcoming deadlines, syllabus weakness, task importance, and delay.
- ⏱️ **Server-Verified Pomodoro Timer**: Anti-cheat duration verification calculated on the server, milestone celebrations, and Web Audio API ambient sounds (Rain, Brown noise).
- 📖 **In-Screen Study Viewer**: Review lecture notes and course study materials side-by-side without leaving your focus session.
- 📚 **Syllabus & Topic Mastery Tracker**: Visual progress bars and topic mastery states (`not started`, `learning`, `revision`, `mastered`) across all enrolled courses.
- 📝 **Server-Graded Quizzes**: Interactive topic quizzes with authoritative backend evaluation and detailed answer explanations.
- 📊 **Productivity Analytics**: Weekly study trends, task completion rates, subject accuracy breakdowns, and peak productivity tracking.
- 🛡️ **Distraction Shield**: Customizable distraction block list to maintain deep focus.

---

## 🧠 Adaptive Recommendation Algorithm

FocusMate calculates a transparent **Priority Score ($0\text{--}100$)** for each task to recommend the highest-impact study item at any moment:

$$\text{Priority Score} = 0.35 D + 0.30 W + 0.20 P + 0.15 A$$

| Factor | Weight | Description |
|---|---|---|
| **$D$ (Deadline Urgency)** | **35%** | Proximity of exam or assignment due date (e.g., $\le 12\text{h} \to 95$, $\le 24\text{h} \to 90$, $> 10\text{d} \to 15$). |
| **$W$ (Topic Weakness)** | **30%** | Derived from quiz accuracy ($100 - \text{accuracy}\%$) and syllabus mastery status. |
| **$P$ (Task Importance)** | **20%** | Combines priority level and academic weighting (Exams: 100, Assignments: 85, Quizzes: 65). |
| **$A$ (Accumulated Delay)** | **15%** | Backlog escalation score for overdue tasks ($\min(100, 30 + \text{daysOverdue} \times 18)$). |

> **Example Output**: *"SQL Joins — revise for 25 minutes today. Your recent quiz accuracy is 33%, and your DBMS assessment is in 2 days."*

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Framer Motion, Recharts, Canvas Confetti |
| **Backend** | Node.js, Express, REST APIs, JSON Web Tokens (JWT), bcryptjs, Cookie-Parser |
| **Database** | MongoDB, Mongoose ODM |
| **Audio** | Web Audio API (real-time brown noise and rain synthesis without external downloads) |
| **Testing** | Node.js native test runner (`node:test`, `node:assert`) |

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- **Node.js** $\ge 18$
- **MongoDB** running locally (`127.0.0.1:27017`) or a MongoDB Atlas connection string

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/Rudra-repo/FocusMate-.git
cd FocusMate-
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 2. Environment Variables
Create a `backend/.env` file:
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/focusmate
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Seed Demo Data (Optional)
Populate sample courses, tasks, quizzes, and focus sessions:
```bash
npm --prefix backend run seed
```
- **Demo Email**: `taly@mail.com`
- **Demo Password**: `focusmate123`

### 4. Run Locally
Run both frontend and backend concurrently:
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend**: [http://localhost:5001](http://localhost:5001)

---

## 📂 Project Structure

```
FocusMate/
├── frontend/                    # React 18 + Vite SPA
│   ├── src/
│   │   ├── components/          # Reusable UI & Layout Components
│   │   ├── context/             # AuthContext & Global State
│   │   ├── pages/               # Dashboard, Plan, Tasks, Subjects, Focus, Quizzes, Analytics
│   │   └── services/            # Axios API client with interceptors
│   ├── tailwind.config.js       # Custom warm pastel theme
│   └── vite.config.js
├── backend/                     # Node.js + Express API
│   ├── src/
│   │   ├── config/              # MongoDB connection
│   │   ├── controllers/         # Route controllers (Auth, Dashboard, Tasks, etc.)
│   │   ├── middleware/          # JWT auth & error handling
│   │   ├── models/              # Mongoose data models
│   │   ├── routes/              # Express API endpoints (/api/v1)
│   │   └── services/            # AdaptivePlanner, Timer, & Analytics services
│   └── tests/                   # Automated backend test suites
├── package.json
└── README.md
```
