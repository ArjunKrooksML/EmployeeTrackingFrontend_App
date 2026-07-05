import { useState, useEffect } from 'react';
import { Plus, ArrowLeft, FolderKanban } from 'lucide-react';
import { api, type Project } from '../lib/api';
import { useToast } from './Toast';

function fmt(d: string | null | undefined) {
  if (!d) return '—';
  const obj = new Date(d);
  if (Number.isNaN(obj.getTime())) return d;
  return obj.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

type FormData = {
  name: string;
  client_name: string;
  address: string;
  start_date: string;
  completion_date: string;
  isCompleted: boolean;
};

function blank(): FormData {
  return { name: '', client_name: '', address: '', start_date: '', completion_date: '', isCompleted: false };
}

function fromProject(p: Project): FormData {
  return {
    name: p.name,
    client_name: p.client_name,
    address: p.address,
    start_date: p.start_date ? p.start_date.split('T')[0] : '',
    completion_date: p.completion_date ? p.completion_date.split('T')[0] : '',
    isCompleted: !!p.completion_date,
  };
}

function ProjView() {
  const toast = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<FormData>(blank());
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    api.projects.getAll()
      .then(data => setProjects(data || []))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(blank()); setView('form'); };
  const openEdit = (p: Project) => { setEditing(p); setForm(fromProject(p)); setView('form'); };
  const closeForm = () => { setView('list'); setEditing(null); };

  const set = (k: keyof FormData, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      name: form.name,
      client_name: form.client_name,
      address: form.address,
      start_date: form.start_date,
      completion_date: form.isCompleted ? form.completion_date || null : null,
    };
    try {
      if (editing) {
        await api.projects.update(editing.project_id, payload);
        toast.success('Project updated');
      } else {
        await api.projects.create(payload);
        toast.success('Project created');
      }
      closeForm();
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400';
  const labelCls = 'block text-xs font-medium text-slate-600 mb-1';

  if (view === 'form') return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={closeForm} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="h-4 w-px bg-slate-300" />
        <h2 className="text-lg font-bold text-slate-800">{editing ? 'Edit Project' : 'New Project'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div>
          <label className={labelCls}>Project Name <span className="text-red-400">*</span></label>
          <input required type="text" value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="e.g. Site A Construction" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Client Name <span className="text-red-400">*</span></label>
          <input required type="text" value={form.client_name} onChange={e => set('client_name', e.target.value)}
            placeholder="e.g. Acme Corp" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Address <span className="text-red-400">*</span></label>
          <textarea required rows={3} value={form.address} onChange={e => set('address', e.target.value)}
            placeholder="Project site address" className={`${inputCls} resize-none`} />
        </div>
        <div>
          <label className={labelCls}>Start Date <span className="text-red-400">*</span></label>
          <input required type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className={inputCls} />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isCompleted} onChange={e => set('isCompleted', e.target.checked)}
            className="w-4 h-4 accent-violet-600" />
          <span className="text-sm text-slate-700">Mark as completed</span>
        </label>
        {form.isCompleted && (
          <div>
            <label className={labelCls}>Completion Date</label>
            <input type="date" value={form.completion_date} min={form.start_date}
              onChange={e => set('completion_date', e.target.value)} className={inputCls} />
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={closeForm}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition">
            {submitting ? (editing ? 'Saving…' : 'Creating…') : (editing ? 'Save Changes' : 'Create Project')}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Projects</h2>
          <p className="text-sm text-slate-500 mt-1">{projects.length} projects</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition">
          <Plus size={15} /> New Project
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-slate-400">Loading…</div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-slate-400">
          <FolderKanban size={36} className="mb-2 opacity-30" />
          <p>No projects yet</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {projects.map(p => (
            <div key={p.project_id} className="px-4 py-3.5 hover:bg-slate-50 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">{p.name}</span>
                    {p.completion_date && (
                      <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Completed</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{p.client_name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{p.address}</p>
                  <div className="flex gap-4 mt-2 text-xs text-slate-500">
                    <span>Start: {fmt(p.start_date)}</span>
                    {p.completion_date && <span>Completed: {fmt(p.completion_date)}</span>}
                  </div>
                </div>
                <button onClick={() => openEdit(p)}
                  className="text-xs text-violet-600 hover:text-violet-800 font-medium whitespace-nowrap transition">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjView;
