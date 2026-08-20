import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

import { Login } from './pages/auth/Login';
import { SignUp } from './pages/auth/SignUp';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { VerifyCertificate } from './pages/certificates/VerifyCertificate';

import { Dashboard } from './pages/dashboard/Dashboard';
import { InternList } from './pages/interns/InternList';
import { InternProfile } from './pages/interns/InternProfile';
import { CandidateList } from './pages/candidates/CandidateList';
import { CandidateNew } from './pages/candidates/CandidateNew';
import { CandidateProfile } from './pages/candidates/CandidateProfile';
import { ApplicationList } from './pages/applications/ApplicationList';
import { ApplicationDetail } from './pages/applications/ApplicationDetail';
import { EmployeeList } from './pages/employees/EmployeeList';
import { DepartmentList } from './pages/departments/DepartmentList';
import { TaskBoard } from './pages/tasks/TaskBoard';
import { TaskDetail } from './pages/tasks/TaskDetail';
import { WorkLogsPage } from './pages/worklogs/WorkLogsPage';
import { WorkLogDetail } from './pages/worklogs/WorkLogDetail';
import { AttendancePage } from './pages/attendance/AttendancePage';
import { LeavesPage } from './pages/leaves/LeavesPage';
import { PerformancePage } from './pages/performance/PerformancePage';
import { AnnouncementsPage } from './pages/announcements/AnnouncementsPage';
import { DocumentsPage } from './pages/documents/DocumentsPage';
import { CertificatesPage } from './pages/certificates/CertificatesPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { AuditLogsPage } from './pages/auditlogs/AuditLogsPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { OffersPage } from './pages/offers/OffersPage';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';
import { NotFound } from './pages/misc/NotFound';
import {AdminAttendancePage} from './pages/attendance/AdminAttendancePage';



function App() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Route>

      {/* Public certificate verification */}
      <Route path="/certificates/verify" element={<VerifyCertificate />} />


      {/* Protected app routes - any authenticated role */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<TaskBoard />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/worklogs" element={<WorkLogsPage />} />
          <Route path="/worklogs/:id" element={<WorkLogDetail />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/leaves" element={<LeavesPage />} />
          <Route path="/performance" element={<PerformancePage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route path="/offers" element={<OffersPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* HR / Admin / Team Lead only */}
          <Route element={<ProtectedRoute roles={['super_admin', 'hr', 'team_lead']} />}>
            <Route path="/interns" element={<InternList />} />
            <Route path="/interns/:id" element={<InternProfile />} />
            <Route path="/admin/attendance" element={<AdminAttendancePage />} />
          </Route>

          {/* HR / Admin only */}
          <Route element={<ProtectedRoute roles={['super_admin', 'hr']} />}>
            <Route path="/employees" element={<EmployeeList />} />
            <Route path="/departments" element={<DepartmentList />} />
            <Route path="/candidates" element={<CandidateList />} />
            <Route path="/candidates/new" element={<CandidateNew />} />
            <Route path="/candidates/:id" element={<CandidateProfile />} />
            <Route path="/applications" element={<ApplicationList />} />
            <Route path="/applications/:id" element={<ApplicationDetail />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
          </Route>

          {/* Everyone with document access (intern's own, or HR/admin/team-lead) */}
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
