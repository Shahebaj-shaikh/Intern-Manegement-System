import { forwardRef } from 'react';

export const Textarea = forwardRef(({ label, error, className = '', ...props }, ref) => (
  <div className={className}>
    {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <textarea
      ref={ref}
      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none ${
        error ? 'border-red-400' : 'border-slate-300'
      }`}
      rows={4}
      {...props}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
));

Textarea.displayName = 'Textarea';
