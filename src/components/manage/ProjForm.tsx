import { useState, useEffect } from 'react';
import { api, type Project } from '../../lib/api';
import { X } from 'lucide-react';

interface Props {
  proj: Project | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ProjForm({ proj, onClose, onSaved }: Props) {
  const [form, setForm] = useState({ name: '', client_name: '', address: '', start_date: '', completion_date: '' });
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (proj) {
      setForm({
        name: proj.name,
        client_name: proj.client_name,
        address: proj.address,
        start_date: proj.start_date || '',
        completion_date: proj.completion_date || '',
      });
      setIsCompleted(!!proj.completion_date);
    } else {
      setIsCompleted(false);
    }
  }, [proj]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isCompleted && !form.completion_date) {
      alert('Please select a completion date or uncheck "Mark as completed".');
      return;
    }
    setLoading(true);
    const payload = {
      name: form.name.trim(),
      client_name: form.client_name.trim(),
      address: form.address.trim(),
      start_date: form.start_date,
      completion_date: isCompleted ? form.completion_date : null,
    };
    try {
      if (proj) {
        await api.manage.updateProject(proj.project_id, payload);
      } else {
        await api.manage.createProject(payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save project');
    }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex justify-between items-center p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-800">{proj ? 'Edit Project' : 'Create Project'}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name <span className="text-red-500">*</span></label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Name <span className="text-red-500">*</span></label>
            <input type="text" name="client_name" value={form.client_name} onChange={handleChange} required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
            <textarea name="address" value={form.address} onChange={handleChange} required rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" name="start_date" value={form.start_date} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Completion Date</label>
              <div className="flex items-center gap-2 mb-2">
                <input type="checkbox" id="completed" checked={isCompleted}
                  onChange={e => { setIsCompleted(e.target.checked); if (!e.target.checked) setForm(f => ({ ...f, completion_date: '' })); }}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded" />
                <label htmlFor="completed" className="text-sm text-gray-700">Mark as completed</label>
              </div>
              {isCompleted && (
                <input type="date" name="completion_date" value={form.completion_date} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm">
              {loading ? 'Saving…' : proj ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
    </div>
  );
}
