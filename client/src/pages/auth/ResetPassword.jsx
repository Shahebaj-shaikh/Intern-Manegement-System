import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/endpoints';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useToast } from '../../context/ToastContext';

export const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword(token, { password });
      showToast('Password reset successfully. Please log in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h1 className="text-xl font-semibold text-slate-800 mb-1">Set a new password</h1>
      <p className="text-sm text-slate-500 mb-6">Choose a strong password with at least 8 characters.</p>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label="New password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" className="w-full" loading={loading}>Reset password</Button>
      </form>
      <p className="text-sm text-center text-slate-500 mt-6">
        <Link to="/login" className="text-brand-600 hover:underline">Back to login</Link>
      </p>
    </Card>
  );
};
