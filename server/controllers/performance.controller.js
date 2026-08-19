const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Performance = require('../models/Performance');
const Intern = require('../models/Intern');
const Employee = require('../models/Employee');
const EvaluationTemplate = require('../models/EvaluationTemplate');
const EvaluationCategory = require('../models/EvaluationCategory');
const Feedback = require('../models/Feedback');
const Task = require('../models/Task');
const Attendance = require('../models/Attendance');
const logAction = require('../utils/auditLogger');
const { notify } = require('../services/notification.service');

// Helper to check if a user is authorized to assess/view a given intern
const verifyInternAccess = async (reqUser, internId) => {
  const intern = await Intern.findById(internId);
  if (!intern) throw new ApiError(404, 'Intern not found');

  if (['super_admin', 'hr'].includes(reqUser.role)) {
    return intern;
  }

  if (reqUser.role === 'team_lead') {
    if (!intern.teamLeader || !intern.teamLeader.equals(reqUser.profileRef)) {
      throw new ApiError(403, 'You are not authorized to access this intern.');
    }
    return intern;
  }

  if (reqUser.role === 'intern') {
    if (!intern._id.equals(reqUser.profileRef)) {
      throw new ApiError(403, 'You are not authorized to view this information.');
    }
    return intern;
  }

  throw new ApiError(403, 'Access denied.');
};

// ==========================================
// 1. EVALUATION TEMPLATES & CATEGORIES (CRUD)
// ==========================================

const getTemplates = asyncHandler(async (req, res) => {
  const filter = {};
  if (['intern', 'team_lead'].includes(req.user.role)) {
    filter.isActive = true;
  }
  const templates = await EvaluationTemplate.find(filter).sort('-createdAt');
  res.json(new ApiResponse(200, templates));
});

const getTemplateById = asyncHandler(async (req, res) => {
  const template = await EvaluationTemplate.findById(req.params.id);
  if (!template) throw new ApiError(404, 'Evaluation template not found');
  res.json(new ApiResponse(200, template));
});

const createTemplate = asyncHandler(async (req, res) => {
  const { name, description, categories, isDefault } = req.body;
  if (!name) throw new ApiError(400, 'Template name is required');
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    throw new ApiError(400, 'At least one evaluation category is required');
  }

  // Validate each category in the template
  categories.forEach((cat, index) => {
    if (!cat.name || !cat.name.trim()) {
      throw new ApiError(400, `Category at index ${index} must have a name`);
    }
    if (cat.minScore !== undefined && cat.maxScore !== undefined && cat.minScore > cat.maxScore) {
      throw new ApiError(400, `Category "${cat.name}" has minScore greater than maxScore`);
    }
  });

  if (isDefault) {
    await EvaluationTemplate.updateMany({}, { isDefault: false });
  }

  const template = await EvaluationTemplate.create({
    name: name.trim(),
    description,
    categories,
    isDefault: !!isDefault,
    createdBy: req.user._id,
  });

  await logAction({
    user: req.user._id,
    action: 'EVALUATION_TEMPLATE_CREATED',
    entity: 'EvaluationTemplate',
    entityId: template._id,
    ipAddress: req.ip,
  });

  res.status(201).json(new ApiResponse(201, template, 'Evaluation template created successfully'));
});

