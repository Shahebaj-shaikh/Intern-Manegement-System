require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');

const app = express();

connectDB();

// --- Security & core middleware ---
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use('/api', apiLimiter);

// Static file serving for uploaded documents/certificates
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Routes ---
app.get('/api/health', (req, res) => res.json({ success: true, message: 'IMS API is running' }));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/interns', require('./routes/intern.routes'));
app.use('/api/employees', require('./routes/employee.routes'));
app.use('/api/departments', require('./routes/department.routes'));
app.use('/api/tasks', require('./routes/task.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));
app.use('/api/leaves', require('./routes/leave.routes'));
app.use('/api/performance', require('./routes/performance.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/announcements', require('./routes/announcement.routes'));
app.use('/api/documents', require('./routes/document.routes'));
app.use('/api/certificates', require('./routes/certificate.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/audit-logs', require('./routes/auditlog.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`IMS server running on port ${PORT}`));
}

module.exports = app;
