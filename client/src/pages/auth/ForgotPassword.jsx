import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/endpoints';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <Card className="p-6">
      <h1 className="text-xl font-semibold text-slate-800 mb-1">Reset your password</h1>
      <p className="text-sm text-slate-500 mb-6">We'll email you a link to reset it.</p>

      {sent ? (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-3">
          If an account with that email exists, a reset link has been sent.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          <Button type="submit" className="w-full" loading={loading}>Send reset link</Button>
        </form>
      )}
      <p className="text-sm text-center text-slate-500 mt-6">
        <Link to="/login" className="text-brand-600 hover:underline">Back to login</Link>
      </p>
    </Card>
  );
};
