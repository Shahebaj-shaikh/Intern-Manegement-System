import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2, Users, Briefcase } from 'lucide-react';
import { departmentApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Textarea } from '../../components/Textarea';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { useToast } from '../../context/ToastContext';

export const DepartmentList = () => {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data, isLoading, isError } = useQuery({ queryKey: ['departments-full'], queryFn: () => departmentApi.list().then((r) => r.data.data) });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await departmentApi.create(form);
      showToast('Department created');
      setForm({ name: '', description: '' });
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['departments-full'] });
      qc.invalidateQueries({ queryKey: ['departments'] });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create department.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Departments</h1>
          <p className="text-sm text-slate-500">{data?.length ?? 0} total</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus size={16} /> Add Department</Button>
      </div>

      {isLoading ? (
        <Skeleton rows={4} cols={3} />
      ) : isError ? (
        <ErrorState />
      ) : data?.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((d) => (
            <Card key={d._id} className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"><Building2 size={18} /></div>
                <h3 className="font-medium text-slate-800">{d.name}</h3>
              </div>
              <p className="text-sm text-slate-500 mb-4">{d.description || 'No description provided.'}</p>
              <div className="flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Users size={13} /> {d.internCount} interns</span>
                <span className="flex items-center gap-1"><Briefcase size={13} /> {d.employeeCount} employees</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Building2} title="No departments yet" message="Create your first department to start organizing interns." />
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Department">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>Create department</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
