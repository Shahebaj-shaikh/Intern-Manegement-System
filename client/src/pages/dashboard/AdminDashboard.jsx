
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserCheck,
  GraduationCap,
  Briefcase,
  Building2,
  ClipboardCheck,
  ListTodo,
  TrendingUp,
  Clipboard,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

import { dashboardApi } from '../../api/endpoints';
import { StatCard } from '../../components/StatCard';
import { Card } from '../../components/Card';
import { Skeleton } from '../../components/Skeleton';
import { ErrorState } from '../../components/ErrorState';

const COLORS = [
  '#4f46e5',
  '#818cf8',
  '#a5b4fc',
  '#c7d2fe',
  '#6366f1',
  '#4338ca',
  '#312e81',
  '#1e1b4b',
];

export const AdminDashboard = () => {
  const navigate = useNavigate();

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['dashboard-admin'],
    queryFn: () => dashboardApi.admin().then((r) => r.data.data),
  });

  if (isLoading) return <Skeleton rows={6} cols={4} />;
  if (isError) return <ErrorState />;

  const statusData = (data.tasksByStatus || []).map((t) => ({
    name: t._id.replace(/_/g, ' '),
    count: t.count,
  }));

  return (
    <div className="space-y-6">

      {/* Dashboard Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          Admin Dashboard
        </h1>

        <p className="text-sm text-slate-500">
          Company-wide internship overview
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Interns"
          value={data.totalInterns}
          icon={Users}
        />

        <StatCard
          label="Active Interns"
          value={data.activeInterns}
          icon={UserCheck}
          accent="text-emerald-600 bg-emerald-50"
        />

        <StatCard
          label="Completed"
          value={data.completedInterns}
          icon={GraduationCap}
          accent="text-slate-600 bg-slate-100"
        />

        <StatCard
          label="Employees"
          value={data.totalEmployees}
          icon={Briefcase}
          accent="text-purple-600 bg-purple-50"
        />

        <StatCard
          label="Departments"
          value={data.departments}
          icon={Building2}
          accent="text-blue-600 bg-blue-50"
        />

        <StatCard
          label="Pending Leaves"
          value={data.pendingLeaves}
          icon={ClipboardCheck}
          accent="text-amber-600 bg-amber-50"
        />

        <StatCard
          label="Pending Reviews"
          value={data.pendingReviews}
          icon={ListTodo}
          accent="text-orange-600 bg-orange-50"
        />

        <StatCard
          label="Task Completion"
          value={`${data.taskCompletionRate}%`}
          icon={TrendingUp}
          accent="text-emerald-600 bg-emerald-50"
        />
      </div>

       

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">

        <Card className="p-5">
          <h3 className="font-medium text-slate-800 mb-4">
            Interns by Department
          </h3>

          {data.internsByDepartment?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>

                <Pie
                  data={data.internsByDepartment}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {data.internsByDepartment.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip />

              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 py-16 text-center">
              No data yet
            </p>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-medium text-slate-800 mb-4">
            Tasks by Status
          </h3>

          {statusData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusData}>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                />

                <Tooltip />

                <Bar
                  dataKey="count"
                  fill="#4f46e5"
                  radius={[6, 6, 0, 0]}
                />

              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 py-16 text-center">
              No data yet
            </p>
          )}

        </Card>

      </div>

    </div>
  );
};