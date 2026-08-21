import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, MessageSquare, User, Calendar, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import { performanceApi, internApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Select } from '../../components/Select';
import { Input } from '../../components/Input';
import { Textarea } from '../../components/Textarea';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const FEEDBACK_CATEGORIES = [
  { value: 'General', label: 'General Performance' },
  { value: 'Technical Skills', label: 'Technical & Coding Skills' },
  { value: 'Communication', label: 'Communication & Teamwork' },
  { value: 'Problem Solving', label: 'Problem Solving & Debugging' },
  { value: 'Discipline', label: 'Discipline & Punctuality' },
  { value: 'Task Delivery', label: 'Task Execution & Delivery' },
];

export const FeedbackTab = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const isIntern = user.role === 'intern';
  const canGiveFeedback = ['team_lead', 'hr', 'super_admin'].includes(user.role);

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedInternFilter, setSelectedInternFilter] = useState('');

  const [form, setForm] = useState({
    intern: '',
    category: 'General',
    strengths: '',
    weaknesses: '',
    improvementSuggestions: '',
    comments: '',
  });

  // Query intern options if authorized
  const { data: internsList } = useQuery({
    queryKey: ['interns-feedback-list'],
    queryFn: () => internApi.list({ limit: 100 }).then((r) => r.data.data.interns),
    enabled: canGiveFeedback,
  });

  // Query feedbacks
  const { data, isLoading, isError } = useQuery({
    queryKey: ['performance-feedbacks', selectedInternFilter],
    queryFn: () =>
      performanceApi
        .getFeedback({
          intern: selectedInternFilter || undefined,
          limit: 50,
        })
        .then((r) => r.data.data),
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.intern) {
      setError('Please select an intern.');
      return;
    }
    if (!form.comments.trim()) {
      setError('Comments are required.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await performanceApi.createFeedback(form);
      showToast('Feedback submitted successfully');
      setShowModal(false);
      setForm({
        intern: '',
        category: 'General',
        strengths: '',
        weaknesses: '',
        improvementSuggestions: '',
        comments: '',
      });
      qc.invalidateQueries({ queryKey: ['performance-feedbacks'] });
      qc.invalidateQueries({ queryKey: ['performance-dashboard'] });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Continuous Feedback</h2>
          <p className="text-xs text-slate-500">Continuous peer and managerial feedback records</p>
        </div>

        <div className="flex items-center gap-3">
          {!isIntern && (
            <div className="w-56">
              <Select
                placeholder="Filter by intern..."
                value={selectedInternFilter}
                onChange={(e) => setSelectedInternFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Interns' },
                  ...(internsList || []).map((i) => ({ value: i._id, label: i.fullName })),
                ]}
              />
            </div>
          )}

          {canGiveFeedback && (
            <Button onClick={() => setShowModal(true)}>
              <Plus size={16} /> Give Feedback
            </Button>
          )}
        </div>
      </div>

      {/* Feedbacks list */}
      {isLoading ? (
        <Skeleton rows={4} cols={2} />
      ) : isError ? (
        <ErrorState message="Could not load feedback records." />
      ) : data?.feedbacks?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.feedbacks.map((fb) => (
            <Card key={fb._id} className="p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 mb-1 border border-brand-100">
                      {fb.category || 'General'}
                    </span>
                    <h3 className="font-semibold text-slate-800 text-sm">{fb.intern?.fullName}</h3>
                  </div>
                  <div className="text-right text-xs text-slate-400 flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(fb.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 italic my-3">
                  "{fb.comments}"
                </p>

                <div className="space-y-2 text-xs">
                  {fb.strengths && (
                    <div className="flex items-start gap-2 text-slate-600">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-700">Strengths: </strong>
                        {fb.strengths}
                      </span>
                    </div>
                  )}
                  {fb.weaknesses && (
                    <div className="flex items-start gap-2 text-slate-600">
                      <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-700">Areas for Attention: </strong>
                        {fb.weaknesses}
                      </span>
                    </div>
                  )}
                  {fb.improvementSuggestions && (
                    <div className="flex items-start gap-2 text-slate-600">
                      <TrendingUp size={14} className="text-blue-500 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-700">Suggestions: </strong>
                        {fb.improvementSuggestions}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <User size={13} className="text-slate-400" />
                  Given by {fb.authorDetails?.fullName || fb.author?.email}
                </span>
                {fb.authorDetails?.designation && (
                  <span className="text-slate-400">({fb.authorDetails.designation})</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={MessageSquare}
            title="No feedback found"
            message="Continuous feedback entries will appear here."
          />
        </Card>
      )}

      {/* Give Feedback Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Give Continuous Feedback" width="max-w-xl">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}
        <form onSubmit={onSubmit} className="space-y-4">
          <Select
            label="Select Intern"
            required
            value={form.intern}
            onChange={(e) => setForm((f) => ({ ...f, intern: e.target.value }))}
            options={(internsList || []).map((i) => ({ value: i._id, label: `${i.fullName} (${i.email})` }))}
          />

          <Select
            label="Feedback Category"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            options={FEEDBACK_CATEGORIES}
          />

          <Textarea
            label="Comments / General Feedback"
            required
            placeholder="Share detailed constructive feedback..."
            value={form.comments}
            onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))}
          />

          <Input
            label="Key Strengths Observed (Optional)"
            placeholder="e.g. Exceptional problem-solving, fast turnaround..."
            value={form.strengths}
            onChange={(e) => setForm((f) => ({ ...f, strengths: e.target.value }))}
          />

          <Input
            label="Weaknesses / Areas for Attention (Optional)"
            placeholder="e.g. Needs to write more descriptive commit messages..."
            value={form.weaknesses}
            onChange={(e) => setForm((f) => ({ ...f, weaknesses: e.target.value }))}
          />

          <Input
            label="Improvement Suggestions (Optional)"
            placeholder="e.g. Review clean code principles for async handling..."
            value={form.improvementSuggestions}
            onChange={(e) => setForm((f) => ({ ...f, improvementSuggestions: e.target.value }))}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Submit Feedback
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
