import { useState, useEffect } from 'react';
import { api, type Employee } from '../../lib/api';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import EmpForm from './EmpForm';

export default function EmpMgmt() {
  const [emps, setEmps] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Employee | null>(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try { setEmps(await api.manage.getEmployees()); } catch { /* silent */ }
    finally { setLoading(false); }
  }

  function openNew() { setSelected(null); setShowForm(true); }
  function openEdit(e: Employee) { setSelected(e); setShowForm(true); }

  async function del(id: number) {
    if (!confirm('Delete this employee?')) return;
    setLoading(true);
    try { await api.manage.deleteEmployee(id); await fetchAll(); }
    catch (err: any) { alert(err.message || 'Error deleting'); }
    finally { setLoading(false); }
  }

  if (showForm) {
    return (
      <EmpForm
        emp={selected}
        onClose={() => setShowForm(false)}
        onSaved={fetchAll}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Employees</h2>
        <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      <div className="space-y-2">
        {emps.map(e => (
          <div key={e.employee_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="font-medium text-sm text-slate-800">{e.employee_name}</div>
              <div className="text-xs text-slate-500">{e.email} · <span className="capitalize">{e.role || 'employee'}</span></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(e)} className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 transition"><Edit2 size={15} /></button>
              <button onClick={() => del(e.employee_id)} className="p-1.5 hover:bg-red-100 rounded-lg text-red-500 transition"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
