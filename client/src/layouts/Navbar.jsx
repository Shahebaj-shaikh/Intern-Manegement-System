import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, LogOut, User, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const notifRef = useRef();
  const menuRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const profileName = user?.profile?.fullName || user?.email;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      <button onClick={onMenuClick} className="lg:hidden text-slate-500" aria-label="Open menu">
        <Menu size={22} />
      </button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-4">
        <div className="relative" ref={notifRef}>
          <button onClick={() => setShowNotifs((s) => !s)} className="relative text-slate-500 hover:text-slate-700" aria-label="Notifications">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <p className="font-medium text-sm text-slate-800">Notifications</p>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">You're all caught up.</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n._id}
                    onClick={() => markAsRead(n._id)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 ${!n.isRead ? 'bg-brand-50/50' : ''}`}
                  >
                    <p className="text-sm font-medium text-slate-800">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <div className="relative" ref={menuRef}>
          <button onClick={() => setShowMenu((s) => !s)} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">
              {profileName?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[140px] truncate">{profileName}</span>
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1">
              <button onClick={() => { navigate('/profile'); setShowMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                <User size={14} /> My profile
              </button>
              <button onClick={() => logout().then(() => navigate('/login'))} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                <LogOut size={14} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
