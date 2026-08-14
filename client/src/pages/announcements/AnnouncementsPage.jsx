import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Megaphone, Trash2 } from 'lucide-react';
import { announcementApi, departmentApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Textarea } from '../../components/Textarea';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const AnnouncementsPage = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const canManage = ['hr', 'super_admin'].includes(user.role);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', targetAudience: 'all', department: '', priority: 'medium' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data, isLoading, isError } = useQuery({ queryKey: ['announcements'], queryFn: () => announcementApi.list().then((r) => r.data.data) });
  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: () => departmentApi.list().then((r) => r.data.data), enabled: showForm });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await announcementApi.create(form);
      showToast('Announcement published');
      setForm({ title: '', description: '', targetAudience: 'all', department: '', priority: 'medium' });
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['announcements'] });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not publish announcement.');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    await announcementApi.remove(id);
    showToast('Announcement removed');
    qc.invalidateQueries({ queryKey: ['announcements'] });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Announcements</h1>
        {canManage && <Button onClick={() => setShowForm(true)}><Plus size={16} /> New Announcement</Button>}
      </div>

      {isLoading ? (
        <Skeleton rows={4} cols={2} />
      ) : isError ? (
        <ErrorState />
      ) : data?.length ? (
        <div className="space-y-4">
          {data.map((a) => (
            <Card key={a._id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-slate-800">{a.title}</h3>
                    <Badge value={a.priority} />
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{a.description}</p>
                  <p className="text-xs text-slate-400 mt-2">By {a.createdBy?.fullName} · {new Date(a.createdAt).toLocaleDateString()} · {a.targetAudience}</p>
                </div>
                {canManage && (
                  <button onClick={() => remove(a._id)} className="text-slate-400 hover:text-red-500 shrink-0"><Trash2 size={16} /></button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card><EmptyState icon={Megaphone} title="No announcements yet" /></Card>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Announcement">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Select label="Target audience" value={form.targetAudience} onChange={(e) => setForm((f) => ({ ...f, targetAudience: e.target.value }))} options={[{ value: 'all', label: 'Everyone' }, { value: 'interns', label: 'Interns' }, { value: 'employees', label: 'Employees' }, { value: 'department', label: 'Specific department' }]} />
          {form.targetAudience === 'department' && (
            <Select label="Department" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} options={(departments || []).map((d) => ({ value: d._id, label: d.name }))} />
          )}
          <Select label="Priority" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>Publish</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
