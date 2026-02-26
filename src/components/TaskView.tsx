import { useState, useEffect } from 'react';
import { api, type Task } from '../lib/api';

type User = {
  name: string;
  email: string;
};

type Props = {
  user: User;
};

function fmt(d: string | null | undefined) {
  if (!d) return '';
  const obj = new Date(d);
  if (Number.isNaN(obj.getTime())) return d;
  return obj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function TaskView({ user }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selId, setSelId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [user.name]);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.tasks.getEmployeeTasks(user.name);
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const sel = tasks.find(t => t.task_id === selId) ?? null;

  const onPick = (id: number) => {
    setSelId(id);
    setConfirm(false);
    setNote('');
  };

  const onDone = async () => {
    if (!sel) return;
    try {
      await api.tasks.markComplete(sel.task_id, user.name, true);
      await fetchTasks();
      setConfirm(false);
      setNote('');
      setSelId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to mark task as completed');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Tasks</h2>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No tasks assigned to you yet.</p>
        </div>
      ) : (
        <>
          {tasks.map(t => (
            <button
              key={t.task_id}
              type="button"
              className="task-row w-full text-left"
              onClick={() => onPick(t.task_id)}
            >
              <div className="task-head">
                <div className="task-head-top">
                  <div className="task-main">
                    <div className="task-title">{t.task_name}</div>
                    <div className="task-sub">
                      <span>Project #{t.project_id}</span>
                      <span>#{t.task_id}</span>
                    </div>
                  </div>
                  <div className="task-meta">
                    <div className="task-tags">
                      <span className={`pill pill-prio-${t.priority}`}>{t.priority}</span>
                      <span className={`pill pill-status-${t.status}`}>{t.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
                {t.description && <div className="task-desc">{t.description}</div>}
              </div>
              <div className="task-foot">
                {t.start_date && (
                  <span>
                    <strong>Start:</strong> {fmt(t.start_date)}
                  </span>
                )}
                {t.deadline && (
                  <span>
                    <strong>Deadline:</strong> {fmt(t.deadline)}
                  </span>
                )}
              </div>
            </button>
          ))}

          {sel && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Task details</h3>
              <p className="font-semibold mb-2">{sel.task_name}</p>
              {sel.description && <p className="text-gray-600 mb-4">{sel.description}</p>}
              <div className="space-y-2 text-sm mb-4">
                <p>
                  <strong>Project ID:</strong> {sel.project_id}
                </p>
                <p>
                  <strong>Status:</strong> {sel.status}
                </p>
                <p>
                  <strong>Priority:</strong> {sel.priority}
                </p>
                {sel.start_date && sel.deadline && (
                  <p>
                    <strong>Dates:</strong> {fmt(sel.start_date)} → {fmt(sel.deadline)}
                  </p>
                )}
              </div>

              {!confirm ? (
                <button
                  type="button"
                  onClick={() => setConfirm(true)}
                  disabled={sel.iscompleted || sel.status === 'completed'}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sel.iscompleted || sel.status === 'completed' ? 'Already completed' : 'Mark as completed'}
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (optional)</label>
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={onDone}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Confirm completed
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TaskView;
