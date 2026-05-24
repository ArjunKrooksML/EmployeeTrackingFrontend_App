import { useState, useEffect } from 'react';
import { api, type Employee } from '../../lib/api';
import { X, CheckCircle, Copy } from 'lucide-react';

interface Props {
  emp: Employee | null;
  onClose: () => void;
  onSaved: () => void;
}

const ID_TYPES = ['Aadhaar', 'PAN', 'Passport'];
const ROLES = ['employee', 'senior', 'hr', 'gm'];

function maxLen(idType: string) {
  const t = idType.toLowerCase();
  if (t === 'aadhaar' || t === 'aadhar') return 12;
  if (t === 'pan') return 10;
  if (t === 'passport') return 8;
  return 50;
}

function idHint(idType: string) {
  if (idType === 'Aadhaar') return '12 digits';
  if (idType === 'PAN') return '10 chars, alphanumeric';
  return '8 chars, alphanumeric';
}

export default function EmpForm({ emp, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    employee_name: '', email: '', password: '', dob: '', address: '',
    phone_no: '', id_type: 'Aadhaar', id_number: '', year_joined: '',
    basic: '', da: '', hra: '', others: '', role: 'employee',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [genPwd, setGenPwd] = useState('');

  useEffect(() => {
    if (emp) {
      const raw = emp.id_type || 'Aadhaar';
      const idType = raw.toLowerCase() === 'aadhar' ? 'Aadhaar'
        : ID_TYPES.find(t => t.toLowerCase() === raw.toLowerCase()) || 'Aadhaar';
      setForm({
        employee_name: emp.employee_name || '',
        email: emp.email || '',
        password: '',
        dob: emp.dob || '',
        address: emp.address || '',
        phone_no: emp.phone_no || '',
        id_type: idType,
        id_number: emp.id_number || '',
        year_joined: emp.year_joined || '',
        basic: emp.basic?.toString() || '0',
        da: emp.da?.toString() || '0',
        hra: emp.hra?.toString() || '0',
        others: emp.others?.toString() || '0',
        role: emp.role || 'employee',
      });
    }
  }, [emp]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    if (name === 'phone_no') {
      setForm(f => ({ ...f, phone_no: value.replace(/\D/g, '').slice(0, 15) }));
    } else if (name === 'id_number') {
      const t = form.id_type.toLowerCase();
      let v: string;
      if (t === 'pan') v = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
      else if (t === 'passport') v = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
      else v = value.replace(/\D/g, '').slice(0, 12);
      setForm(f => ({ ...f, id_number: v }));
    } else if (name === 'id_type') {
      setForm(f => ({ ...f, id_type: value, id_number: '' }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const payload: any = {
      ...form,
      basic: parseInt(form.basic) || 0,
      da: parseInt(form.da) || 0,
      hra: parseInt(form.hra) || 0,
      others: parseInt(form.others) || 0,
      year_joined: form.year_joined || null,
    };
    if (!form.password) delete payload.password;
    try {
      if (emp?.employee_id) {
        await api.manage.updateEmployee(emp.employee_id, payload);
        onSaved();
        onClose();
      } else {
        const res: any = await api.manage.createEmployee(payload);
        if (res.generated_password) setGenPwd(res.generated_password);
        else { onSaved(); onClose(); }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    }
    setLoading(false);
  }

  if (genPwd) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center border max-w-md mx-auto my-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Employee Added!</h3>
        <p className="text-gray-600 mb-5">Their temporary password is:</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <span className="font-mono text-xl text-blue-900 tracking-wider font-bold mx-auto">{genPwd}</span>
          <button type="button" onClick={() => navigator.clipboard.writeText(genPwd)}
            className="text-gray-400 hover:text-blue-600 transition flex-shrink-0 ml-2">
            <Copy size={20} />
          </button>
        </div>
        <button onClick={() => { onSaved(); onClose(); }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition">
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex justify-between items-center p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-800">{emp ? 'Edit Employee' : 'Add Employee'}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700 whitespace-pre-line">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name <span className="text-red-500">*</span></label>
            <input type="text" name="employee_name" value={form.employee_name} onChange={handleChange} required maxLength={150}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required maxLength={255}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>

          {emp ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password <span className="text-gray-400 text-xs ml-1">(leave blank to keep current)</span>
              </label>
              <input type="password" name="password" value={form.password} onChange={handleChange} minLength={6} maxLength={100}
                placeholder="Enter new password or leave blank"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth <span className="text-red-500">*</span></label>
              <input type="date" name="dob" value={form.dob} onChange={handleChange} required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
              <input type="tel" name="phone_no" value={form.phone_no} onChange={handleChange} required maxLength={15} placeholder="10–15 digits"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
            <textarea name="address" value={form.address} onChange={handleChange} required rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID Type <span className="text-red-500">*</span></label>
            <select name="id_type" value={form.id_type} onChange={handleChange} required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Number <span className="text-red-500">*</span>
              <span className="text-gray-400 text-xs ml-2">({idHint(form.id_type)})</span>
            </label>
            <input type="text" name="id_number" value={form.id_number} onChange={handleChange} required maxLength={maxLen(form.id_type)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year Joined</label>
              <input type="text" name="year_joined" value={form.year_joined} onChange={handleChange} maxLength={10} placeholder="YYYY"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role <span className="text-red-500">*</span></label>
              <select name="role" value={form.role} onChange={handleChange} required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Salary Breakdown</p>
            <div className="grid grid-cols-2 gap-3">
              {(['basic', 'da', 'hra', 'others'] as const).map(field => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">{field}</label>
                  <input type="number" name={field} value={(form as any)[field]} onChange={handleChange} min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-gray-100 text-sm">
              <span className="font-medium text-gray-600">Gross Salary</span>
              <span className="font-bold text-blue-700">
                ₹{(parseInt(form.basic) || 0) + (parseInt(form.da) || 0) + (parseInt(form.hra) || 0) + (parseInt(form.others) || 0)}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm">
              {loading ? 'Saving…' : emp ? 'Update Employee' : 'Add Employee'}
            </button>
          </div>
        </form>
    </div>
  );
}
