import { useState, useEffect } from 'react';
import { api, type Task, type Attendance, type Leave } from '../lib/api';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import { Briefcase, ListChecks, CalendarDays, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  user: any;
}

export default function Dashboard({ user }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          api.tasks?.getEmployeeTasks?.(user.name) || Promise.resolve([]),
          api.attendance?.getMyAttendance?.(user.employee_id || 0) || Promise.resolve([]),
          api.leaves?.getByEmployee?.(user.employee_id || 0) || Promise.resolve([])
        ]);
        setTasks(results[0].status === 'fulfilled' ? (results[0].value || []) : []);
        setAttendance(results[1].status === 'fulfilled' ? (results[1].value || []) : []);
        setLeaves(results[2].status === 'fulfilled' ? (results[2].value || []) : []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user && user.name && user.employee_id) {
      fetchDashboardData();
    }
  }, [user]);

  // Task Stats
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const todoTasks = tasks.filter(t => t.status === 'To Do').length;

  const taskData = [
    { id: 'Completed', label: 'Completed', value: completedTasks, color: '#10b981' },
    { id: 'In Progress', label: 'In Progress', value: inProgressTasks, color: '#f59e0b' },
    { id: 'To Do', label: 'To Do', value: todoTasks, color: '#6366f1' },
  ].filter(d => d.value > 0);

  // Attendance Stats
  const presentDays = attendance.filter(a => a.attendance === 'present').length;
  const lateDays = attendance.filter(a => a.attendance === 'late').length;
  const absentDays = attendance.filter(a => a.attendance === 'absent').length;

  const attData = [
    {
      type: "Attendance",
      Present: presentDays,
      Late: lateDays,
      Absent: absentDays,
    }
  ];

  // Leaves Summary
  const takenLeaves = leaves.filter(l => l.status === 'approved').length;
  const pendingLeavesCount = leaves.filter(l => l.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-violet-600">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-violet-200 border-t-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold">Good Morning, {user.name}!</h2>
          <p className="text-violet-100 mt-1 opacity-90">Here is your snapshot for today.</p>
        </div>
        <div className="absolute -right-8 -top-8 opacity-10 pointer-events-none">
          <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12 4.5C16.1421 4.5 19.5 7.85786 19.5 12C19.5 16.1421 16.1421 19.5 12 19.5C7.85786 19.5 4.5 16.1421 4.5 12C4.5 7.85786 7.85786 4.5 12 4.5Z" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border text-center border-slate-100 p-4 rounded-xl shadow-sm hover:shadow-md transition">
          <div className="h-10 w-10 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
            <CheckCircle2 size={20} />
          </div>
          <p className="text-xl font-bold text-slate-800">{completedTasks}</p>
          <p className="text-xs text-slate-500 font-medium">Tasks Completed</p>
        </div>
        <div className="bg-white border text-center border-slate-100 p-4 rounded-xl shadow-sm hover:shadow-md transition">
          <div className="h-10 w-10 mx-auto bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mb-2">
            <CalendarDays size={20} />
          </div>
          <p className="text-xl font-bold text-slate-800">{presentDays}</p>
          <p className="text-xs text-slate-500 font-medium">Days Present</p>
        </div>
        <div className="bg-white border text-center border-slate-100 p-4 rounded-xl shadow-sm hover:shadow-md transition">
          <div className="h-10 w-10 mx-auto bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-2">
            <Briefcase size={20} />
          </div>
          <p className="text-xl font-bold text-slate-800">{takenLeaves}</p>
          <p className="text-xs text-slate-500 font-medium">Leaves Taken</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-5 h-80 flex flex-col">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-2">
            <ListChecks size={18} className="text-violet-500" />
            Task Overview
          </h3>
          <div className="flex-1 w-full h-full relative">
            {taskData.length > 0 ? (
              <ResponsivePie
                data={taskData}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                innerRadius={0.6}
                padAngle={1.5}
                cornerRadius={5}
                colors={{ datum: 'data.color' }}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                enableArcLinkLabels={false}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor="#ffffff"
                theme={{
                  tooltip: { container: { background: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' } }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-slate-400">No tasks assigned</div>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-5 h-80 flex flex-col">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-2">
            <CalendarDays size={18} className="text-violet-500" />
            Attendance Ratio
          </h3>
          <div className="flex-1 w-full h-full relative">
            {(presentDays > 0 || lateDays > 0 || absentDays > 0) ? (
              <ResponsiveBar
                data={attData}
                keys={['Present', 'Late', 'Absent']}
                indexBy="type"
                margin={{ top: 10, right: 10, bottom: 40, left: 10 }}
                padding={0.3}
                layout="horizontal"
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={['#10b981', '#f59e0b', '#ef4444']}
                borderRadius={4}
                axisLeft={null}
                axisBottom={{
                  tickSize: 0,
                  tickPadding: 10,
                  tickRotation: 0,
                }}
                enableGridY={false}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor="#ffffff"
                theme={{
                  tooltip: { container: { background: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' } }
                }}
              />
            ) : (
                <div className="flex items-center justify-center h-full text-sm text-slate-400">No attendance data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
