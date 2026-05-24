import { useState, useEffect } from 'react';
import { api, type Task, type Employee, type Project } from '../../lib/api';
import { X } from 'lucide-react';

interface Props {
  task: Task | null;
  onClose: () => void;
  onSaved: () => void;
}

const TASK_TYPES = ['Tools', 'Coupler Supply', 'Machine Mobilization', 'Machine Demobilization', 'Samples Testing'];
const TOOLS_TYPES = ['Chasers', 'Rebar Caps', 'Forging Dyes', 'Gloves', 'Hydraulic Oil', 'Miscellaneous'];

export default function TaskForm({ task, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    task_name: '', description: '', project_id: '', assigned_to: '',
    status: 'todo', priority: 'medium', start_date: '', deadline: '',
    task_type: '', tools_type: '',
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.manage.getEmployees().then(setEmployees).catch(() => {});
    api.manage.getProjects().then(setProjects).catch(() => {});
  }, []);

  useEffect(() => {
    if (task) {
      setForm({
        task_name: task.task_name,
        description: task.description || '',
        project_id: task.project_id?.toString() || '',
        assigned_to: task.assigned_to?.toString() || '',
        status: task.status,
        priority: task.priority,
        start_date: task.start_date || '',
        deadline: task.deadline || '',
        task_type: task.task_type || '',
        tools_type: task.tools_type || '',
      });
    }
  }, [task]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value, ...(name === 'task_type' && value !== 'Tools' ? { tools_type: '' } : {}) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.project_id) { alert('Please select a project'); return; }
    setLoading(true);
    const payload = {
      task_name: form.task_name.trim(),
      description: form.description.trim() || null,
      project_id: Number(form.project_id),
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      status: form.status,
      priority: form.priority,
      start_date: form.start_date || null,
      deadline: form.deadline || null,
      iscompleted: form.status === 'completed',
      task_type: form.task_type || null,
      tools_type: form.task_type === 'Tools' ? (form.tools_type || null) : null,
    };
    try {
      if (task) await api.manage.updateTask(task.task_id, payload);
      else await api.manage.createTask(payload);
      onSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save task');
    }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex justify-between items-center p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-800">{task ? 'Edit Task' : 'Create Task'}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title <span className="text-red-500">*</span></label>
            <input type="text" name="task_name" value={form.task_name} onChange={handleChange} required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
              <select name="task_type" value={form.task_type} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm">
                <option value="">Select type</option>
                {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {form.task_type === 'Tools' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tools Type</label>
                <select name="tools_type" value={form.tools_type} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm">
                  <option value="">Select tool</option>
                  {TOOLS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project <span className="text-red-500">*</span></label>
              <select name="project_id" value={form.project_id} onChange={handleChange} required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm">
                <option value="">Select project</option>
                {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
              <select name="assigned_to" value={form.assigned_to} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm">
                <option value="">Unassigned</option>
                {employees.map(e => <option key={e.employee_id} value={e.employee_id}>{e.employee_name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select name="status" value={form.status} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm">
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" name="start_date" value={form.start_date} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input type="date" name="deadline" value={form.deadline} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 text-sm">
              {loading ? 'Saving…' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
    </div>
  );
}