const updateTemplate = asyncHandler(async (req, res) => {
  const { name, description, categories, isDefault, isActive } = req.body;
  const template = await EvaluationTemplate.findById(req.params.id);
  if (!template) throw new ApiError(404, 'Evaluation template not found');

  if (name) template.name = name.trim();
  if (description !== undefined) template.description = description;
  if (isActive !== undefined) template.isActive = isActive;
  if (categories && Array.isArray(categories)) {
    categories.forEach((cat, index) => {
      if (!cat.name || !cat.name.trim()) {
        throw new ApiError(400, `Category at index ${index} must have a name`);
      }
      if (cat.minScore !== undefined && cat.maxScore !== undefined && cat.minScore > cat.maxScore) {
        throw new ApiError(400, `Category "${cat.name}" has minScore greater than maxScore`);
      }
    });
    template.categories = categories;
  }

  if (isDefault) {
    await EvaluationTemplate.updateMany({ _id: { $ne: template._id } }, { isDefault: false });
    template.isDefault = true;
  }

  await template.save();

  await logAction({
    user: req.user._id,
    action: 'EVALUATION_TEMPLATE_UPDATED',
    entity: 'EvaluationTemplate',
    entityId: template._id,
    ipAddress: req.ip,
  });

  res.json(new ApiResponse(200, template, 'Evaluation template updated successfully'));
});

const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await EvaluationTemplate.findById(req.params.id);
  if (!template) throw new ApiError(404, 'Evaluation template not found');

  // Soft delete / deactivate
  template.isActive = false;
  await template.save();

  await logAction({
    user: req.user._id,
    action: 'EVALUATION_TEMPLATE_DEACTIVATED',
    entity: 'EvaluationTemplate',
    entityId: template._id,
    ipAddress: req.ip,
  });

  res.json(new ApiResponse(200, null, 'Evaluation template deactivated'));
});

// Standalone Category helpers for configuration
const getCategories = asyncHandler(async (req, res) => {
  const categories = await EvaluationCategory.find({ isActive: true }).sort('order createdAt');
  res.json(new ApiResponse(200, categories));
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description, minScore, maxScore, weight, order } = req.body;
  if (!name) throw new ApiError(400, 'Category name is required');

  const category = await EvaluationCategory.create({
    name: name.trim(),
    description,
    minScore: minScore !== undefined ? minScore : 1,
    maxScore: maxScore !== undefined ? maxScore : 10,
    weight: weight !== undefined ? weight : 1,
    order: order || 0,
  });

  res.status(201).json(new ApiResponse(201, category, 'Evaluation category created'));
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await EvaluationCategory.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) throw new ApiError(404, 'Category not found');
  res.json(new ApiResponse(200, category, 'Category updated'));
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await EvaluationCategory.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!category) throw new ApiError(404, 'Category not found');
  res.json(new ApiResponse(200, null, 'Category deactivated'));
});

// ==========================================
// 2. CONTINUOUS FEEDBACK
// ==========================================

const getFeedback = asyncHandler(async (req, res) => {
  const { intern, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (req.user.role === 'intern') {
    filter.intern = req.user.profileRef;
  } else if (req.user.role === 'team_lead') {
    if (intern) {
      await verifyInternAccess(req.user, intern);
      filter.intern = intern;
    } else {
      // Find all interns assigned to this team leader
      const assignedInterns = await Intern.find({ teamLeader: req.user.profileRef }).select('_id');
      filter.intern = { $in: assignedInterns.map((i) => i._id) };
    }
  } else if (intern) {
    filter.intern = intern;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [feedbacks, total] = await Promise.all([
    Feedback.find(filter)
      .populate('intern', 'fullName email')
      .populate('author', 'email profileRef')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit)),
    Feedback.countDocuments(filter),
  ]);

  // Populate author profile details
  const populatedFeedbacks = await Promise.all(
    feedbacks.map(async (fb) => {
      const fbObj = fb.toObject();
      if (fb.author && fb.author.profileRef) {
        const emp = await Employee.findById(fb.author.profileRef).select('fullName designation');
        fbObj.authorDetails = emp || { fullName: fb.author.email };
      }
      return fbObj;
    })
  );

  res.json(new ApiResponse(200, { feedbacks: populatedFeedbacks, total, page: Number(page), pages: Math.ceil(total / limit) }));
});

