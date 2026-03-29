import { useState, useEffect } from 'react';
import { api, type Project } from '../../lib/api';
import { Plus, X, Check } from 'lucide-react';

export default function ProjMgmt() {
  const [projs, setProjs] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<Project> | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setProjs(await api.manage.getProjects()); } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function save() {
    if (!form) return;
    setLoading(true);
    try {
      await api.manage.createProject(form);
      setForm(null);
      await load();
    } catch (err: any) { alert(err.message || 'Error saving'); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Projects</h2>
        <button onClick={() => setForm({ name: '', client_name: '', address: '', start_date: '' })}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <Plus size={16} /> Add
        </button>
      </div>

      {form !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-slate-800">New Project</h3>
              <button onClick={() => setForm(null)}><X size={20} /></button>
            </div>
            {(['name', 'client_name', 'address'] as const).map(k => (
              <div key={k}>
                <label className="text-xs font-medium text-slate-600 capitalize">{k.replace('_', ' ')}</label>
                <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-0.5" value={(form as any)[k] || ''} onChange={e => setForm(f => ({ ...f!, [k]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-slate-600">Start Date</label>
              <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-0.5" value={form.start_date || ''} onChange={e => setForm(f => ({ ...f!, start_date: e.target.value }))} />
            </div>
            <button onClick={save} disabled={loading} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2">
              <Check size={16} /> {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {loading && !form && <p className="text-sm text-slate-500">Loading…</p>}
      <div className="space-y-2">
        {projs.map(p => (
          <div key={p.project_id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-medium text-sm text-slate-800">{p.name}</div>
            <div className="text-xs text-slate-500">{p.client_name} · started {p.start_date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
