'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function LogIn() {
  const router = useRouter();
  const { logIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false); // State to toggle visibility
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await logIn(formData.email, formData.password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Log in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0b0f19] text-zinc-900 dark:text-white flex items-center justify-center py-12 px-4 relative overflow-hidden transition-colors duration-300">
      
      {/* 🔮 Background Glow Orbs for Glassmorphism Context */}
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-indigo-600 rounded-full filter blur-[120px] opacity-10 dark:opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-emerald-600 rounded-full filter blur-[120px] opacity-10 dark:opacity-10 pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-50 dark:bg-white/5 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl p-8 relative z-10 transition-colors duration-300">
        <div className="mb-8">
          <span className="text-xs font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase mb-1 block text-center">
            Student Portal
          </span>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-transparent bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-slate-300 text-center">
            Lakshmi Technical Institute
          </h1>
          <p className="text-center text-zinc-500 dark:text-slate-400 mt-2">Welcome back to your typing dashboard</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-slate-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 transition-colors duration-300"
              placeholder="example@gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pr-12 px-4 py-2.5 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 transition-colors duration-300"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-indigo-500/20"
          >
            {loading ? 'Logging In...' : 'Log In 🔒'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-zinc-500 dark:text-slate-400 text-sm">
            Don't have an account?{' '}
            <Link href="/signup" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-semibold underline underline-offset-4 transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}