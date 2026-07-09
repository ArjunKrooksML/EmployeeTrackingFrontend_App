import { useState, useEffect } from 'react';
import { api, type SalaryDeduction } from '../lib/api';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PayslipPDF from './PayslipPDF';
import { FileDown, Wallet } from 'lucide-react';
import { MONTHS } from '../utils/helpers';

function fmt(n: number) {
  return 'Rs. ' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PayrollView() {
  const [payslips, setPayslips] = useState<SalaryDeduction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.salary.getMy()
      .then(setPayslips)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-800">My Payslips</h2>
        <p className="text-sm text-gray-500 mt-1">Download your monthly salary statements</p>
      </div>

      {payslips.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Wallet size={44} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium text-gray-500">No payslips yet</p>
          <p className="text-sm mt-1">Your payslips will appear here once the admin processes them.</p>
        </div>
      ) : (
        payslips.map(p => (
          <div key={`${p.year}-${p.month}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="font-semibold text-gray-900">{MONTHS[p.month - 1]} {p.year}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.working_days} working days</p>
              </div>
              <PDFDownloadLink
                document={<PayslipPDF result={p} />}
                fileName={`payslip-${MONTHS[p.month - 1]}-${p.year}.pdf`}
              >
                {({ loading: pdfLoading }) => (
                  <button
                    disabled={pdfLoading}
                    className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white rounded-xl text-xs font-semibold hover:bg-violet-700 disabled:opacity-50 transition"
                  >
                    <FileDown size={14} />
                    {pdfLoading ? 'Preparing…' : 'Download PDF'}
                  </button>
                )}
              </PDFDownloadLink>
            </div>

            {/* Salary summary tiles */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 px-0">
              <div className="px-5 py-4 text-center">
                <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Gross</p>
                <p className="text-base font-bold text-gray-800 mt-1">{fmt(p.gross_salary)}</p>
              </div>
              <div className="px-5 py-4 text-center">
                <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Deductions</p>
                <p className="text-base font-bold text-red-600 mt-1">{fmt(p.total_deduction)}</p>
              </div>
              <div className="px-5 py-4 text-center">
                <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Net Pay</p>
                <p className="text-base font-bold text-emerald-600 mt-1">{fmt(p.net_salary)}</p>
              </div>
            </div>

            {/* Breakdown details */}
            <div className="px-5 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Lates', val: p.lates_count, cls: p.lates_count > 0 ? 'text-amber-600' : 'text-gray-400' },
                { label: 'Full Absents', val: p.full_absents, cls: p.full_absents > 0 ? 'text-red-600' : 'text-gray-400' },
                { label: 'Half Days', val: p.half_day_absents, cls: p.half_day_absents > 0 ? 'text-amber-600' : 'text-gray-400' },
                { label: 'Free Leave Used', val: p.paid_leave_used ? 'Yes' : 'No', cls: p.paid_leave_used ? 'text-emerald-600' : 'text-gray-400' },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl px-3 py-2">
                  <p className="text-[10px] text-gray-400">{item.label}</p>
                  <p className={`text-sm font-semibold mt-0.5 ${item.cls}`}>{item.val}</p>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
