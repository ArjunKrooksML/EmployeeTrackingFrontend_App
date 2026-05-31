import { useState, useEffect } from 'react';
import { api, type Project } from '../../lib/api';
import { Plus, Edit2, Trash2, CheckSquare, X } from 'lucide-react';
import ProjForm from './ProjForm';
import { useToast } from '../Toast';
import { useConfirm } from '../ConfirmDialog';

export default function ProjMgmt() {
  const [projs, setProjs] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try { setProjs(await api.manage.getProjects()); } catch { /* silent */ }
    finally { setLoading(false); }
  }

  function openNew() { setSelected(null); setShowForm(true); }
  function openEdit(p: Project) { setSelected(p); setShowForm(true); }

  async function handleDelete(p: Project) {
    const ok = await confirm({ title: 'Delete Project', message: `Delete "${p.name}"? Projects with existing tasks cannot be deleted.`, confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    try { await api.manage.deleteProject(p.project_id); fetchAll(); toast.success('Project deleted'); }
    catch (e: any) { toast.error(e?.message || 'Failed to delete project'); }
  }

  function toggleSelect(id: number) {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function cancelSelect() { setSelecting(false); setSelectedIds(new Set()); }

  async function deleteSelected() {
    if (!selectedIds.size) return;
    const ok = await confirm({ title: `Delete ${selectedIds.size} Project(s)`, message: 'Projects with tasks will be skipped.', confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    const results = await Promise.allSettled([...selectedIds].map(id => api.manage.deleteProject(id)));
    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed) toast.error(`${failed} project(s) have tasks and could not be deleted`);
    else toast.success(`${selectedIds.size} project(s) deleted`);
    cancelSelect(); fetchAll();
  }

  if (showForm) return <ProjForm proj={selected} onClose={() => setShowForm(false)} onSaved={fetchAll} />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Projects</h2>
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
                <Plus size={16} /> Add Project
              </button>
            </>
          )}
        </div>
      </div>

      {loading && (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
      )}
      <div className="space-y-2">
        {projs.map((p, i) => {
          const isSelected = selectedIds.has(p.project_id);
          return (
            <div key={p.project_id}
              className={`animate-row flex items-center justify-between p-3 rounded-xl border transition ${selecting ? 'cursor-pointer' : 'hover:-translate-y-px hover:shadow-sm'} ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-200'}`}
              style={{ animationDelay: `${i * 0.04}s` }}
              onClick={selecting ? () => toggleSelect(p.project_id) : undefined}>
              <div className="flex items-center gap-2">
                {selecting && (
                  <input type="checkbox" checked={isSelected}
                    onChange={() => toggleSelect(p.project_id)}
                    onClick={ev => ev.stopPropagation()}
                    className="rounded border-slate-300 text-blue-600 flex-shrink-0" />
                )}
                <div>
                  <div className="font-medium text-sm text-slate-800">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.client_name} · started {p.start_date}</div>
                </div>
              </div>
              {!selecting && (
                <div className="flex gap-1">
                  <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 transition"><Edit2 size={15} /></button>
                  <button onClick={() => handleDelete(p)} className="p-1.5 hover:bg-red-100 rounded-lg text-red-500 transition"><Trash2 size={15} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
