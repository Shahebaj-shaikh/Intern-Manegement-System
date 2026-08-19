import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Paperclip, Send, CheckCircle2, XCircle } from 'lucide-react';
import { taskApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Textarea } from '../../components/Textarea';
import { Skeleton } from '../../components/Skeleton';
import { ErrorState } from '../../components/ErrorState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const isTaskOverdue = (task) => {
  if (!task?.deadline) return false;
  if (['completed', 'rejected'].includes(task.status)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.deadline);
  due.setHours(0, 0, 0, 0);
  return today.getTime() > due.getTime();
};

export const TaskDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [comment, setComment] = useState('');
  const [submitNotes, setSubmitNotes] = useState('');
  const [files, setFiles] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['task', id],
    queryFn: () => taskApi.get(id).then((r) => r.data.data),
  });

  const isOwner = user.role === 'intern' && String(data?.task?.assignedTo?._id) === String(user.profile?._id);
  const canReview = ['team_lead', 'hr', 'super_admin'].includes(user.role);

  const addComment = async () => {
    if (!comment.trim()) return;
    try {
      await taskApi.addComment(id, comment);
      setComment('');
      refetch();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not add comment', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('notes', submitNotes);
      files.forEach((f) => fd.append('files', f));
      await taskApi.submit(id, fd);
      showToast('Task submitted for review');
      setSubmitNotes('');
      setFiles([]);
      refetch();
      qc.invalidateQueries({ queryKey: ['tasks'] });
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not submit task', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleReview = async (submissionId, decision) => {
    setBusy(true);
    try {
      await taskApi.review(id, submissionId, { decision, feedback });
      showToast(`Submission ${decision}`);
      setFeedback('');
      refetch();
      qc.invalidateQueries({ queryKey: ['tasks'] });
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not review submission', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) return <Skeleton rows={6} cols={2} />;
  if (isError || !data) return <ErrorState message="This task could not be found." />;

  const { task, submissions } = data;
  const overdue = isTaskOverdue(task);
  const pending = submissions?.filter((s) => s.reviewStatus === 'pending') || [];

  return (
    <div className="space-y-6 max-w-3xl">
      <Link to="/tasks" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} /> Back to tasks
      </Link>

      <Card className={`p-6 ${overdue ? 'border-red-400' : ''}`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-800">{task.title}</h1>
              {overdue && (
                <span className="inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-100">
                  Overdue
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">Assigned to {task.assignedTo?.fullName} · by {task.createdBy?.fullName}</p>
          </div>
          <div className="flex gap-2">
            <Badge value={task.priority} />
            <Badge value={task.status} />
          </div>
        </div>
        <p className="text-sm text-slate-600 mt-4 whitespace-pre-wrap">{task.description || 'No description provided.'}</p>
        <div className="flex flex-wrap gap-6 mt-4 text-sm text-slate-500">
          <span>Start: {task.startDate ? new Date(task.startDate).toLocaleDateString() : '—'}</span>
          <span className={overdue ? 'font-semibold text-red-600' : ''}>
            Deadline: {new Date(task.deadline).toLocaleDateString()}
          </span>
          <span>Hours: {task.actualHours || 0} actual / {task.estimatedHours || 0} estimated</span>
        </div>
        {isOwner && (
          <Link to="/worklogs" className="inline-block mt-4 text-sm font-medium text-brand-600 hover:underline">
            Log hours on this task
          </Link>
        )}
      </Card>

      {isOwner && task.status !== 'completed' && (
        <Card className="p-6">
          <h3 className="font-medium text-slate-800 mb-1">Submit your work</h3>
          <p className="text-xs text-slate-500 mb-3">Upload files and notes. This sends the task to review — it does not use the Kanban drag.</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea placeholder="Notes about your submission..." value={submitNotes} onChange={(e) => setSubmitNotes(e.target.value)} />
            <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files))} className="text-sm" />
            <Button type="submit" loading={busy}><Paperclip size={15} /> Submit task</Button>
          </form>
        </Card>
      )}

      {submissions?.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-slate-800">Submissions & review</h3>
            {pending.length > 0 && canReview && (
              <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                {pending.length} pending
              </span>
            )}
          </div>
          <div className="space-y-4">
            {submissions.map((s) => (
              <div key={s._id} className="border border-slate-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">{new Date(s.submittedAt).toLocaleString()}</p>
                  <Badge value={s.reviewStatus} />
                </div>
                {s.notes && <p className="text-sm text-slate-600 mt-2">{s.notes}</p>}
                {s.files?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {s.files.map((f) => (
                      <a key={f} href={`http://localhost:5000${f}`} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                        <Paperclip size={12} /> Attachment
                      </a>
                    ))}
                  </div>
                )}
                {s.feedback && <p className="text-sm text-slate-500 mt-2 italic">"{s.feedback}"</p>}

                {canReview && s.reviewStatus === 'pending' && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    <p className="text-xs text-slate-500">Approve to complete the task, or request changes to send it back.</p>
                    <Textarea placeholder="Feedback for the intern..." value={feedback} onChange={(e) => setFeedback(e.target.value)} />
                    <div className="flex gap-2">
                      <Button variant="primary" onClick={() => handleReview(s._id, 'approved')} loading={busy}><CheckCircle2 size={15} /> Approve</Button>
                      <Button variant="danger" onClick={() => handleReview(s._id, 'rejected')} loading={busy}><XCircle size={15} /> Request changes</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="font-medium text-slate-800 mb-4">Comments</h3>
        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
          {task.comments?.length ? task.comments.map((c, i) => (
            <div key={c._id || i} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="font-medium text-slate-700">{c.authorName}</span>
                <span className="text-slate-400 text-xs">{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-slate-600">{c.text}</p>
            </div>
          )) : <p className="text-sm text-slate-400">No comments yet.</p>}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addComment();
          }}
        >
          <input
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button type="submit" disabled={!comment.trim()}><Send size={15} /></Button>
        </form>
      </Card>
    </div>
  );
};
