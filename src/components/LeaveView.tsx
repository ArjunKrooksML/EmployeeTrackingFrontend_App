import React, { useState, useEffect } from 'react';
import { fmtLabel } from '../utils/format';
import { createPortal } from 'react-dom';
import { Save, Plus, X, Calendar as CalendarIcon, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { api, type Leave, type LeaveCreate } from '../lib/api';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';

type User = {
  name: string;
  employee_id?: number;
};

export default function LeaveView({ user }: { user: User }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    leave_type: 'casual',
    leave_date: new Date().toISOString().split('T')[0],
    day_type: 'full',
    reason: ''
  });

  useEffect(() => {
    fetchLeaves();
  }, [user]);

  const fetchLeaves = async () => {
    if (!user?.employee_id) return;
    setLoading(true);
    try {
      const data = await api.leaves.getMy();
      setLeaves(data || []);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.employee_id) return;
    setSubmitting(true);
    try {
      const payload: LeaveCreate = {
        leave_type: formData.leave_type,
        leave_date: formData.leave_date,
        day_type: formData.day_type,
        reason: formData.reason,
      };
      await api.leaves.request(payload);
      setShowModal(false);
      setFormData({
        leave_type: 'casual', leave_date: new Date().toISOString().split('T')[0], day_type: 'full', reason: ''
      });
      fetchLeaves();
      toast.success('Leave request submitted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to request leave');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (leave: Leave) => {
    if (!user?.employee_id || !leave.id) return;
    const ok = await confirm({ message: 'Cancel this leave request?', confirmLabel: 'Cancel Leave', danger: true });
    if (!ok) return;
    setCancelling(leave.id);
    try {
      await api.leaves.cancel(leave.id);
      fetchLeaves();
      toast.success('Leave request cancelled');
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel leave');
    } finally {
      setCancelling(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-emerald-800';
      case 'rejected': return 'bg-rose-100 text-rose-800';
      default: return 'bg-amber-100 text-amber-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800">Leaves</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your time off requests</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 transition-all shadow-violet-600/20 shadow-lg active:scale-95"
        >
          <Plus size={18} />
          <span>Request Leave</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600"></div>
        </div>
      ) : leaves.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="h-16 w-16 bg-violet-50 text-violet-500 rounded-full flex items-center justify-center mb-4">
            <CalendarIcon size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">No leave requests</h3>
          <p className="text-sm text-slate-500 max-w-sm">You haven't requested any leaves yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {leaves.map((leave) => (
            <div key={leave.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className={`absolute top-0 left-0 w-1.5 h-full ${leave.status === 'approved' ? 'bg-emerald-500' : leave.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-800 select-none">{fmtLabel(leave.leave_type)} Leave</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                    <CalendarIcon size={14} className="text-slate-400" />
                    {new Date(leave.leave_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(leave.status)}`}>
                  {fmtLabel(leave.status)}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                  <Clock size={14} className="text-violet-500" />
                  <span>{fmtLabel(leave.day_type)}</span>
                </div>
                {leave.reason && (
                  <div className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                    <AlertCircle size={14} className="text-violet-500 shrink-0 mt-0.5" />
                    <span className="truncate">{leave.reason}</span>
                  </div>
                )}
                {leave.status !== 'rejected' && (
                  <button
                    onClick={() => handleCancel(leave)}
                    disabled={cancelling === leave.id}
                    className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {cancelling === leave.id
                      ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-300 border-t-rose-600" />
                      : <Trash2 size={13} />}
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">Request Leave</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Leave Type</label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                >
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="emergency">Emergency Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date</label>
                <input
                  type="date"
                  required
                  value={formData.leave_date}
                  onChange={(e) => setFormData({ ...formData, leave_date: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Duration</label>
                <select
                  value={formData.day_type}
                  onChange={(e) => setFormData({ ...formData, day_type: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                >
                  <option value="full">Full Day</option>
                  <option value="first_half">First Half</option>
                  <option value="second_half">Second Half</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason (Optional)</label>
                <textarea
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Provide any additional details..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 transition-all shadow-violet-600/20 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
                >
                  {submitting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  ) : (
                     <>
                      <Save size={18} />
                      <span>Submit Request</span>
                     </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
