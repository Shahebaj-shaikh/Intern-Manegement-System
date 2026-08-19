const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Setting = require('../models/Setting');
const Intern = require('../models/Intern');
const Performance = require('../models/Performance');
const Document = require('../models/Document');
const Completion = require('../models/Completion');
const Alumni = require('../models/Alumni');
const Certificate = require('../models/Certificate');
const logAction = require('../utils/auditLogger');

const DEFAULT_RULES = {
  requireFinalEvaluation: true,
  requireOffboarding: false,
  requiredDocuments: ['offer_letter', 'joining_doc'],
  requireInternshipEndDatePassed: true,
};

const getCompletionRules = async () => {
  const s = await Setting.findOne({ key: 'completionRules' });
  return s?.value || DEFAULT_RULES;
};

// POST /api/completion/:internId/complete
const completeIntern = asyncHandler(async (req, res) => {
  const intern = await Intern.findById(req.params.internId);
  if (!intern) throw new ApiError(404, 'Intern not found');

  const rules = await getCompletionRules();

  // Check internship end date
  if (rules.requireInternshipEndDatePassed && new Date(intern.internshipEndDate) > new Date()) {
    throw new ApiError(400, 'Internship period has not yet ended');
  }

  // Check final evaluation
  if (rules.requireFinalEvaluation) {
    const perf = await Performance.findOne({ intern: intern._id });
    if (!perf) throw new ApiError(400, 'Final evaluation not found');
  }

  // Check required documents
  if (Array.isArray(rules.requiredDocuments) && rules.requiredDocuments.length > 0) {
    const docs = await Document.find({ owner: intern._id, ownerModel: 'Intern', type: { $in: rules.requiredDocuments } });
    const foundTypes = new Set(docs.map((d) => d.type));
    const missing = rules.requiredDocuments.filter((t) => !foundTypes.has(t));
    if (missing.length) throw new ApiError(400, `Missing required documents: ${missing.join(', ')}`);
  }

  // Mark intern as completed
  intern.status = 'completed';
  await intern.save();

  const completion = await Completion.create({ intern: intern._id, completedBy: req.user?._id, metadata: { rulesPassed: rules } });

  // Create Alumni snapshot
  const performance = await Performance.find({ intern: intern._id });
  const certificates = await Certificate.find({ intern: intern._id });
  const docs = await Document.find({ owner: intern._id, ownerModel: 'Intern' });

  const snapshot = {
    intern: intern.toObject(),
    performance,
    certificates,
    documents: docs.map((d) => ({ type: d.type, filePath: d.filePath })),
  };

  const alumni = await Alumni.create({ internRef: intern._id, snapshot });

  await logAction({ user: req.user?._id, action: 'INTERN_COMPLETED', entity: 'Intern', entityId: intern._id, ipAddress: req.ip });

  res.json(new ApiResponse(200, { completion, alumni }, 'Intern marked as completed and alumni snapshot created'));
});

module.exports = { completeIntern };
