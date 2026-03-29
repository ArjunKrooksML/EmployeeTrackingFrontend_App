import { useState, useEffect } from 'react';
import { api, type Attendance } from '../../lib/api';
import { MapPin } from 'lucide-react';

type AttRow = Attendance & { employee_name: string };

export default function AllAtt() {
  const [rows, setRows] = useState<AttRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setRows(await api.attendance.getAll() as AttRow[]); }
    catch { /* silent */ }
    finally { setLoading(false); }
  }

  const filtered = rows.filter(r =>
    r.employee_name.toLowerCase().includes(search.toLowerCase()) ||
    r.date.includes(search)
  );

  const statusColor: Record<string, string> = {
    present: 'text-green-600 bg-green-50',
    absent: 'text-red-600 bg-red-50',
    late: 'text-orange-600 bg-orange-50',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-800">All Attendance</h2>
        <span className="text-xs text-slate-400">Read only</span>
      </div>

      <input
        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm mb-4"
        placeholder="Search by name or date…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      <div className="space-y-2">
        {filtered.map(r => (
          <div key={r.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm text-slate-800">{r.employee_name}</div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColor[r.attendance] || ''}`}>
                {r.attendance}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              <span>{r.date}</span>
              {r.checkin && <span>⏰ {String(r.checkin).slice(0, 5)}</span>}
              {r.lat && r.lng && (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${r.lat}&mlon=${r.lng}&zoom=16`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-blue-500 hover:underline"
                >
                  <MapPin size={11} /> Location
                </a>
              )}
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">No records found.</p>
        )}
      </div>
    </div>
  );
}
