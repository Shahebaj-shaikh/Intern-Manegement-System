import api from './axios';

// --- Auth ---
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.put(`/auth/reset-password/${token}`, data),
};

// --- Interns ---
export const internApi = {
  list: (params) => api.get('/interns', { params }),
  get: (id) => api.get(`/interns/${id}`),
  create: (data) => api.post('/interns', data),
  update: (id, data) => api.put(`/interns/${id}`, data),
  remove: (id) => api.delete(`/interns/${id}`),
};

// --- Employees ---
export const employeeApi = {
  list: (params) => api.get('/employees', { params }),
  get: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  remove: (id) => api.delete(`/employees/${id}`),
};

// --- Departments ---
export const departmentApi = {
  list: () => api.get('/departments'),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  remove: (id) => api.delete(`/departments/${id}`),
};

// --- Tasks ---
export const taskApi = {
  list: (params) => api.get('/tasks', { params }),
  get: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  updateStatus: (id, status) => api.put(`/tasks/${id}/status`, { status }),
  addComment: (id, text) => api.post(`/tasks/${id}/comments`, { text }),
  submit: (id, formData) => api.post(`/tasks/${id}/submit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  review: (taskId, submissionId, data) => api.put(`/tasks/${taskId}/submissions/${submissionId}/review`, data),
};

// --- Attendance ---
export const attendanceApi = {
  checkIn: () => api.post('/attendance/check-in'),
  checkOut: () => api.post('/attendance/check-out'),
  list: (params) => api.get('/attendance', { params }),
  summary: (internId) => api.get(`/attendance/summary/${internId || ''}`),
};

// --- Leaves ---
export const leaveApi = {
  list: (params) => api.get('/leaves', { params }),
  apply: (formData) => api.post('/leaves', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  review: (id, data) => api.put(`/leaves/${id}/review`, data),
};

// --- Performance, Feedback & Evaluation ---
export const performanceApi = {
  // Dashboard
  getDashboard: (internId) => api.get(`/performance/dashboard${internId ? `/${internId}` : ''}`),

  // Evaluation Templates
  getTemplates: (params) => api.get('/performance/templates', { params }),
  getTemplate: (id) => api.get(`/performance/templates/${id}`),
  createTemplate: (data) => api.post('/performance/templates', data),
  updateTemplate: (id, data) => api.put(`/performance/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/performance/templates/${id}`),

  // Standalone Categories
  getCategories: () => api.get('/performance/categories'),
  createCategory: (data) => api.post('/performance/categories', data),
  updateCategory: (id, data) => api.put(`/performance/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/performance/categories/${id}`),

  // Continuous Feedback
  getFeedback: (params) => api.get('/performance/feedback', { params }),
  createFeedback: (data) => api.post('/performance/feedback', data),

  // Mid-Term & Periodic Evaluations
  getEvaluations: (params) => api.get('/performance/evaluations', { params }),
  getEvaluation: (id) => api.get(`/performance/evaluations/${id}`),
  createEvaluation: (data) => api.post('/performance/evaluations', data),
  updateEvaluation: (id, data) => api.put(`/performance/evaluations/${id}`, data),
  finalizeEvaluation: (id) => api.put(`/performance/evaluations/${id}/finalize`),
  getEvaluationHistory: (id) => api.get(`/performance/evaluations/${id}/history`),

  // Backwards compatibility
  list: (params) => api.get('/performance/evaluations', { params }),
  create: (data) => api.post('/performance/evaluations', data),
};

// --- Notifications ---
export const notificationApi = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// --- Announcements ---
export const announcementApi = {
  list: () => api.get('/announcements'),
  create: (data) => api.post('/announcements', data),
  remove: (id) => api.delete(`/announcements/${id}`),
};

// --- Documents ---
export const documentApi = {
  list: (params) => api.get('/documents', { params }),
  upload: (formData) => api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  remove: (id) => api.delete(`/documents/${id}`),
};

// --- Certificates ---
export const certificateApi = {
  list: () => api.get('/certificates'),
  generate: (internId, data) => api.post(`/certificates/${internId}/generate`, data),
  verifyPublic: (certificateId) => api.get(`/certificates/verify/${certificateId}`),
};

// --- Completion ---
export const completionApi = {
  complete: (internId) => api.post(`/completion/${internId}/complete`),
};

// --- Reports ---
export const reportApi = {
  interns: (params) => api.get('/reports/interns', { params }),
  attendance: (params) => api.get('/reports/attendance', { params }),
  leaves: (params) => api.get('/reports/leaves', { params }),
  tasks: (params) => api.get('/reports/tasks', { params }),
  performance: (params) => api.get('/reports/performance', { params }),
};

// --- Audit Logs ---
export const auditLogApi = {
  list: (params) => api.get('/audit-logs', { params }),
};

// --- Dashboard ---
export const dashboardApi = {
  admin: () => api.get('/dashboard/admin'),
  teamLead: () => api.get('/dashboard/team-lead'),
  intern: () => api.get('/dashboard/intern'),
};
