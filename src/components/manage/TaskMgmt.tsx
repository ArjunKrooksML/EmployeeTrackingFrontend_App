import { useState, useEffect } from 'react';
import { api, type Task } from '../../lib/api';
import { Plus, Edit2, X, Check } from 'lucide-react';

export default function TaskMgmt() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<Task & { project_id: number }> | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setTasks(await api.manage.getTasks()); } catch { /* silent */ }
    finally { setLoading(false); }
  }

  function openNew() {
    setEditId(null);
    setForm({ task_name: '', description: '', status: 'todo', priority: 'medium', project_id: undefined });
  }

  function openEdit(t: Task) {
    setEditId(t.task_id);
    setForm({ ...t });
  }

  async function save() {
    if (!form) return;
    setLoading(true);
    try {
      if (editId) {
        await api.manage.updateTask(editId, form);
      } else {
        await api.manage.createTask(form);
      }
      setForm(null);
      await load();
    } catch (err: any) { alert(err.message || 'Error saving'); }
    finally { setLoading(false); }
  }

  const statusColor: Record<string, string> = {
    todo: 'bg-slate-100 text-slate-600',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    blocked: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Tasks</h2>
        <button onClick={openNew} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <Plus size={16} /> Add
        </button>
      </div>

      {form !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">{editId ? 'Edit Task' : 'New Task'}</h3>
              <button onClick={() => setForm(null)}><X size={20} /></button>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Task Name</label>
              <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-0.5" value={form.task_name || ''} onChange={e => setForm(f => ({ ...f!, task_name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Description</label>
              <textarea className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-0.5" rows={2} value={form.description || ''} onChange={e => setForm(f => ({ ...f!, description: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Project ID</label>
              <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-0.5" value={(form as any).project_id || ''} onChange={e => setForm(f => ({ ...f!, project_id: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Assigned To (Employee ID)</label>
              <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-0.5" value={form.assigned_to ?? ''} onChange={e => setForm(f => ({ ...f!, assigned_to: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Status</label>
                <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-0.5" value={form.status || 'todo'} onChange={e => setForm(f => ({ ...f!, status: e.target.value }))}>
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Priority</label>
                <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-0.5" value={form.priority || 'medium'} onChange={e => setForm(f => ({ ...f!, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <button onClick={save} disabled={loading} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2">
              <Check size={16} /> {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {loading && !form && <p className="text-sm text-slate-500">Loading…</p>}
      <div className="space-y-2">
        {tasks.map(t => (
          <div key={t.task_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-slate-800 truncate">{t.task_name}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[t.status] || 'bg-slate-100 text-slate-600'}`}>{t.status}</span>
                <span className="text-xs text-slate-400">{t.priority}</span>
              </div>
            </div>
            <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 transition ml-2"><Edit2 size={15} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
