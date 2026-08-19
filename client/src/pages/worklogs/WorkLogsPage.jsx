import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, ClipboardList } from 'lucide-react';
import { workLogApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Badge } from '../../components/Badge';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { useAuth } from '../../context/AuthContext';
import { WorkLogFormModal } from './WorkLogFormModal';

const emptyFilters = { query: '', date: '', important: 'All' };

export const WorkLogsPage = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isIntern = user.role === 'intern';
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['worklogs'],
    queryFn: () => workLogApi.list({ limit: 100 }).then((r) => r.data.data),
  });

  const workLogs = data?.workLogs || [];

  const stats = useMemo(() => {
    const totalHours = workLogs.reduce((sum, log) => sum + (log.hours || 0), 0);
    const importantLogs = workLogs.filter((log) => log.important).length;
    const activeInterns = new Set(workLogs.map((log) => log.intern?._id || log.intern)).size;
    return { totalLogs: workLogs.length, totalHours, importantLogs, activeInterns };
  }, [workLogs]);

  const filtered = useMemo(() => {
    const term = filters.query.trim().toLowerCase();
    return workLogs.filter((log) => {
      const haystack = `${log.intern?.fullName || ''} ${log.task?.title || ''} ${log.workCompleted || ''}`.toLowerCase();
      const matchesSearch = !term || haystack.includes(term);
      const logDate = log.date ? new Date(log.date).toISOString().slice(0, 10) : '';
      const matchesDate = !filters.date || logDate === filters.date;
      const matchesImportant =
        filters.important === 'All' ||
        (filters.important === 'Important' && log.important) ||
        (filters.important === 'Regular' && !log.important);
      return matchesSearch && matchesDate && matchesImportant;
    });
  }, [workLogs, filters]);

  if (isLoading) return <Skeleton rows={6} cols={4} />;
  if (isError) return <ErrorState />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Work Logs</h1>
          <p className="text-sm text-slate-500">Track daily progress, hours, and manager follow-ups.</p>
        </div>
        {isIntern && <Button onClick={() => setShowForm(true)}><Plus size={16} /> New work log</Button>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4"><p className="text-xs text-slate-500">Total logs</p><p className="text-2xl font-semibold text-slate-800">{stats.totalLogs}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Total hours</p><p className="text-2xl font-semibold text-slate-800">{stats.totalHours}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Important logs</p><p className="text-2xl font-semibold text-slate-800">{stats.importantLogs}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Active interns</p><p className="text-2xl font-semibold text-slate-800">{stats.activeInterns}</p></Card>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            label="Search"
            placeholder="Intern, task, or work completed"
            value={filters.query}
            onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
          />
          <Input
            label="Date"
            type="date"
            value={filters.date}
            onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
          />
          <Select
            label="Flag"
            placeholder="All"
            value={filters.important === 'All' ? '' : filters.important}
            onChange={(e) => setFilters((f) => ({ ...f, important: e.target.value || 'All' }))}
            options={[
              { value: 'Important', label: 'Important' },
              { value: 'Regular', label: 'Regular' },
            ]}
          />
        </div>
      </Card>

      {!filtered.length ? (
        <Card>
          <EmptyState icon={ClipboardList} title="No work logs yet" message={isIntern ? 'Create a work log for one of your tasks.' : 'Interns have not submitted work logs yet.'} />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((log) => (
            <Link key={log._id} to={`/worklogs/${log._id}`}>
              <Card className="p-5 h-full hover:border-brand-200 transition">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-800">{log.task?.title || 'Task'}</p>
                    <p className="text-xs text-slate-500 mt-1">{log.intern?.fullName} · {new Date(log.date).toLocaleDateString()} · {log.hours} hrs</p>
                  </div>
                  {log.important && <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Important</span>}
                </div>
                <p className="text-sm text-slate-600 mt-3 line-clamp-2">{log.workCompleted}</p>
                {log.managerComment ? <Badge className="mt-3" value="reviewed" /> : <p className="text-xs text-slate-400 mt-3">Awaiting manager comment</p>}
              </Card>
            </Link>
          ))}
        </div>
      )}

      <WorkLogFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={() => {
          setShowForm(false);
          qc.invalidateQueries({ queryKey: ['worklogs'] });
          qc.invalidateQueries({ queryKey: ['tasks'] });
        }}
      />
    </div>
  );
};
