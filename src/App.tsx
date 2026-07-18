import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, FolderKanban, ListChecks, UserCircle, X, LayoutGrid, Home, Wallet, Menu, Package, FileText, Receipt, ChevronRight, CreditCard, ImagePlus, Trash2 } from 'lucide-react';
import { ToastProvider, useToast } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmDialog';
import NotificationBell from './components/NotificationBell';
import Login from './components/Login';
import { api } from './lib/api';

const Dashboard = lazy(() => import('./components/Dashboard'));
const AttView = lazy(() => import('./components/AttView'));
const TaskView = lazy(() => import('./components/TaskView'));
const ProjView = lazy(() => import('./components/ProjView'));
const LeaveView = lazy(() => import('./components/LeaveView'));
const MeView = lazy(() => import('./components/MeView'));
const PayrollView = lazy(() => import('./components/PayrollView'));
const OrdersView = lazy(() => import('./components/OrdersView'));
const ChangePasswordModal = lazy(() => import('./components/ChangePasswordModal'));
const ChatBot = lazy(() => import('./components/ChatBot'));
const DPRView = lazy(() => import('./components/DPRView'));
const ExpensesView = lazy(() => import('./components/ExpensesView'));
const EmpMgmt = lazy(() => import('./components/manage/EmpMgmt'));
const ProjMgmt = lazy(() => import('./components/manage/ProjMgmt'));
const TaskMgmt = lazy(() => import('./components/manage/TaskMgmt'));
const AllAtt = lazy(() => import('./components/manage/AllAtt'));

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
  profile_pic_url?: string | null;
};

type BaseTab = 'dashboard' | 'att' | 'tasks' | 'proj' | 'leaves' | 'payroll' | 'me' | 'orders' | 'dpr' | 'expenses';
type ManageTab = 'mg_emps' | 'mg_projs' | 'mg_tasks' | 'mg_att';
type Tab = BaseTab | ManageTab;

function isExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp * 1000 < Date.now();
  } catch { return true; }
}

function roleLabel(r?: string) {
  const map: Record<string, string> = { employee: 'Employee', senior: 'Senior', hr: 'HR', gm: 'GM' };
  return map[r || 'employee'] || r || 'Employee';
}

const TabSpinner = () => (
  <div className="flex items-center justify-center h-48">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />
  </div>
);

function App() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('empUser');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as User;
      if (!parsed.employee_id) { localStorage.removeItem('empUser'); return null; }
      if (isExpired(localStorage.getItem('empAccessToken')) && isExpired(localStorage.getItem('empRefreshToken'))) {
        localStorage.removeItem('empUser');
        localStorage.removeItem('empAccessToken');
        localStorage.removeItem('empRefreshToken');
        return null;
      }
      return parsed;
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
    localStorage.removeItem('empUser');
    setUser(null);
    api.auth.logout();
  };

  const updateUser = (patch: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem('empUser', JSON.stringify(next));
      return next;
    });
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <ToastProvider>
      <ConfirmProvider>
        <AppInner user={user} handleLogout={handleLogout} updateUser={updateUser} />
      </ConfirmProvider>
    </ToastProvider>
  );
}