const createFeedback = asyncHandler(async (req, res) => {
  const { intern, category, strengths, weaknesses, improvementSuggestions, comments } = req.body;
  if (!intern || !comments) {
    throw new ApiError(400, 'Intern and comments are required.');
  }

  // IDOR & Authorization check
  const internDoc = await verifyInternAccess(req.user, intern);

  const feedback = await Feedback.create({
    intern: internDoc._id,
    author: req.user._id,
    authorModel: 'User',
    category: category || 'General',
    strengths: strengths || '',
    weaknesses: weaknesses || '',
    improvementSuggestions: improvementSuggestions || '',
    comments: comments.trim(),
  });

  // Notify Intern
  await notify({
    user: internDoc.user,
    type: 'new_feedback',
    title: 'New Feedback Received',
    message: `You have received new feedback for ${category || 'General'}.`,
    link: '/performance',
  });

  await logAction({
    user: req.user._id,
    action: 'FEEDBACK_CREATED',
    entity: 'Feedback',
    entityId: feedback._id,
    ipAddress: req.ip,
  });

  res.status(201).json(new ApiResponse(201, feedback, 'Feedback submitted successfully'));
});

// ==========================================
// 3. MID-TERM & PERIODIC EVALUATIONS
// ==========================================

const getEvaluations = asyncHandler(async (req, res) => {
  const { intern, period, status, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (req.user.role === 'intern') {
    filter.intern = req.user.profileRef;
    // Interns only see submitted or finalized evaluations
    filter.status = { $in: ['submitted', 'finalized'] };
  } else if (req.user.role === 'team_lead') {
    if (intern) {
      await verifyInternAccess(req.user, intern);
      filter.intern = intern;
    } else {
      const assignedInterns = await Intern.find({ teamLeader: req.user.profileRef }).select('_id');
      filter.intern = { $in: assignedInterns.map((i) => i._id) };
    }
  } else if (intern) {
    filter.intern = intern;
  }

  if (period) filter.evaluationPeriod = period;
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [evaluations, total] = await Promise.all([
    Performance.find(filter)
      .populate('intern', 'fullName email department teamLeader')
      .populate('evaluator', 'email profileRef role')
      .populate('finalizedBy', 'email')
      .populate('template', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit)),
    Performance.countDocuments(filter),
  ]);

  // Enrich evaluator employee name
  const populated = await Promise.all(
    evaluations.map(async (ev) => {
      const obj = ev.toObject();
      if (ev.evaluator && ev.evaluator.profileRef) {
        const emp = await Employee.findById(ev.evaluator.profileRef).select('fullName designation');
        obj.evaluatorDetails = emp || { fullName: ev.evaluator.email };
      }
      return obj;
    })
  );

  res.json(new ApiResponse(200, { evaluations: populated, total, page: Number(page), pages: Math.ceil(total / limit) }));
});

const getEvaluationById = asyncHandler(async (req, res) => {
  const evaluation = await Performance.findById(req.params.id)
    .populate('intern', 'fullName email department teamLeader')
    .populate('evaluator', 'email profileRef role')
    .populate('finalizedBy', 'email')
    .populate('template', 'name categories')
    .populate('versionHistory.modifiedBy', 'email');

  if (!evaluation) throw new ApiError(404, 'Evaluation not found');

  // Verify access
  await verifyInternAccess(req.user, evaluation.intern._id);

  // If intern, hide draft
  if (req.user.role === 'intern' && evaluation.status === 'draft') {
    throw new ApiError(403, 'This evaluation is not yet available for viewing.');
  }

  const obj = evaluation.toObject();
  if (evaluation.evaluator && evaluation.evaluator.profileRef) {
    const emp = await Employee.findById(evaluation.evaluator.profileRef).select('fullName designation');
    obj.evaluatorDetails = emp || { fullName: evaluation.evaluator.email };
  }

  res.json(new ApiResponse(200, obj));
});

