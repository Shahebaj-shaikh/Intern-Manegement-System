import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ClipboardList, Trophy, XCircle } from 'lucide-react';
import { applicationApi, departmentApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Select } from '../../components/Select';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';

const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const COLUMNS = [
  { key: 'applied', label: 'Applied', accent: 'border-t-slate-400' },
  { key: 'shortlisted', label: 'Shortlisted', accent: 'border-t-blue-500' },
  { key: 'interview', label: 'Interview', accent: 'border-t-purple-500' },
  { key: 'selected', label: 'Selected', accent: 'border-t-emerald-500' },
  { key: 'rejected', label: 'Rejected', accent: 'border-t-red-500' },
];

export const ApplicationList = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const debouncedSearch = useDebounce(search);

  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: () => departmentApi.list().then((r) => r.data.data) });
  const { data, isLoading, isError } = useQuery({
    queryKey: ['applications', debouncedSearch, department],
    queryFn: () => applicationApi.list({ search: debouncedSearch, department, limit: 200 }).then((r) => r.data.data),
  });

  const applications = data?.applications || [];
  const total = applications.length;
  const selectedCount = applications.filter((a) => a.status === 'selected').length;
  const rejectedCount = applications.filter((a) => a.status === 'rejected').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Applications</h1>
          <p className="text-sm text-slate-500">{total} application{total === 1 ? '' : 's'} in the pipeline</p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg"><Trophy size={14} /> {selectedCount} selected</span>
          <span className="flex items-center gap-1.5 text-red-700 bg-red-50 px-3 py-1.5 rounded-lg"><XCircle size={14} /> {rejectedCount} rejected</span>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              placeholder="Search by candidate name, email, or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            placeholder="All programs"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            options={(departments || []).map((d) => ({ value: d._id, label: d.name }))}
          />
        </div>
      </Card>

      {isLoading ? (
        <Card><Skeleton rows={6} cols={5} /></Card>
      ) : isError ? (
        <Card><ErrorState /></Card>
      ) : !applications.length ? (
        <Card><EmptyState icon={ClipboardList} title="No applications yet" message="Applications will appear here once created from a candidate's profile." /></Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colApps = applications.filter((a) => a.status === col.key);
            return (
              <div key={col.key} className="w-72 shrink-0">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-sm font-medium text-slate-600">{col.label}</h3>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{colApps.length}</span>
                </div>
                <div className="space-y-3 min-h-[80px]">
                  {colApps.map((a) => (
                    <Card
                      key={a._id}
                      className={`p-4 border-t-4 ${col.accent} cursor-pointer hover:shadow-md transition-shadow`}
                      onClick={() => navigate(`/applications/${a._id}`)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold shrink-0">
                          {a.candidate?.fullName?.[0]}
                        </div>
                        <p className="font-medium text-sm text-slate-800 truncate">{a.candidate?.fullName}</p>
                      </div>
                      <p className="text-xs text-slate-500">{a.positionTitle || a.department?.name}</p>
                      <p className="text-[11px] text-slate-400 mt-2">Applied {new Date(a.createdAt).toLocaleDateString()}</p>
                    </Card>
                  ))}
                  {!colApps.length && <p className="text-xs text-slate-300 text-center py-6">No candidates here</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
