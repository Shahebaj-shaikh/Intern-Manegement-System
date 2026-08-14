import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';

export const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
    <p className="text-6xl font-bold text-brand-600 mb-2">404</p>
    <h1 className="text-xl font-semibold text-slate-800 mb-2">Page not found</h1>
    <p className="text-sm text-slate-500 mb-6">The page you're looking for doesn't exist or has moved.</p>
    <Link to="/dashboard"><Button>Go to dashboard</Button></Link>
  </div>
);