const createEvaluation = asyncHandler(async (req, res) => {
  const {
    intern,
    template,
    evaluationPeriod,
    categoryScores,
    strengths,
    weaknesses,
    improvementPlan,
    overallRecommendation,
    status = 'draft',
  } = req.body;

  if (!intern) throw new ApiError(400, 'Intern is required');
  if (!evaluationPeriod) throw new ApiError(400, 'Evaluation period is required (e.g. Mid-Term)');
  if (!categoryScores || !Array.isArray(categoryScores) || categoryScores.length === 0) {
    throw new ApiError(400, 'At least one category score is required');
  }

  // Verify evaluator authorization for intern
  const internDoc = await verifyInternAccess(req.user, intern);

  // Validate category scores
  for (const item of categoryScores) {
    if (!item.categoryName || !item.categoryName.trim()) {
      throw new ApiError(400, 'Each category score must have a categoryName');
    }
    const scoreVal = Number(item.score);
    const maxVal = item.maxScore !== undefined ? Number(item.maxScore) : 10;
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > maxVal) {
      throw new ApiError(400, `Score for "${item.categoryName}" must be between 0 and ${maxVal}`);
    }
  }

  const newStatus = ['draft', 'submitted', 'finalized'].includes(status) ? status : 'draft';

  // Calculate overallScore
  let totalWeighted = 0;
  let totalWeight = 0;
  categoryScores.forEach((item) => {
    const weight = item.weight || 1;
    const max = item.maxScore || 10;
    const normalized = (item.score / max) * 10;
    totalWeighted += normalized * weight;
    totalWeight += weight;
  });
  const calculatedOverallScore = totalWeight > 0 ? Number((totalWeighted / totalWeight).toFixed(2)) : 0;

  const initialSnapshot = {
    version: 1,
    modifiedBy: req.user._id,
    modifiedAt: new Date(),
    status: newStatus,
    overallScore: calculatedOverallScore,
    categoryScores,
    strengths: strengths || '',
    weaknesses: weaknesses || '',
    improvementPlan: improvementPlan || '',
    overallRecommendation: overallRecommendation || 'satisfactory',
    changeSummary: 'Initial evaluation created',
  };

  const evaluation = new Performance({
    intern: internDoc._id,
    evaluator: req.user._id,
    evaluatedBy: req.user.profileRef, // for backwards compatibility
    template: template || null,
    evaluationPeriod: evaluationPeriod.trim(),
    categoryScores,
    strengths: strengths || '',
    weaknesses: weaknesses || '',
    improvementPlan: improvementPlan || '',
    overallRecommendation: overallRecommendation || 'satisfactory',
    overallScore: calculatedOverallScore,
    status: newStatus,
    submittedAt: newStatus === 'submitted' ? new Date() : null,
    finalizedAt: newStatus === 'finalized' ? new Date() : null,
    finalizedBy: newStatus === 'finalized' ? req.user._id : null,
    version: 1,
    versionHistory: [initialSnapshot],
  });

  await evaluation.save();

  if (newStatus !== 'draft') {
    await notify({
      user: internDoc.user,
      type: 'new_evaluation',
      title: `${evaluationPeriod} Evaluation`,
      message: `Your ${evaluationPeriod} evaluation has been ${newStatus}.`,
      link: '/performance',
    });
  }

  await logAction({
    user: req.user._id,
    action: 'EVALUATION_CREATED',
    entity: 'Performance',
    entityId: evaluation._id,
    metadata: { status: newStatus, evaluationPeriod },
    ipAddress: req.ip,
  });

  res.status(201).json(new ApiResponse(201, evaluation, 'Evaluation created successfully'));
});