function AppInner({ user, handleLogout, updateUser }: { user: any; handleLogout: () => void; updateUser: (patch: Partial<any>) => void }) {
  const [tab, setTab] = useState<any>('dashboard');
  const [showMenu, setShowMenu] = useState(false);
  const [showPicSub, setShowPicSub] = useState(false);
  const [picBusy, setPicBusy] = useState(false);
  const [cardBusy, setCardBusy] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [manageTab, setManageTab] = useState<any>('mg_emps');
  const [tabKey, setTabKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const navigate = (key: any) => {
    if (tab === key) setTabKey(k => k + 1);
    else setTab(key);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setPicBusy(true);
    try {
      const res = await api.profile.upload(f);
      updateUser({ profile_pic_url: res.profile_pic_url });
      toast.success('Profile picture updated');
    } catch (err: any) {
      toast.error('Upload failed', err?.message);
    } finally {
      setPicBusy(false);
    }
  };

  const handleRemovePic = async () => {
    setShowPicSub(false);
    setShowMenu(false);
    setPicBusy(true);
    try {
      await api.profile.remove();
      updateUser({ profile_pic_url: null });
      toast.success('Profile picture removed');
    } catch (err: any) {
      toast.error('Failed to remove picture', err?.message);
    } finally {
      setPicBusy(false);
    }
  };

  const handleCreateIdCard = async () => {
    setShowMenu(false);
    setCardBusy(true);
    const win = window.open('', '_blank');
    try {
      const blob = await api.profile.idCard();
      const url = URL.createObjectURL(blob);
      if (win) win.location.href = url;
      else window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err: any) {
      win?.close();
      toast.error('Could not generate ID card', err?.message);
    } finally {
      setCardBusy(false);
    }
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
    { key: 'dpr', icon: <FileText size={17} />, label: 'DPR' },
    { key: 'expenses', icon: <Receipt size={17} />, label: 'Expenses' },
  ];

  const manageSubs: { key: ManageTab; label: string; show: boolean }[] = [
    { key: 'mg_emps', label: 'Employees', show: isHR },
    { key: 'mg_projs', label: 'Projects', show: isHR },
    { key: 'mg_tasks', label: 'Tasks', show: isGM || isSenior },
    { key: 'mg_att', label: 'All Attendance', show: isGM },
  ];

  const isManage = (tab as string).startsWith('mg_');

  return (
    <div className="min-h-screen bg-[#f5f3ff] flex flex-col relative">
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse 55% 45% at 95% -5%, rgba(167,139,250,0.14) 0%, transparent 100%), radial-gradient(ellipse 50% 40% at -5% 55%, rgba(99,102,241,0.1) 0%, transparent 100%), radial-gradient(ellipse 50% 40% at 65% 105%, rgba(192,132,252,0.08) 0%, transparent 100%)' }}
      />
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
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">{roleLabel(role)}</span>
            <NotificationBell empId={user.employee_id} />
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(v => !v)}
                className="flex items-center gap-2 rounded-full bg-white/20 hover:bg-white/30 px-3 py-1.5 text-sm font-medium transition"
                title={user.email}
              >
                {user.profile_pic_url ? (
                  <img src={user.profile_pic_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <UserCircle size={20} />
                )}
                <span className="hidden sm:inline max-w-[120px] truncate">{user.name}</span>
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-100 py-1 text-sm text-slate-700 z-50">
                  <button className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-t-xl" onClick={() => { setShowMenu(false); setShowProfile(true); }}>View Profile</button>
                  <div>
                    <button className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between" onClick={() => setShowPicSub(v => !v)}>
                      <span>Change Profile Picture</span>
                      <ChevronRight size={14} className={`transition-transform ${showPicSub ? 'rotate-90' : ''}`} />
                    </button>
                    {showPicSub && (
                      <div className="bg-slate-50 border-y border-slate-100">
                        <button
                          className="w-full text-left pl-6 pr-3 py-2 hover:bg-slate-100 flex items-center gap-2 disabled:opacity-40"
                          disabled={picBusy}
                          onClick={() => { setShowPicSub(false); setShowMenu(false); fileInputRef.current?.click(); }}
                        >
                          <ImagePlus size={14} /> Add profile picture
                        </button>
                        <button
                          className="w-full text-left pl-6 pr-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 disabled:opacity-40"
                          disabled={picBusy || !user.profile_pic_url}
                          onClick={handleRemovePic}
                        >
                          <Trash2 size={14} /> Remove profile picture
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-40"
                    disabled={cardBusy}
                    onClick={handleCreateIdCard}
                  >
                    <CreditCard size={14} /> {cardBusy ? 'Generating…' : 'Create ID Card'}
                  </button>
                  <button className="w-full text-left px-3 py-2 hover:bg-slate-50" onClick={() => { setShowMenu(false); setShowChangePass(true); }}>Change Password</button>
                  <button className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-b-xl" onClick={handleLogout}>Logout</button>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileChange} />
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
          <AnimatePresence>
            <motion.div
              key={`${tab}-${tabKey}`}
              className="relative z-10 max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <Suspense fallback={<TabSpinner />}>
                {tab === 'dashboard' && <Dashboard user={user} />}
                {tab === 'att' && <AttView user={user} />}
                {tab === 'tasks' && <TaskView user={user} />}
                {tab === 'proj' && <ProjView />}
                {tab === 'leaves' && <LeaveView user={user} />}
                {tab === 'payroll' && <PayrollView />}
                {tab === 'me' && <MeView user={user} />}
                {tab === 'orders' && <OrdersView />}
                {tab === 'dpr' && <DPRView />}
                {tab === 'expenses' && <ExpensesView />}
                {isManage && canManage && (
                  <div>
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
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {showDrawer && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              className="absolute inset-0 bg-black/50"
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
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4"
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
                <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 text-white flex items-center justify-center text-2xl font-semibold shadow-lg overflow-hidden">
                  {user.profile_pic_url ? (
                    <img src={user.profile_pic_url} alt="" className="h-16 w-16 object-cover" />
                  ) : (
                    (user.name || user.email).charAt(0).toUpperCase()
                  )}
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

      <Suspense fallback={null}>
        {showChangePass && <ChangePasswordModal onClose={() => setShowChangePass(false)} />}
        <ChatBot />
      </Suspense>
    </div>
  );
}

export default App;
