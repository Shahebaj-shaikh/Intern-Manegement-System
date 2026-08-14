import { useQuery } from '@tanstack/react-query';
import { ScrollText, Download } from 'lucide-react';
import { certificateApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

export const CertificatesPage = () => {
  const { data, isLoading, isError } = useQuery({ queryKey: ['certificates'], queryFn: () => certificateApi.list().then((r) => r.data.data) });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-slate-800">Certificates</h1>

      {isLoading ? (
        <Skeleton rows={4} cols={2} />
      ) : isError ? (
        <ErrorState />
      ) : data?.length ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {data.map((c) => (
            <Card key={c._id} className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><ScrollText size={22} /></div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800">{c.intern?.fullName}</p>
                <p className="text-xs text-slate-400 mono">{c.certificateId}</p>
                <p className="text-xs text-slate-500 mt-0.5">{c.role} · {c.durationText} · Issued {new Date(c.issueDate).toLocaleDateString()}</p>
              </div>
              <a href={`${API_ORIGIN}${c.filePath}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-brand-600 shrink-0"><Download size={18} /></a>
            </Card>
          ))}
        </div>
      ) : (
        <Card><EmptyState icon={ScrollText} title="No certificates yet" message="Certificates appear here once generated for completed internships." /></Card>
      )}
    </div>
  );
};
