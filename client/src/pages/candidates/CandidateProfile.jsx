import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Archive, RotateCcw, Mail, Phone, GraduationCap, Calendar, Tag, Download, Plus, FileText } from 'lucide-react';
import { candidateApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Table } from '../../components/Table';
import { Skeleton } from '../../components/Skeleton';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { CandidateEditModal } from './CandidateEditModal';
import { NewApplicationModal } from './NewApplicationModal';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

const SOURCE_LABELS = {
  referral: 'Referral', job_portal: 'Job Portal', campus: 'Campus Drive',
  linkedin: 'LinkedIn', company_website: 'Company Website', other: 'Other',
};

export const CandidateProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showEdit, setShowEdit] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showNewApp, setShowNewApp] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => candidateApi.get(id).then((r) => r.data.data),
  });

  const handleArchiveToggle = async () => {
    setBusy(true);
    try {
      if (data.candidate.isArchived) {
        await candidateApi.restore(id);
        showToast('Candidate restored');
      } else {
        await candidateApi.archive(id);
        showToast('Candidate archived');
      }
      setShowArchive(false);
      refetch();
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) return <Skeleton rows={8} cols={2} />;
  if (isError || !data) return <ErrorState message="This candidate could not be found." />;

  const { candidate, applications } = data;

  return (
    <div className="space-y-6">
      <Link to="/candidates" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} /> Back to candidates
      </Link>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xl font-semibold shrink-0">
              {candidate.fullName?.[0]}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">{candidate.fullName}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{SOURCE_LABELS[candidate.source] || candidate.source}</span>
                {candidate.isArchived && <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-medium">Archived</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" onClick={() => setShowNewApp(true)}><Plus size={15} /> New Application</Button>
            <Button variant="secondary" onClick={() => setShowEdit(true)}><Pencil size={15} /> Edit</Button>
            <Button variant={candidate.isArchived ? 'primary' : 'danger'} onClick={() => setShowArchive(true)}>
              {candidate.isArchived ? <RotateCcw size={15} /> : <Archive size={15} />}
              {candidate.isArchived ? 'Restore' : 'Archive'}
            </Button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 pt-6 border-t border-slate-100">
          <InfoRow icon={Mail} label="Email" value={candidate.email} />
          <InfoRow icon={Phone} label="Phone" value={candidate.phone || '—'} />
          <InfoRow icon={GraduationCap} label="Education" value={`${candidate.education?.degree || '—'}${candidate.education?.institution ? ` · ${candidate.education.institution}` : ''}`} />
          <InfoRow icon={Calendar} label="Application Date" value={new Date(candidate.applicationDate).toLocaleDateString()} />
          {candidate.resume?.fileName ? (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"><FileText size={15} /></div>
              <div>
                <p className="text-xs text-slate-400">Resume</p>
                <a href={`${API_ORIGIN}${candidate.resume.filePath}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand-600 hover:underline flex items-center gap-1">
                  {candidate.resume.fileName} <Download size={12} />
                </a>
              </div>
            </div>
          ) : (
            <InfoRow icon={FileText} label="Resume" value="Not uploaded" />
          )}
        </div>

        {candidate.skills?.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-400 mb-2 flex items-center gap-1"><Tag size={13} /> Skills</p>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((s) => <span key={s} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">{s}</span>)}
            </div>
          </div>
        )}

        {candidate.profileSummary && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-400 mb-1">Profile Summary</p>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{candidate.profileSummary}</p>
          </div>
        )}
      </Card>

      <Card>
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-medium text-slate-800">Applications</h3>
          <p className="text-xs text-slate-500">{applications.length} application{applications.length === 1 ? '' : 's'} submitted</p>
        </div>
        {applications.length ? (
          <Table columns={['Program', 'Position', 'Status', 'Applied On']}>
            {applications.map((a) => (
              <tr key={a._id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/applications/${a._id}`)}>
                <td className="px-4 py-3 font-medium text-slate-700">{a.department?.name || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{a.positionTitle || '—'}</td>
                <td className="px-4 py-3"><Badge value={a.status} /></td>
                <td className="px-4 py-3 text-slate-500 text-xs">{new Date(a.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState icon={FileText} title="No applications yet" message="Create an application to start moving this candidate through the pipeline." />
        )}
      </Card>

      <CandidateEditModal open={showEdit} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); refetch(); }} candidate={candidate} />
      <NewApplicationModal open={showNewApp} onClose={() => setShowNewApp(false)} onSaved={() => { setShowNewApp(false); refetch(); }} candidateId={id} />
      <ConfirmDialog
        open={showArchive}
        onClose={() => setShowArchive(false)}
        onConfirm={handleArchiveToggle}
        title={candidate.isArchived ? 'Restore candidate?' : 'Archive candidate?'}
        message={candidate.isArchived ? `${candidate.fullName} will reappear in the active candidates list.` : `${candidate.fullName} will be moved out of the active list. Their application history is preserved and this can be undone.`}
        confirmLabel={candidate.isArchived ? 'Restore' : 'Archive'}
        loading={busy}
      />
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
