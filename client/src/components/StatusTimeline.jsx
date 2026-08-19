import { Check, X, Send, Users, Video, Trophy } from 'lucide-react';
import clsx from 'clsx';

const stageMeta = {
  applied: { icon: Send, color: 'bg-slate-400' },
  shortlisted: { icon: Users, color: 'bg-blue-500' },
  interview: { icon: Video, color: 'bg-purple-500' },
  selected: { icon: Trophy, color: 'bg-emerald-500' },
  rejected: { icon: X, color: 'bg-red-500' },
};

// Vertical timeline of an application's statusHistory entries, newest first
export const StatusTimeline = ({ history = [] }) => {
  const sorted = [...history].sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));

  if (!sorted.length) return <p className="text-sm text-slate-400">No status changes recorded yet.</p>;

  return (
    <ol className="relative border-l-2 border-slate-100 ml-3">
      {sorted.map((h, i) => {
        const meta = stageMeta[h.status] || { icon: Check, color: 'bg-slate-400' };
        const Icon = meta.icon;
        return (
          <li key={i} className="mb-6 ml-6 last:mb-0">
            <span className={clsx('absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-4 ring-white text-white', meta.color)}>
              <Icon size={12} />
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-slate-800 capitalize">{h.status}</p>
              <span className="text-xs text-slate-400">{new Date(h.changedAt).toLocaleString()}</span>
            </div>
            {h.changedByName && <p className="text-xs text-slate-400">by {h.changedByName}</p>}
            {h.note && <p className="text-sm text-slate-600 mt-1">{h.note}</p>}
          </li>
        );
      })}
    </ol>
  );
};
