export const StatCard = ({ label, value, icon: Icon, accent = 'text-brand-600 bg-brand-50' }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
      {Icon && <Icon size={20} />}
    </div>
    <div>
      <p className="text-2xl font-semibold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  </div>
);
