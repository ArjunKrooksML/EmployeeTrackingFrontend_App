import { useState, useEffect } from 'react';
import { api, type Attendance } from '../lib/api';
import { MapPin } from 'lucide-react';

type User = { employee_id?: number; name: string; [key: string]: any };
type AttMap = Record<string, Attendance>;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toKey(d: Date) {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${d.getFullYear()}-${m < 10 ? '0' + m : m}-${day < 10 ? '0' + day : day}`;
}

function fromKey(k: string) {
  const [y, m, d] = k.split('-').map(Number);
  if (!y || !m || !d) return new Date(k);
  return new Date(y, m - 1, d);
}

function getGps(): Promise<{ lat: number; lng: number } | null> {
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { timeout: 8000 }
    );
  });
}

export default function AttView({ user }: { user: User }) {
  const today = new Date();
  const [y, setY] = useState(today.getFullYear());
  const [m, setM] = useState(today.getMonth());
  const [data, setData] = useState<AttMap>({});
  const [sel, setSel] = useState(toKey(today));
  const [loading, setLoading] = useState(false);
  const [locMsg, setLocMsg] = useState('');

  useEffect(() => {
    if (user.employee_id) load(user.employee_id);
  }, [user.employee_id]);

  async function load(id: number) {
    setLoading(true);
    try {
      const rows = await api.attendance.getMyAttendance(id);
      const map: AttMap = {};
      rows.forEach(r => { map[String(r.date).split('T')[0]] = r; });
      setData(map);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function onCheck() {
    if (!user.employee_id) {
      alert('Employee ID missing. Please log in again.');
      return;
    }
    try {
      setLoading(true);
      setLocMsg('Getting location…');
      const pos = await getGps();
      if (pos) {
        setLocMsg('📍 Location captured');
      } else {
        setLocMsg('⚠ Location unavailable — check-in recorded without GPS');
      }
      const res = await api.attendance.checkIn(user.employee_id, pos?.lat, pos?.lng);
      const k = String(res.date).split('T')[0];
      setData(prev => ({ ...prev, [k]: res }));
      setSel(k);
      await load(user.employee_id);
    } catch (e: any) {
      alert(e?.message || 'Check-in failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const onMonth = (dir: -1 | 1) => {
    const nd = new Date(y, m + dir, 1);
    setY(nd.getFullYear());
    setM(nd.getMonth());
  };

  const start = new Date(y, m, 1);
  const firstDay = start.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(y, m, i + 1);
    return { label: i + 1, k: toKey(d) };
  });

  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const selRec = data[sel];
  const selTime = selRec?.checkin ? String(selRec.checkin).slice(0, 5) : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20 }}>Attendance</h2>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>Log your check-in for the day.</p>
        </div>
        {!data[toKey(today)] && (
          <button
            type="button"
            onClick={onCheck}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Checking in…' : 'Check in'}
          </button>
        )}
      </div>

      {locMsg && (
        <div className="mb-3 text-sm px-3 py-2 rounded-lg bg-slate-100 text-slate-700 flex items-center gap-2">
          <MapPin size={14} />
          {locMsg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <button type="button" onClick={() => onMonth(-1)} className="p-1 hover:bg-slate-100 rounded">◀</button>
        <div style={{ fontWeight: 600 }}>
          {start.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
        </div>
        <button type="button" onClick={() => onMonth(1)} className="p-1 hover:bg-slate-100 rounded">▶</button>
      </div>

      <div className="cal-grid">
        {DAYS.map(d => <div key={d} className="cal-day">{d}</div>)}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
        {cells.map(c => {
          const rec = data[c.k];
          const isFuture = fromKey(c.k).getTime() > todayMid;
          let cls = 'cal-cell cal-future';
          if (!isFuture) {
            if (rec) {
              cls = rec.attendance === 'present' ? 'cal-cell cal-present'
                : rec.attendance === 'absent' ? 'cal-cell cal-absent'
                : rec.attendance === 'pending' ? 'cal-cell cal-pending'
                : 'cal-cell cal-late';
            } else {
              cls = 'cal-cell cal-absent';
            }
          }
          if (c.k === sel) cls += ' ring-2 ring-blue-500 ring-offset-2';
          return (
            <button key={c.k} type="button" className={cls} onClick={() => setSel(c.k)}>
              {c.label}
              {rec?.lat && <span style={{ fontSize: 7, display: 'block' }}>📍</span>}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 16, fontSize: 14 }}>
        <div style={{ marginBottom: 4, fontWeight: 500 }}>
          {fromKey(sel).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
        </div>
        {selRec ? (
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700">Time:</span>
              <span>{selTime || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700">Status:</span>
              <span className={`font-medium ${
                selRec.attendance === 'present' ? 'text-green-600'
                : selRec.attendance === 'absent' ? 'text-red-600'
                : selRec.attendance === 'pending' ? 'text-yellow-600'
                : 'text-orange-600'
              }`}>
                {selRec.attendance === 'pending' ? 'Under Review'
                  : selRec.attendance.charAt(0).toUpperCase() + selRec.attendance.slice(1)}
              </span>
            </div>
            {selRec.lat && selRec.lng && (
              <div className="flex items-center gap-2 pt-1">
                <MapPin size={14} className="text-blue-500" />
                <a
                  href={`https://www.openstreetmap.org/?mlat=${selRec.lat}&mlon=${selRec.lng}&zoom=16`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline text-xs"
                >
                  View location on map
                </a>
              </div>
            )}
          </div>
        ) : (
          <span className="text-slate-500">No check-in recorded.</span>
        )}
      </div>
    </div>
  );
}
