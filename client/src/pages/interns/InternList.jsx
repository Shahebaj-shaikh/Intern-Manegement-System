import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Users } from 'lucide-react';
import { internApi, departmentApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Table } from '../../components/Table';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { useAuth } from '../../context/AuthContext';
import { InternFormModal } from './InternFormModal';

const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

export const InternList = () => {
  const { user } = useAuth();
  const canManage = ['super_admin', 'hr'].includes(user.role);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');
  const [showForm, setShowForm] = useState(false);
  const debouncedSearch = useDebounce(search);

  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: () => departmentApi.list().then((r) => r.data.data) });
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['interns', debouncedSearch, status, department],
    queryFn: () => internApi.list({ search: debouncedSearch, status, department }).then((r) => r.data.data),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{user.role === 'team_lead' ? 'My Interns' : 'Interns'}</h1>
          <p className="text-sm text-slate-500">{data?.total ?? 0} total</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowForm(true)}><Plus size={16} /> Add Intern</Button>
        )}
      </div>

      <Card className="p-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              placeholder="Search by name, email, college..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            placeholder="All statuses"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'upcoming', label: 'Upcoming' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'terminated', label: 'Terminated' },
            ]}
          />
          <Select
            placeholder="All departments"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            options={(departments || []).map((d) => ({ value: d._id, label: d.name }))}
          />
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <Skeleton rows={6} cols={5} />
        ) : isError ? (
          <ErrorState />
        ) : data?.interns?.length ? (
          <Table columns={['Name', 'College', 'Department', 'Team Lead', 'Status']}>
            {data.interns.map((i) => (
              <tr key={i._id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link to={`/interns/${i._id}`} className="font-medium text-slate-800 hover:text-brand-600">{i.fullName}</Link>
                  <p className="text-xs text-slate-400">{i.email}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{i.college || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{i.department?.name || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{i.teamLeader?.fullName || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Badge value={i.status} />
                    {i.profileComplete === false && (
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">Needs review</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState icon={Users} title="No interns found" message="Try adjusting your filters, or add your first intern." />
        )}
      </Card>

      <InternFormModal open={showForm} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); refetch(); }} departments={departments} />
    </div>
  );
};
