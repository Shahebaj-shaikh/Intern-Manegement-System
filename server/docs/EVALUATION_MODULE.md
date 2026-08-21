# Feedback, Mid-Term Evaluation & Performance Module Documentation

## 1. Overview & Architecture

The **Feedback, Mid-Term Evaluation & Performance** module provides an end-to-end framework for assessing intern progress throughout their internship lifecycle.

Key architectural highlights:
- **Dynamic Category Configuration**: Rubrics and scoring categories are completely database-driven (`EvaluationTemplate` and `EvaluationCategory`) rather than hardcoded in application logic.
- **Continuous Feedback**: Regular, lightweight peer and manager feedback with strengths, weaknesses, and improvement suggestions.
- **Formal Mid-Term Evaluations**: Structured reviews supporting dynamic category weights, qualitative feedback, improvement plans, and recommendation classifications.
- **Evaluation Lifecycle & Security**:
  - `draft`: Evaluator can incrementally save progress.
  - `submitted`: Evaluation is submitted for formal review.
  - `finalized`: Evaluation is approved and locked. **Finalized evaluations cannot be modified or silently overwritten.**
- **Version History & Auditing**: Every update generates a version snapshot (`versionHistory`) tracking modifications, timestamps, and author identity.
- **Role-Aware Performance Dashboard**: Aggregates formal evaluation scores, continuous feedback, and **READ-ONLY** metrics from existing `Attendance` and `Task` modules.

---

## 2. Database Models & Schema Design

### 2.1 `EvaluationTemplate` (`models/EvaluationTemplate.js`)
Stores configurable evaluation templates containing dynamic rubric categories.

```javascript
{
  name: String,               // Unique template name (e.g. "Standard Mid-Term Evaluation")
  description: String,
  isDefault: Boolean,         // Default template for new evaluations
  isActive: Boolean,          // Soft delete flag
  createdBy: ObjectId,        // Ref: User
  categories: [
    {
      name: String,           // Category title (e.g. "Technical Skills", "Communication")
      description: String,    // Evaluation guidance for this category
      minScore: Number,       // e.g. 1
      maxScore: Number,       // e.g. 10
      weight: Number,         // e.g. 1.5
      order: Number,          // Display sort order
      isActive: Boolean
    }
  ],
  timestamps: true
}
```

### 2.2 `EvaluationCategory` (`models/EvaluationCategory.js`)
Stores standalone configurable categories for system-wide rubric definitions.

```javascript
{
  name: String,               // Unique category name
  description: String,
  minScore: Number,           // Default: 1
  maxScore: Number,           // Default: 10
  weight: Number,             // Default: 1
  order: Number,
  isActive: Boolean,
  timestamps: true
}
```

### 2.3 `Feedback` (`models/Feedback.js`)
Stores continuous qualitative feedback entries.

```javascript
{
  intern: ObjectId,                  // Ref: Intern (Required)
  author: ObjectId,                  // Ref: User (Required)
  category: String,                  // e.g. "Technical Skills", "General", "Communication"
  strengths: String,
  weaknesses: String,
  improvementSuggestions: String,
  comments: String,                  // Required
  timestamps: true
}
```

### 2.4 `Performance` (`models/Performance.js`)
Stores formal periodic / mid-term evaluations and version snapshots.

```javascript
{
  intern: ObjectId,                  // Ref: Intern (Required)
  evaluator: ObjectId,               // Ref: User (Required)
  template: ObjectId,                // Ref: EvaluationTemplate
  evaluationPeriod: String,          // e.g. "Mid-Term", "Final"
  categoryScores: [
    {
      categoryId: ObjectId,
      categoryName: String,
      score: Number,                 // Evaluator score
      maxScore: Number,              // Maximum allowable score (default 10)
      weight: Number,                // Category multiplier weight
      notes: String                  // Specific notes for this category
    }
  ],
  strengths: String,
  weaknesses: String,
  improvementPlan: String,
  overallRecommendation: String,    // 'exceptional' | 'excellent' | 'satisfactory' | 'needs_improvement' | 'terminate'
  overallScore: Number,              // Calculated weighted score on a 10.0 scale
  status: String,                    // 'draft' | 'submitted' | 'finalized'
  submittedAt: Date,
  finalizedAt: Date,
  finalizedBy: ObjectId,             // Ref: User
  version: Number,                   // Monotonically increasing version number
  versionHistory: [
    {
      version: Number,
      modifiedBy: ObjectId,
      modifiedAt: Date,
      status: String,
      overallScore: Number,
      categoryScores: Array,
      strengths: String,
      weaknesses: String,
      improvementPlan: String,
      overallRecommendation: String,
      changeSummary: String
    }
  ],
  timestamps: true
}
```

---

## 3. Score Calculation Formula

The overall score is computed as a **weighted average** normalized to a 10.0 scale:

$$\text{Overall Score} = \frac{\sum_{i=1}^{n} \left( \frac{\text{score}_i}{\text{maxScore}_i} \times 10 \times \text{weight}_i \right)}{\sum_{i=1}^{n} \text{weight}_i}$$

