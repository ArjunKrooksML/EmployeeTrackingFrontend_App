import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { api, type Project } from '../lib/api';

function fmt(d: string | null | undefined) {
  if (!d) return '-';
  const obj = new Date(d);
  if (Number.isNaN(obj.getTime())) return d;
  return obj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function ProjView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.projects.getAll();
      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (projectData: Omit<Project, 'project_id'>) => {
    try {
      await api.projects.create(projectData);
      await fetchProjects();
      setShowForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create project');
      throw err;
    }
  };

  const handleUpdate = async (projectId: number, projectData: Partial<Omit<Project, 'project_id'>>) => {
    try {
      await api.projects.update(projectId, projectData);
      await fetchProjects();
      setEditingProject(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update project');
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Projects</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
        >
          <Plus size={20} />
          New Project
        </button>
      </div>

      {showForm && (
        <ProjectForm
          onClose={() => setShowForm(false)}
          onSubmit={handleCreate}
        />
      )}

      {editingProject && (
        <ProjectForm
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSubmit={(data) => handleUpdate(editingProject.project_id, data)}
        />
      )}

      {projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No projects found. Create your first project to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map(p => (
            <div
              key={p.project_id}
              className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-baseline gap-4 mb-2">
                <h3 className="font-semibold text-lg">{p.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">#{p.project_id}</span>
                  <button
                    onClick={() => setEditingProject(p)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Edit
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{p.client_name}</p>
              <p className="text-xs text-gray-500 mb-4">{p.address}</p>
              <div className="flex gap-6 text-sm text-gray-600">
                <span>
                  <strong>Start:</strong> {fmt(p.start_date)}
                </span>
                <span>
                  <strong>Completion:</strong> {fmt(p.completion_date)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type ProjectFormProps = {
  project?: Project;
  onClose: () => void;
  onSubmit: (project: Omit<Project, 'project_id'>) => Promise<void>;
};

function ProjectForm({ project, onClose, onSubmit }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    client_name: project?.client_name || '',
    address: project?.address || '',
    start_date: project?.start_date ? project.start_date.split('T')[0] : '',
    completion_date: project?.completion_date ? project.completion_date.split('T')[0] : '',
    isCompleted: !!project?.completion_date,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        name: formData.name,
        client_name: formData.client_name,
        address: formData.address,
        start_date: formData.start_date,
        completion_date: formData.isCompleted ? formData.completion_date : null,
      });
    } catch (err) {
      // Error already shown in parent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">{project ? 'Edit Project' : 'Create New Project'}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
          <input
            type="text"
            required
            value={formData.client_name}
            onChange={e => setFormData({ ...formData, client_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
          <textarea
            required
            value={formData.address}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
          <input
            type="date"
            required
            value={formData.start_date}
            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            id="isCompleted"
            checked={formData.isCompleted}
            onChange={e => setFormData({ ...formData, isCompleted: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="isCompleted" className="text-sm font-medium text-gray-700">
            Mark as completed
          </label>
        </div>
        {formData.isCompleted && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Completion Date</label>
            <input
              type="date"
              value={formData.completion_date}
              onChange={e => setFormData({ ...formData, completion_date: e.target.value })}
              min={formData.start_date}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {submitting ? (project ? 'Updating...' : 'Creating...') : (project ? 'Update Project' : 'Create Project')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProjView;
