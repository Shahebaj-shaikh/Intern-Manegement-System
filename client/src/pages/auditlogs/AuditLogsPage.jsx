import { useQuery } from '@tanstack/react-query';
import { History } from 'lucide-react';
import { auditLogApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Table } from '../../components/Table';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';

export const AuditLogsPage = () => {
  const { data, isLoading, isError } = useQuery({ queryKey: ['audit-logs'], queryFn: () => auditLogApi.list({ limit: 100 }).then((r) => r.data.data) });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Audit Logs</h1>
        <p className="text-sm text-slate-500">System-wide activity trail</p>
      </div>

      <Card>
        {isLoading ? (
          <Skeleton rows={8} cols={4} />
        ) : isError ? (
          <ErrorState />
        ) : data?.logs?.length ? (
          <Table columns={['Action', 'Entity', 'User', 'Time']}>
            {data.logs.map((l) => (
              <tr key={l._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-700">{l.action}</td>
                <td className="px-4 py-3 text-slate-600">{l.entity}</td>
                <td className="px-4 py-3 text-slate-600">{l.user?.email || 'System'}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{new Date(l.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState icon={History} title="No activity recorded yet" />
        )}
      </Card>
    </div>
  );
};
