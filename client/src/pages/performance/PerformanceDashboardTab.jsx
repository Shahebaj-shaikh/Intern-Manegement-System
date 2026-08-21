import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckSquare,
  Sparkles,
  User,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { performanceApi, internApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';
import { Select } from '../../components/Select';
import { Skeleton } from '../../components/Skeleton';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';

export const PerformanceDashboardTab = () => {
  const { user } = useAuth();
  const isIntern = user.role === 'intern';
  const [selectedInternId, setSelectedInternId] = useState('');

  // Fetch interns list for manager / HR / Admin selector
  const { data: internsData } = useQuery({
    queryKey: ['interns-dropdown'],
    queryFn: () => internApi.list({ limit: 100 }).then((r) => r.data.data.interns),
    enabled: !isIntern,
  });

  const activeInternId = isIntern
    ? user.profileRef
    : selectedInternId || (internsData && internsData[0]?._id) || '';

  const { data: dashboardData, isLoading, isError } = useQuery({
    queryKey: ['performance-dashboard', activeInternId],
    queryFn: () => performanceApi.getDashboard(activeInternId).then((r) => r.data.data),
    enabled: isIntern || !!activeInternId,
  });

  if (isLoading && !dashboardData) {
    return <Skeleton rows={6} cols={3} />;
  }

  if (isError) {
    return <ErrorState message="Could not load performance dashboard metrics." />;
  }

  const {
    intern,
    overallScore = 0,
    categoryScores = [],
    attendance = {},
    tasks = {},
    strengths = [],
    weaknesses = [],
    improvementAreas = [],
    recentEvaluations = [],
    recentFeedback = [],
  } = dashboardData || {};

  return (
    <div className="space-y-6">
      {/* Header / Intern Selector */}
      {!isIntern && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-semibold">
              <User size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Viewing Performance For</p>
              <h3 className="font-semibold text-slate-800">{intern?.fullName || 'Select Intern'}</h3>
            </div>
          </div>
          <div className="w-full sm:w-72">
            <Select
              placeholder="Select an Intern"
              value={activeInternId}
              onChange={(e) => setSelectedInternId(e.target.value)}
              options={(internsData || []).map((i) => ({
                value: i._id,
                label: `${i.fullName} (${i.department?.name || 'Intern'})`,
              }))}
            />
          </div>
        </div>
      )}

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Score */}
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-xl p-5 text-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-200">Overall Score</span>
            <Award className="text-brand-300" size={24} />
          </div>
          <div className="my-2">
            <div className="text-4xl font-bold">{overallScore.toFixed(1)}</div>
            <p className="text-xs text-brand-200 mt-1">out of 10.0 scale across evaluations</p>
          </div>
          <div className="w-full bg-brand-900/40 rounded-full h-1.5 overflow-hidden">
            <div className="bg-white h-full rounded-full" style={{ width: `${Math.min(overallScore * 10, 100)}%` }} />
          </div>
        </div>

        {/* Attendance Rate */}
        <StatCard
          label="Attendance Rate"
          value={`${attendance?.percentage || 0}%`}
          icon={Clock}
          accent="text-emerald-600 bg-emerald-50"
        />

        {/* Task Completion */}
        <StatCard
          label="Task Completion"
          value={`${tasks?.percentage || 0}%`}
          icon={CheckSquare}
          accent="text-blue-600 bg-blue-50"
        />

        {/* Total Working Hours */}
        <StatCard
          label="Total Hours Logged"
          value={`${attendance?.workingHours || 0} hrs`}
          icon={TrendingUp}
          accent="text-purple-600 bg-purple-50"
        />
      </div>

      {/* Grid: Category Breakdown & Strengths/Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Category Scores */}
        <Card className="p-6 lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Sparkles size={18} className="text-brand-600" />
              Category Score Breakdown
            </h3>
            <span className="text-xs text-slate-500">Scale: 1 - 10</span>
          </div>

          {categoryScores.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              No category evaluations recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {categoryScores.map((cat) => {
                const pct = (cat.score / (cat.maxScore || 10)) * 100;
                let colorClass = 'bg-brand-500';
                if (cat.score >= 8) colorClass = 'bg-emerald-500';
                else if (cat.score >= 6) colorClass = 'bg-blue-500';
                else if (cat.score >= 4) colorClass = 'bg-amber-500';
                else colorClass = 'bg-red-500';

                return (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-700">{cat.name}</span>
                      <span className="font-semibold text-slate-800">
                        {cat.score} <span className="text-xs font-normal text-slate-400">/ {cat.maxScore || 10}</span>
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right Column: Attendance & Tasks Summary Cards */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-5">
            <h4 className="font-semibold text-slate-800 mb-3 text-sm flex items-center gap-2">
              <Clock size={16} className="text-emerald-600" />
              Attendance Summary
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <div className="text-lg font-bold text-slate-800">{attendance?.present || 0}</div>
                <div className="text-xs text-slate-500">Days Present</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <div className="text-lg font-bold text-slate-800">{attendance?.total || 0}</div>
                <div className="text-xs text-slate-500">Total Logged</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <div className="text-lg font-bold text-emerald-600">{attendance?.percentage || 0}%</div>
                <div className="text-xs text-slate-500">Rate</div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h4 className="font-semibold text-slate-800 mb-3 text-sm flex items-center gap-2">
              <CheckSquare size={16} className="text-blue-600" />
              Task Execution
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <div className="text-lg font-bold text-emerald-600">{tasks?.completed || 0}</div>
                <div className="text-xs text-slate-500">Completed</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <div className="text-lg font-bold text-amber-600">{tasks?.inProgress || 0}</div>
                <div className="text-xs text-slate-500">In Progress</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <div className="text-lg font-bold text-slate-800">{tasks?.total || 0}</div>
                <div className="text-xs text-slate-500">Assigned</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Strengths, Weaknesses & Improvement Areas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Strengths */}
        <Card className="p-5 border-t-4 border-t-emerald-500">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <h4 className="font-semibold text-slate-800 text-sm">Key Strengths</h4>
          </div>
          {strengths.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No key strengths documented yet.</p>
          ) : (
            <ul className="space-y-2">
              {strengths.map((s, idx) => (
                <li key={idx} className="text-xs text-slate-700 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100 flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Weaknesses / Attention */}
        <Card className="p-5 border-t-4 border-t-amber-500">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-amber-600" />
            <h4 className="font-semibold text-slate-800 text-sm">Areas for Attention</h4>
          </div>
          {weaknesses.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No critical weaknesses noted.</p>
          ) : (
            <ul className="space-y-2">
              {weaknesses.map((w, idx) => (
                <li key={idx} className="text-xs text-slate-700 bg-amber-50/60 p-2.5 rounded-lg border border-amber-100 flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Improvement Action Plan */}
        <Card className="p-5 border-t-4 border-t-blue-500">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-blue-600" />
            <h4 className="font-semibold text-slate-800 text-sm">Improvement Plan</h4>
          </div>
          {improvementAreas.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No active action items assigned.</p>
          ) : (
            <ul className="space-y-2">
              {improvementAreas.map((item, idx) => (
                <li key={idx} className="text-xs text-slate-700 bg-blue-50/60 p-2.5 rounded-lg border border-blue-100 flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Recent Evaluations & Recent Feedback Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Evaluations */}
        <Card className="p-5">
          <h4 className="font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2">
            <Award size={16} className="text-brand-600" />
            Recent Formal Evaluations
          </h4>
          {recentEvaluations.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No formal evaluations recorded.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentEvaluations.map((ev) => (
                <div key={ev._id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm text-slate-800">{ev.evaluationPeriod}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Calendar size={12} />
                      {new Date(ev.createdAt).toLocaleDateString()}
                      <span>·</span>
                      <span>Version {ev.version || 1}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge value={ev.status} />
                    <span className="font-bold text-sm text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">
                      {ev.overallScore}/10
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Feedback */}
        <Card className="p-5">
          <h4 className="font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2">
            <MessageSquare size={16} className="text-blue-600" />
            Latest Continuous Feedback
          </h4>
          {recentFeedback.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No recent feedback received.</p>
          ) : (
            <div className="space-y-3">
              {recentFeedback.map((fb) => (
                <div key={fb._id} className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 border border-slate-100">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="font-semibold text-slate-700">{fb.category || 'General'}</span>
                    <span>{new Date(fb.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-600 italic">"{fb.comments}"</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
