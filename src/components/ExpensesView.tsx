import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Paperclip, X, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import type { ExpenseResp, ExpItem } from '../lib/api';
import { useToast } from './Toast';
import { expBadge } from '../utils/helpers';

const calcTotal = (items: ExpItem[]) => items.reduce((s, i) => s + Number(i.amount || 0), 0);

type FormItem = { description: string; amount: string; date: string };
type StatusTab = 'all' | 'pending' | 'approved' | 'rejected';
const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export default function ExpensesView() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [expenses, setExpenses] = useState<ExpenseResp[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
  const [detailExp, setDetailExp] = useState<ExpenseResp | null>(null);
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState('');
  const [multiDay, setMultiDay] = useState(false);
  const [items, setItems] = useState<FormItem[]>([{ description: '', amount: '', date: new Date().toISOString().slice(0, 10) }]);
  const [files, setFiles] = useState<File[]>([]);

  const load = () => {
    setLoading(true);
    api.expenses.mine()
      .then(setExpenses)
      .catch(() => toast.error('Failed to load expenses'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const today = new Date().toISOString().slice(0, 10);
  const resetForm = () => {
    setTitle('');
    setDate(today);
    setDateTo('');
    setMultiDay(false);
    setItems([{ description: '', amount: '', date: today }]);
    setFiles([]);
    if (fileRef.current) fileRef.current.value = ''; // clear native input too
  };

  const addItem = () => setItems(prev => [...prev, { description: '', amount: '', date: date }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof FormItem, val: string) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const toggleMultiDay = (on: boolean) => {
    setMultiDay(on);
    if (!on) setDateTo('');
  };

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error('Title is required');
    if (multiDay && !dateTo) return toast.error('Please set an end date');
    if (multiDay && dateTo < date) return toast.error('End date must be after start date');
    if (items.some(it => !it.description.trim() || !it.amount)) return toast.error('Fill all expense items');
    if (files.length === 0) return toast.error('Please attach at least one document');
    const totalBytes = files.reduce((s, f) => s + f.size, 0);
    if (totalBytes > 25 * 1024 * 1024) return toast.error('Total attachments exceed 25 MB');
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('title', title.trim());
      form.append('date', date);
      if (multiDay && dateTo) form.append('date_to', dateTo);
      form.append('items', JSON.stringify(items.map(it => ({
        description: it.description.trim(),
        amount: parseFloat(it.amount),
        ...(multiDay ? { date: it.date } : {}),
      }))));
      files.forEach(f => form.append('files', f));
      await api.expenses.create(form);
      toast.success('Expense filed successfully');
      resetForm();
      setView('list');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to file expense');
    } finally {
      setSubmitting(false);
    }
  };

  const counts = {
    all: expenses.length,
    pending: expenses.filter(e => e.status === 'pending').length,
    approved: expenses.filter(e => e.status === 'approved').length,
    rejected: expenses.filter(e => e.status === 'rejected').length,
  };
  const visible = activeTab === 'all' ? expenses : expenses.filter(e => e.status === activeTab);

  const ExpCard = ({ e }: { e: ExpenseResp }) => (
    <div
      onClick={() => { setDetailExp(e); setView('detail'); }}
      className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 cursor-pointer transition"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 truncate">{e.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            {e.date_to && ` → ${new Date(e.date_to).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {expBadge(e.status)}
          <span className="text-sm font-semibold text-slate-800">₹{calcTotal(e.items).toLocaleString('en-IN')}</span>
        </div>
      </div>
      {(e.attachments?.length ?? 0) > 0 && (
        <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
          <Paperclip size={11} /> {e.attachments!.length} attachment{e.attachments!.length > 1 ? 's' : ''}
        </div>
      )}
      {e.remarks && (
        <p className="text-xs text-slate-500 mt-2 bg-slate-50 rounded px-2 py-1 italic">{e.remarks}</p>
      )}
    </div>
  );


  // ── Form view ──────────────────────────────────────────────────────────
  if (view === 'form') return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => { setView('list'); resetForm(); }}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="h-4 w-px bg-slate-300" />
        <h2 className="text-lg font-bold text-slate-800">File Expense Statement</h2>
      </div>

      <div className="space-y-5 max-w-lg">

        {/* Title + Date row */}
        <div className={`grid gap-3 items-end ${multiDay ? 'grid-cols-[1fr_1fr_1fr_auto]' : 'grid-cols-[1fr_1fr_auto]'}`}>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Title <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Site visit"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{multiDay ? 'From' : 'Date'} <span className="text-red-400">*</span></label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
          {multiDay && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">To <span className="text-red-400">*</span></label>
              <input type="date" value={dateTo} min={date} onChange={e => setDateTo(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
          )}
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-500 select-none pb-2.5">
            <input type="checkbox" checked={multiDay} onChange={e => toggleMultiDay(e.target.checked)}
              className="w-3.5 h-3.5 accent-violet-600 cursor-pointer" />
            Multiple days
          </label>
        </div>

        {/* Expense items */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-2">Expense Items <span className="text-red-400">*</span></label>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            {/* Header */}
            <div className={`grid ${multiDay ? 'grid-cols-[140px_1fr_110px_36px]' : 'grid-cols-[1fr_110px_36px]'} gap-0 bg-slate-50 border-b border-slate-200 px-3 py-2 text-xs font-medium text-slate-500`}>
              {multiDay && <span>Date</span>}
              <span>Description</span><span>Amount (₹)</span><span />
            </div>
            {/* Rows */}
            <div className="divide-y divide-slate-100">
              {items.map((item, i) => (
                <div key={i} className={`grid ${multiDay ? 'grid-cols-[140px_1fr_110px_36px]' : 'grid-cols-[1fr_110px_36px]'} gap-0 items-center`}>
                  {multiDay && (
                    <input
                      type="date"
                      value={item.date}
                      min={date}
                      max={dateTo || undefined}
                      onChange={e => updateItem(i, 'date', e.target.value)}
                      className="px-2 py-2.5 text-sm border-0 border-r border-slate-100 focus:outline-none focus:bg-violet-50/50 w-full"
                    />
                  )}
                  <input
                    type="text"
                    value={item.description}
                    onChange={e => updateItem(i, 'description', e.target.value)}
                    placeholder="e.g. Travel"
                    className="px-3 py-2.5 text-sm border-0 focus:outline-none focus:bg-violet-50/50 w-full"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.amount}
                    onChange={e => updateItem(i, 'amount', e.target.value)}
                    placeholder="0.00"
                    className="px-3 py-2.5 text-sm border-0 border-l border-slate-100 focus:outline-none focus:bg-violet-50/50 w-full"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                    className="flex items-center justify-center h-full border-l border-slate-100 text-slate-300 hover:text-red-400 disabled:opacity-0 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            {/* Footer */}
            <div className="flex items-center justify-between bg-slate-50 border-t border-slate-200 px-3 py-2">
              <button type="button" onClick={addItem}
                className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-medium transition">
                <Plus size={13} /> Add Item
              </button>
              <span className="text-sm font-semibold text-slate-700">
                Total: ₹{items.reduce((s, it) => s + parseFloat(it.amount || '0'), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Attachments */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-600">Attachments <span className="text-red-400">*</span></label>
            <span className="text-xs text-slate-400">Max 25 MB total</span>
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
            onChange={e => {
              const picked = Array.from(e.target.files || []);
              if (picked.length === 0) return;
              setFiles(prev => {
                const existing = new Set(prev.map(f => f.name + f.size));
                return [...prev, ...picked.filter(f => !existing.has(f.name + f.size))];
              });
              e.target.value = '';
            }}
          />
          {files.length === 0 ? (
            <div
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-1.5 w-full py-5 border-2 border-dashed border-slate-300 hover:border-violet-400 hover:bg-slate-50 rounded-xl cursor-pointer transition select-none">
              <Paperclip size={18} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Click to upload receipts or documents</span>
              <span className="text-xs text-slate-400">Images, PDF, Word, Excel · select multiple at once or add one by one</span>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                  <Paperclip size={13} className="text-violet-400 shrink-0" />
                  <span className="flex-1 text-sm text-slate-700 truncate">{f.name}</span>
                  <span className="text-xs text-slate-400 shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                  <button type="button" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-slate-300 hover:text-red-400 transition shrink-0">
                    <X size={13} />
                  </button>
                </div>
              ))}
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-t border-slate-200">
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="text-xs text-violet-600 hover:text-violet-800 font-medium transition">
                  + Add more
                </button>
                <span className="text-xs text-slate-400">
                  {(files.reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(1)} MB / 25 MB
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={() => { setView('list'); resetForm(); }}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition">
            {submitting ? 'Submitting…' : 'Submit Expense'}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Detail view ────────────────────────────────────────────────────────
  if (view === 'detail' && detailExp) return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setView('list')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="h-4 w-px bg-slate-300" />
        <div>
          <h2 className="text-lg font-bold text-slate-800">{detailExp.title}</h2>
          <p className="text-xs text-slate-500">
            {new Date(detailExp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            {detailExp.date_to && ` → ${new Date(detailExp.date_to).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`}
          </p>
        </div>
        <div className="ml-2">{expBadge(detailExp.status)}</div>
      </div>

      <div className="space-y-5 max-w-lg">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Expense Items</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500">
                {detailExp.date_to && <th className="px-3 py-1.5 text-left font-medium">Date</th>}
                <th className="px-3 py-1.5 text-left rounded-tl font-medium">Description</th>
                <th className="px-3 py-1.5 text-right rounded-tr font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {detailExp.items.map((item, i) => (
                <tr key={i}>
                  {detailExp.date_to && (
                    <td className="px-3 py-2 text-slate-500 text-xs whitespace-nowrap">
                      {item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                    </td>
                  )}
                  <td className="px-3 py-2 text-slate-700">{item.description}</td>
                  <td className="px-3 py-2 text-right font-medium">₹{Number(item.amount).toLocaleString('en-IN')}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-semibold">
                <td className="px-3 py-2 text-slate-700 rounded-bl">Total</td>
                <td className="px-3 py-2 text-right text-slate-800 rounded-br">₹{calcTotal(detailExp.items).toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {(detailExp.attachments?.length ?? 0) > 0 && (
          <div className="space-y-1">
            {detailExp.attachments!.map((a, i) => (
              <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800 transition truncate">
                <Paperclip size={14} className="shrink-0" /> {a.name}
              </a>
            ))}
          </div>
        )}

        {detailExp.remarks && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Remarks</p>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">{detailExp.remarks}</p>
          </div>
        )}
      </div>
    </div>
  );

  // ── List view ──────────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800">My Expenses</h2>
          <p className="text-sm text-slate-500 mt-0.5">{expenses.length} total submissions</p>
        </div>
        <button
          onClick={() => setView('form')}
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
        >
          <Plus size={15} /> File Expense
        </button>
      </div>

      <div className="flex gap-1 mb-5 border-b border-slate-200">
        {STATUS_TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
              ${activeTab === t.key
                ? 'text-violet-600 border-b-2 border-violet-600 -mb-px bg-white'
                : 'text-slate-500 hover:text-slate-800'}`}>
            {t.label}
            {counts[t.key] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium
                ${activeTab === t.key ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'}`}>
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-slate-400">Loading…</div>
      ) : visible.length === 0 ? (
        <div className="flex justify-center py-16 text-slate-400 text-sm">
          No {activeTab === 'all' ? '' : activeTab} expenses
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map(e => <ExpCard key={e.id} e={e} />)}
        </div>
      )}
    </div>
  );
}
