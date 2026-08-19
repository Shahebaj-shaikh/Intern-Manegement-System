const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Certificate = require('../models/Certificate');
const Intern = require('../models/Intern');
const logAction = require('../utils/auditLogger');

const uploadDir = path.join(__dirname, '..', 'uploads');

const formatDuration = (start, end) => {
  const months = Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24 * 30));
  return `${months} month${months !== 1 ? 's' : ''}`;
};

// POST /api/certificates/:internId/generate
const generateCertificate = asyncHandler(async (req, res) => {
  const intern = await Intern.findById(req.params.internId).populate('department');
  if (!intern) throw new ApiError(404, 'Intern not found');
  if (intern.status !== 'completed') throw new ApiError(400, 'Certificates can only be generated for completed internships.');

  const certificateId = `IMS-CERT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const fileName = `certificate-${certificateId}.pdf`;
  const filePath = path.join(uploadDir, fileName);

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke('#4F46E5');
  doc.fontSize(28).fillColor('#1E293B').text('Certificate of Internship Completion', { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(14).fillColor('#475569').text('This is to certify that', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(24).fillColor('#0F172A').text(intern.fullName, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(14).fillColor('#475569').text(
    `has successfully completed an internship in ${intern.department?.name || 'the company'} as a ${req.body.role || 'Intern'}`,
    { align: 'center' }
  );
  doc.moveDown(0.3);
  doc.text(`Duration: ${formatDuration(intern.joiningDate, intern.internshipEndDate)}`, { align: 'center' });
  doc.text(`Completion Date: ${new Date(intern.internshipEndDate).toLocaleDateString()}`, { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(11).fillColor('#94A3B8').text(`Certificate ID: ${certificateId}`, { align: 'center' });
  doc.text(`Authorized by: ${req.body.authorizedBy || 'HR Department'}`, { align: 'center' });

  doc.end();

  await new Promise((resolve) => stream.on('finish', resolve));

  const certificate = await Certificate.create({
    intern: intern._id,
    certificateId,
    role: req.body.role || 'Intern',
    durationText: formatDuration(intern.joiningDate, intern.internshipEndDate),
    issuedBy: req.user.profileRef,
    filePath: `/uploads/${fileName}`,
  });

  await logAction({ user: req.user._id, action: 'CERTIFICATE_GENERATED', entity: 'Certificate', entityId: certificate._id, ipAddress: req.ip });
  res.status(201).json(new ApiResponse(201, certificate, 'Certificate generated successfully'));
});

const getCertificates = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'intern' ? { intern: req.user.profileRef } : {};
  const certificates = await Certificate.find(filter).populate('intern', 'fullName').sort('-createdAt');
  res.json(new ApiResponse(200, certificates));
});

module.exports = { generateCertificate, getCertificates };
