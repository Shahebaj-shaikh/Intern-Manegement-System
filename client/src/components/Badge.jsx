import clsx from 'clsx';

const statusColors = {
  active: 'bg-emerald-100 text-emerald-700',
  upcoming: 'bg-blue-100 text-blue-700',
  completed: 'bg-slate-200 text-slate-700',
  terminated: 'bg-red-100 text-red-700',
  present: 'bg-emerald-100 text-emerald-700',
  absent: 'bg-red-100 text-red-700',
  half_day: 'bg-amber-100 text-amber-700',
  leave: 'bg-blue-100 text-blue-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  not_started: 'bg-slate-200 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  submitted: 'bg-purple-100 text-purple-700',
  under_review: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-200 text-slate-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
  // Candidate selection pipeline
  applied: 'bg-slate-200 text-slate-700',
  shortlisted: 'bg-blue-100 text-blue-700',
  interview: 'bg-purple-100 text-purple-700',
  selected: 'bg-emerald-100 text-emerald-700',
};

export const Badge = ({ value, className = '' }) => (
  <span
    className={clsx(
      'inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize',
      statusColors[value] || 'bg-slate-100 text-slate-600',
      className
    )}
  >
    {String(value).replace(/_/g, ' ')}
  </span>
);
