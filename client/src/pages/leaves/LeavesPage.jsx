import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, CalendarClock, Check, X } from 'lucide-react';
import { leaveApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Table } from '../../components/Table';
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

export const LeavesPage = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const isIntern = user.role === 'intern';
  const canReview = ['team_lead', 'hr', 'super_admin'].includes(user.role);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ leaveType: 'casual', startDate: '', endDate: '', reason: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviewComment, setReviewComment] = useState({});

  const { data, isLoading, isError } = useQuery({ queryKey: ['leaves'], queryFn: () => leaveApi.list({ limit: 50 }).then((r) => r.data.data) });

  const applyLeave = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('attachment', file);
      await leaveApi.apply(fd);
      showToast('Leave request submitted');
      setForm({ leaveType: 'casual', startDate: '', endDate: '', reason: '' });
      setFile(null);
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['leaves'] });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit leave request.');
    } finally {
      setLoading(false);
    }
  };

  const review = async (id, decision) => {
    try {
      await leaveApi.review(id, { decision, reviewComment: reviewComment[id] || '' });
      showToast(`Leave ${decision}`);
      qc.invalidateQueries({ queryKey: ['leaves'] });
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update leave', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Leave Requests</h1>
          <p className="text-sm text-slate-500">{isIntern ? 'Apply and track your leave' : 'Review team leave requests'}</p>
        </div>
        {isIntern && <Button onClick={() => setShowForm(true)}><Plus size={16} /> Apply for Leave</Button>}
      </div>

      <Card>
        {isLoading ? (
          <Skeleton rows={5} cols={5} />
        ) : isError ? (
          <ErrorState />
        ) : data?.leaves?.length ? (
          <Table columns={isIntern ? ['Type', 'From', 'To', 'Reason', 'Status'] : ['Intern', 'Type', 'From', 'To', 'Status', 'Action']}>
            {data.leaves.map((l) => (
              <tr key={l._id} className="hover:bg-slate-50">
                {!isIntern && <td className="px-4 py-3 font-medium text-slate-700">{l.intern?.fullName}</td>}
                <td className="px-4 py-3 text-slate-600 capitalize">{l.leaveType}</td>
                <td className="px-4 py-3 text-slate-600">{new Date(l.startDate).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-slate-600">{new Date(l.endDate).toLocaleDateString()}</td>
                {isIntern && <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{l.reason}</td>}
                <td className="px-4 py-3"><Badge value={l.status} /></td>
                {canReview && (
                  <td className="px-4 py-3">
                    {l.status === 'pending' ? (
                      <div className="flex items-center gap-1">
                        <input
                          className="w-28 text-xs border border-slate-200 rounded px-1.5 py-1"
                          placeholder="Comment"
                          onChange={(e) => setReviewComment((r) => ({ ...r, [l._id]: e.target.value }))}
                        />
                        <button onClick={() => review(l._id, 'approved')} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded"><Check size={16} /></button>
                        <button onClick={() => review(l._id, 'rejected')} className="text-red-600 hover:bg-red-50 p-1 rounded"><X size={16} /></button>
                      </div>
                    ) : <span className="text-xs text-slate-400">Reviewed</span>}
                  </td>
                )}
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState icon={CalendarClock} title="No leave requests" message={isIntern ? 'Apply for leave when you need time off.' : 'No requests from your team yet.'} />
        )}
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Apply for Leave">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}
        <form onSubmit={applyLeave} className="space-y-4">
          <Select label="Leave type" value={form.leaveType} onChange={(e) => setForm((f) => ({ ...f, leaveType: e.target.value }))} options={[{ value: 'sick', label: 'Sick' }, { value: 'casual', label: 'Casual' }, { value: 'emergency', label: 'Emergency' }, { value: 'other', label: 'Other' }]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="From" type="date" required value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
            <Input label="To" type="date" required value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
          </div>
          <Textarea label="Reason" required value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Supporting document (optional)</label>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} className="text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>Submit request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
