import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, FileText, ChevronRight, X, Search } from 'lucide-react';
import { api } from '../lib/api';
import type { Project, DPREntry } from '../lib/api';
import { useToast } from './Toast';

export default function DPRView() {
  const toast = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Project | null>(null);
  const [dprs, setDprs] = useState<DPREntry[]>([]);
  const [dprLoading, setDprLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formDesc, setFormDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.dpr.projects()
      .then(setProjects)
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  const loadDprs = (proj: Project) => {
    setDprLoading(true);
    api.dpr.list(proj.project_id, 1, 100)
      .then(data => setDprs(data.items))
      .catch(() => toast.error('Failed to load DPR entries'))
      .finally(() => setDprLoading(false));
  };

  const selectProject = (p: Project) => {
    setSelected(p);
    loadDprs(p);
  };

  const handleSubmit = async () => {
    if (!selected || !formDesc.trim()) return;
    setSubmitting(true);
    try {
      await api.dpr.create(selected.project_id, formDate, formDesc.trim());
      toast.success('DPR entry added');
      setShowForm(false);
      setFormDesc('');
      loadDprs(selected);
    } catch (e: any) {
      toast.error(e.message || 'Failed to add entry');
    } finally {
      setSubmitting(false);
    }
  };

  const q = search.toLowerCase();
  const filteredProjects = projects.filter(p =>
    !q || p.name?.toLowerCase().includes(q) || p.client_name?.toLowerCase().includes(q)
  );

  return (
    <>
      {!selected ? (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">Daily Progress Reports</h2>
            <p className="text-sm text-slate-500 mt-1">Select a project to view or add DPR entries</p>
          </div>

          {!loading && projects.length > 0 && (
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by project or client name…"
                className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition" />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={14} /></button>}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16 text-slate-400">Loading projects…</div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-slate-400">
              <FileText size={36} className="mb-2 opacity-30" />
              <p>No projects found</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex justify-center py-16 text-slate-400 text-sm">No projects match "{search}"</div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {filteredProjects.map(p => (
                <button
                  key={p.project_id}
                  onClick={() => selectProject(p)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition text-left"
                >
                  <div className="h-9 w-9 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 truncate">{p.name}</div>
                    <div className="text-xs text-slate-500 truncate">{p.client_name}</div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition"
              >
                <ArrowLeft size={16} /> Back
              </button>
              <div className="h-4 w-px bg-slate-300" />
              <div>
                <h2 className="text-lg font-bold text-slate-800">{selected.name}</h2>
                <p className="text-xs text-slate-500">{dprs.length} entries</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
            >
              <Plus size={15} /> Add Entry
            </button>
          </div>

          {dprLoading ? (
            <div className="flex justify-center py-16 text-slate-400">Loading…</div>
          ) : dprs.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-slate-400">
              <FileText size={36} className="mb-2 opacity-30" />
              <p>No DPR entries yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dprs.map(d => (
                <div key={d.id} className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700">
                      {new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-xs text-slate-400">{d.uploaded_by}</span>
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{d.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-slate-800">Add DPR Entry</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea
                  rows={5}
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Describe today's progress…"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !formDesc.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition"
              >
                {submitting ? 'Saving…' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
