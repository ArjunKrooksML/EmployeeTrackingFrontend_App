import { useState, useEffect } from 'react';
import { api, type Project } from '../../lib/api';
import { Plus, Edit2 } from 'lucide-react';
import ProjForm from './ProjForm';

export default function ProjMgmt() {
  const [projs, setProjs] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try { setProjs(await api.manage.getProjects()); } catch { /* silent */ }
    finally { setLoading(false); }
  }

  function openNew() { setSelected(null); setShowForm(true); }
  function openEdit(p: Project) { setSelected(p); setShowForm(true); }

  if (showForm) {
    return (
      <ProjForm
        proj={selected}
        onClose={() => setShowForm(false)}
        onSaved={fetchAll}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Projects</h2>
        <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <Plus size={16} /> Add Project
        </button>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      <div className="space-y-2">
        {projs.map(p => (
          <div key={p.project_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="font-medium text-sm text-slate-800">{p.name}</div>
              <div className="text-xs text-slate-500">{p.client_name} · started {p.start_date}</div>
            </div>
            <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 transition"><Edit2 size={15} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
