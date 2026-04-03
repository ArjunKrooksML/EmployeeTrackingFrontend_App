import { useState, useEffect } from 'react';
import { CalendarDays, FolderKanban, ListChecks, UserCircle, Users, X, LayoutGrid, Home } from 'lucide-react';
import Dashboard from './components/Dashboard';
import AttView from './components/AttView';
import TaskView from './components/TaskView';
import ProjView from './components/ProjView';
import LeaveView from './components/LeaveView';
import MeView from './components/MeView';
import Login from './components/Login';
import ChangePasswordModal from './components/ChangePasswordModal';
import EmpMgmt from './components/manage/EmpMgmt';
import ProjMgmt from './components/manage/ProjMgmt';
import TaskMgmt from './components/manage/TaskMgmt';
import AllAtt from './components/manage/AllAtt';

type User = {
  name: string;
  email: string;
  employee_id?: number;
  role?: string;
  dob?: string;
  address?: string;
  phone_no?: string;
  id_type?: string;
  id_number?: string;
  designation_id?: number;
  year_joined?: string;
  salary?: number;
};

// Base tabs always visible
type BaseTab = 'dashboard' | 'att' | 'tasks' | 'proj' | 'leaves' | 'me';
// Extra tabs for HR/GM
type ManageTab = 'mg_emps' | 'mg_projs' | 'mg_tasks' | 'mg_att';
type Tab = BaseTab | ManageTab;

function roleLabel(r?: string) {
  const map: Record<string, string> = { employee: 'Employee', senior: 'Senior', hr: 'HR', gm: 'GM' };
  return map[r || 'employee'] || r || 'Employee';
}

