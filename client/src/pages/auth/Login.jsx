import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      // ✅ FIX: Pass as an object { email, password } instead of two individual arguments
      await login({ email: data.email, password: data.password });
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <Card className="p-6">
      <h1 className="text-xl font-semibold text-slate-800 mb-1">Welcome back</h1>
      <p className="text-sm text-slate-500 mb-6">Sign in to your IMS account</p>

      {serverError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {serverError}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@company.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-brand-600 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <p className="text-sm text-center text-slate-500 mt-5">
        New intern?{' '}
        <Link to="/signup" className="text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>

      <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-400">
        <p className="font-medium text-slate-500 mb-1">Demo credentials</p>
        <p>Admin: admin@ims.com / Admin@123</p>
        <p>HR: hr@ims.com / Hr@12345</p>
        <p>Team Lead: teamlead@ims.com / Lead@123</p>
        <p>Intern: intern@ims.com / Intern@123</p>
      </div>
    </Card>
  );
};