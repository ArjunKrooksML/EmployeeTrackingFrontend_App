import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, FolderKanban, ListChecks, UserCircle, X, LayoutGrid, Home, Wallet, Menu, Package } from 'lucide-react';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmDialog';
import NotificationBell from './components/NotificationBell';
import Dashboard from './components/Dashboard';
import AttView from './components/AttView';
import TaskView from './components/TaskView';
import ProjView from './components/ProjView';
import LeaveView from './components/LeaveView';
import MeView from './components/MeView';
import PayrollView from './components/PayrollView';
import OrdersView from './components/OrdersView';
import Login from './components/Login';
import ChangePasswordModal from './components/ChangePasswordModal';
import ChatBot from './components/ChatBot';
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
  year_joined?: string;
  basic?: number;
  da?: number;
  hra?: number;
  others?: number;
};

// Base tabs always visible
type BaseTab = 'dashboard' | 'att' | 'tasks' | 'proj' | 'leaves' | 'payroll' | 'me' | 'orders';
// Extra tabs for HR/GM
type ManageTab = 'mg_emps' | 'mg_projs' | 'mg_tasks' | 'mg_att';
type Tab = BaseTab | ManageTab;

function roleLabel(r?: string) {
  const map: Record<string, string> = { employee: 'Employee', senior: 'Senior', hr: 'HR', gm: 'GM' };
  return map[r || 'employee'] || r || 'Employee';
}

function App() {
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

  useEffect(() => {
    const onExpired = () => { setUser(null); };
    window.addEventListener('emp:auth-expired', onExpired);
    return () => window.removeEventListener('emp:auth-expired', onExpired);
  }, []);

  const handleLogin = (employee: User) => {
    setUser(employee);
    localStorage.setItem('empUser', JSON.stringify(employee));
  };

  const handleLogout = () => {
    localStorage.removeItem('empAccessToken');
    localStorage.removeItem('empRefreshToken');
    localStorage.removeItem('empUser');
    setUser(null);
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <ToastProvider>
      <ConfirmProvider>
        <AppInner user={user} handleLogout={handleLogout} />
      </ConfirmProvider>
    </ToastProvider>
  );
}

