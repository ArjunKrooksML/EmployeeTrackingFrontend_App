import { useState, useEffect } from 'react';
import { api, type Employee } from '../../lib/api';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';

const ROLES = ['employee', 'senior', 'hr', 'gm'];

export default function EmpMgmt() {
  const [emps, setEmps] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<Employee & { password: string; dob: string; address: string; phone_no: string; id_type: string; id_number: string; salary: number; role: string }> | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try { setEmps(await api.manage.getEmployees()); } catch { /* silent */ }
    finally { setLoading(false); }
  }

  function openNew() {
    setEditId(null);
    setForm({ employee_name: '', email: '', password: '', dob: '', address: '', phone_no: '', id_type: 'aadhar', id_number: '', salary: 0, role: 'employee' });
  }

  function openEdit(e: Employee) {
    setEditId(e.employee_id);
    setForm({ ...e, password: '' });
  }

  async function save() {
    if (!form) return;
    setLoading(true);
    try {
      if (editId) {
        await api.manage.updateEmployee(editId, form);
      } else {
        await api.manage.createEmployee(form);
      }
      setForm(null);
      await fetchAll();
    } catch (err: any) { alert(err.message || 'Error saving'); }
    finally { setLoading(false); }
  }

  async function del(id: number) {
    if (!confirm('Delete this employee?')) return;
    setLoading(true);
    try { await api.manage.deleteEmployee(id); await fetchAll(); }
    catch (err: any) { alert(err.message || 'Error deleting'); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Employees</h2>
        <button onClick={openNew} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <Plus size={16} /> Add
        </button>
      </div>

      {form !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-slate-800">{editId ? 'Edit Employee' : 'Add Employee'}</h3>
              <button onClick={() => setForm(null)}><X size={20} /></button>
            </div>
            {(['employee_name', 'email', 'phone_no', 'address', 'id_number'] as const).map(k => (
              <div key={k}>
                <label className="text-xs font-medium text-slate-600 capitalize">{k.replace('_', ' ')}</label>
                <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-0.5" value={(form as any)[k] || ''} onChange={e => setForm(f => ({ ...f!, [k]: e.target.value }))} />
              </div>
            ))}
            {!editId && (
              <div>
                <label className="text-xs font-medium text-slate-600">Password</label>
                <input type="password" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-0.5" value={(form as any).password || ''} onChange={e => setForm(f => ({ ...f!, password: e.target.value }))} />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-slate-600">Date of Birth</label>
              <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-0.5" value={(form as any).dob || ''} onChange={e => setForm(f => ({ ...f!, dob: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Salary</label>
              <input type="number" min="0" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-0.5" value={(form as any).salary ?? 0} onChange={e => setForm(f => ({ ...f!, salary: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">ID Type</label>
              <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-0.5" value={(form as any).id_type || 'aadhar'} onChange={e => setForm(f => ({ ...f!, id_type: e.target.value }))}>
                <option value="aadhar">Aadhaar</option>
                <option value="pan">PAN</option>
                <option value="passport">Passport</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Role</label>
              <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-0.5" value={(form as any).role || 'employee'} onChange={e => setForm(f => ({ ...f!, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <button onClick={save} disabled={loading} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition mt-2 flex items-center justify-center gap-2">
              <Check size={16} /> {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {loading && !form && <p className="text-sm text-slate-500">Loading…</p>}
      <div className="space-y-2">
        {emps.map(e => (
          <div key={e.employee_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="font-medium text-sm text-slate-800">{e.employee_name}</div>
              <div className="text-xs text-slate-500">{e.email} · <span className="capitalize">{(e as any).role || 'employee'}</span></div>
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
