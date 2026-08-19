import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Sliders, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { performanceApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Textarea } from '../../components/Textarea';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { useToast } from '../../context/ToastContext';

export const TemplatesTab = () => {
  const qc = useQueryClient();
  const { showToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    isDefault: false,
    categories: [
      { name: 'Technical Skills', description: 'Core programming proficiency', minScore: 1, maxScore: 10, weight: 1.5, order: 1 },
      { name: 'Communication', description: 'Written and oral communication', minScore: 1, maxScore: 10, weight: 1, order: 2 },
      { name: 'Problem Solving', description: 'Analytical and debugging abilities', minScore: 1, maxScore: 10, weight: 1.2, order: 3 },
    ],
  });

  const { data: templates, isLoading, isError } = useQuery({
    queryKey: ['evaluation-templates-admin'],
    queryFn: () => performanceApi.getTemplates().then((r) => r.data.data),
  });

  const openCreateModal = () => {
    setEditingTemplate(null);
    setForm({
      name: '',
      description: '',
      isDefault: false,
      categories: [
        { name: 'Technical Skills', description: 'Programming and tool mastery', minScore: 1, maxScore: 10, weight: 1.5, order: 1 },
        { name: 'Communication', description: 'Team and client communication', minScore: 1, maxScore: 10, weight: 1, order: 2 },
        { name: 'Problem Solving', description: 'Analytical thinking and debugging', minScore: 1, maxScore: 10, weight: 1.2, order: 3 },
      ],
    });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (tmpl) => {
    setEditingTemplate(tmpl);
    setForm({
      name: tmpl.name,
      description: tmpl.description || '',
      isDefault: tmpl.isDefault || false,
      categories: tmpl.categories || [],
    });
    setError('');
    setShowModal(true);
  };

  const handleAddCategoryRow = () => {
    setForm((f) => ({
      ...f,
      categories: [
        ...f.categories,
        {
          name: '',
          description: '',
          minScore: 1,
          maxScore: 10,
          weight: 1,
          order: f.categories.length + 1,
        },
      ],
    }));
  };

  const handleRemoveCategoryRow = (index) => {
    setForm((f) => ({
      ...f,
      categories: f.categories.filter((_, i) => i !== index),
    }));
  };

  const handleCategoryFieldChange = (index, field, value) => {
    setForm((f) => {
      const updated = [...f.categories];
      updated[index] = { ...updated[index], [field]: value };
      return { ...f, categories: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Template name is required.');
      return;
    }
    if (!form.categories || form.categories.length === 0) {
      setError('At least one category is required.');
      return;
    }

    for (let i = 0; i < form.categories.length; i++) {
      if (!form.categories[i].name.trim()) {
        setError(`Category #${i + 1} must have a name.`);
        return;
      }
    }

    setError('');
    setLoading(true);
    try {
      if (editingTemplate) {
        await performanceApi.updateTemplate(editingTemplate._id, form);
        showToast('Template updated successfully');
      } else {
        await performanceApi.createTemplate(form);
        showToast('Template created successfully');
      }
      setShowModal(false);
      qc.invalidateQueries({ queryKey: ['evaluation-templates-admin'] });
      qc.invalidateQueries({ queryKey: ['evaluation-templates'] });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save evaluation template.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this template?')) return;
    try {
      await performanceApi.deleteTemplate(id);
      showToast('Template deactivated');
      qc.invalidateQueries({ queryKey: ['evaluation-templates-admin'] });
    } catch (err) {
      showToast('Failed to deactivate template', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Evaluation Templates & Rubric Configuration</h2>
          <p className="text-xs text-slate-500">Configure customizable evaluation categories and scoring criteria in MongoDB</p>
        </div>

        <Button onClick={openCreateModal}>
          <Plus size={16} /> New Template
        </Button>
      </div>

      {/* Templates List */}
      {isLoading ? (
        <Skeleton rows={3} cols={2} />
      ) : isError ? (
        <ErrorState message="Could not load templates." />
      ) : templates?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {templates.map((tmpl) => (
            <Card key={tmpl._id} className="p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      {tmpl.name}
                      {tmpl.isDefault && (
                        <span className="bg-brand-50 text-brand-700 text-xs px-2 py-0.5 rounded-full border border-brand-200">
                          Default
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{tmpl.description || 'No description provided.'}</p>
                  </div>
                  {!tmpl.isActive && (
                    <span className="bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded-full border border-red-200">
                      Inactive
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Configured Categories ({tmpl.categories?.length || 0})
                  </span>
                  <div className="space-y-1.5">
                    {tmpl.categories?.map((cat, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-md">
                        <div>
                          <span className="font-medium text-slate-700">{cat.name}</span>
                          {cat.description && <span className="text-slate-400 ml-1">· {cat.description}</span>}
                        </div>
                        <div className="text-slate-500 font-mono text-[11px] shrink-0">
                          {cat.minScore}-{cat.maxScore} (w: {cat.weight || 1})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEditModal(tmpl)}>
                  Edit
                </Button>
                {tmpl.isActive && (
                  <Button size="sm" variant="secondary" onClick={() => handleDelete(tmpl._id)}>
                    Deactivate
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={Sliders}
            title="No evaluation templates"
            message="Create dynamic evaluation rubrics and category configurations."
          />
        </Card>
      )}

      {/* Create / Edit Template Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingTemplate ? 'Edit Evaluation Template' : 'Configure Evaluation Template'}
        width="max-w-3xl"
      >
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Template Name"
              required
              placeholder="e.g. Mid-Term Engineering Rubric"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />

            <div className="flex items-center gap-2 pt-6">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span>Set as Default Rubric for new evaluations</span>
              </label>
            </div>
          </div>

          <Textarea
            label="Description (Optional)"
            placeholder="Describe who this evaluation rubric applies to..."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />

          {/* Categories List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Sparkles size={16} className="text-brand-600" />
                Evaluation Categories (Dynamic)
              </h4>
              <Button type="button" size="sm" variant="secondary" onClick={handleAddCategoryRow}>
                <Plus size={14} /> Add Category
              </Button>
            </div>

            <div className="space-y-3">
              {form.categories.map((cat, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-5">
                      <Input
                        placeholder="Category Name (e.g. Technical Skills)"
                        required
                        value={cat.name}
                        onChange={(e) => handleCategoryFieldChange(idx, 'name', e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        type="number"
                        placeholder="Min Score"
                        value={cat.minScore}
                        onChange={(e) => handleCategoryFieldChange(idx, 'minScore', Number(e.target.value))}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        type="number"
                        placeholder="Max Score"
                        value={cat.maxScore}
                        onChange={(e) => handleCategoryFieldChange(idx, 'maxScore', Number(e.target.value))}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Weight"
                        value={cat.weight}
                        onChange={(e) => handleCategoryFieldChange(idx, 'weight', Number(e.target.value))}
                      />
                    </div>
                    <div className="sm:col-span-1 text-center">
                      {form.categories.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCategoryRow(idx)}
                          className="text-slate-400 hover:text-red-600 p-1"
                          title="Remove Category"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <Input
                    placeholder="Brief rubric criteria / description for evaluators..."
                    value={cat.description}
                    onChange={(e) => handleCategoryFieldChange(idx, 'description', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Save Template Configuration
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
