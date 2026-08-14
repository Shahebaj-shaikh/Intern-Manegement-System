import { forwardRef } from 'react';

export const Select = forwardRef(({ label, error, options = [], placeholder = 'Select...', className = '', ...props }, ref) => (
  <div className={className}>
    {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <select
      ref={ref}
      className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none ${
        error ? 'border-red-400' : 'border-slate-300'
      }`}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
));

Select.displayName = 'Select';
