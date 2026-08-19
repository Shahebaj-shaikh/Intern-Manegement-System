const fs = require('fs');
const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Document = require('../models/Document');
const logAction = require('../utils/auditLogger');

const getDocuments = asyncHandler(async (req, res) => {
  const { owner, ownerModel } = req.query;
  const filter = {};

  if (req.user.role === 'intern') {
    filter.owner = req.user.profileRef;
    filter.ownerModel = 'Intern';
  } else {
    if (owner) filter.owner = owner;
    if (ownerModel) filter.ownerModel = ownerModel;
  }

  const documents = await Document.find(filter).sort('-createdAt');
  res.json(new ApiResponse(200, documents));
});

const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded.');
  const { type, owner, ownerModel } = req.body;
  if (!type) throw new ApiError(400, 'Document type is required.');

  const doc = await Document.create({
    owner: owner || req.user.profileRef,
    ownerModel: ownerModel || (req.user.role === 'intern' ? 'Intern' : 'Employee'),
    type,
    fileName: req.file.originalname,
    filePath: `/uploads/${req.file.filename}`,
    fileSize: req.file.size,
    uploadedBy: req.user._id,
  });

  await logAction({ user: req.user._id, action: 'DOCUMENT_UPLOADED', entity: 'Document', entityId: doc._id, ipAddress: req.ip });
  res.status(201).json(new ApiResponse(201, doc, 'Document uploaded successfully'));
});

const deleteDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) throw new ApiError(404, 'Document not found');

  // Only owner or HR/admin may delete
  const isOwner = String(doc.owner) === String(req.user.profileRef);
  if (!isOwner && !['hr', 'super_admin'].includes(req.user.role)) {
    throw new ApiError(403, 'You do not have permission to delete this document.');
  }

  const filePath = path.join(__dirname, '..', doc.filePath);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await doc.deleteOne();

  await logAction({ user: req.user._id, action: 'DOCUMENT_DELETED', entity: 'Document', entityId: req.params.id, ipAddress: req.ip });
  res.json(new ApiResponse(200, null, 'Document deleted'));
});

module.exports = { getDocuments, uploadDocument, deleteDocument };