const updateEvaluation = asyncHandler(async (req, res) => {
  const {
    categoryScores,
    strengths,
    weaknesses,
    improvementPlan,
    overallRecommendation,
    evaluationPeriod,
    status,
    changeSummary,
  } = req.body;

  const evaluation = await Performance.findById(req.params.id);
  if (!evaluation) throw new ApiError(404, 'Evaluation not found');

  // Verify access
  await verifyInternAccess(req.user, evaluation.intern);

  // CRITICAL SECURITY RULE: Finalized evaluations cannot be silently overwritten or modified
  if (evaluation.status === 'finalized') {
    throw new ApiError(400, 'Finalized evaluations cannot be modified. Evaluation is locked.');
  }

  // Evaluator check: Team leads can only edit their own evaluations or draft evaluations for their interns
  if (req.user.role === 'team_lead') {
    if (!evaluation.evaluator.equals(req.user._id)) {
      throw new ApiError(403, 'You can only edit evaluations created by you.');
    }
  }

  // Validate category scores if updating
  if (categoryScores && Array.isArray(categoryScores)) {
    for (const item of categoryScores) {
      if (!item.categoryName || !item.categoryName.trim()) {
        throw new ApiError(400, 'Each category score must have a categoryName');
      }
      const scoreVal = Number(item.score);
      const maxVal = item.maxScore !== undefined ? Number(item.maxScore) : 10;
      if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > maxVal) {
        throw new ApiError(400, `Score for "${item.categoryName}" must be between 0 and ${maxVal}`);
      }
    }
    evaluation.categoryScores = categoryScores;
  }

  if (strengths !== undefined) evaluation.strengths = strengths;
  if (weaknesses !== undefined) evaluation.weaknesses = weaknesses;
  if (improvementPlan !== undefined) evaluation.improvementPlan = improvementPlan;
  if (overallRecommendation !== undefined) evaluation.overallRecommendation = overallRecommendation;
  if (evaluationPeriod !== undefined) evaluation.evaluationPeriod = evaluationPeriod.trim();

  if (status && ['draft', 'submitted'].includes(status)) {
    evaluation.status = status;
    if (status === 'submitted' && !evaluation.submittedAt) {
      evaluation.submittedAt = new Date();
    }
  }

  // Recalculate overall score
  let totalWeighted = 0;
  let totalWeight = 0;
  evaluation.categoryScores.forEach((item) => {
    const weight = item.weight || 1;
    const max = item.maxScore || 10;
    const normalized = (item.score / max) * 10;
    totalWeighted += normalized * weight;
    totalWeight += weight;
  });
  evaluation.overallScore = totalWeight > 0 ? Number((totalWeighted / totalWeight).toFixed(2)) : 0;

  // Append to version history
  evaluation.version = (evaluation.version || 1) + 1;
  const newSnapshot = {
    version: evaluation.version,
    modifiedBy: req.user._id,
    modifiedAt: new Date(),
    status: evaluation.status,
    overallScore: evaluation.overallScore,
    categoryScores: evaluation.categoryScores,
    strengths: evaluation.strengths,
    weaknesses: evaluation.weaknesses,
    improvementPlan: evaluation.improvementPlan,
    overallRecommendation: evaluation.overallRecommendation,
    changeSummary: changeSummary || `Updated to version ${evaluation.version}`,
  };

  evaluation.versionHistory.push(newSnapshot);

  await evaluation.save();

  await logAction({
    user: req.user._id,
    action: 'EVALUATION_UPDATED',
    entity: 'Performance',
    entityId: evaluation._id,
    metadata: { version: evaluation.version, status: evaluation.status },
    ipAddress: req.ip,
  });

  res.json(new ApiResponse(200, evaluation, 'Evaluation updated successfully'));
});

