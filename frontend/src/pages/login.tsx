import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Sparkles, Lock, Mail, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { api } from '../services/api';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success(`Welcome back, ${res.data.user.full_name}!`);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur-xl shadow-2xl">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h2>
          <p className="text-xs text-slate-400">Sign in to manage registrations and discover events</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-500 hover:to-purple-500 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'} <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link href="/register" className="font-semibold text-indigo-400 hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
