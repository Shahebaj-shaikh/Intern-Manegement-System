import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, ListTodo } from 'lucide-react';
import { taskApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Skeleton } from '../../components/Skeleton';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TaskFormModal } from './TaskFormModal';

const columns = [
  { key: 'not_started', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'submitted', label: 'Review' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'completed', label: 'Completed' },
];

export const TaskBoard = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const canCreate = ['team_lead', 'hr', 'super_admin'].includes(user.role);
  const isIntern = user.role === 'intern';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskApi.list({ limit: 100 }).then((r) => r.data.data),
  });

  const moveTask = async (taskId, status) => {
    try {
      await taskApi.updateStatus(taskId, status);
      qc.invalidateQueries({ queryKey: ['tasks'] });
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update task', 'error');
    }
  };

  if (isLoading) return <Skeleton rows={6} cols={5} />;
  if (isError) return <ErrorState />;

  const tasks = data?.tasks || [];
  if (!tasks.length) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-800">Tasks</h1>
          {canCreate && <Button onClick={() => setShowForm(true)}><Plus size={16} /> New Task</Button>}
        </div>
        <Card><EmptyState icon={ListTodo} title="No tasks yet" message="Create a task to get started." /></Card>
        <TaskFormModal open={showForm} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['tasks'] }); }} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Tasks</h1>
          <p className="text-sm text-slate-500">Kanban board · {tasks.length} tasks</p>
        </div>
        {canCreate && <Button onClick={() => setShowForm(true)}><Plus size={16} /> New Task</Button>}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="w-72 shrink-0">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-medium text-slate-600">{col.label}</h3>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{colTasks.length}</span>
              </div>
              <div className="space-y-3 min-h-[80px]">
                {colTasks.map((t) => (
                  <Card key={t._id} className="p-4">
                    <Link to={`/tasks/${t._id}`} className="font-medium text-sm text-slate-800 hover:text-brand-600 line-clamp-2">{t.title}</Link>
                    <p className="text-xs text-slate-500 mt-1">{t.assignedTo?.fullName}</p>
                    <div className="flex items-center justify-between mt-3">
                      <Badge value={t.priority} />
                      <span className="text-[11px] text-slate-400">Due {new Date(t.deadline).toLocaleDateString()}</span>
                    </div>
                    {isIntern && String(t.assignedTo?._id) === user.profile?._id && col.key !== 'completed' && (
                      <select
                        className="mt-3 w-full text-xs border border-slate-200 rounded-md px-2 py-1.5"
                        value={t.status}
                        onChange={(e) => moveTask(t._id, e.target.value)}
                      >
                        <option value="not_started">To Do</option>
                        <option value="in_progress">In Progress</option>
                      </select>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <TaskFormModal open={showForm} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['tasks'] }); }} />
    </div>
  );
};
