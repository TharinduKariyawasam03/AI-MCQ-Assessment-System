# My Teacher (AI-MCQ-Assessment-System)

An AI powered MCQ assessment system for tuition classes. Teachers enter a paper with its questions and
correct answers, students upload a photo of their answer sheet, and the app marks it and shows each
student the theory behind the questions they got wrong.

Full project documentation: https://claude.ai/code/artifact/0d741801-0039-4751-967f-ee00c133ac6b

## Status

| Phase | Scope | State |
| --- | --- | --- |
| 1 | UI and backend: accounts, classes, syllabus, paper editor, sheet upload, marking, theory feedback, weak-topic statistics | Built |
| 2 | AI integration: reading the sheet from the photo (OpenCV), AI topic tagging, explanations, study plan | Not started. The interface is in `server/src/ai` |

Until phase 2, a student uploads the photo and then copies their answers onto an on-screen bubble grid.
The teacher can check each submission against the photo and correct it.

## Stack

- **client**: React 19, Vite, React Router
- **server**: Node.js, Express 5, Mongoose, JWT auth, Multer uploads
- **database**: MongoDB

## Run it locally

Requires Node.js 20 or newer.

```bash
npm run install:all   # root, server and client packages
npm run seed          # optional demo data
npm run dev           # API on :5000, web app on :5173
```

Open http://localhost:5173.

MongoDB does not need to be installed. When `MONGO_URI` is empty the server starts its own local database
and keeps the data in `server/.data`. The first start downloads the MongoDB binary (about 600 MB), so it
takes a few minutes. To use your own MongoDB or Atlas instead, copy `server/.env.example` to `server/.env`
and set `MONGO_URI`.

### Demo accounts (after `npm run seed`)

| Role | Email | Password |
| --- | --- | --- |
| Teacher | teacher@myteacher.lk | password123 |
| Student | kavindu@myteacher.lk | password123 |
| Student | sanduni@myteacher.lk | password123 |
| Student | tharushi@myteacher.lk | password123 |

Demo class join code: `PHY26A`

## Project structure

```
client/src
  api/          fetch wrapper and data hook
  context/      auth state
  components/   layout, shared UI, bubble grid
  pages/        landing, auth, dashboard, classes, paper editor, results, profile
  styles/       design tokens and global CSS (white and green)
server/src
  config/       environment and database connection
  models/       User, Class, Paper, Submission
  middleware/   auth, uploads, errors
  routes/       auth, users, classes, papers, submissions, analytics
  services/     grading, analytics, access checks
  ai/           AI provider interface and the phase 1 stub
  seed.js       demo data
```

## Integrating the AI (phase 2)

Every AI call goes through `server/src/ai/index.js`. A provider is a module exporting four functions:

| Function | Purpose |
| --- | --- |
| `suggestTopics` | Link each question to a syllabus topic |
| `readAnswerSheet` | Read the chosen option per question from the sheet photo |
| `explainMistake` | Explain a wrong answer to the student |
| `summarizeWeakness` | Turn the weak-topic ranking into a study plan |

Add a provider next to `stubProvider.js`, register it in `index.js`, and set `AI_PROVIDER` in `server/.env`.
Marks are always calculated by `server/src/services/grading.js` from the answer key, never by the AI.
