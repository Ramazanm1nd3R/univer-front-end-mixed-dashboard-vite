# TaskFlow AI

Smart Task Management with AI Insights.

TaskFlow AI is a React + Flask + SQLite productivity app focused on practical task planning, analytics, and AI-generated recommendations.

## Core Features

- Task dashboard with filtering, sorting, priorities, and status tracking
- Add/Edit task workflows with controlled forms and validation
- Analytics page with trends, heatmap, predictions, and AI insights
- Productivity tools page with Pomodoro timer and quick daily stats
- Profile page with achievements, activity overview, and settings
- Auth flow with verification code support

## Tech Stack

- Frontend: React 19 + React Router + Vite
- Backend: Flask + SQLite
- AI: OpenAI Chat Completions API (`gpt-4o-mini`)

## Local Run

1. Install frontend deps:

```bash
npm install
```

2. Start frontend:

```bash
npm run dev
```

3. Start backend (from `backend/`):

```bash
pip install -r requirements.txt
python server.py
```

## Environment

Create `.env` in project root:

```bash
VITE_API_URL=http://localhost:5001/api
VITE_OPENAI_API_KEY=your_openai_key
```

## Build

```bash
npm run build
```
