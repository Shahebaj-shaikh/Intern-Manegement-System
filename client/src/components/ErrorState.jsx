import { AlertTriangle } from 'lucide-react';

export const ErrorState = ({ message = 'Something went wrong. Please try again.' }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-6">
    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
      <AlertTriangle size={22} className="text-red-500" />
    </div>
    <p className="font-medium text-slate-700">Couldn't load this</p>
    <p className="text-sm text-slate-500 mt-1">{message}</p>
  </div>
);
