import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { workLogApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Textarea } from '../../components/Textarea';
import { Skeleton } from '../../components/Skeleton';
import { ErrorState } from '../../components/ErrorState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const WorkLogDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [managerComment, setManagerComment] = useState('');
  const [important, setImportant] = useState(false);
  const [busy, setBusy] = useState(false);

  const canReview = ['team_lead', 'hr', 'super_admin'].includes(user.role);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['worklog', id],
    queryFn: () => workLogApi.get(id).then((r) => r.data.data),
  });

  const review = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await workLogApi.review(id, { managerComment, important });
      showToast('Work log reviewed');
      refetch();
      qc.invalidateQueries({ queryKey: ['worklogs'] });
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not review work log', 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await workLogApi.remove(id);
      showToast('Work log deleted');
      qc.invalidateQueries({ queryKey: ['worklogs'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      navigate('/worklogs');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete work log', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) return <Skeleton rows={6} cols={2} />;
  if (isError || !data) return <ErrorState message="This work log could not be found." />;

  const log = data;
  const isOwner = user.role === 'intern' && String(log.intern?._id || log.intern) === String(user.profile?._id);

  return (
    <div className="space-y-6 max-w-3xl">
      <Link to="/worklogs" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} /> Back to work logs
      </Link>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">{log.task?.title || 'Work log'}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {log.intern?.fullName} · {new Date(log.date).toLocaleDateString()} · {log.hours} hours
            </p>
          </div>
          {log.important && (
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">Important</span>
          )}
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-1">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Work completed</dt>
            <dd className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{log.workCompleted}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Next steps</dt>
            <dd className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{log.nextSteps || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Blockers</dt>
            <dd className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{log.blockers || '—'}</dd>
          </div>
        </dl>

        {log.task?._id && (
          <Link to={`/tasks/${log.task._id}`} className="inline-block mt-4 text-sm font-medium text-brand-600 hover:underline">
            Open related task
          </Link>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="font-medium text-slate-800 mb-3">Manager comment</h3>
        {log.managerComment ? (
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{log.managerComment}</p>
        ) : (
          <p className="text-sm text-slate-400">No manager comment yet.</p>
        )}
        {log.reviewedBy?.fullName && (
          <p className="text-xs text-slate-400 mt-2">
            Reviewed by {log.reviewedBy.fullName}
            {log.reviewedAt ? ` · ${new Date(log.reviewedAt).toLocaleString()}` : ''}
          </p>
        )}

        {canReview && (
          <form onSubmit={review} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
            <Textarea
              label="Comment"
              placeholder="Acknowledge progress or request a follow-up."
              value={managerComment}
              onChange={(e) => setManagerComment(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={important} onChange={(e) => setImportant(e.target.checked)} />
              Mark as important
            </label>
            <Button type="submit" loading={busy}>Save review</Button>
          </form>
        )}
      </Card>

      {(isOwner && !log.reviewedAt) || ['hr', 'super_admin'].includes(user.role) ? (
        <Button variant="danger" onClick={remove} loading={busy}>Delete work log</Button>
      ) : null}
    </div>
  );
};
