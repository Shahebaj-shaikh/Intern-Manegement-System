import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Button } from '../../components/Button';
import { internApi, employeeApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';

const emptyForm = {
  fullName: '', email: '', password: '', phone: '', college: '', degree: '', branch: '',
  graduationYear: '', department: '', teamLeader: '', internshipType: 'stipend',
  joiningDate: '', internshipEndDate: '', status: 'upcoming',
};

export const InternFormModal = ({ open, onClose, onSaved, departments, intern }) => {
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(intern);

  const { data: teamLeads } = useQuery({
    queryKey: ['team-leads'],
    queryFn: () => employeeApi.list({ role: 'team_lead', limit: 100 }).then((r) => r.data.data.employees),
    enabled: open,
  });

  useEffect(() => {
    if (intern) {
      setForm({
        ...emptyForm,
        ...intern,
        department: intern.department?._id || '',
        teamLeader: intern.teamLeader?._id || '',
        joiningDate: intern.joiningDate?.slice(0, 10) || '',
        internshipEndDate: intern.internshipEndDate?.slice(0, 10) || '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [intern, open]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isEdit) {
        await internApi.update(intern._id, form);
        showToast('Intern updated successfully');
      } else {
        await internApi.create(form);
        showToast('Intern created successfully');
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save intern.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Intern' : 'Add Intern'} width="max-w-2xl">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}
      <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-4">
        <Input label="Full name" required value={form.fullName} onChange={update('fullName')} />
        <Input label="Email" type="email" required disabled={isEdit} value={form.email} onChange={update('email')} />
        {!isEdit && <Input label="Temporary password" type="password" required minLength={8} value={form.password} onChange={update('password')} />}
        <Input label="Phone" value={form.phone} onChange={update('phone')} />
        <Input label="College" value={form.college} onChange={update('college')} />
        <Input label="Degree" value={form.degree} onChange={update('degree')} />
        <Input label="Branch" value={form.branch} onChange={update('branch')} />
        <Input label="Graduation year" type="number" value={form.graduationYear} onChange={update('graduationYear')} />
        <Select label="Department" value={form.department} onChange={update('department')} options={(departments || []).map((d) => ({ value: d._id, label: d.name }))} />
        <Select label="Team leader" value={form.teamLeader} onChange={update('teamLeader')} options={(teamLeads || []).map((t) => ({ value: t._id, label: t.fullName }))} />
        <Select label="Internship type" value={form.internshipType} onChange={update('internshipType')} options={[{ value: 'unpaid', label: 'Unpaid' }, { value: 'paid', label: 'Paid' }, { value: 'stipend', label: 'Stipend' }]} />
        <Select label="Status" value={form.status} onChange={update('status')} options={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'active', label: 'Active' }, { value: 'completed', label: 'Completed' }, { value: 'terminated', label: 'Terminated' }]} />
        <Input label="Joining date" type="date" required value={form.joiningDate} onChange={update('joiningDate')} />
        <Input label="Internship end date" type="date" required value={form.internshipEndDate} onChange={update('internshipEndDate')} />

        <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEdit ? 'Save changes' : 'Create intern'}</Button>
        </div>
      </form>
    </Modal>
  );
};
