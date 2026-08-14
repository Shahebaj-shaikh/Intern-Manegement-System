import { Outlet } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export const AuthLayout = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
    <div className="w-full max-w-sm">
      <div className="flex items-center gap-2 justify-center mb-8">
        <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white">
          <GraduationCap size={20} />
        </div>
        <span className="font-semibold text-lg text-slate-800">IMS</span>
      </div>
      <Outlet />
    </div>
  </div>
);
