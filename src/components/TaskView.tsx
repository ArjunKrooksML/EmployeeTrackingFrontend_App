import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fmtLabel } from '../utils/format';
import { X, Paperclip, LayoutGrid, List } from 'lucide-react';
import { api, type Task } from '../lib/api';
import { useToast } from './Toast';

type User = {
  name: string;
  email: string;
  employee_id?: number;
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
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selId, setSelId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [atts, setAtts] = useState<{ id: number; file_name: string; url: string }[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  useEffect(() => {
    fetchTasks();
  }, [user.employee_id]);

  const fetchTasks = async () => {
    if (!user.employee_id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.tasks.getEmployeeTasks(user.employee_id);
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
    setAtts([]);
    api.tasks.getAttachments(id).then(setAtts).catch(() => {});
  };

  const onDone = async () => {
    if (!sel) return;
    try {
      await api.tasks.markComplete(sel.task_id, user.employee_id!, true);
      await fetchTasks();
      setConfirm(false);
      setNote('');
      setSelId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark task as completed');
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

  const BOARD_COLS = [
    { id: 'todo',        label: 'To Do',       dot: 'bg-slate-400',   ring: 'border-slate-200' },
    { id: 'in_progress', label: 'In Progress',  dot: 'bg-blue-500',    ring: 'border-blue-100'  },
    { id: 'blocked',     label: 'Blocked',      dot: 'bg-red-500',     ring: 'border-red-100'   },
    { id: 'completed',   label: 'Completed',    dot: 'bg-emerald-500', ring: 'border-emerald-100' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Tasks</h2>
        {tasks.length > 0 && (
          <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-lg p-0.5">
            <button onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition
                ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
              <List size={13} /> List
            </button>
            <button onClick={() => setViewMode('board')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition
                ${viewMode === 'board' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
              <LayoutGrid size={13} /> Board
            </button>
          </div>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No tasks assigned to you yet.</p>
        </div>
      ) : viewMode === 'board' ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {BOARD_COLS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                  <span className="text-sm font-semibold text-slate-700">{col.label}</span>
                  <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{colTasks.length}</span>
                </div>
                <div className={`min-h-[80px] rounded-2xl p-2 space-y-2 bg-slate-100/60 border-2 ${col.ring}`}>
                  {colTasks.length === 0 ? (
                    <div className="h-12 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400">Empty</div>
                  ) : colTasks.map(t => (
                    <button key={t.task_id} type="button" onClick={() => onPick(t.task_id)}
                      className="w-full text-left bg-white rounded-xl p-3 shadow-sm border border-white/60 hover:-translate-y-0.5 hover:shadow-md transition-all">
                      <p className="text-sm font-semibold text-slate-800 leading-tight mb-1.5">{t.task_name}</p>
                      {t.description && <p className="text-xs text-slate-400 mb-1.5 line-clamp-2">{t.description}</p>}
                      <div className="flex flex-wrap gap-1">
                        <span className={`pill pill-prio-${t.priority} text-[11px]`}>{fmtLabel(t.priority)}</span>
                        {t.deadline && <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Due {fmt(t.deadline)}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
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
                      <span className={`pill pill-prio-${t.priority}`}>{fmtLabel(t.priority)}</span>
                      <span className={`pill pill-status-${t.status}`}>{fmtLabel(t.status)}</span>
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

          {sel && createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => { setSelId(null); setConfirm(false); setNote(''); }}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-start justify-between p-5 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{sel.task_name}</h3>
                    <div className="flex gap-2 mt-1.5">
                      <span className={`pill pill-prio-${sel.priority}`}>{fmtLabel(sel.priority)}</span>
                      <span className={`pill pill-status-${sel.status}`}>{fmtLabel(sel.status)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelId(null); setConfirm(false); setNote(''); }}
                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors ml-3 shrink-0"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-5 space-y-3 text-sm">
                  {sel.description && (
                    <p className="text-slate-600">{sel.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-400 mb-0.5">Project</p>
                      <p className="font-medium text-slate-700">#{sel.project_id}</p>
                    </div>
                    {sel.task_type && (
                      <div className="bg-slate-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-slate-400 mb-0.5">Task Type</p>
                        <p className="font-medium text-slate-700">{sel.task_type}</p>
                      </div>
                    )}
                    {sel.tools_type && (
                      <div className="bg-slate-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-slate-400 mb-0.5">Tools Type</p>
                        <p className="font-medium text-slate-700">{sel.tools_type}</p>
                      </div>
                    )}
                    {sel.start_date && (
                      <div className="bg-slate-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-slate-400 mb-0.5">Start</p>
                        <p className="font-medium text-slate-700">{fmt(sel.start_date)}</p>
                      </div>
                    )}
                    {sel.deadline && (
                      <div className="bg-slate-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-slate-400 mb-0.5">Deadline</p>
                        <p className="font-medium text-slate-700">{fmt(sel.deadline)}</p>
                      </div>
                    )}
                  </div>

                  {atts.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5"><Paperclip size={12} /> Attachments</p>
                      {atts.map(a => (
                        <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 hover:underline truncate">
                          <Paperclip size={12} className="shrink-0" />{a.file_name}
                        </a>
                      ))}
                    </div>
                  )}

                  {!confirm ? (
                    <button
                      type="button"
                      onClick={() => setConfirm(true)}
                      disabled={sel.iscompleted || sel.status === 'completed'}
                      className="w-full mt-2 px-4 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sel.iscompleted || sel.status === 'completed' ? 'Already completed' : 'Mark as completed'}
                    </button>
                  ) : (
                    <div className="space-y-3 mt-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Remarks (optional)</label>
                        <textarea
                          value={note}
                          onChange={e => setNote(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:outline-none resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirm(false)}
                          className="flex-1 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition text-sm font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={onDone}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition text-sm font-semibold"
                        >
                          Confirm completed
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
}

export default TaskView;
