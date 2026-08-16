# Candidate Intake & Selection Module

Branch: `feature/candidate-selection`

Adds the missing front half of the recruitment funnel to IMS: **Candidate → Application → Selection**, sitting *before* a person becomes an Intern. This module does not touch Offers, Onboarding, Documents, Authentication, Attendance, Tasks, Evaluation, or Certificates — it's fully additive.

## 1. Concept & Lifecycle

A **Candidate** is a person in the recruitment pipeline. They don't get a login/User account — recruitment is managed entirely by HR/Admin on their behalf. A single candidate can apply more than once over time, so **Candidate** and **Application** are separate models:

- **Candidate** — the person and their static profile info (contact details, education, skills, resume).
- **Application** — one specific attempt by a candidate to join one internship program (Department), carrying its own status and history.

```
APPLIED → SHORTLISTED → INTERVIEW → SELECTED
                                   ↘ REJECTED
```

Rules enforced server-side:
- Stages can only move **forward one step at a time** (no skipping, e.g. `applied` can't jump straight to `interview`).
- **Reject** is allowed from any non-terminal stage (`applied`, `shortlisted`, or `interview`).
- `selected` and `rejected` are terminal — no further transitions are permitted once reached.
- Every transition is appended to `statusHistory` with who made the change, when, and an optional note — nothing is overwritten, so the full audit trail survives.

Converting a `selected` application into an actual Intern record is a deliberate manual step for HR (via the existing "Add Intern" flow) — this module does not auto-create Intern/Employee/User records, since that crosses into Onboarding, which is out of scope here.

## 2. Data Model

### Candidate (`server/models/Candidate.js`)
| Field | Notes |
|---|---|
| `fullName`, `email` (unique), `phone` | Contact info |
| `resume` | `{ fileName, filePath, fileSize }` — uploaded via Multer, same validation as the rest of the app (10MB max, pdf/doc/docx/etc.) |
| `education` | `{ degree, institution, branch, graduationYear }` |
| `skills` | Array of strings |
| `applicationDate` | Defaults to when the candidate first entered the pipeline |
| `source` | `referral \| job_portal \| campus \| linkedin \| company_website \| other` |
| `profileSummary` | Free-text notes/bio |
| `isArchived`, `archivedAt` | Soft delete — archiving preserves application history instead of destroying it |
| `createdAt` / `updatedAt` | Automatic timestamps |

Fields were kept to what the brief explicitly asked for — no speculative extra fields were added.

### Application (`server/models/Application.js`)
| Field | Notes |
|---|---|
| `candidate` | ref → Candidate |
| `department` | ref → Department, used as the "internship program" the candidate applied to |
| `positionTitle` | Free-text role label (e.g. "Frontend Development Intern") |
| `status` | `applied \| shortlisted \| interview \| selected \| rejected` |
| `interviewDate` | Set when moved to `interview` |
| `decision`, `decisionAt`, `decisionBy` | Populated only once a terminal decision (`selected`/`rejected`) is made |
| `statusHistory` | Array of `{ status, changedBy, changedByName, note, changedAt }` — the full audit trail |

## 3. API Reference

All routes are prefixed `/api` and require `Authorization: Bearer <token>` with role `hr` or `super_admin`.

```
GET    /candidates                 ?search=&source=&skill=&archived=&sort=&page=&limit=
GET    /candidates/:id             → { candidate, applications }
POST   /candidates                 multipart/form-data (resume upload supported)
PUT    /candidates/:id             multipart/form-data
DELETE /candidates/:id             archives (soft delete)
PUT    /candidates/:id/restore     un-archives

GET    /applications               ?status=&department=&candidate=&search=&sort=&page=&limit=
GET    /applications/:id
POST   /applications                { candidate, department, positionTitle, notes }
PUT    /applications/:id            general field updates (not status)
PUT    /applications/:id/status     { status, note, interviewDate? }  ← the selection workflow endpoint
```

Every response follows the app-wide `{ success, message, data }` shape. Invalid stage transitions return `400` with a clear message (e.g. *"Cannot move an application from 'applied' to 'interview'."*).

## 4. Frontend

| Route | Purpose |
|---|---|
| `/candidates` | Searchable, filterable, sortable candidate table with a pipeline summary banner |
| `/candidates/new` | Full-page candidate intake form (resume upload, education, skills, source) |
| `/candidates/:id` | Candidate profile — contact info, resume link, skills, and a table of every application they've submitted, with actions to edit, archive/restore, or start a new application |
| `/applications` | Kanban-style pipeline board (Applied → Shortlisted → Interview → Selected/Rejected columns), with search and program filter |
| `/applications/:id` | Application detail — candidate summary, current stage, one-click selection actions (Shortlist / Move to Interview / Select / Reject) each behind a confirmation modal with an optional note, plus a full visual status-history timeline |

UI notes:
- Reuses the app's existing design system (`Card`, `Button`, `Badge`, `Table`, `Modal`, `Select`, toasts) so it looks native to the rest of IMS, not bolted on.
- Fully responsive: the candidate table and Kanban board both scroll horizontally on small screens; forms collapse to a single column on mobile.
- Every list/detail view has loading skeletons, empty states, and error states — no blank screens.
- Only `hr` and `super_admin` see the **Candidates** / **Applications** nav items and can reach these routes (enforced by `ProtectedRoute` on the frontend and `authorize()` on the backend — not just hidden nav).

## 5. Testing

```bash
cd server
npm run seed   # now also seeds 5 demo candidates across every pipeline stage
npm test       # includes server/tests/candidate.test.js and application.test.js
```

Covered:
- Candidate CRUD, duplicate-email rejection, archive/restore (confirms the record isn't hard-deleted).
- Application creation starting in `applied`.
- Legal transitions (`applied → shortlisted → interview → selected`) and that each records `statusHistory` + `decision`.
- Illegal transitions are rejected: skipping a stage (`applied → interview`) and acting on a terminal application (`selected → rejected`).

## 6. What Was Intentionally Left Out (Out of Scope)

Per the brief, this module stops at "selected/rejected" and does **not**:
- Auto-create an Intern/User account when an application is marked `selected` (that's Onboarding).
- Send offer letters or manage acceptance (that's Offers).
- Touch Attendance, Tasks, Evaluation, Certificates, or Authentication in any way.

Converting a selected candidate into an active intern remains a manual step through the existing "Add Intern" flow in the Interns module.
