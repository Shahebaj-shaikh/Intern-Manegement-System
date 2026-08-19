import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Trash2, Mail, Phone, GraduationCap, Building2, UserCog } from 'lucide-react';
import { internApi, certificateApi, completionApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Skeleton } from '../../components/Skeleton';
import { ErrorState } from '../../components/ErrorState';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { InternFormModal } from './InternFormModal';

export const InternProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const canManage = ['super_admin', 'hr'].includes(user.role);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);

  const { data: intern, isLoading, isError, refetch } = useQuery({
    queryKey: ['intern', id],
    queryFn: () => internApi.get(id).then((r) => r.data.data),
  });

  const handleDelete = async () => {
    await internApi.remove(id);
    showToast('Intern deactivated');
    setShowDelete(false);
    refetch();
  };

  const handleGenerateCertificate = async () => {
    setGenLoading(true);
    try {
      const { data } = await certificateApi.generate(id, { role: 'Software Development Intern', authorizedBy: 'HR Department' });
      showToast('Certificate generated');
      window.open(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${data.data.filePath}`, '_blank');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not generate certificate', 'error');
    } finally {
      setGenLoading(false);
    }
  };

  if (isLoading) return <Skeleton rows={8} cols={2} />;
  if (isError || !intern) return <ErrorState message="This intern could not be found." />;

  return (
    <div className="space-y-6">
      <Link to="/interns" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} /> Back to interns
      </Link>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xl font-semibold">
              {intern.fullName?.[0]}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">{intern.fullName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge value={intern.status} />
                <span className="text-sm text-slate-500">{intern.department?.name}</span>
              </div>
            </div>
          </div>
          {canManage && (
            <div className="flex gap-2">
              {intern.status !== 'completed' && (
                <Button variant="primary" onClick={async () => {
                  setCompleteLoading(true);
                  try {
                    await completionApi.complete(id);
                    showToast('Intern marked as completed');
                    refetch();
                  } catch (err) {
                    showToast(err.response?.data?.message || 'Could not mark completion', 'error');
                  } finally {
                    setCompleteLoading(false);
                  }
                }} loading={completeLoading}>Mark as Complete</Button>
              )}
              {intern.status === 'completed' && (
                <Button variant="secondary" onClick={handleGenerateCertificate} loading={genLoading}>Generate Certificate</Button>
              )}
              <Button variant="secondary" onClick={() => setShowEdit(true)}><Pencil size={15} /> Edit</Button>
              <Button variant="danger" onClick={() => setShowDelete(true)}><Trash2 size={15} /> Deactivate</Button>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 pt-6 border-t border-slate-100">
          <InfoRow icon={Mail} label="Email" value={intern.email} />
          <InfoRow icon={Phone} label="Phone" value={intern.phone || '—'} />
          <InfoRow icon={GraduationCap} label="College" value={intern.college || '—'} />
          <InfoRow icon={GraduationCap} label="Degree / Branch" value={`${intern.degree || '—'} · ${intern.branch || '—'}`} />
          <InfoRow icon={Building2} label="Department" value={intern.department?.name || '—'} />
          <InfoRow icon={UserCog} label="Team Leader" value={intern.teamLeader?.fullName || '—'} />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-100 text-sm">
          <div><p className="text-slate-400">Joining Date</p><p className="font-medium text-slate-700">{new Date(intern.joiningDate).toLocaleDateString()}</p></div>
          <div><p className="text-slate-400">End Date</p><p className="font-medium text-slate-700">{new Date(intern.internshipEndDate).toLocaleDateString()}</p></div>
          <div><p className="text-slate-400">Internship Type</p><p className="font-medium text-slate-700 capitalize">{intern.internshipType}</p></div>
        </div>

        {intern.skills?.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-400 mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">
              {intern.skills.map((s) => <span key={s} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">{s}</span>)}
            </div>
          </div>
        )}
      </Card>

      <InternFormModal open={showEdit} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); refetch(); }} intern={intern} departments={[intern.department].filter(Boolean)} />
      <ConfirmDialog open={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Deactivate intern?" message={`This will mark ${intern.fullName} as terminated and disable their login.`} confirmLabel="Deactivate" />
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"><Icon size={15} /></div>
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value}</p>
    </div>
  </div>
);
