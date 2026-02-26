import { useState, type FormEvent } from 'react';
import { Lock, Mail } from 'lucide-react';
import ForgotPasswordModal from './ForgotPasswordModal';

type User = {
  name: string;
  email: string;
  employee_id?: number;
  dob?: string;
  address?: string;
  phone_no?: string;
  id_type?: string;
  id_number?: string;
  designation_id?: number;
  year_joined?: string;
  salary?: number;
};

type Props = {
  onLogin: (u: User) => void;
};

function Login({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!email || !pass) {
      setErr('Enter email and password.');
      return;
    }

    setLoading(true);
    try {
      const { api } = await import('../lib/api');
      const res = await api.auth.login(email, pass);
      const emp = res.user;
      const userData: User = {
        name: emp.employee_name,
        email: emp.email,
        employee_id: emp.employee_id,
        dob: emp.dob,
        address: emp.address,
        phone_no: emp.phone_no,
        id_type: emp.id_type,
        id_number: emp.id_number,
        designation_id: emp.designation_id ?? undefined,
        year_joined: emp.year_joined ?? undefined,
        salary: emp.salary,
      };
      onLogin(userData);
    } catch (error: any) {
      const errorMessage = error?.message || 'Login failed. Please check your credentials.';
      setErr(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-3">
          <img
            src="/svaas.png"
            alt="SVAAS logo"
            className="mx-auto h-14 w-14 object-cover shadow-lg border border-gray-100"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employee Tracking</h1>
            <p className="text-sm text-gray-500">Sign in to access your workspace.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
              <Mail className="text-gray-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full outline-none text-sm text-gray-900 placeholder:text-gray-400"
                placeholder="you@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
              <Lock className="text-gray-400" size={18} />
              <input
                type="password"
                value={pass}
                onChange={e => setPass(e.target.value)}
                required
                className="w-full outline-none text-sm text-gray-900 placeholder:text-gray-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </div>
  );
}

export default Login;
