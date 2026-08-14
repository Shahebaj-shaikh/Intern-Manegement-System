import { useAuth } from '../../context/AuthContext';
import { AdminDashboard } from './AdminDashboard';
import { TeamLeadDashboard } from './TeamLeadDashboard';
import { InternDashboard } from './InternDashboard';

export const Dashboard = () => {
  const { user } = useAuth();
  if (user.role === 'team_lead') return <TeamLeadDashboard />;
  if (user.role === 'intern') return <InternDashboard />;
  return <AdminDashboard />;
};
