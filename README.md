# Intern Management System (IMS)

A full-stack, production-style internal tool for managing a company's internship program: intern profiles, tasks, attendance, leave, performance reviews, notifications, announcements, documents, certificates, and reports — all behind role-based access control.

---

## 1. Overview

IMS is built as a real internal SaaS product, not a demo. It has four roles (Super Admin, HR, Team Leader, Intern), each with a tailored dashboard and permission set enforced on both the frontend and the backend.

## 2. Features

- JWT authentication with refresh tokens, forgot/reset password, change password
- Role-based access control on every route (frontend + backend)
- Intern, Employee, and Department management (CRUD)
- Task management with a Kanban board, file submissions, and a review/approval workflow
- Attendance check-in/check-out with automatic working-hours calculation
- Leave application and approval workflow
- Performance evaluations (8-metric 1–10 rating system) with auto-computed overall score
- In-app notifications (bell, unread count, mark as read)
- Company-wide announcements targeted by audience/department
- Document upload/download with file-type and size validation
- Auto-generated PDF internship completion certificates
- CSV/JSON exportable reports (interns, attendance, leave, tasks, performance)
- Full audit log of sensitive actions
- Role-specific dashboards with charts (Recharts)
- Responsive, professional UI (Tailwind CSS)

## 3. Tech Stack

**Frontend:** React 18, Vite, React Router, Axios, Tailwind CSS, Lucide icons, Recharts, React Hook Form + Zod, TanStack Query

**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, Multer, Nodemailer, PDFKit, json2csv

## 4. Architecture

```
ims/
├── client/     # React frontend (Vite)
└── server/     # Express backend (REST API)
```

See inline comments in `server/models/` for the database schema, and `server/routes/` for the full API surface (also summarized in section 9 below).

## 5. Installation

### Prerequisites
- Node.js 18+
- MongoDB running locally or a MongoDB Atlas connection string

### Backend

```bash
cd server
npm install
cp .env.example .env
# edit .env — at minimum set MONGODB_URI and two JWT secrets
npm run seed     # populates demo data + demo accounts
npm run dev      # starts the API on http://localhost:5000
```

### Frontend

```bash
cd client
npm install
cp .env.example .env    # VITE_API_URL defaults to http://localhost:5000/api
npm run dev              # starts the app on http://localhost:5173
```

Open `http://localhost:5173` and log in with one of the demo accounts below.

## 6. Environment Variables

### server/.env
| Variable | Description |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Long random strings — **change these** |
| `JWT_ACCESS_EXPIRES` / `JWT_REFRESH_EXPIRES` | Token lifetimes (e.g. `15m`, `7d`) |
| `CLIENT_URL` | Frontend origin, used for CORS and reset-password links |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASSWORD` / `EMAIL_FROM` | SMTP config for password-reset emails. If left blank, emails are logged to the console instead of sent — handy for local development. |

### client/.env
| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API |

Never commit `.env` — only `.env.example` is tracked in git.

## 7. Seed Data / Demo Credentials

Run `npm run seed` inside `server/` to wipe and repopulate the database with departments, employees, interns, tasks, attendance, leave, performance data, and announcements.

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@ims.com | Admin@123 |
| HR | hr@ims.com | Hr@12345 |
| Team Leader | teamlead@ims.com | Lead@123 |
| Team Leader (Web) | weblead@ims.com | Lead@123 |
| Intern | intern@ims.com | Intern@123 |
| Intern 2–5 | intern2@ims.com … intern5@ims.com | Intern@123 |

## 8. User Roles & Permissions

| Capability | Super Admin | HR | Team Leader | Intern |
|---|---|---|---|---|
| Manage interns/employees/departments | ✅ | ✅ | — | — |
| View assigned interns | ✅ | ✅ | ✅ (own team) | — |
| Create/assign tasks | ✅ | ✅ | ✅ | — |
| Update own task status / submit work | — | — | — | ✅ |
| Review task submissions | ✅ | ✅ | ✅ | — |
| Check in/out | — | — | — | ✅ |
| Apply for leave | — | — | — | ✅ |
| Approve/reject leave | ✅ | ✅ | ✅ | — |
| Submit performance evaluation | ✅ | ✅ | ✅ | — |
| View own performance | — | — | — | ✅ |
| Publish announcements | ✅ | ✅ | — | — |
| Generate certificates | ✅ | ✅ | — | — |
| View reports & audit logs | ✅ | ✅ | reports only | — |

## 9. API Overview

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <accessToken>`.

```
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
GET    /auth/me
PUT    /auth/change-password
POST   /auth/forgot-password
PUT    /auth/reset-password/:token

GET    /interns            POST /interns            GET/PUT/DELETE /interns/:id
GET    /employees          POST /employees          GET/PUT/DELETE /employees/:id
GET    /departments        POST /departments        PUT/DELETE /departments/:id

GET    /tasks               POST /tasks              GET/PUT /tasks/:id
PUT    /tasks/:id/status
POST   /tasks/:id/comments
POST   /tasks/:id/submit
PUT    /tasks/:taskId/submissions/:submissionId/review

POST   /attendance/check-in
POST   /attendance/check-out
GET    /attendance
GET    /attendance/summary/:internId?

GET    /leaves              POST /leaves             PUT /leaves/:id/review

GET    /performance         POST /performance

GET    /notifications       PUT /notifications/:id/read     PUT /notifications/read-all

GET    /announcements       POST /announcements      DELETE /announcements/:id

GET    /documents           POST /documents          DELETE /documents/:id

GET    /certificates        POST /certificates/:internId/generate

GET    /reports/interns | attendance | leaves | tasks | performance   (?format=csv|json)

GET    /audit-logs

GET    /dashboard/admin | team-lead | intern
```

Every response follows `{ success, message, data }` (or `{ success, message, errors }` on failure).

## 10. Testing

```bash
cd server
npm test
```

Requires a running MongoDB instance (tests connect using `MONGODB_URI` from `.env`). Covers authentication, protected-route enforcement, and intern CRUD as a baseline — extend `server/tests/` for deeper coverage.

## 11. Deployment Notes

- Set `NODE_ENV=production` and use strong, unique values for `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`.
- Serve `client` as a static build (`npm run build` → `client/dist`) behind a CDN or reverse proxy (e.g. Nginx), with `/api` and `/uploads` proxied to the Node server.
- Point `uploads/` at persistent storage (or migrate to S3/Cloud Storage) since local disk storage doesn't survive container redeploys.
- Put MongoDB behind authentication and network restrictions; use MongoDB Atlas for managed hosting if you don't want to run your own cluster.
- Consider a process manager (PM2) or containerizing the API with Docker for production process supervision.

## 12. What's Implemented vs. Lightweight

This build is fully wired end-to-end: real MongoDB models, real JWT auth, real RBAC, and a React frontend that talks to the live API (no mock data). To keep the initial delivery reviewable, a few areas are intentionally minimal and are good next steps:
- Email delivery is stubbed to console logging unless SMTP credentials are provided.
- The Kanban board lets interns move their own cards via a dropdown rather than full drag-and-drop — swap in a library like `@dnd-kit` if you want true drag-and-drop.
- Only baseline Jest/Supertest tests are included; expand coverage per module as needed.
- No CI/CD pipeline is included — add GitHub Actions or similar for automated testing/deployment.

---

Built following the phased architecture: schemas → auth → core management → tasks → attendance/leave → performance → notifications/announcements → documents/certificates → dashboards/reports → hardening.
