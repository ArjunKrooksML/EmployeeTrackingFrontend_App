import { useState, useEffect } from 'react';
import { api, type Task } from '../../lib/api';
import { Plus, Edit2, Trash2, CheckSquare, X } from 'lucide-react';
import TaskForm from './TaskForm';

const statusColor: Record<string, string> = {
  todo: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
};

export default function TaskMgmt() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Task | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try { setTasks(await api.manage.getTasks()); } catch { /* silent */ }
    finally { setLoading(false); }
  }

  function openNew() { setSelected(null); setShowForm(true); }
  function openEdit(t: Task) { setSelected(t); setShowForm(true); }

  async function handleDelete(t: Task) {
    if (!window.confirm(`Delete task "${t.task_name}"? This cannot be undone.`)) return;
    try { await api.manage.deleteTask(t.task_id); fetchAll(); }
    catch (e: any) { alert(e?.message || 'Failed to delete task'); }
  }

  function toggleSelect(id: number) {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function cancelSelect() { setSelecting(false); setSelectedIds(new Set()); }

  async function deleteSelected() {
    if (!selectedIds.size) return;
    if (!confirm(`Delete ${selectedIds.size} task(s)? This cannot be undone.`)) return;
    const results = await Promise.allSettled([...selectedIds].map(id => api.manage.deleteTask(id)));
    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed) alert(`${failed} deletion(s) failed.`);
    cancelSelect(); fetchAll();
  }

  if (showForm) return <TaskForm task={selected} onClose={() => setShowForm(false)} onSaved={fetchAll} />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Tasks</h2>
        <div className="flex gap-2 flex-wrap justify-end">
          {selecting ? (
            <>
              <button onClick={deleteSelected} disabled={!selectedIds.size}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-40">
                Delete{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
              </button>
              <button onClick={cancelSelect}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition">
                <X size={15} /> Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setSelecting(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-200 transition">
                <CheckSquare size={15} /> Select Item(s)
              </button>
              <button onClick={openNew}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                <Plus size={16} /> Add Task
              </button>
            </>
          )}
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      <div className="space-y-2">
        {tasks.map(t => {
          const isSelected = selectedIds.has(t.task_id);
          return (
            <div key={t.task_id}
              className={`flex items-center justify-between p-3 rounded-xl border transition ${selecting ? 'cursor-pointer' : ''} ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-200'}`}
              onClick={selecting ? () => toggleSelect(t.task_id) : undefined}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {selecting && (
                  <input type="checkbox" checked={isSelected}
                    onChange={() => toggleSelect(t.task_id)}
                    onClick={ev => ev.stopPropagation()}
                    className="rounded border-slate-300 text-blue-600 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-800 truncate">{t.task_name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[t.status] || 'bg-slate-100 text-slate-600'}`}>{t.status}</span>
                    <span className="text-xs text-slate-400">{t.priority}</span>
                  </div>
                </div>
              </div>
              {!selecting && (
                <div className="flex gap-1 ml-2">
                  <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 transition"><Edit2 size={15} /></button>
                  <button onClick={() => handleDelete(t)} className="p-1.5 hover:bg-red-100 rounded-lg text-red-500 transition"><Trash2 size={15} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
