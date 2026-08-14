import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, ListTodo, ClipboardCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { dashboardApi } from '../../api/endpoints';
import { StatCard } from '../../components/StatCard';
import { Card } from '../../components/Card';
import { Skeleton } from '../../components/Skeleton';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { Badge } from '../../components/Badge';

export const TeamLeadDashboard = () => {
  const { data, isLoading, isError } = useQuery({ queryKey: ['dashboard-team-lead'], queryFn: () => dashboardApi.teamLead().then((r) => r.data.data) });

  if (isLoading) return <Skeleton rows={6} cols={4} />;
  if (isError) return <ErrorState />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Team Lead Dashboard</h1>
        <p className="text-sm text-slate-500">Overview of your assigned interns and tasks</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Assigned Interns" value={data.assignedInterns} icon={Users} />
        <StatCard label="Active Tasks" value={data.activeTasks} icon={ListTodo} accent="text-blue-600 bg-blue-50" />
        <StatCard label="Pending Submissions" value={data.pendingSubmissions} icon={ClipboardCheck} accent="text-amber-600 bg-amber-50" />
        <StatCard label="Completed Tasks" value={data.completedTasks} icon={CheckCircle2} accent="text-emerald-600 bg-emerald-50" />
        <StatCard label="Overdue Tasks" value={data.overdueTasks} icon={AlertTriangle} accent="text-red-600 bg-red-50" />
      </div>

      <Card className="p-5">
        <h3 className="font-medium text-slate-800 mb-4">Upcoming Deadlines</h3>
        {data.upcomingDeadlines?.length ? (
          <ul className="divide-y divide-slate-100">
            {data.upcomingDeadlines.map((t) => (
              <li key={t._id} className="py-3 flex items-center justify-between">
                <div>
                  <Link to={`/tasks/${t._id}`} className="text-sm font-medium text-slate-800 hover:text-brand-600">{t.title}</Link>
                  <p className="text-xs text-slate-500">{t.assignedTo?.fullName} · Due {new Date(t.deadline).toLocaleDateString()}</p>
                </div>
                <Badge value={t.priority} />
              </li>
            ))}
          </ul>
        ) : <EmptyState title="No upcoming deadlines" message="All caught up for now." />}
      </Card>
    </div>
  );
};
