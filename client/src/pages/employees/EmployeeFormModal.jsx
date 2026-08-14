import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Button } from '../../components/Button';
import { employeeApi, departmentApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';

const empty = { fullName: '', email: '', password: '', role: 'team_lead', designation: '', department: '', phone: '' };

export const EmployeeFormModal = ({ open, onClose, onSaved }) => {
  const { showToast } = useToast();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: () => departmentApi.list().then((r) => r.data.data), enabled: open });

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await employeeApi.create(form);
      showToast('Employee created successfully');
      setForm(empty);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create employee.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Employee">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label="Full name" required value={form.fullName} onChange={update('fullName')} />
        <Input label="Email" type="email" required value={form.email} onChange={update('email')} />
        <Input label="Temporary password" type="password" required minLength={8} value={form.password} onChange={update('password')} />
        <Select label="Role" required value={form.role} onChange={update('role')} options={[{ value: 'team_lead', label: 'Team Leader' }, { value: 'hr', label: 'HR' }, { value: 'super_admin', label: 'Super Admin' }]} />
        <Input label="Designation" value={form.designation} onChange={update('designation')} />
        <Select label="Department" value={form.department} onChange={update('department')} options={(departments || []).map((d) => ({ value: d._id, label: d.name }))} />
        <Input label="Phone" value={form.phone} onChange={update('phone')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create employee</Button>
        </div>
      </form>
    </Modal>
  );
};
