import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, ListTodo } from 'lucide-react';
import { taskApi } from '../../api/endpoints';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
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

const INTERN_MOVE_STATUSES = ['not_started', 'in_progress'];
const TASK_ID_MIME = 'text/plain';

const emptyFilters = { search: '', priority: '', assignedTo: '', overdue: false };

const isTaskOverdue = (task) => {
  if (!task?.deadline) return false;
  if (['completed', 'rejected'].includes(task.status)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.deadline);
  due.setHours(0, 0, 0, 0);
  return today.getTime() > due.getTime();
};

export const TaskBoard = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [draggingId, setDraggingId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
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

  const tasks = data?.tasks || [];

  const assignees = useMemo(() => {
    const map = new Map();
    tasks.forEach((task) => {
      const id = task.assignedTo?._id;
      const name = task.assignedTo?.fullName;
      if (id && name) map.set(String(id), name);
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [tasks]);

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesTitle = !term || task.title.toLowerCase().includes(term);
      const matchesPriority = !filters.priority || task.priority === filters.priority;
      const matchesAssignee =
        !filters.assignedTo || String(task.assignedTo?._id) === filters.assignedTo;
      const matchesOverdue = !filters.overdue || isTaskOverdue(task);
      return matchesTitle && matchesPriority && matchesAssignee && matchesOverdue;
    });
  }, [tasks, filters]);

  const canDragTask = (task) => {
    if (!isIntern) return true;
    if (String(task.assignedTo?._id) !== String(user.profile?._id)) return false;
    return INTERN_MOVE_STATUSES.includes(task.status);
  };

  const handleDragStart = (event, task) => {
    if (!canDragTask(task)) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData(TASK_ID_MIME, task._id);
    event.dataTransfer.effectAllowed = 'move';
    setDraggingId(task._id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTarget(null);
  };

  const handleDragOver = (event, status) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropTarget(status);
  };

  const handleDragLeave = (status) => {
    setDropTarget((current) => (current === status ? null : current));
  };

  const handleDrop = async (event, status) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData(TASK_ID_MIME);
    const task = tasks.find((item) => item._id === taskId);
    setDraggingId(null);
    setDropTarget(null);
    if (!task || task.status === status) return;
    if (isIntern && (!INTERN_MOVE_STATUSES.includes(task.status) || !INTERN_MOVE_STATUSES.includes(status))) {
      showToast('Interns can only move cards between To Do and In Progress. Submit work from the task page.', 'error');
      return;
    }
    await moveTask(taskId, status);
  };

  if (isLoading) return <Skeleton rows={6} cols={5} />;
  if (isError) return <ErrorState />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Tasks</h1>
          <p className="text-sm text-slate-500">Kanban board · {filtered.length} of {tasks.length} tasks</p>
        </div>
        {canCreate && <Button onClick={() => setShowForm(true)}><Plus size={16} /> New Task</Button>}
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input
            label="Search by title"
            placeholder="Search tasks"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
          <Select
            label="Priority"
            placeholder="All"
            value={filters.priority}
            onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'critical', label: 'Critical' },
            ]}
          />
          <Select
            label="Assignee"
            placeholder="All"
            value={filters.assignedTo}
            onChange={(e) => setFilters((f) => ({ ...f, assignedTo: e.target.value }))}
            options={assignees}
          />
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-600 pb-2">
              <input
                type="checkbox"
                checked={filters.overdue}
                onChange={(e) => setFilters((f) => ({ ...f, overdue: e.target.checked }))}
              />
              Overdue only
            </label>
            <Button type="button" variant="secondary" onClick={() => setFilters(emptyFilters)}>
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {!tasks.length ? (
        <Card>
          <EmptyState icon={ListTodo} title="No tasks yet" message="Create a task to get started." />
        </Card>
      ) : !filtered.length ? (
        <Card>
          <EmptyState icon={ListTodo} title="No tasks match these filters" message="Try a different title, priority, or assignee." />
        </Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => {
            const colTasks = filtered.filter((t) => t.status === col.key);
            return (
              <div
                key={col.key}
                className={`w-72 shrink-0 rounded-xl p-1 transition-colors ${dropTarget === col.key ? 'bg-blue-50' : ''}`}
                onDragOver={(e) => handleDragOver(e, col.key)}
                onDragLeave={() => handleDragLeave(col.key)}
                onDrop={(e) => handleDrop(e, col.key)}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-sm font-medium text-slate-600">{col.label}</h3>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{colTasks.length}</span>
                </div>
                <div className="space-y-3 min-h-[80px]">
                  {colTasks.length ? colTasks.map((t) => {
                    const overdue = isTaskOverdue(t);
                    const draggable = canDragTask(t);
                    return (
                      <Card
                        key={t._id}
                        className={`p-4 ${overdue ? 'border-red-400' : ''} ${draggingId === t._id ? 'opacity-60' : ''} ${draggable ? 'cursor-grab' : ''}`}
                        draggable={draggable}
                        onDragStart={(e) => handleDragStart(e, t)}
                        onDragEnd={handleDragEnd}
                      >
                        <Link to={`/tasks/${t._id}`} className="font-medium text-sm text-slate-800 hover:text-brand-600 line-clamp-2">{t.title}</Link>
                        <p className="text-xs text-slate-500 mt-1">{t.assignedTo?.fullName}</p>
                        <div className="flex items-center justify-between mt-3 gap-2">
                          <Badge value={t.priority} />
                          <span className={`text-[11px] ${overdue ? 'font-semibold text-red-600' : 'text-slate-400'}`}>
                            Due {new Date(t.deadline).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2">
                          {(t.actualHours || 0)} actual / {(t.estimatedHours || 0)} estimated hrs
                        </p>
                        {overdue && (
                          <span className="mt-2 inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-100">
                            Overdue
                          </span>
                        )}
                      </Card>
                    );
                  }) : (
                    <p className="rounded-lg border border-dashed border-slate-300 px-3 py-8 text-center text-xs text-slate-400">
                      Drop a task here
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskFormModal open={showForm} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['tasks'] }); }} />
    </div>
  );
};
