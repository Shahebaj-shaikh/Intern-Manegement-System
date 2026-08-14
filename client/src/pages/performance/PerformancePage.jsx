import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Award } from 'lucide-react';
import { performanceApi, internApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Select } from '../../components/Select';
import { Textarea } from '../../components/Textarea';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const RATING_FIELDS = [
  ['technicalSkills', 'Technical Skills'], ['taskCompletion', 'Task Completion'], ['problemSolving', 'Problem Solving'],
  ['communication', 'Communication'], ['teamwork', 'Teamwork'], ['punctuality', 'Punctuality'],
  ['learningAbility', 'Learning Ability'], ['professionalism', 'Professionalism'],
];

const RatingBar = ({ label, value }) => (
  <div>
    <div className="flex justify-between text-xs text-slate-500 mb-1">
      <span>{label}</span><span>{value}/10</span>
    </div>
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${value * 10}%` }} />
    </div>
  </div>
);

export const PerformancePage = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const canEvaluate = ['team_lead', 'hr', 'super_admin'].includes(user.role);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ intern: '', evaluationPeriod: '', feedback: '', ratings: Object.fromEntries(RATING_FIELDS.map(([k]) => [k, 5])) });

  const { data, isLoading, isError } = useQuery({ queryKey: ['performance'], queryFn: () => performanceApi.list({ limit: 50 }).then((r) => r.data.data) });
  const { data: internOptions } = useQuery({ queryKey: ['interns-for-eval'], queryFn: () => internApi.list({ status: 'active', limit: 100 }).then((r) => r.data.data.interns), enabled: showForm });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await performanceApi.create(form);
      showToast('Evaluation submitted');
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['performance'] });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit evaluation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{user.role === 'intern' ? 'My Performance' : 'Performance Evaluations'}</h1>
          <p className="text-sm text-slate-500">Ratings and feedback over time</p>
        </div>
        {canEvaluate && <Button onClick={() => setShowForm(true)}><Plus size={16} /> New Evaluation</Button>}
      </div>

      {isLoading ? (
        <Skeleton rows={4} cols={2} />
      ) : isError ? (
        <ErrorState />
      ) : data?.evaluations?.length ? (
        <div className="grid lg:grid-cols-2 gap-5">
          {data.evaluations.map((ev) => (
            <Card key={ev._id} className="p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-slate-800">{ev.intern?.fullName}</h3>
                <span className="text-lg font-semibold text-brand-600">{ev.overallScore}/10</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">Evaluated by {ev.evaluatedBy?.fullName} {ev.evaluationPeriod && `· ${ev.evaluationPeriod}`}</p>
              <div className="space-y-2.5">
                {RATING_FIELDS.map(([k, label]) => <RatingBar key={k} label={label} value={ev.ratings?.[k] || 0} />)}
              </div>
              {ev.feedback && <p className="text-sm text-slate-600 mt-4 pt-4 border-t border-slate-100 italic">"{ev.feedback}"</p>}
            </Card>
          ))}
        </div>
      ) : (
        <Card><EmptyState icon={Award} title="No evaluations yet" message="Performance reviews will appear here." /></Card>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Performance Evaluation" width="max-w-2xl">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}
        <form onSubmit={onSubmit} className="space-y-4">
          <Select label="Intern" required value={form.intern} onChange={(e) => setForm((f) => ({ ...f, intern: e.target.value }))} options={(internOptions || []).map((i) => ({ value: i._id, label: i.fullName }))} />
          <input
            placeholder="Evaluation period (e.g. Month 1, Final)"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            value={form.evaluationPeriod}
            onChange={(e) => setForm((f) => ({ ...f, evaluationPeriod: e.target.value }))}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            {RATING_FIELDS.map(([k, label]) => (
              <div key={k}>
                <label className="flex justify-between text-sm text-slate-600 mb-1">
                  <span>{label}</span><span>{form.ratings[k]}</span>
                </label>
                <input
                  type="range" min={1} max={10} value={form.ratings[k]}
                  onChange={(e) => setForm((f) => ({ ...f, ratings: { ...f.ratings, [k]: Number(e.target.value) } }))}
                  className="w-full accent-brand-600"
                />
              </div>
            ))}
          </div>
          <Textarea label="Written feedback" value={form.feedback} onChange={(e) => setForm((f) => ({ ...f, feedback: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>Submit evaluation</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