const finalizeEvaluation = asyncHandler(async (req, res) => {
  const evaluation = await Performance.findById(req.params.id);
  if (!evaluation) throw new ApiError(404, 'Evaluation not found');

  if (evaluation.status === 'finalized') {
    throw new ApiError(400, 'Evaluation is already finalized.');
  }

  // Authorization: super_admin or hr can finalize any evaluation; team_lead can finalize if assigned
  if (req.user.role === 'team_lead') {
    await verifyInternAccess(req.user, evaluation.intern);
  }

  evaluation.status = 'finalized';
  evaluation.finalizedAt = new Date();
  evaluation.finalizedBy = req.user._id;

  evaluation.version = (evaluation.version || 1) + 1;
  const snapshot = {
    version: evaluation.version,
    modifiedBy: req.user._id,
    modifiedAt: new Date(),
    status: 'finalized',
    overallScore: evaluation.overallScore,
    categoryScores: evaluation.categoryScores,
    strengths: evaluation.strengths,
    weaknesses: evaluation.weaknesses,
    improvementPlan: evaluation.improvementPlan,
    overallRecommendation: evaluation.overallRecommendation,
    changeSummary: `Evaluation finalized by ${req.user.role.toUpperCase()}`,
  };
  evaluation.versionHistory.push(snapshot);

  await evaluation.save();

  const internDoc = await Intern.findById(evaluation.intern);
  if (internDoc && internDoc.user) {
    await notify({
      user: internDoc.user,
      type: 'evaluation_finalized',
      title: `${evaluation.evaluationPeriod} Evaluation Finalized`,
      message: `Your ${evaluation.evaluationPeriod} performance evaluation has been finalized with an overall score of ${evaluation.overallScore}/10.`,
      link: '/performance',
    });
  }

  await logAction({
    user: req.user._id,
    action: 'EVALUATION_FINALIZED',
    entity: 'Performance',
    entityId: evaluation._id,
    metadata: { overallScore: evaluation.overallScore },
    ipAddress: req.ip,
  });

  res.json(new ApiResponse(200, evaluation, 'Evaluation finalized successfully'));
});

const getEvaluationHistory = asyncHandler(async (req, res) => {
  const evaluation = await Performance.findById(req.params.id)
    .populate('versionHistory.modifiedBy', 'email role')
    .select('version versionHistory intern evaluationPeriod status');

  if (!evaluation) throw new ApiError(404, 'Evaluation not found');

  await verifyInternAccess(req.user, evaluation.intern);

  res.json(new ApiResponse(200, {
    currentVersion: evaluation.version,
    status: evaluation.status,
    history: evaluation.versionHistory,
  }));
});

// ==========================================
// 4. PERFORMANCE DASHBOARD (READ-ONLY CONSUMPTION)
// ==========================================

