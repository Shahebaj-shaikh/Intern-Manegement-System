import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../../components/Modal';
import { Select } from '../../components/Select';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { departmentApi, applicationApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';

export const NewApplicationModal = ({ open, onClose, onSaved, candidateId }) => {
  const { showToast } = useToast();
  const [form, setForm] = useState({ department: '', positionTitle: '', notes: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: () => departmentApi.list().then((r) => r.data.data), enabled: open });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await applicationApi.create({ ...form, candidate: candidateId });
      showToast('Application created');
      setForm({ department: '', positionTitle: '', notes: '' });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Application">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <Select label="Program / Department" required value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} options={(departments || []).map((d) => ({ value: d._id, label: d.name }))} />
        <Input label="Position title" placeholder="e.g. Frontend Development Intern" value={form.positionTitle} onChange={(e) => setForm((f) => ({ ...f, positionTitle: e.target.value }))} />
        <Input label="Notes (optional)" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create application</Button>
        </div>
      </form>
    </Modal>
  );
};
