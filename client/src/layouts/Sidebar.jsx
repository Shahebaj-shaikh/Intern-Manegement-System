import { NavLink } from 'react-router-dom';
import { GraduationCap, Users, LayoutDashboard, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { navByRole } from './navConfig';

export const Sidebar = ({ open, onClose }) => {
  const { user } = useAuth();
  
  // Checking actual role or falling back
  const userRole = user?.role || 'admin'; // Dev fallback to admin
  const items = navByRole[userRole] || [];

  return (
    <>
      {open && <div className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed lg:sticky top-0 h-screen w-64 bg-white border-r border-slate-200 z-40 flex flex-col transition-transform
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center gap-2 px-5 h-16 border-b border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <GraduationCap size={18} />
          </div>
          <span className="font-semibold text-slate-800">Intern MS</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          {/* Always show Team Attendance Link in Dev mode for testing 📊 */}
          <NavLink
            to="/admin/attendance"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
            <Users size={18} />
            <span>Team Attendance (Admin)</span>
          </NavLink>
        </nav>
      </aside>
    </>
  );
};