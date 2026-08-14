import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ListTodo, CheckCircle2, Clock, CalendarClock } from 'lucide-react';
import { dashboardApi } from '../../api/endpoints';
import { StatCard } from '../../components/StatCard';
import { Card } from '../../components/Card';
import { Skeleton } from '../../components/Skeleton';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { Badge } from '../../components/Badge';

export const InternDashboard = () => {
  const { data, isLoading, isError } = useQuery({ queryKey: ['dashboard-intern'], queryFn: () => dashboardApi.intern().then((r) => r.data.data) });

  if (isLoading) return <Skeleton rows={6} cols={4} />;
  if (isError) return <ErrorState />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Hi, {data.profile?.fullName?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-slate-500">Here's what's happening with your internship</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={data.totalTasks} icon={ListTodo} />
        <StatCard label="Pending Tasks" value={data.pendingTasks} icon={Clock} accent="text-amber-600 bg-amber-50" />
        <StatCard label="Completed Tasks" value={data.completedTasks} icon={CheckCircle2} accent="text-emerald-600 bg-emerald-50" />
        <StatCard label="Pending Leaves" value={data.pendingLeaveRequests} icon={CalendarClock} accent="text-blue-600 bg-blue-50" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-medium text-slate-800 mb-3">Today's Attendance</h3>
          {data.todayAttendance ? (
            <div className="text-sm space-y-1 text-slate-600">
              <p>Check-in: <span className="font-medium text-slate-800">{data.todayAttendance.checkIn ? new Date(data.todayAttendance.checkIn).toLocaleTimeString() : '—'}</span></p>
              <p>Check-out: <span className="font-medium text-slate-800">{data.todayAttendance.checkOut ? new Date(data.todayAttendance.checkOut).toLocaleTimeString() : '—'}</span></p>
              <Badge value={data.todayAttendance.status} className="mt-1" />
            </div>
          ) : (
            <EmptyState title="Not checked in yet" message="Head to the Attendance page to check in for today." />
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-medium text-slate-800 mb-3">Upcoming Deadlines</h3>
          {data.upcomingDeadlines?.length ? (
            <ul className="divide-y divide-slate-100">
              {data.upcomingDeadlines.map((t) => (
                <li key={t._id} className="py-2.5 flex items-center justify-between">
                  <Link to={`/tasks/${t._id}`} className="text-sm text-slate-700 hover:text-brand-600">{t.title}</Link>
                  <span className="text-xs text-slate-400">{new Date(t.deadline).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          ) : <EmptyState title="Nothing due soon" />}
        </Card>
      </div>
    </div>
  );
};
