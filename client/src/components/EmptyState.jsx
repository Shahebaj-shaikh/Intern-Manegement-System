import { Inbox } from 'lucide-react';

export const EmptyState = ({ icon: Icon = Inbox, title = 'Nothing here yet', message, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-6">
    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
      <Icon size={22} className="text-slate-400" />
    </div>
    <p className="font-medium text-slate-700">{title}</p>
    {message && <p className="text-sm text-slate-500 mt-1 max-w-sm">{message}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
