import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api, type Task, type Attendance, type Leave } from '../lib/api';
import { fmtLabel } from '../utils/format';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import { ListChecks, CalendarDays, CheckCircle2, Briefcase, FileText } from 'lucide-react';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface DashboardProps { user: any; }

function useCountUp(target: number, duration = 1.1) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let frameId: number;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / (duration * 1000), 1);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) frameId = requestAnimationFrame(step);
    };
    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);
  return count;
}

function StatCard({ icon, label, value, gradient, shadow, delay = 0 }: {
  icon: React.ReactNode; label: string; value: number; gradient: string; shadow: string; delay?: number;
}) {
  const count = useCountUp(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white border border-slate-100 p-5 rounded-2xl hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-default"
    >
      <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${shadow} mb-4`}>
        {icon}
      </div>
      <p className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">{count}</p>
      <p className="text-sm text-slate-500 mt-1 font-medium">{label}</p>
    </motion.div>
  );
}

function greet() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard({ user }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.employee_id) { setLoading(false); return; }
    (async () => {
      try {
        const results = await Promise.allSettled([
          api.tasks?.getEmployeeTasks?.(user.employee_id) || Promise.resolve([]),
          api.attendance?.getMyAttendance?.(user.employee_id, new Date().getFullYear()) || Promise.resolve([]),
          api.leaves?.getByEmployee?.(user.employee_id) || Promise.resolve([]),
        ]);
        setTasks(results[0].status === 'fulfilled' ? (results[0].value || []) : []);
        setAttendance(results[1].status === 'fulfilled' ? (results[1].value || []) : []);
        setLeaves(results[2].status === 'fulfilled' ? (results[2].value || []) : []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-36 rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="skeleton h-72 rounded-2xl" />
          <div className="skeleton h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  const completedTasks = tasks.filter(t => t.status.toLowerCase() === 'completed').length;
  const inProgressTasks = tasks.filter(t => ['in progress', 'in_progress'].includes(t.status.toLowerCase())).length;
  const todoTasks = tasks.filter(t => ['to do', 'todo'].includes(t.status.toLowerCase())).length;

  const presentDays = attendance.filter(a => a.attendance === 'present').length;
  const lateDays = attendance.filter(a => a.attendance === 'late').length;
  const absentDays = attendance.filter(a => a.attendance === 'absent').length;
  const takenLeaves = leaves.filter(l => l.status === 'approved').length;

  const taskData = [
    { id: 'Completed', label: 'Completed', value: completedTasks, color: '#10b981' },
    { id: 'In Progress', label: 'In Progress', value: inProgressTasks, color: '#6366f1' },
    { id: 'To Do', label: 'To Do', value: todoTasks, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const attData = [{ type: 'Attendance', Present: presentDays, Late: lateDays, Absent: absentDays }];

  return (
    <div className="space-y-6">
      {/* Hero greeting */}
      <div className="relative bg-[#0e0820] rounded-2xl p-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-violet-600/25 rounded-full blur-3xl" />
          <div className="absolute -bottom-8 left-1/4 w-48 h-48 bg-purple-600/20 rounded-full blur-2xl" />
        </div>
        <div className="relative z-10">
          <p className="text-violet-400 text-sm font-medium tracking-wide uppercase mb-1">{greet()}</p>
          <h2 className="text-2xl font-bold text-white tracking-tight">{user.name}</h2>
          <p className="text-slate-400 mt-1 text-sm">Here's your snapshot for today.</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<CheckCircle2 size={20} className="text-white" />} label="Tasks Done" value={completedTasks}
          gradient="from-emerald-500 to-teal-600" shadow="shadow-emerald-500/25" delay={0} />
        <StatCard icon={<CalendarDays size={20} className="text-white" />} label="Days Present" value={presentDays}
          gradient="from-violet-500 to-purple-600" shadow="shadow-violet-500/25" delay={0.08} />
        <StatCard icon={<Briefcase size={20} className="text-white" />} label="Leaves Taken" value={takenLeaves}
          gradient="from-rose-500 to-pink-600" shadow="shadow-rose-500/25" delay={0.16} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 h-72 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-violet-50 flex items-center justify-center">
              <ListChecks size={14} className="text-violet-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Task Overview</h3>
          </div>
          <div className="flex-1 relative">
            {taskData.length > 0 ? (
              <ResponsivePie data={taskData}
                margin={{ top: 16, right: 16, bottom: 16, left: 16 }}
                innerRadius={0.6} padAngle={2} cornerRadius={5}
                colors={{ datum: 'data.color' }}
                borderWidth={1} borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                enableArcLinkLabels={false}
                arcLabelsSkipAngle={10} arcLabelsTextColor="#ffffff"
                theme={{ tooltip: { container: { background: '#fff', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' } } }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-slate-400">No tasks assigned</div>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 h-72 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-violet-50 flex items-center justify-center">
              <CalendarDays size={14} className="text-violet-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Attendance Ratio</h3>
          </div>
          <div className="flex-1 relative">
            {(presentDays > 0 || lateDays > 0 || absentDays > 0) ? (
              <ResponsiveBar data={attData}
                keys={['Present', 'Late', 'Absent']} indexBy="type"
                margin={{ top: 10, right: 10, bottom: 40, left: 10 }}
                padding={0.3} layout="horizontal"
                colors={['#10b981', '#f59e0b', '#ef4444']}
                borderRadius={4}
                axisLeft={null}
                axisBottom={{ tickSize: 0, tickPadding: 10 }}
                enableGridY={false}
                labelSkipWidth={14} labelSkipHeight={12}
                labelTextColor="#ffffff"
                theme={{ tooltip: { container: { background: '#fff', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' } } }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-slate-400">No attendance data</div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      {(() => {
        const events: { key: string; icon: React.ReactNode; title: string; sub: string; time: string }[] = [];
        tasks.slice(0, 5).forEach(t => events.push({
          key: `t-${t.task_id}`,
          icon: <ListChecks size={14} className="text-violet-500" />,
          title: t.task_name,
          sub: `Task · ${fmtLabel(t.status)}`,
          time: t.created ?? '',
        }));
        leaves.slice(0, 3).forEach(l => events.push({
          key: `l-${l.id ?? Math.random()}`,
          icon: <FileText size={14} className="text-indigo-500" />,
          title: 'Leave request',
          sub: `${fmtLabel(l.status)} · ${l.leave_date ?? ''}`,
          time: l.leave_date ?? '',
        }));
        attendance.slice(0, 3).forEach(a => events.push({
          key: `a-${a.id ?? Math.random()}`,
          icon: <CalendarDays size={14} className="text-emerald-500" />,
          title: 'Attendance',
          sub: `${a.attendance} · ${a.date ?? ''}`,
          time: a.date ?? '',
        }));
        const sorted = events.filter(e => e.time).sort((a, b) => b.time.localeCompare(a.time)).slice(0, 7);
        if (!sorted.length) return null;
        return (
          <div className="bg-white/70 backdrop-blur-sm border border-white/60 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {sorted.map((ev, i) => (
                <motion.div key={ev.key}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  className="flex items-start gap-3"
                >
                  <div className="relative flex-shrink-0 mt-0.5">
                    <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">{ev.icon}</div>
                    {i < sorted.length - 1 && <div className="absolute left-3.5 top-7 w-px h-3 bg-slate-200" />}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm font-medium text-slate-800 truncate">{ev.title}</p>
                    <p className="text-xs text-slate-400">{ev.sub}</p>
                  </div>
                  {ev.time && <span className="text-xs text-slate-400 flex-shrink-0 pt-0.5">{timeAgo(ev.time)}</span>}
                </motion.div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
