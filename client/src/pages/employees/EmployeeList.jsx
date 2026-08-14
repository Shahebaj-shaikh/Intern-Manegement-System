import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Briefcase } from 'lucide-react';
import { employeeApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Table } from '../../components/Table';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { EmployeeFormModal } from './EmployeeFormModal';

const roleLabels = { super_admin: 'Super Admin', hr: 'HR', team_lead: 'Team Lead' };

export const EmployeeList = () => {
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeApi.list({ limit: 100 }).then((r) => r.data.data),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Employees</h1>
          <p className="text-sm text-slate-500">{data?.total ?? 0} total</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus size={16} /> Add Employee</Button>
      </div>

      <Card>
        {isLoading ? (
          <Skeleton rows={6} cols={4} />
        ) : isError ? (
          <ErrorState />
        ) : data?.employees?.length ? (
          <Table columns={['Name', 'Designation', 'Department', 'Role', 'Status']}>
            {data.employees.map((e) => (
              <tr key={e._id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{e.fullName}</p>
                  <p className="text-xs text-slate-400">{e.email}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{e.designation || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{e.department?.name || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{roleLabels[e.user?.role] || e.user?.role}</td>
                <td className="px-4 py-3"><Badge value={e.isActive ? 'active' : 'terminated'} /></td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState icon={Briefcase} title="No employees yet" message="Add HR staff or team leads to get started." />
        )}
      </Card>

      <EmployeeFormModal open={showForm} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); refetch(); }} />
    </div>
  );
};
