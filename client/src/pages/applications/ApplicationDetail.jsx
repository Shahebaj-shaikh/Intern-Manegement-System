import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Users, Video, Trophy, XCircle, Mail, Phone, Briefcase, Calendar, FileText } from 'lucide-react';
import { applicationApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Textarea } from '../../components/Textarea';
import { Input } from '../../components/Input';
import { Skeleton } from '../../components/Skeleton';
import { ErrorState } from '../../components/ErrorState';
import { useToast } from '../../context/ToastContext';
import { StatusTimeline } from '../../components/StatusTimeline';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

const ACTIONS = {
  applied: [{ status: 'shortlisted', label: 'Shortlist', icon: Users, variant: 'primary' }, { status: 'rejected', label: 'Reject', icon: XCircle, variant: 'danger' }],
  shortlisted: [{ status: 'interview', label: 'Move to Interview', icon: Video, variant: 'primary' }, { status: 'rejected', label: 'Reject', icon: XCircle, variant: 'danger' }],
  interview: [{ status: 'selected', label: 'Select', icon: Trophy, variant: 'primary' }, { status: 'rejected', label: 'Reject', icon: XCircle, variant: 'danger' }],
  selected: [],
  rejected: [],
};

export const ApplicationDetail = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const [pendingAction, setPendingAction] = useState(null); // { status, label }
  const [note, setNote] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: application, isLoading, isError, refetch } = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationApi.get(id).then((r) => r.data.data),
  });

  const confirmAction = async () => {
    setBusy(true);
    try {
      const payload = { status: pendingAction.status, note };
      if (pendingAction.status === 'interview' && interviewDate) payload.interviewDate = interviewDate;
      await applicationApi.updateStatus(id, payload);
      showToast(`Application moved to "${pendingAction.status}"`);
      setPendingAction(null);
      setNote('');
      setInterviewDate('');
      refetch();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update application', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) return <Skeleton rows={8} cols={2} />;
  if (isError || !application) return <ErrorState message="This application could not be found." />;

  const { candidate, department } = application;
  const availableActions = ACTIONS[application.status] || [];

  return (
    <div className="space-y-6 max-w-4xl">
      <Link to="/applications" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} /> Back to applications
      </Link>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-lg font-semibold shrink-0">
              {candidate?.fullName?.[0]}
            </div>
            <div>
              <Link to={`/candidates/${candidate?._id}`} className="text-xl font-semibold text-slate-800 hover:text-brand-600">{candidate?.fullName}</Link>
              <p className="text-sm text-slate-500">{application.positionTitle || 'Position not specified'} · {department?.name}</p>
            </div>
          </div>
          <Badge value={application.status} className="text-sm px-3 py-1.5" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 pt-6 border-t border-slate-100">
          <InfoRow icon={Mail} label="Email" value={candidate?.email} />
          <InfoRow icon={Phone} label="Phone" value={candidate?.phone || '—'} />
          <InfoRow icon={Briefcase} label="Program" value={department?.name || '—'} />
          <InfoRow icon={Calendar} label="Applied On" value={new Date(application.createdAt).toLocaleDateString()} />
        </div>

        {application.interviewDate && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-purple-700 bg-purple-50 rounded-lg px-3 py-2 w-fit">
            <Video size={14} /> Interview scheduled for {new Date(application.interviewDate).toLocaleDateString()}
          </div>
        )}

        {availableActions.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-700 mb-3">Selection actions</p>
            <div className="flex flex-wrap gap-2">
              {availableActions.map((a) => (
                <Button key={a.status} variant={a.variant} onClick={() => setPendingAction(a)}>
                  <a.icon size={15} /> {a.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {application.decision && (
          <div className={`mt-6 pt-6 border-t border-slate-100 flex items-center gap-2 text-sm rounded-lg px-3 py-2 w-fit ${application.decision === 'selected' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
            {application.decision === 'selected' ? <Trophy size={14} /> : <XCircle size={14} />}
            Final decision: <span className="font-medium capitalize">{application.decision}</span> on {new Date(application.decisionAt).toLocaleDateString()}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="font-medium text-slate-800 mb-5">Status History</h3>
        <StatusTimeline history={application.statusHistory} />
      </Card>

      <Modal open={Boolean(pendingAction)} onClose={() => setPendingAction(null)} title={pendingAction?.label || ''} width="max-w-md">
        <p className="text-sm text-slate-600 mb-4">
          Move <span className="font-medium">{candidate?.fullName}</span> to <span className="font-medium capitalize">{pendingAction?.status}</span>?
        </p>
        {pendingAction?.status === 'interview' && (
          <Input label="Interview date (optional)" type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} className="mb-4" />
        )}
        <Textarea label="Note (optional)" placeholder="Add context for this decision..." value={note} onChange={(e) => setNote(e.target.value)} className="mb-4" />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setPendingAction(null)}>Cancel</Button>
          <Button variant={pendingAction?.variant || 'primary'} onClick={confirmAction} loading={busy}>Confirm</Button>
        </div>
      </Modal>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"><Icon size={15} /></div>
    <div className="min-w-0">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-700 truncate">{value}</p>
    </div>
  </div>
);
