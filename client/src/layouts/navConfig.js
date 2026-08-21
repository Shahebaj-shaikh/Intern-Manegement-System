import {
  LayoutDashboard,
  Users,
  Briefcase,
  Building2,
  ListChecks,
  ClipboardList,
  CalendarCheck,
  CalendarClock,
  Award,
  Bell,
  Megaphone,
  FileText,
  ScrollText,
  BarChart3,
  History,
  User,
  UserPlus,
  UserMinus,
  FileSignature,
  ClipboardCheck,
} from 'lucide-react';


export const navByRole = {
  super_admin: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/interns', label: 'Interns', icon: Users },

    // Offer & Onboarding
    { to: '/offers', label: 'Offers', icon: FileSignature },
    { to: '/onboarding', label: 'Onboarding', icon: ClipboardCheck },

    { to: '/employees', label: 'Employees', icon: Briefcase },
    { to: '/departments', label: 'Departments', icon: Building2 },
    { to: '/candidates', label: 'Candidates', icon: UserPlus },
    { to: '/applications', label: 'Applications', icon: ClipboardList },
    { to: '/tasks', label: 'Tasks', icon: ListChecks },
    { to: '/worklogs', label: 'Work Logs', icon: ClipboardList },
    { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/leaves', label: 'Leaves', icon: CalendarClock },
    { to: '/performance', label: 'Performance', icon: Award },
    { to: '/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/documents', label: 'Documents', icon: FileText },
    { to: '/certificates', label: 'Certificates', icon: ScrollText },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/audit-logs', label: 'Audit Logs', icon: History },
    { to: '/offboarding', label: 'Offboarding', icon: UserMinus },
  ],

  hr: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/interns', label: 'Interns', icon: Users },

    // Offer & Onboarding
    { to: '/offers', label: 'Offers', icon: FileSignature },
    { to: '/onboarding', label: 'Onboarding', icon: ClipboardCheck },

    { to: '/employees', label: 'Employees', icon: Briefcase },
    { to: '/departments', label: 'Departments', icon: Building2 },
    { to: '/candidates', label: 'Candidates', icon: UserPlus },
    { to: '/applications', label: 'Applications', icon: ClipboardList },
    { to: '/tasks', label: 'Tasks', icon: ListChecks },
    { to: '/worklogs', label: 'Work Logs', icon: ClipboardList },
    { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/leaves', label: 'Leaves', icon: CalendarClock },
    { to: '/performance', label: 'Performance', icon: Award },
    { to: '/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/documents', label: 'Documents', icon: FileText },
    { to: '/certificates', label: 'Certificates', icon: ScrollText },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/audit-logs', label: 'Audit Logs', icon: History },
    { to: '/offboarding', label: 'Offboarding', icon: UserMinus },
  ],

  team_lead: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/interns', label: 'My Interns', icon: Users },
    { to: '/tasks', label: 'Tasks', icon: ListChecks },
    { to: '/worklogs', label: 'Work Logs', icon: ClipboardList },
    { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/leaves', label: 'Leave Requests', icon: CalendarClock },
    { to: '/performance', label: 'Performance', icon: Award },
    { to: '/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/offboarding', label: 'Offboarding', icon: UserMinus },
  ],

  intern: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },

    // Offer & Onboarding
    { to: '/offers', label: 'My Offers', icon: FileSignature },
    { to: '/onboarding', label: 'My Onboarding', icon: ClipboardCheck },

    { to: '/tasks', label: 'My Tasks', icon: ListChecks },
    { to: '/worklogs', label: 'Work Logs', icon: ClipboardList },
    { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/leaves', label: 'Leaves', icon: CalendarClock },
    { to: '/performance', label: 'My Performance', icon: Award },
    { to: '/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/documents', label: 'Documents', icon: FileText },
    { to: '/certificates', label: 'Certificates', icon: ScrollText },
    { to: '/profile', label: 'My Profile', icon: User },
  ],
};