- Minimum Score: `0.0`
- Maximum Score: `10.0`
- Automatically calculated in controller and Mongoose `pre('save')` hooks.

---

## 4. API Reference

All endpoints require JWT Bearer authentication (`protect` middleware).

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/performance/dashboard/:internId?` | Any (Role-filtered) | Aggregated performance metrics |
| `GET` | `/api/performance/templates` | Any | List evaluation templates |
| `GET` | `/api/performance/templates/:id` | Any | Get template by ID |
| `POST` | `/api/performance/templates` | `super_admin`, `hr` | Create new evaluation template |
| `PUT` | `/api/performance/templates/:id` | `super_admin`, `hr` | Update evaluation template |
| `DELETE`| `/api/performance/templates/:id` | `super_admin`, `hr` | Deactivate evaluation template |
| `GET` | `/api/performance/categories` | Any | List active categories |
| `POST` | `/api/performance/categories` | `super_admin`, `hr` | Create standalone category |
| `PUT` | `/api/performance/categories/:id`| `super_admin`, `hr` | Update category |
| `DELETE`| `/api/performance/categories/:id`| `super_admin`, `hr` | Deactivate category |
| `GET` | `/api/performance/feedback` | Any (Role-filtered) | List feedback entries |
| `POST` | `/api/performance/feedback` | `team_lead`, `hr`, `super_admin` | Submit continuous feedback |
| `GET` | `/api/performance/evaluations` | Any (Role-filtered) | List formal evaluations |
| `GET` | `/api/performance/evaluations/:id` | Any (Verified) | Get evaluation details |
| `POST` | `/api/performance/evaluations` | `team_lead`, `hr`, `super_admin` | Create evaluation (draft/submitted) |
| `PUT` | `/api/performance/evaluations/:id` | `team_lead`, `hr`, `super_admin` | Update unfinalized evaluation |
| `PUT` | `/api/performance/evaluations/:id/finalize` | `team_lead`, `hr`, `super_admin` | Finalize & lock evaluation |
| `GET` | `/api/performance/evaluations/:id/history` | Any (Verified) | Inspect version history snapshots |

---

## 5. RBAC & Security Rules

| Action | Super Admin | HR | Team Leader | Intern |
| :--- | :---: | :---: | :---: | :---: |
| **Manage Templates & Categories** | ✅ | ✅ | ❌ | ❌ |
| **Create Feedback** | ✅ (All) | ✅ (All) | ✅ (Assigned only) | ❌ |
| **View Feedback** | ✅ (All) | ✅ (All) | ✅ (Assigned only) | ✅ (Self only) |
| **Create / Update Evaluation** | ✅ (All) | ✅ (All) | ✅ (Assigned only) | ❌ |
| **Finalize Evaluation** | ✅ (All) | ✅ (All) | ✅ (Assigned only) | ❌ |
| **Modify Finalized Evaluation** | ❌ (Locked) | ❌ (Locked) | ❌ (Locked) | ❌ (Locked) |
| **View Performance Dashboard** | ✅ (All) | ✅ (All) | ✅ (Assigned only) | ✅ (Self only) |
| **View Version History** | ✅ (All) | ✅ (All) | ✅ (Assigned only) | ✅ (Self only) |

### Security Safeguards Implemented:
1. **IDOR Prevention**: `verifyInternAccess()` strictly checks that Team Leaders cannot query or assess interns outside their assigned team, and interns cannot access data belonging to other interns.
2. **Draft Concealment**: Interns cannot view draft evaluations until they are formally `submitted` or `finalized`.
3. **Immutability of Finalized Evaluations**: Once finalized, any `PUT` attempt returns a `400 ApiError` preventing silent overwrites.
4. **Audit Logging**: Every action (`EVALUATION_CREATED`, `EVALUATION_UPDATED`, `EVALUATION_FINALIZED`, `FEEDBACK_CREATED`, `EVALUATION_TEMPLATE_CREATED`) is logged via `auditLogger`.

---

## 6. Read-Only Integration with Attendance and Tasks

The Performance module interacts with `Attendance` and `Task` in a strictly **READ-ONLY** manner:
- `Attendance.countDocuments({ intern: internId })` -> Total logged days
- `Attendance.countDocuments({ intern: internId, status: { $in: ['present', 'half_day'] } })` -> Present count & %
- `Attendance.find({ intern: internId }).select('workingHours')` -> Total hours sum
- `Task.countDocuments({ assignedTo: internId })` -> Total assigned tasks
- `Task.countDocuments({ assignedTo: internId, status: 'completed' })` -> Completed tasks count & %
- `Task.countDocuments({ assignedTo: internId, status: { $in: ['in_progress', 'submitted', 'under_review'] } })` -> In-progress count

No mutation or modification of attendance or task records occurs within the performance module.

---

## 7. Running Tests

To run the evaluation test suite:
```bash
cd server
npm test tests/evaluation.test.js
```

To run all server tests:
```bash
cd server
npm test
```
