import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Award,
  Calendar,
  User,
  History,
  CheckCircle,
  Eye,
  FileEdit,
  Lock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { performanceApi, internApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { Select } from '../../components/Select';
import { Input } from '../../components/Input';
import { Textarea } from '../../components/Textarea';
import { Table } from '../../components/Table';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const EvaluationsTab = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const isIntern = user.role === 'intern';
  const canEvaluate = ['team_lead', 'hr', 'super_admin'].includes(user.role);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [selectedHistory, setSelectedHistory] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form State
  const [form, setForm] = useState({
    intern: '',
    template: '',
    evaluationPeriod: 'Mid-Term',
    categoryScores: [],
    strengths: '',
    weaknesses: '',
    improvementPlan: '',
    overallRecommendation: 'satisfactory',
    status: 'submitted',
  });

  // Query evaluations list
  const { data, isLoading, isError } = useQuery({
    queryKey: ['evaluations-list'],
    queryFn: () => performanceApi.getEvaluations({ limit: 50 }).then((r) => r.data.data),
  });

  // Query templates for dynamic evaluation form
  const { data: templates } = useQuery({
    queryKey: ['evaluation-templates'],
    queryFn: () => performanceApi.getTemplates().then((r) => r.data.data),
    enabled: canEvaluate,
  });

  // Query interns for evaluator dropdown
  const { data: internsList } = useQuery({
    queryKey: ['eval-interns-dropdown'],
    queryFn: () => internApi.list({ limit: 100 }).then((r) => r.data.data.interns),
    enabled: canEvaluate,
  });

  // When template is selected in create modal, initialize dynamic categoryScores
  const handleTemplateChange = (templateId) => {
    const tmpl = templates?.find((t) => t._id === templateId);
    if (tmpl && tmpl.categories) {
      const initialScores = tmpl.categories.map((cat) => ({
        categoryId: cat._id,
        categoryName: cat.name,
        score: Math.round((cat.maxScore || 10) / 2),
        maxScore: cat.maxScore || 10,
        weight: cat.weight || 1,
        notes: '',
      }));
      setForm((f) => ({ ...f, template: templateId, categoryScores: initialScores }));
    } else {
      setForm((f) => ({ ...f, template: templateId }));
    }
  };

  // Real-time calculated overall score
  const calculatedScore = useMemo(() => {
    if (!form.categoryScores || form.categoryScores.length === 0) return 0;
    let totalWeighted = 0;
    let totalWeight = 0;
    form.categoryScores.forEach((item) => {
      const weight = item.weight || 1;
      const max = item.maxScore || 10;
      const normalized = (item.score / max) * 10;
      totalWeighted += normalized * weight;
      totalWeight += weight;
    });
    return totalWeight > 0 ? Number((totalWeighted / totalWeight).toFixed(2)) : 0;
  }, [form.categoryScores]);

  // Open Create / Edit Modal
  const openNewEvaluation = () => {
    const defaultTmpl = templates?.find((t) => t.isDefault) || templates?.[0];
    let initialScores = [];
    if (defaultTmpl && defaultTmpl.categories) {
      initialScores = defaultTmpl.categories.map((cat) => ({
        categoryId: cat._id,
        categoryName: cat.name,
        score: Math.round((cat.maxScore || 10) / 2),
        maxScore: cat.maxScore || 10,
        weight: cat.weight || 1,
        notes: '',
      }));
    } else {
      // Fallback default categories if no templates exist yet
      initialScores = [
        { categoryName: 'Technical Skills', score: 7, maxScore: 10, weight: 1.5, notes: '' },
        { categoryName: 'Communication', score: 8, maxScore: 10, weight: 1, notes: '' },
        { categoryName: 'Problem Solving', score: 7, maxScore: 10, weight: 1.2, notes: '' },
        { categoryName: 'Discipline', score: 9, maxScore: 10, weight: 0.8, notes: '' },
        { categoryName: 'Task Completion', score: 8, maxScore: 10, weight: 1.3, notes: '' },
      ];
    }

    setEditingId(null);
    setForm({
      intern: internsList?.[0]?._id || '',
      template: defaultTmpl?._id || '',
      evaluationPeriod: 'Mid-Term',
      categoryScores: initialScores,
      strengths: '',
      weaknesses: '',
      improvementPlan: '',
      overallRecommendation: 'satisfactory',
      status: 'submitted',
    });
    setError('');
    setShowCreateModal(true);
  };

  const openEditDraft = (ev) => {
    setEditingId(ev._id);
    setForm({
      intern: ev.intern?._id,
      template: ev.template?._id || '',
      evaluationPeriod: ev.evaluationPeriod,
      categoryScores: ev.categoryScores || [],
      strengths: ev.strengths || '',
      weaknesses: ev.weaknesses || '',
      improvementPlan: ev.improvementPlan || '',
      overallRecommendation: ev.overallRecommendation || 'satisfactory',
      status: ev.status || 'draft',
    });
    setError('');
    setShowCreateModal(true);
  };

  const handleScoreChange = (index, field, value) => {
    setForm((f) => {
      const updated = [...f.categoryScores];
      updated[index] = { ...updated[index], [field]: value };
      return { ...f, categoryScores: updated };
    });
  };

  const handleSubmitEvaluation = async (submitStatus) => {
    if (!form.intern) {
      setError('Please select an intern.');
      return;
    }
    if (!form.categoryScores || form.categoryScores.length === 0) {
      setError('Evaluation categories are required.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const payload = { ...form, status: submitStatus };
      if (editingId) {
        await performanceApi.updateEvaluation(editingId, payload);
        showToast(`Evaluation ${submitStatus === 'draft' ? 'saved as draft' : 'submitted'}`);
      } else {
        await performanceApi.createEvaluation(payload);
        showToast(`Evaluation ${submitStatus === 'draft' ? 'saved as draft' : 'submitted'}`);
      }
      setShowCreateModal(false);
      qc.invalidateQueries({ queryKey: ['evaluations-list'] });
      qc.invalidateQueries({ queryKey: ['performance-dashboard'] });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save evaluation.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async (id) => {
    try {
      await performanceApi.finalizeEvaluation(id);
      showToast('Evaluation finalized and locked successfully');
      setShowDetailModal(false);
      qc.invalidateQueries({ queryKey: ['evaluations-list'] });
      qc.invalidateQueries({ queryKey: ['performance-dashboard'] });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to finalize evaluation', 'error');
    }
  };

  const openHistory = async (ev) => {
    try {
      const res = await performanceApi.getEvaluationHistory(ev._id);
      setSelectedHistory(res.data.data);
      setSelectedEvaluation(ev);
      setShowHistoryModal(true);
    } catch (err) {
      showToast('Failed to load version history', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Formal Mid-Term & Periodic Evaluations</h2>
          <p className="text-xs text-slate-500">Structured rubric evaluations with category scoring and version history</p>
        </div>

        {canEvaluate && (
          <Button onClick={openNewEvaluation}>
            <Plus size={16} /> New Evaluation
          </Button>
        )}
      </div>

      {/* Evaluations Table */}
      {isLoading ? (
        <Skeleton rows={5} cols={4} />
      ) : isError ? (
        <ErrorState message="Could not load evaluations." />
      ) : data?.evaluations?.length ? (
        <Card className="overflow-hidden">
          <Table columns={['Intern', 'Evaluator', 'Period', 'Overall Score', 'Status', 'Date', 'Version', 'Actions']}>
            {data.evaluations.map((ev) => (
              <tr key={ev._id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3.5">
                  <div className="font-semibold text-slate-800">{ev.intern?.fullName}</div>
                  <div className="text-xs text-slate-400">{ev.intern?.email}</div>
                </td>
                <td className="px-4 py-3.5 text-slate-600 text-xs">
                  {ev.evaluatorDetails?.fullName || ev.evaluator?.email}
                </td>
                <td className="px-4 py-3.5 text-xs font-medium text-slate-700">{ev.evaluationPeriod}</td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-brand-50 text-brand-700 border border-brand-100">
                    {ev.overallScore} / 10
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <Badge value={ev.status} />
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-500">
                  {new Date(ev.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-500">v{ev.version || 1}</td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedEvaluation(ev);
                        setShowDetailModal(true);
                      }}
                    >
                      <Eye size={14} /> View
                    </Button>

                    {canEvaluate && ev.status === 'draft' && (
                      <Button size="sm" variant="secondary" onClick={() => openEditDraft(ev)}>
                        <FileEdit size={14} /> Edit
                      </Button>
                    )}

                    <Button size="sm" variant="secondary" onClick={() => openHistory(ev)} title="View Version History">
                      <History size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={Award}
            title="No evaluations found"
            message="Formal performance evaluations will appear here."
          />
        </Card>
      )}

      {/* New / Edit Evaluation Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={editingId ? 'Edit Draft Evaluation' : 'New Mid-Term Evaluation'}
        width="max-w-3xl"
      >
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}
        <div className="space-y-5">
          <div className="grid sm:grid-cols-3 gap-4">
            <Select
              label="Select Intern"
              required
              disabled={!!editingId}
              value={form.intern}
              onChange={(e) => setForm((f) => ({ ...f, intern: e.target.value }))}
              options={(internsList || []).map((i) => ({ value: i._id, label: `${i.fullName} (${i.email})` }))}
            />

            <Select
              label="Template (Configurable Rubric)"
              value={form.template}
              onChange={(e) => handleTemplateChange(e.target.value)}
              options={(templates || []).map((t) => ({ value: t._id, label: t.name }))}
            />

            <Input
              label="Evaluation Period"
              required
              placeholder="e.g. Mid-Term, Q2"
              value={form.evaluationPeriod}
              onChange={(e) => setForm((f) => ({ ...f, evaluationPeriod: e.target.value }))}
            />
          </div>

          {/* Dynamic Category Scores */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <Sparkles size={16} className="text-brand-600" />
                Category Rubric Scoring
              </h4>
              <div className="text-sm font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-3 py-1 rounded-lg">
                Overall Score Preview: {calculatedScore} / 10
              </div>
            </div>

            <div className="space-y-4">
              {form.categoryScores.map((cat, idx) => (
                <div key={idx} className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm text-slate-800">{cat.categoryName}</span>
                      <span className="text-xs text-slate-400 ml-2">(Weight: {cat.weight || 1})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">{cat.score}</span>
                      <span className="text-xs text-slate-400">/ {cat.maxScore || 10}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={cat.maxScore || 10}
                      step={0.5}
                      value={cat.score}
                      onChange={(e) => handleScoreChange(idx, 'score', Number(e.target.value))}
                      className="w-full accent-brand-600"
                    />
                  </div>

                  <Input
                    placeholder="Specific notes or observation for this category..."
                    value={cat.notes || ''}
                    onChange={(e) => handleScoreChange(idx, 'notes', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Qualitative Feedback */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Textarea
              label="Key Strengths"
              placeholder="What did the intern excel at?"
              value={form.strengths}
              onChange={(e) => setForm((f) => ({ ...f, strengths: e.target.value }))}
            />

            <Textarea
              label="Areas for Improvement / Weaknesses"
              placeholder="Where should the intern focus next?"
              value={form.weaknesses}
              onChange={(e) => setForm((f) => ({ ...f, weaknesses: e.target.value }))}
            />
          </div>

          <Textarea
            label="Targeted Improvement Action Plan"
            placeholder="Specific actionable goals or milestones for the second half of the internship..."
            value={form.improvementPlan}
            onChange={(e) => setForm((f) => ({ ...f, improvementPlan: e.target.value }))}
          />

          <Select
            label="Overall Recommendation"
            value={form.overallRecommendation}
            onChange={(e) => setForm((f) => ({ ...f, overallRecommendation: e.target.value }))}
            options={[
              { value: 'exceptional', label: 'Exceptional (Exceeds all expectations)' },
              { value: 'excellent', label: 'Excellent (Consistently strong performance)' },
              { value: 'satisfactory', label: 'Satisfactory (Meets job requirements)' },
              { value: 'needs_improvement', label: 'Needs Improvement (Requires support)' },
              { value: 'terminate', label: 'Unsatisfactory (Consider offboarding/action)' },
            ]}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="button" variant="secondary" loading={loading} onClick={() => handleSubmitEvaluation('draft')}>
              Save as Draft
            </Button>
            <Button type="button" loading={loading} onClick={() => handleSubmitEvaluation('submitted')}>
              Submit Evaluation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Evaluation Details Modal */}
      {selectedEvaluation && (
        <Modal
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`${selectedEvaluation.evaluationPeriod} Evaluation Details`}
          width="max-w-2xl"
        >
          <div className="space-y-5">
            {/* Header info */}
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="font-bold text-slate-800">{selectedEvaluation.intern?.fullName}</h3>
                <p className="text-xs text-slate-500">{selectedEvaluation.intern?.email}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Evaluated by {selectedEvaluation.evaluatorDetails?.fullName || selectedEvaluation.evaluator?.email}
                </p>
              </div>
              <div className="text-right space-y-1.5">
                <div className="text-2xl font-black text-brand-600">{selectedEvaluation.overallScore} / 10</div>
                <Badge value={selectedEvaluation.status} />
              </div>
            </div>

            {/* Category Rubric */}
            <div>
              <h4 className="font-semibold text-slate-800 text-sm mb-3">Category Scores</h4>
              <div className="space-y-2.5">
                {selectedEvaluation.categoryScores?.map((cat, idx) => (
                  <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span>{cat.categoryName}</span>
                      <span>
                        {cat.score} / {cat.maxScore || 10}
                      </span>
                    </div>
                    {cat.notes && <p className="text-slate-500 italic">Notes: {cat.notes}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Qualitative Notes */}
            {selectedEvaluation.strengths && (
              <div className="text-xs bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                <strong className="text-emerald-800 block mb-1">Strengths:</strong>
                <p className="text-emerald-700">{selectedEvaluation.strengths}</p>
              </div>
            )}

            {selectedEvaluation.weaknesses && (
              <div className="text-xs bg-amber-50 p-3 rounded-lg border border-amber-100">
                <strong className="text-amber-800 block mb-1">Areas for Improvement:</strong>
                <p className="text-amber-700">{selectedEvaluation.weaknesses}</p>
              </div>
            )}

            {selectedEvaluation.improvementPlan && (
              <div className="text-xs bg-blue-50 p-3 rounded-lg border border-blue-100">
                <strong className="text-blue-800 block mb-1">Improvement Plan:</strong>
                <p className="text-blue-700">{selectedEvaluation.improvementPlan}</p>
              </div>
            )}

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
              <span>Overall Recommendation:</span>
              <span className="font-bold uppercase tracking-wider text-brand-700">
                {selectedEvaluation.overallRecommendation}
              </span>
            </div>

            {/* Finalization Action */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-400">
                {selectedEvaluation.status === 'finalized' ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <Lock size={12} /> Finalized & Locked (v{selectedEvaluation.version})
                  </span>
                ) : (
                  <span>Version {selectedEvaluation.version || 1} (Draft / Submitted)</span>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                  Close
                </Button>
                {canEvaluate && selectedEvaluation.status !== 'finalized' && (
                  <Button onClick={() => handleFinalize(selectedEvaluation._id)}>
                    <CheckCircle size={14} /> Finalize Evaluation
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Version History Modal */}
      {selectedHistory && (
        <Modal
          open={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          title="Evaluation Version History"
          width="max-w-2xl"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Audit log of all versions, updates, and finalization snapshots for this evaluation.
            </p>

            <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 pl-4">
              {selectedHistory.history?.map((snap, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[23px] top-0 w-3 h-3 rounded-full bg-brand-600 ring-4 ring-white" />
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Version {snap.version}</span>
                      <span className="text-slate-400">{new Date(snap.modifiedAt).toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-slate-600">
                      <span className="font-medium">Change: </span>
                      {snap.changeSummary || 'Snapshot recorded'}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <Badge value={snap.status} />
                      <span className="font-semibold text-brand-600">Score: {snap.overallScore}/10</span>
                      {snap.modifiedBy && (
                        <span className="text-slate-400">By: {snap.modifiedBy?.email}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
                Close History
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