const getDashboard = asyncHandler(async (req, res) => {
  let targetInternId = req.params.internId;

  if (req.user.role === 'intern') {
    targetInternId = req.user.profileRef;
  } else if (!targetInternId) {
    // For HR/SuperAdmin/TeamLead, if no intern specified and teamLead, pick first assigned intern
    if (req.user.role === 'team_lead') {
      const firstIntern = await Intern.findOne({ teamLeader: req.user.profileRef });
      if (firstIntern) targetInternId = firstIntern._id;
    } else {
      const firstIntern = await Intern.findOne({ status: 'active' });
      if (firstIntern) targetInternId = firstIntern._id;
    }
  }

  if (!targetInternId) {
    return res.json(
      new ApiResponse(200, {
        overallScore: 0,
        categoryScores: [],
        attendance: { percentage: 0, present: 0, total: 0, workingHours: 0 },
        tasks: { percentage: 0, completed: 0, inProgress: 0, total: 0 },
        feedback: [],
        strengths: [],
        weaknesses: [],
        improvementAreas: [],
        evaluations: [],
      })
    );
  }

  // Verify access for this target intern
  const internDoc = await verifyInternAccess(req.user, targetInternId);

  // 1. Evaluations data
  const evalFilter = { intern: targetInternId };
  if (req.user.role === 'intern') {
    evalFilter.status = { $in: ['submitted', 'finalized'] };
  }
  const evaluations = await Performance.find(evalFilter)
    .populate('evaluator', 'email profileRef')
    .sort('-createdAt');

  let overallScore = 0;
  const categoryAgg = {};
  const strengthsList = [];
  const weaknessesList = [];
  const improvementList = [];

  if (evaluations.length > 0) {
    const totalScoreSum = evaluations.reduce((acc, ev) => acc + (ev.overallScore || 0), 0);
    overallScore = Number((totalScoreSum / evaluations.length).toFixed(2));

    // Aggregate category scores
    evaluations.forEach((ev) => {
      if (ev.strengths) strengthsList.push(ev.strengths);
      if (ev.weaknesses) weaknessesList.push(ev.weaknesses);
      if (ev.improvementPlan) improvementList.push(ev.improvementPlan);

      if (ev.categoryScores && Array.isArray(ev.categoryScores)) {
        ev.categoryScores.forEach((cat) => {
          if (!categoryAgg[cat.categoryName]) {
            categoryAgg[cat.categoryName] = { name: cat.categoryName, total: 0, count: 0, maxScore: cat.maxScore || 10 };
          }
          categoryAgg[cat.categoryName].total += cat.score;
          categoryAgg[cat.categoryName].count += 1;
        });
      }
    });
  }

  const categoryScores = Object.values(categoryAgg).map((c) => ({
    name: c.name,
    score: Number((c.total / c.count).toFixed(1)),
    maxScore: c.maxScore,
  }));

  // 2. Attendance Summary (READ-ONLY from Attendance model)
  const attendanceTotal = await Attendance.countDocuments({ intern: targetInternId });
  const attendancePresent = await Attendance.countDocuments({
    intern: targetInternId,
    status: { $in: ['present', 'half_day'] },
  });
  const attendanceRecords = await Attendance.find({ intern: targetInternId }).select('workingHours');
  const totalWorkingHours = attendanceRecords.reduce((acc, curr) => acc + (curr.workingHours || 0), 0);
  const attendancePercentage = attendanceTotal ? Number(((attendancePresent / attendanceTotal) * 100).toFixed(1)) : 0;

  // 3. Task Completion Summary (READ-ONLY from Task model)
  const taskTotal = await Task.countDocuments({ assignedTo: targetInternId });
  const taskCompleted = await Task.countDocuments({ assignedTo: targetInternId, status: 'completed' });
  const taskInProgress = await Task.countDocuments({
    assignedTo: targetInternId,
    status: { $in: ['in_progress', 'submitted', 'under_review'] },
  });
  const taskPercentage = taskTotal ? Number(((taskCompleted / taskTotal) * 100).toFixed(1)) : 0;

  // 4. Feedback
  const recentFeedback = await Feedback.find({ intern: targetInternId })
    .populate('author', 'email profileRef')
    .sort('-createdAt')
    .limit(10);

  recentFeedback.forEach((fb) => {
    if (fb.strengths) strengthsList.push(fb.strengths);
    if (fb.weaknesses) weaknessesList.push(fb.weaknesses);
    if (fb.improvementSuggestions) improvementList.push(fb.improvementSuggestions);
  });

  res.json(
    new ApiResponse(200, {
      intern: {
        _id: internDoc._id,
        fullName: internDoc.fullName,
        email: internDoc.email,
        department: internDoc.department,
      },
      overallScore,
      categoryScores,
      attendance: {
        percentage: attendancePercentage,
        present: attendancePresent,
        total: attendanceTotal,
        workingHours: Number(totalWorkingHours.toFixed(1)),
      },
      tasks: {
        percentage: taskPercentage,
        completed: taskCompleted,
        inProgress: taskInProgress,
        total: taskTotal,
      },
      feedback: recentFeedback,
      strengths: [...new Set(strengthsList.filter(Boolean))],
      weaknesses: [...new Set(weaknessesList.filter(Boolean))],
      improvementAreas: [...new Set(improvementList.filter(Boolean))],
      evaluationsCount: evaluations.length,
      recentEvaluations: evaluations.slice(0, 5),
    })
  );
});

module.exports = {
  // Templates & Categories
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,

  // Feedback
  getFeedback,
  createFeedback,

  // Evaluations
  getEvaluations,
  getEvaluationById,
  createEvaluation,
  updateEvaluation,
  finalizeEvaluation,
  getEvaluationHistory,

  // Dashboard
  getDashboard,
};
