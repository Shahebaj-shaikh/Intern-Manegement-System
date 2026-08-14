import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/endpoints';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

const schema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const SignUp = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (formData) => {
    setServerError('');
    try {
      const { data } = await authApi.register(formData);
      localStorage.setItem('accessToken', data.data.accessToken);
      setUser(data.data.user);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Could not create your account. Please try again.');
    }
  };

  return (
    <Card className="p-6">
      <h1 className="text-xl font-semibold text-slate-800 mb-1">Create your account</h1>
      <p className="text-sm text-slate-500 mb-6">Sign up as an intern. HR will review and complete your profile.</p>

      {serverError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{serverError}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Full name" placeholder="Jane Doe" error={errors.fullName?.message} {...register('fullName')} />
        <Input label="Email" type="email" placeholder="you@company.com" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" placeholder="At least 8 characters" error={errors.password?.message} {...register('password')} />
        <Button type="submit" className="w-full" loading={isSubmitting}>Create account</Button>
      </form>

      <p className="text-sm text-center text-slate-500 mt-6">
        Already have an account? <Link to="/login" className="text-brand-600 hover:underline">Sign in</Link>
      </p>
      <p className="text-xs text-center text-slate-400 mt-2">
        Are you HR, a team leader, or an admin? Your account is created for you by HR.
      </p>
    </Card>
  );
};
