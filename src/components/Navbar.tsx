'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

export default function Navbar() {
  const { user, profile, isAdmin, logOut } = useAuth();
  const router = useRouter();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogOut = async () => {
    try {
      await logOut();
      router.push('/login');
    } catch (err) {
      console.error('Log out failed:', err);
    }
  };

  return (
    <nav className="bg-zinc-50 dark:bg-[#0b0f19] text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-white/5 sticky top-0 z-50 backdrop-blur-lg bg-opacity-80 dark:bg-opacity-80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* 1. Logo Section with Hover Animation */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:shadow-indigo-500/40 group-hover:rotate-6 transition-all duration-300">
                L
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tighter leading-none dark:text-white">
                  LAKSHMI
                </span>
                <span className="text-[10px] font-bold tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                  TECHNICAL
                </span>
              </div>
            </Link>
          </div>

          {/* 2. Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/dashboard" className="text-sm font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-2 relative group">
              Dashboard
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full"></span>
            </Link>
            
            <Link href="/courses" className="text-sm font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-2 relative group">
              Courses
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full"></span>
            </Link>

            {isAdmin && (
              <Link href="/admin" className="bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-600 dark:text-amber-500 hover:bg-amber-500/20 transition-all flex items-center gap-2">
                <span className="animate-pulse">🛡️</span> ADMIN PANEL
              </Link>
            )}

            <div className="h-6 w-px bg-zinc-200 dark:bg-white/10 mx-2" />

            <ThemeToggle />

            {/* 3. Rich Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpenDropdown(openDropdown === 'profile' ? null : 'profile')}
                className="flex items-center gap-3 p-1 pr-3 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:border-indigo-500/50 transition-all"
              >
                <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-inner">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold leading-none truncate max-w-[80px]">
                    {profile?.full_name?.split(' ')[0] || 'Member'}
                  </p>
                </div>
                <svg className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${openDropdown === 'profile' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {openDropdown === 'profile' && (
                <div className="absolute top-full mt-3 right-0 w-64 bg-white dark:bg-[#111827] border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-4 bg-zinc-50 dark:bg-white/5 border-b border-zinc-200 dark:border-white/10 mb-2">
                    <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                      {profile?.full_name || 'Student Typist'}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-indigo-400 font-mono truncate uppercase">
                      ID: {user?.id.slice(0, 8)}...
                    </p>
                  </div>
                  
                  <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 transition-colors">
                    <span>👤</span> My Profile
                  </Link>
                  
                  <Link href="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 transition-colors">
                    <span>⚙️</span> Account Settings
                  </Link>

                  <div className="h-px bg-zinc-200 dark:bg-white/10 my-2 mx-4" />

                  <button
                    onClick={handleLogOut}
                    className="w-[calc(100%-1rem)] mx-2 flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <span>🚪</span> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <ThemeToggle />
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-zinc-600 dark:text-zinc-400"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Content */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-[#0b0f19] border-b border-zinc-200 dark:border-white/10 px-4 py-6 space-y-4 animate-in slide-in-from-top duration-300">
          <Link href="/dashboard" className="block text-lg font-bold">Dashboard</Link>
          <Link href="/profile" className="block text-lg font-bold">Profile</Link>
          {isAdmin && <Link href="/admin" className="block text-lg font-bold text-amber-500">Admin Panel</Link>}
          <button onClick={handleLogOut} className="block text-lg font-bold text-red-500">Logout</button>
        </div>
      )}
    </nav>
  );
}