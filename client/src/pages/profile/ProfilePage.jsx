import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

export const ProfilePage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const profile = user.profile;
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const changePassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.changePassword(form);
      showToast('Password changed successfully');
      setForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-semibold text-slate-800">My Profile</h1>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xl font-semibold">
            {profile?.fullName?.[0] || user.email[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-slate-800">{profile?.fullName || user.email}</p>
            <p className="text-sm text-slate-500 capitalize">{user.role.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div><p className="text-slate-400">Email</p><p className="font-medium text-slate-700">{user.email}</p></div>
          {profile?.phone && <div><p className="text-slate-400">Phone</p><p className="font-medium text-slate-700">{profile.phone}</p></div>}
          {profile?.department?.name && <div><p className="text-slate-400">Department</p><p className="font-medium text-slate-700">{profile.department.name}</p></div>}
          {profile?.teamLeader?.fullName && <div><p className="text-slate-400">Team Leader</p><p className="font-medium text-slate-700">{profile.teamLeader.fullName}</p></div>}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-medium text-slate-800 mb-4">Change Password</h3>
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}
        <form onSubmit={changePassword} className="space-y-4">
          <Input label="Current password" type="password" required value={form.currentPassword} onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))} />
          <Input label="New password" type="password" required minLength={8} value={form.newPassword} onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))} />
          <Button type="submit" loading={loading}>Update password</Button>
        </form>
      </Card>
    </div>
  );
};
