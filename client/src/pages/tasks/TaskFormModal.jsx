import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Textarea } from '../../components/Textarea';
import { Button } from '../../components/Button';
import { taskApi, internApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';

const empty = { title: '', description: '', assignedTo: '', priority: 'medium', startDate: '', deadline: '', estimatedHours: '' };

export const TaskFormModal = ({ open, onClose, onSaved }) => {
  const { showToast } = useToast();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data } = useQuery({ queryKey: ['interns-for-task'], queryFn: () => internApi.list({ status: 'active', limit: 100 }).then((r) => r.data.data.interns), enabled: open });

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await taskApi.create({
        ...form,
        estimatedHours: form.estimatedHours === '' ? 0 : Number(form.estimatedHours),
      });
      showToast('Task created and assigned');
      setForm(empty);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Task">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label="Task title" required value={form.title} onChange={update('title')} />
        <Textarea label="Description" value={form.description} onChange={update('description')} />
        <Select label="Assign to" required value={form.assignedTo} onChange={update('assignedTo')} options={(data || []).map((i) => ({ value: i._id, label: i.fullName }))} />
        <Select label="Priority" value={form.priority} onChange={update('priority')} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }]} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Start date" type="date" value={form.startDate} onChange={update('startDate')} />
          <Input label="Deadline" type="date" required value={form.deadline} onChange={update('deadline')} />
        </div>
        <Input
          label="Estimated hours"
          type="number"
          min="0"
          step="0.5"
          placeholder="8"
          value={form.estimatedHours}
          onChange={update('estimatedHours')}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create task</Button>
        </div>
      </form>
    </Modal>
  );
};
