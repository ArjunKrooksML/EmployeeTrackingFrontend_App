import { useState } from 'react';
import { CalendarDays, FolderKanban, ListChecks, UserCircle, X } from 'lucide-react';
import AttView from './components/AttView';
import TaskView from './components/TaskView';
import ProjView from './components/ProjView';
import MeView from './components/MeView';
import Login from './components/Login';
import ChangePasswordModal from './components/ChangePasswordModal';

type Tab = 'att' | 'tasks' | 'proj' | 'me';

type User = {
  name: string;
  email: string;
  employee_id?: number;
  dob?: string;
  address?: string;
  phone_no?: string;
  id_type?: string;
  id_number?: string;
  designation_id?: number;
  year_joined?: string;
  salary?: number;
};

function App() {
  const [tab, setTab] = useState<Tab>('att');
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('empUser');
      if (raw) {
        const parsed = JSON.parse(raw) as User;
        // If user doesn't have employee_id, clear it (old login data)
        if (!parsed.employee_id) {
          localStorage.removeItem('empUser');
          return null;
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const handleLogin = (employee: User) => {
    setUser(employee);
    localStorage.setItem('empUser', JSON.stringify(employee));
  };

  const handleLogout = () => {
    localStorage.removeItem('empAccessToken');
    localStorage.removeItem('empRefreshToken');
    localStorage.removeItem('empUser');
    setUser(null);
    setShowMenu(false);
    setShowProfile(false);
  };

  if (!user) {
    return (
      <Login
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-500 text-white shadow-lg">
        <div className="px-4 sm:px-8 lg:px-12 flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <img
              src="/svaas.png"
              alt="SVAAS logo"
              className="h-10 w-10 rounded-lg object-cover shadow-lg border border-white/40"
            />
            <h1 className="text-2xl font-semibold tracking-tight">SVAAS Inframax Solutions</h1>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(v => !v)}
              className="flex items-center gap-2 rounded-full bg-white/20 hover:bg-white/30 px-3 py-1.5 text-sm font-medium transition"
              title={user.email ?? ''}
            >
              <UserCircle size={22} />
              <span className="hidden sm:inline max-w-[160px] truncate">{user.name}</span>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl bg-white shadow-xl border border-slate-100/60 py-1 text-sm text-slate-700 z-50">
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-t-xl"
                  onClick={() => {
                    setShowMenu(false);
                    setShowProfile(true);
                  }}
                >
                  View profile
                </button>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2"
                  onClick={() => {
                    setShowMenu(false);
                    setShowChangePass(true);
                  }}
                >
                  Change password
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-b-xl"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className="w-64 bg-slate-900 text-slate-100 border-r border-slate-800/60 px-4 py-6 space-y-3 shadow-xl">
          <button
            onClick={() => setTab('att')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium tracking-tight transition ${tab === 'att'
              ? 'bg-white/15 text-white shadow-lg shadow-slate-900/30'
              : 'text-slate-200/80 hover:bg-white/10 hover:text-white'
              }`}
          >
            <CalendarDays size={18} />
            <span>Attendance</span>
          </button>
          <button
            onClick={() => setTab('tasks')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium tracking-tight transition ${tab === 'tasks'
              ? 'bg-white/15 text-white shadow-lg shadow-slate-900/30'
              : 'text-slate-200/80 hover:bg-white/10 hover:text-white'
              }`}
          >
            <ListChecks size={18} />
            <span>My Tasks</span>
          </button>
          <button
            onClick={() => setTab('proj')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium tracking-tight transition ${tab === 'proj'
              ? 'bg-white/15 text-white shadow-lg shadow-slate-900/30'
              : 'text-slate-200/80 hover:bg-white/10 hover:text-white'
              }`}
          >
            <FolderKanban size={18} />
            <span>Projects</span>
          </button>
          <button
            onClick={() => setTab('me')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium tracking-tight transition ${tab === 'me'
              ? 'bg-white/15 text-white shadow-lg shadow-slate-900/30'
              : 'text-slate-200/80 hover:bg-white/10 hover:text-white'
              }`}
          >
            <UserCircle size={18} />
            <span>Profile</span>
          </button>
        </aside>

        <main className="flex-1 px-4 sm:px-10 py-8">
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100/80 p-4 sm:p-6">
            {tab === 'att' && user && <AttView user={user} />}
            {tab === 'tasks' && <TaskView user={user} />}
            {tab === 'proj' && <ProjView />}
            {tab === 'me' && user && <MeView user={user} />}
          </div>
        </main>
      </div>

      {showProfile && user && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 relative">
            <button
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              onClick={() => setShowProfile(false)}
            >
              <X size={20} />
            </button>
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 text-white flex items-center justify-center text-2xl font-semibold shadow-lg">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{user.name}</h2>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
            </div>
            <div className="mt-6 space-y-3 text-sm text-slate-600">
              {user.employee_id && (
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="font-medium text-slate-500">Employee ID</span>
                  <span className="text-slate-900">{user.employee_id}</span>
                </div>
              )}
              {user.designation_id && (
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="font-medium text-slate-500">Designation ID</span>
                  <span className="text-slate-900">{user.designation_id}</span>
                </div>
              )}
              {user.year_joined && (
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="font-medium text-slate-500">Year Joined</span>
                  <span className="text-slate-900">{user.year_joined}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showChangePass && <ChangePasswordModal onClose={() => setShowChangePass(false)} />}
    </div>
  );
}

export default App;
