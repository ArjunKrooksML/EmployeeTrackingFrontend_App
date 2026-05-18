import { useState, type FormEvent } from 'react';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import ForgotPasswordModal from './ForgotPasswordModal';

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
  designation_id?: number;
  year_joined?: string;
  salary?: number;
};

type Props = { onLogin: (u: User) => void };

const PERKS = ['Check in with GPS', 'View your payslips', 'Request leaves', 'Track your tasks'];

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!email || !pass) { setErr('Enter email and password.'); return; }
    setLoading(true);
    try {
      const { api } = await import('../lib/api');
      const res = await api.auth.login(email, pass);
      const emp = res.user;
      onLogin({
        name: emp.employee_name,
        email: emp.email,
        employee_id: emp.employee_id,
        role: emp.role ?? undefined,
        dob: emp.dob,
        address: emp.address,
        phone_no: emp.phone_no,
        id_type: emp.id_type,
        id_number: emp.id_number,
        designation_id: emp.designation_id ?? undefined,
        year_joined: emp.year_joined ?? undefined,
        salary: emp.salary,
      });
    } catch (error: any) {
      setErr(error?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Mobile dark background with orbs */}
      <div className="lg:hidden absolute inset-0 bg-[#0e0820] overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[400px] h-[400px] bg-violet-600/30 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-0 w-72 h-72 bg-purple-600/20 rounded-full blur-[80px]" />
        <div className="absolute -bottom-24 left-1/4 w-64 h-64 bg-indigo-700/25 rounded-full blur-[80px]" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
      </div>

      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative bg-[#0e0820] overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-violet-600/30 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[80px]" />
          <div className="absolute -bottom-24 left-1/4 w-80 h-80 bg-indigo-700/25 rounded-full blur-[80px]" />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <img src="/svaas.png" alt="SVAAS" className="h-9 w-9 rounded-xl object-cover border border-white/20 shadow-lg" />
            <span className="text-white font-semibold text-base tracking-tight">SVAAS Inframax Solutions</span>
          </div>

          <div className="space-y-5">
            <h1 className="text-5xl font-bold text-white leading-[1.15] tracking-tight">
              Your workspace,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400">
                always with you
              </span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
              Stay connected with your team, track your attendance, and manage your work from anywhere.
            </p>
            <div className="flex flex-col gap-2.5 pt-2">
              {PERKS.map((p, i) => (
                <div key={p} className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-violet-500/30 border border-violet-400/40 flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-slate-300 text-sm" style={{ animationDelay: `${i * 0.05}s` }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <div className="bg-white/6 backdrop-blur-sm border border-white/10 rounded-2xl p-5 max-w-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-violet-500/30 border border-violet-400/30 flex items-center justify-center">
                <span className="text-violet-300 text-xs font-bold">E</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Employee Portal</p>
                <p className="text-slate-500 text-xs">Your personal workspace</p>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Check in, view your payslips, apply for leaves and track your assigned tasks — all in one app.
            </p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6 lg:bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <img src="/svaas.png" alt="SVAAS" className="h-11 w-11 rounded-xl object-cover border border-white/20 shadow-lg" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">SVAAS Inframax Solutions</h1>
            <p className="text-violet-300 text-sm mt-1">Employee Portal</p>
          </div>

          {/* Form card — white card on mobile, transparent on desktop */}
          <div className="bg-white rounded-2xl p-7 shadow-2xl border border-white/5 lg:bg-transparent lg:rounded-none lg:shadow-none lg:border-none lg:p-0">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
              <p className="text-slate-500 mt-1 text-sm">Sign in to your employee account</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <div className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-3.5 py-2.5 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all bg-slate-50 focus-within:bg-white">
                  <Mail className="text-slate-400 flex-shrink-0" size={16} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full outline-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400"
                    placeholder="you@company.com" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <div className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-3.5 py-2.5 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all bg-slate-50 focus-within:bg-white">
                  <Lock className="text-slate-400 flex-shrink-0" size={16} />
                  <input type={showPassword ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)} required
                    className="w-full outline-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400"
                    placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="button" onClick={() => setShowForgot(true)}
                  className="text-sm text-violet-600 hover:text-violet-800 font-medium transition-colors">
                  Forgot password?
                </button>
              </div>

              {err && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                  {err}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full flex justify-center items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-semibold py-2.5 text-sm transition-all disabled:opacity-60 shadow-lg shadow-violet-500/20">
                {loading
                  ? <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>
                  : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </div>
  );
}