function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);
  const [manageTab, setManageTab] = useState<ManageTab>('mg_emps');

  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('empUser');
      if (raw) {
        const parsed = JSON.parse(raw) as User;
        if (!parsed.employee_id) { localStorage.removeItem('empUser'); return null; }
        return parsed;
      }
      return null;
    } catch { return null; }
  });

  useEffect(() => {
    if (user?.name) {
      document.title = `${user.name} | SVAAS Inframax Solutions`;
    } else {
      document.title = 'Employee | SVAAS Inframax Solutions';
    }
  }, [user]);

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

  if (!user) return <Login onLogin={handleLogin} />;

  const role = user.role || 'employee';
  const isHR = role === 'hr' || role === 'gm';
  const isGM = role === 'gm';

  // Build manage sub-tabs for the inline manage section
  const manageSubs: { key: ManageTab; label: string; show: boolean }[] = [
    { key: 'mg_emps', label: 'Employees', show: isHR },
    { key: 'mg_projs', label: 'Projects', show: isHR },
    { key: 'mg_tasks', label: 'Tasks', show: isGM },
    { key: 'mg_att', label: 'All Attendance', show: isGM },
  ];

  // Tab is "manage" section if it's a manage key
  const isManage = (tab as string).startsWith('mg_');

  return (
    <div className="min-h-screen bg-violet-50/40 flex flex-col">
      {/* Top nav */}
      <nav className="bg-gradient-to-r from-violet-600 via-purple-600 to-rose-500 text-white shadow-lg">
        <div className="px-4 sm:px-8 flex justify-between items-center h-14">
          <div className="flex items-center gap-3">
            <img src="/svaas.png" alt="SVAAS" className="h-8 w-8 rounded-lg object-cover shadow border border-white/40" />
            <h1 className="text-lg font-semibold tracking-tight hidden sm:block">SVAAS Inframax Solutions</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Role badge */}
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">{roleLabel(role)}</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(v => !v)}
                className="flex items-center gap-2 rounded-full bg-white/20 hover:bg-white/30 px-3 py-1.5 text-sm font-medium transition"
                title={user.email}
              >
                <UserCircle size={20} />
                <span className="hidden sm:inline max-w-[120px] truncate">{user.name}</span>
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl bg-white shadow-xl border border-slate-100 py-1 text-sm text-slate-700 z-50">
                  <button className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-t-xl" onClick={() => { setShowMenu(false); setShowProfile(true); }}>View Profile</button>
                  <button className="w-full text-left px-3 py-2 hover:bg-slate-50" onClick={() => { setShowMenu(false); setShowChangePass(true); }}>Change Password</button>
                  <button className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-b-xl" onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Desktop layout: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop only */}
        <aside className="hidden md:flex w-56 bg-indigo-950 text-slate-100 flex-col px-3 py-5 space-y-1 shadow-xl">
          {[
            { key: 'dashboard', icon: <Home size={17} />, label: 'Dashboard' },
            { key: 'att', icon: <CalendarDays size={17} />, label: 'Attendance' },
            { key: 'tasks', icon: <ListChecks size={17} />, label: 'My Tasks' },
            { key: 'proj', icon: <FolderKanban size={17} />, label: 'Projects' },
            { key: 'leaves', icon: <CalendarDays size={17} />, label: 'Leaves' },
            { key: 'me', icon: <UserCircle size={17} />, label: 'Profile' },
          ].map(item => (
            <button key={item.key} onClick={() => setTab(item.key as Tab)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${tab === item.key
                ? 'bg-violet-600/30 text-violet-300 border-l-2 border-violet-400'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}>
              {item.icon}<span>{item.label}</span>
            </button>
          ))}

          {/* Manage section for HR/GM */}
          {isHR && (
            <>
              <div className="pt-3 pb-1 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Manage</div>
              {manageSubs.filter(s => s.show).map(s => (
                <button key={s.key} onClick={() => { setTab(s.key); setManageTab(s.key); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${tab === s.key
                    ? 'bg-violet-600/30 text-violet-300 border-l-2 border-violet-400'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}>
                  <LayoutGrid size={17} /><span>{s.label}</span>
                </button>
              ))}
            </>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-24 md:pb-6">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border-t-4 border-violet-500 border border-slate-100 p-4 sm:p-6">
            {tab === 'dashboard' && <Dashboard user={user} />}
            {tab === 'att' && <AttView user={user} />}
            {tab === 'tasks' && <TaskView user={user} />}
            {tab === 'proj' && <ProjView />}
            {tab === 'leaves' && <LeaveView user={user} />}
            {tab === 'me' && <MeView user={user} />}
            {/* Manage tabs */}
            {isManage && isHR && (
              <div>
                {/* Sub-tab bar */}
                <div className="flex gap-2 mb-5 border-b border-slate-200 pb-2 overflow-x-auto">
                  {manageSubs.filter(s => s.show).map(s => (
                    <button key={s.key} onClick={() => { setManageTab(s.key); setTab(s.key); }}
                      className={`px-3 py-1.5 text-sm rounded-lg font-medium whitespace-nowrap transition ${manageTab === s.key ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
                {manageTab === 'mg_emps' && <EmpMgmt />}
                {manageTab === 'mg_projs' && <ProjMgmt />}
                {manageTab === 'mg_tasks' && isGM && <TaskMgmt />}
                {manageTab === 'mg_att' && isGM && <AllAtt />}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex md:hidden z-30 pb-safe">
        {[
          { key: 'dashboard', icon: <Home size={22} />, label: 'Home' },
          { key: 'att', icon: <CalendarDays size={22} />, label: 'Att.' },
          { key: 'tasks', icon: <ListChecks size={22} />, label: 'Tasks' },
          { key: 'proj', icon: <FolderKanban size={22} />, label: 'Projects' },
          { key: 'leaves', icon: <CalendarDays size={22} />, label: 'Leaves' },
          ...(isHR ? [{ key: 'mg_emps' as Tab, icon: <Users size={22} />, label: 'Manage' }] : []),
          { key: 'me', icon: <UserCircle size={22} />, label: 'Profile' },
        ].map(item => {
          const active = item.key === 'mg_emps' ? isManage : tab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                if (item.key === 'mg_emps' && isHR) {
                  setTab(manageTab);
                } else {
                  setTab(item.key as Tab);
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition relative ${active ? 'text-violet-600' : 'text-slate-400'
                }`}
            >
              {active && <span className="absolute top-0 inset-x-4 h-0.5 rounded-b-full bg-violet-500" />}
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Profile modal */}
      {showProfile && user && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 relative">
            <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600" onClick={() => setShowProfile(false)}><X size={20} /></button>
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 text-white flex items-center justify-center text-2xl font-semibold shadow-lg">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{user.name}</h2>
                <p className="text-sm text-slate-500">{user.email}</p>
                <p className="text-xs text-indigo-600 font-medium mt-1">{roleLabel(role)}</p>
              </div>
            </div>
            <div className="mt-5 space-y-2 text-sm text-slate-600">
              {user.employee_id && <div className="flex justify-between pb-2 border-b border-slate-100"><span className="text-slate-500">Employee ID</span><span className="text-slate-900">{user.employee_id}</span></div>}
              {user.year_joined && <div className="flex justify-between pb-2 border-b border-slate-100"><span className="text-slate-500">Year Joined</span><span className="text-slate-900">{user.year_joined}</span></div>}
            </div>
          </div>
        </div>
      )}

      {showChangePass && <ChangePasswordModal onClose={() => setShowChangePass(false)} />}
    </div>
  );
}

export default App;
