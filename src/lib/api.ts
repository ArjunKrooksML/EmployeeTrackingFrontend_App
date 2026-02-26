const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface Task {
  task_id: number;
  project_id: number;
  task_name: string;
  description?: string | null;
  assigned_to?: string | null;
  start_date?: string | null;
  deadline?: string | null;
  iscompleted?: boolean;
  status: string;
  priority: string;
  created?: string;
}

export interface Project {
  project_id: number;
  name: string;
  client_name: string;
  address: string;
  start_date: string;
  completion_date?: string | null;
}

export interface Attendance {
  id: number;
  employee_id: number;
  date: string;
  attendance: 'present' | 'absent' | 'late';
  checkin?: string | null;
  created_at: string;
}

function getAccessToken(): string | null {
  return localStorage.getItem('empAccessToken');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('empRefreshToken');
}

async function refreshToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await fetch(`${BACKEND_URL}/employees/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });

    if (!res.ok) {
      localStorage.removeItem('empAccessToken');
      localStorage.removeItem('empRefreshToken');
      return null;
    }

    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('empAccessToken', data.access_token);
      return data.access_token;
    }
    return null;
  } catch {
    localStorage.removeItem('empAccessToken');
    localStorage.removeItem('empRefreshToken');
    return null;
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const url = `${BACKEND_URL}${endpoint}`;
  let token = getAccessToken();

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    });

    // If 401 and we have a refresh token, try to refresh
    if (response.status === 401 && retry && getRefreshToken()) {
      const newToken = await refreshToken();
      if (newToken) {
        // Retry the request with new token
        return apiRequest<T>(endpoint, options, false);
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error - is the backend running?', error);
      throw new Error('Cannot connect to backend. Please ensure the server is running at ' + BACKEND_URL);
    }
    throw error;
  }
}

export interface Employee {
  employee_id: number;
  employee_name: string;
  email: string;
  dob: string;
  address: string;
  phone_no: string;
  id_type: string;
  id_number: string;
  designation_id?: number | null;
  year_joined?: string | null;
  salary: number;
}

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<{ access_token: string; refresh_token: string; user: Employee }> => {
      const res = await apiRequest<{ access_token: string; refresh_token: string; user: Employee }>('/employees/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }, false);
      if (res.access_token) {
        localStorage.setItem('empAccessToken', res.access_token);
      }
      if (res.refresh_token) {
        localStorage.setItem('empRefreshToken', res.refresh_token);
      }
      return res;
    },
    refresh: async (): Promise<{ access_token: string; user: Employee } | null> => {
      const refresh = getRefreshToken();
      if (!refresh) return null;
      return await apiRequest<{ access_token: string; user: Employee }>('/employees/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refresh }),
      }, false);
    },
    logout: () => {
      localStorage.removeItem('empAccessToken');
      localStorage.removeItem('empRefreshToken');
    },
    resetPassword: async (email: string, otp: string, new_password: string): Promise<void> => {
      return apiRequest<void>('/employees/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, new_password }),
      }, false);
    },
    changePassword: async (old_password: string, new_password: string): Promise<{ message: string }> => {
      return apiRequest<{ message: string }>('/employees/change-password', {
        method: 'POST',
        body: JSON.stringify({ old_password, new_password }),
      });
    },
  },
  tasks: {
    getEmployeeTasks: async (employeeName: string): Promise<Task[]> => {
      return apiRequest<Task[]>(`/tasks/employee/${encodeURIComponent(employeeName)}`);
    },
    markComplete: async (taskId: number, employeeName: string, isCompleted: boolean = true): Promise<Task> => {
      return apiRequest<Task>(`/tasks/${taskId}/complete?employee_name=${encodeURIComponent(employeeName)}&is_completed=${isCompleted}`, {
        method: 'PUT',
      });
    },
  },
  projects: {
    getAll: async (): Promise<Project[]> => {
      return apiRequest<Project[]>('/projects/employee');
    },
    create: async (project: Omit<Project, 'project_id'>): Promise<Project> => {
      return apiRequest<Project>('/projects/employee/create', {
        method: 'POST',
        body: JSON.stringify(project),
      });
    },
    update: async (id: number, project: Partial<Omit<Project, 'project_id'>>): Promise<Project> => {
      return apiRequest<Project>(`/projects/employee/${id}`, {
        method: 'PUT',
        body: JSON.stringify(project),
      });
    },
  },
  attendance: {
    checkIn: async (employeeId: number): Promise<Attendance> => {
      return apiRequest<Attendance>(`/attendance/checkin?employee_id=${employeeId}`, {
        method: 'POST',
      });
    },
    getMyAttendance: async (employeeId: number): Promise<Attendance[]> => {
      return apiRequest<Attendance[]>(`/attendance/employee/${employeeId}`);
    },
  },
};