function AppInner({ user, handleLogout }: { user: any; handleLogout: () => void }) {
  const [tab, setTab] = useState<any>('dashboard');
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [manageTab, setManageTab] = useState<any>('mg_emps');
  const [tabKey, setTabKey] = useState(0);

  const navigate = (key: any) => {
    if (tab === key) setTabKey(k => k + 1);
    else setTab(key);
  };

  const role = user.role || 'employee';
  const isHR = role === 'hr' || role === 'gm';
  const isGM = role === 'gm';
  const isSenior = role === 'senior';
  const canManage = isHR || isSenior;

  const NAV_ITEMS = [
    { key: 'dashboard', icon: <Home size={17} />, label: 'Dashboard' },
    { key: 'att', icon: <CalendarDays size={17} />, label: 'Attendance' },
    { key: 'tasks', icon: <ListChecks size={17} />, label: 'My Tasks' },
    { key: 'proj', icon: <FolderKanban size={17} />, label: 'Projects' },
    { key: 'leaves', icon: <CalendarDays size={17} />, label: 'Leaves' },
    { key: 'payroll', icon: <Wallet size={17} />, label: 'Payroll' },
    { key: 'me', icon: <UserCircle size={17} />, label: 'Profile' },
    { key: 'orders', icon: <Package size={17} />, label: 'Orders' },
  ];

  // Build manage sub-tabs for the inline manage section
  const manageSubs: { key: ManageTab; label: string; show: boolean }[] = [
    { key: 'mg_emps', label: 'Employees', show: isHR },
    { key: 'mg_projs', label: 'Projects', show: isHR },
    { key: 'mg_tasks', label: 'Tasks', show: isGM || isSenior },
    { key: 'mg_att', label: 'All Attendance', show: isGM },
  ];

  // Tab is "manage" section if it's a manage key
  const isManage = (tab as string).startsWith('mg_');

  return (
    <div className="min-h-screen bg-[#f5f3ff] flex flex-col relative">
      {/* Liquid glass background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-violet-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-indigo-400/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-[450px] h-[450px] bg-purple-400/7 rounded-full blur-3xl" />
      </div>
      {/* Top nav */}
      <nav className="bg-[#130c24] text-white border-b border-white/5 relative z-20">
        <div className="px-4 sm:px-8 flex justify-between items-center h-14">
          <div className="flex items-center gap-2 sm:gap-3">
            <button type="button" onClick={() => setShowDrawer(true)} className="md:hidden p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition mr-1">
              <Menu size={20} />
            </button>
            <button type="button" onClick={() => setTabKey(k => k + 1)} className="flex items-center gap-2">
              <img src="/svaas.png" alt="SVAAS" className="h-8 w-8 rounded-lg object-cover shadow border border-white/40" />
              <h1 className="text-[10px] sm:text-lg font-semibold tracking-tight leading-tight">SVAAS Inframax Solutions OPC Pvt Ltd</h1>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {/* Role badge */}
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">{roleLabel(role)}</span>
            <NotificationBell empId={user.employee_id} />
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
        <aside className="hidden md:flex w-56 bg-[#130c24] text-slate-100 flex-col px-3 py-5 space-y-0.5 border-r border-white/5">
          {NAV_ITEMS.map(item => (
            <div key={item.key} className="relative">
              {tab === item.key && (
                <motion.div
                  layoutId="emp-sidebar-active"
                  className="absolute inset-0 rounded-lg bg-violet-500/15"
                  style={{ borderLeft: '2px solid rgb(139 92 246)' }}
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                />
              )}
              <button onClick={() => navigate(item.key as Tab)}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === item.key ? 'text-violet-300' : 'text-slate-400 hover:bg-white/8 hover:text-slate-100'
                  }`}>
                {item.icon}<span>{item.label}</span>
              </button>
            </div>
          ))}

          {/* Manage section for HR/GM/Senior */}
          {canManage && (
            <>
              <div className="pt-3 pb-1 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Manage</div>
              {manageSubs.filter(s => s.show).map(s => (
                <div key={s.key} className="relative">
                  {tab === s.key && (
                    <motion.div
                      layoutId="emp-sidebar-active"
                      className="absolute inset-0 rounded-lg bg-violet-500/15"
                      style={{ borderLeft: '2px solid rgb(139 92 246)' }}
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                    />
                  )}
                  <button onClick={() => { navigate(s.key); setManageTab(s.key); }}
                    className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === s.key ? 'text-violet-300' : 'text-slate-400 hover:bg-white/8 hover:text-slate-100'
                      }`}>
                    <LayoutGrid size={17} /><span>{s.label}</span>
                  </button>
                </div>
              ))}
            </>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${tab}-${tabKey}`}
              className="relative z-10 max-w-4xl mx-auto bg-white/80 backdrop-blur-md rounded-2xl shadow-lg shadow-black/5 border border-white/70 p-4 sm:p-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {tab === 'dashboard' && <Dashboard user={user} />}
              {tab === 'att' && <AttView user={user} />}
              {tab === 'tasks' && <TaskView user={user} />}
              {tab === 'proj' && <ProjView />}
              {tab === 'leaves' && <LeaveView user={user} />}
              {tab === 'payroll' && <PayrollView />}
              {tab === 'me' && <MeView user={user} />}
              {tab === 'orders' && <OrdersView />}
              {/* Manage tabs */}
              {isManage && canManage && (
                <div>
                  {/* Sub-tab bar */}
                  <div className="flex gap-2 mb-5 border-b border-slate-200 pb-2 overflow-x-auto">
                    {manageSubs.filter(s => s.show).map(s => (
                      <button key={s.key} onClick={() => { setManageTab(s.key); navigate(s.key); }}
                        className={`px-3 py-1.5 text-sm rounded-lg font-medium whitespace-nowrap transition ${manageTab === s.key ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                  {manageTab === 'mg_emps' && isHR && <EmpMgmt />}
                  {manageTab === 'mg_projs' && isHR && <ProjMgmt />}
                  {manageTab === 'mg_tasks' && (isGM || isSenior) && <TaskMgmt />}
                  {manageTab === 'mg_att' && isGM && <AllAtt />}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {showDrawer && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
            />
            <motion.aside
              className="relative w-60 bg-[#130c24] text-slate-100 flex flex-col px-3 py-5 space-y-0.5 h-full overflow-y-auto border-r border-white/5"
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.28 }}
            >
              <div className="flex items-center justify-between mb-3 px-2">
                <span className="text-sm font-semibold text-slate-300 tracking-wide uppercase">Menu</span>
                <button onClick={() => setShowDrawer(false)} className="text-slate-400 hover:text-white p-1"><X size={18} /></button>
              </div>
              {NAV_ITEMS.map(item => (
                <button key={item.key} onClick={() => { navigate(item.key as Tab); setShowDrawer(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === item.key
                    ? 'bg-violet-500/15 text-violet-300 border-l-2 border-violet-500'
                    : 'text-slate-400 hover:bg-white/8 hover:text-slate-100 border-l-2 border-transparent'}`}>
                  {item.icon}<span>{item.label}</span>
                </button>
              ))}
              {canManage && (
                <>
                  <div className="pt-3 pb-1 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Manage</div>
                  {manageSubs.filter(s => s.show).map(s => (
                    <button key={s.key} onClick={() => { navigate(s.key); setManageTab(s.key); setShowDrawer(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === s.key
                        ? 'bg-violet-500/15 text-violet-300 border-l-2 border-violet-500'
                        : 'text-slate-400 hover:bg-white/8 hover:text-slate-100 border-l-2 border-transparent'}`}>
                      <LayoutGrid size={17} /><span>{s.label}</span>
                    </button>
                  ))}
                </>
              )}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Profile modal */}
      <AnimatePresence>
        {showProfile && user && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 relative"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
            >
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showChangePass && <ChangePasswordModal onClose={() => setShowChangePass(false)} />}
      <ChatBot />
    </div>
  );
}

export default App;
