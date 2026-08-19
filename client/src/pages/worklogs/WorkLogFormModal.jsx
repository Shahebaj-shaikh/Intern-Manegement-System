import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Textarea } from '../../components/Textarea';
import { Button } from '../../components/Button';
import { taskApi, workLogApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';

const empty = { task: '', date: '', hours: '', workCompleted: '', nextSteps: '', blockers: '' };

export const WorkLogFormModal = ({ open, onClose, onSaved }) => {
  const { showToast } = useToast();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data } = useQuery({
    queryKey: ['tasks-for-worklog'],
    queryFn: () => taskApi.list({ limit: 100 }).then((r) => r.data.data.tasks),
    enabled: open,
  });

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await workLogApi.create({
        ...form,
        hours: Number(form.hours),
      });
      showToast('Work log submitted');
      setForm(empty);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit work log.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New work log">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <Select
          label="Task"
          required
          value={form.task}
          onChange={update('task')}
          options={(data || []).map((t) => ({ value: t._id, label: t.title }))}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Date" type="date" required value={form.date} onChange={update('date')} />
          <Input label="Hours" type="number" min="0.25" max="24" step="0.25" required value={form.hours} onChange={update('hours')} />
        </div>
        <Textarea label="Work completed" required value={form.workCompleted} onChange={update('workCompleted')} />
        <Textarea label="Next steps" value={form.nextSteps} onChange={update('nextSteps')} />
        <Textarea label="Blockers" value={form.blockers} onChange={update('blockers')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Save log</Button>
        </div>
      </form>
    </Modal>
  );
};
