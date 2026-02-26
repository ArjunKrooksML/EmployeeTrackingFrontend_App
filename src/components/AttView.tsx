import { useState, useEffect } from 'react';
import { api, type Attendance } from '../lib/api';

type User = {
  employee_id?: number;
  name: string;
  [key: string]: any;
};

interface AttViewProps {
  user: User;
}

type AttMap = Record<string, Attendance>;

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function keyOf(d: Date) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const mm = m < 10 ? `0${m}` : String(m);
  const dd = day < 10 ? `0${day}` : String(day);
  return `${y}-${mm}-${dd}`;
}

function fromKey(k: string) {
  const [ys, ms, ds] = k.split('-');
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  if (!y || !m || !d) return new Date(k);
  return new Date(y, m - 1, d);
}

function AttView({ user }: AttViewProps) {
  const today = new Date();
  const [y, setY] = useState(today.getFullYear());
  const [m, setM] = useState(today.getMonth());
  const [data, setData] = useState<AttMap>({});
  const [sel, setSel] = useState<string>(keyOf(today));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user.employee_id) {
      fetchAttendance(user.employee_id);
    }
  }, [user.employee_id]);

  const fetchAttendance = async (empId: number) => {
    setLoading(true);
    try {
      const res = await api.attendance.getMyAttendance(empId);
      const map: AttMap = {};
      res.forEach(r => {
        // Ensure date is in YYYY-MM-DD format for the key
        const dateKey = typeof r.date === 'string' ? r.date.split('T')[0] : String(r.date).split('T')[0];
        map[dateKey] = r;
      });
      setData(map);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const onCheck = async () => {
    if (!user.employee_id) {
      console.error('User object:', user);
      alert('Employee ID not found. Please log out and log in again with your email and password.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.attendance.checkIn(user.employee_id);
      // Ensure date is in YYYY-MM-DD format for the key
      const dateKey = typeof res.date === 'string' ? res.date.split('T')[0] : String(res.date).split('T')[0];
      setData(prev => ({ ...prev, [dateKey]: res }));
      setSel(dateKey);
      // Refresh the attendance list to get updated data
      await fetchAttendance(user.employee_id);
    } catch (error: any) {
      console.error('Check-in error:', error);
      const errorMessage = error?.message || 'Failed to check in. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onMonth = (dir: -1 | 1) => {
    const d = new Date(y, m + dir, 1);
    setY(d.getFullYear());
    setM(d.getMonth());
  };

  const start = new Date(y, m, 1);
  const firstDay = start.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  const cells: { label: number; k: string; d: Date }[] = [];
  for (let i = 1; i <= daysInMonth; i += 1) {
    const d = new Date(y, m, i);
    cells.push({ label: i, k: keyOf(d), d });
  }

  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const selRecord = data[sel];
  const selDate = fromKey(sel);
  const selTime = selRecord?.checkin 
    ? (typeof selRecord.checkin === 'string' ? selRecord.checkin.slice(0, 5) : String(selRecord.checkin).slice(0, 5))
    : null;

  const getStatusText = (rec: Attendance) => {
    // If status is present, show "Under Review" unless explicitly confirmed? 
    // Since we can't distinguish, we assume 'present' means "Present" but show "Under Review" as requested for unmarked.
    // Assuming 'present' is the default.
    if (rec.attendance === 'present') return 'Present (Under Review)';
    return rec.attendance.charAt(0).toUpperCase() + rec.attendance.slice(1);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20 }}>Attendance</h2>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>Log your check-in for the day.</p>
        </div>
        {!data[keyOf(today)] && (
          <button 
            type="button" 
            onClick={onCheck}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Checking in...' : 'Check in'}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <button type="button" onClick={() => onMonth(-1)} className="p-1 hover:bg-slate-100 rounded">
          ◀
        </button>
        <div style={{ fontWeight: 600 }}>
          {start.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
        </div>
        <button type="button" onClick={() => onMonth(1)} className="p-1 hover:bg-slate-100 rounded">
          ▶
        </button>
      </div>

      <div className="cal-grid">
        {days.map(d => (
          <div key={d} className="cal-day">
            {d}
          </div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {cells.map(c => {
          const has = Boolean(data[c.k]);
          const t = fromKey(c.k).getTime();
          const isFuture = t > todayMid;
          let cls = 'cal-cell cal-future';
          if (!isFuture) {
            if (has) {
                const status = data[c.k].attendance;
                if (status === 'present') cls = 'cal-cell cal-present';
                else if (status === 'absent') cls = 'cal-cell cal-absent';
                else cls = 'cal-cell cal-late'; // late
            } else {
                cls = 'cal-cell cal-absent'; // No record = absent? Or just empty? Existing code used 'cal-absent' for !has
                // Wait, if no record and in past, it's absent.
            }
          }
          // Highlight selected
          if (c.k === sel) cls += ' ring-2 ring-blue-500 ring-offset-2';
          
          return (
            <button key={c.k} type="button" className={cls} onClick={() => setSel(c.k)}>
              {c.label}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 16, fontSize: 14 }}>
        <div style={{ marginBottom: 4, fontWeight: 500 }}>Selected day</div>
        <div style={{ marginBottom: 2 }}>
          {selDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
        </div>
        <div style={{ color: '#64748b' }}>
          {selRecord ? (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-700">Time:</span>
                    <span>{selTime || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700">Status:</span>
                    <span className={`font-medium ${
                        selRecord.attendance === 'present' ? 'text-yellow-600' : 
                        selRecord.attendance === 'absent' ? 'text-red-600' : 'text-orange-600'
                    }`}>
                        {getStatusText(selRecord)}
                    </span>
                </div>
              </div>
          ) : (
            'No check-in recorded.'
          )}
        </div>
      </div>
    </div>
  );
}

export default AttView;
