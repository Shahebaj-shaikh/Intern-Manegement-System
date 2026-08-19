import { useState } from 'react';
import { LayoutDashboard, Award, MessageSquare, Sliders } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PerformanceDashboardTab } from './PerformanceDashboardTab';
import { EvaluationsTab } from './EvaluationsTab';
import { FeedbackTab } from './FeedbackTab';
import { TemplatesTab } from './TemplatesTab';

export const PerformancePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const isAdminOrHr = ['super_admin', 'hr'].includes(user.role);

  const tabs = [
    { id: 'dashboard', label: 'Performance Dashboard', icon: LayoutDashboard },
    { id: 'evaluations', label: 'Mid-Term Evaluations', icon: Award },
    { id: 'feedback', label: 'Continuous Feedback', icon: MessageSquare },
    ...(isAdminOrHr ? [{ id: 'templates', label: 'Evaluation Templates', icon: Sliders }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {user.role === 'intern' ? 'My Performance & Evaluation' : 'Performance & Mid-Term Evaluation'}
          </h1>
          <p className="text-sm text-slate-500">
            Monitor progress, continuous feedback, dynamic rubric evaluations, and version history.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Rendering */}
      <div>
        {activeTab === 'dashboard' && <PerformanceDashboardTab />}
        {activeTab === 'evaluations' && <EvaluationsTab />}
        {activeTab === 'feedback' && <FeedbackTab />}
        {activeTab === 'templates' && isAdminOrHr && <TemplatesTab />}
      </div>
    </div>
  );
};
