import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Sparkles, Calendar, User as UserIcon, LogOut, LayoutDashboard } from 'lucide-react';
import { User } from '../services/api';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, [router.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5 transition-transform hover:scale-105">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            EventPulse <span className="text-indigo-400 font-medium text-xs">AI</span>
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${
              router.pathname === '/' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Explore Events
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  router.pathname === '/dashboard' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>

              <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-white">{user.full_name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-mono">
                    {user.role}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="rounded-lg bg-slate-900 p-2 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors border border-slate-800"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-500 hover:to-purple-500 active:scale-95"
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
