'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

import { ThemeToggle } from './ThemeToggle';

export default function Navbar({ hideContact = false }: { hideContact?: boolean }) {
  const { user, profile, isAdmin, logOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <nav className="bg-[#0b0f19] text-white border-b border-white/5 relative z-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">

          <Link
            href="/dashboard"
            className="flex items-center gap-3 text-xl font-bold tracking-tight text-white hover:text-indigo-300 transition-colors uppercase">
            <img
              src="/my-logo.png"
              alt="LTI Logo"
              className="w-8 h-8 object-contain"
            />
            <span>LAKSHMI TECHNICAL INSTITUTE</span>
          </Link>

          <div className="flex items-center gap-6" ref={dropdownRef}>

            <Link href="/dashboard" className="text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors">
              Dashboard
            </Link>

            {/* Typing Tests Dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'tests' ? null : 'tests')}
                className="text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                Typing Tests
                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform ${openDropdown === 'tests' ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openDropdown === 'tests' && (
                <div className="absolute top-full mt-2 bg-[#111827] border border-white/10 rounded-xl shadow-2xl py-2 w-64 z-50">
                  <div>
                    <p className="px-4 py-2 text-xs font-semibold tracking-wider text-indigo-400 uppercase">English</p>
                    <Link href="/typing-test/english/junior" className="block px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors">
                      Junior (30 WPM / 1500)
                    </Link>
                    <Link href="/typing-test/english/senior" className="block px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors">
                      Senior (45 WPM / 2250)
                    </Link>
                  </div>

                  <hr className="my-2 border-white/5" />

                  <div>
                    <p className="px-4 py-2 text-xs font-semibold tracking-wider text-indigo-400 uppercase">Tamil</p>
                    <Link href="/typing-test/tamil/junior" className="block px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors">
                      Junior (30 WPM / 1500)
                    </Link>
                    <Link href="/typing-test/tamil/senior" className="block px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors">
                      Senior (45 WPM / 2250)
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link href="/leaderboard" className="text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors">
              Leaderboard
            </Link>

            {!hideContact && (
              <Link href="/contact" className="text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors">
                Contact
              </Link>
            )}

            <ThemeToggle />

            {/* 🛡️ ADMIN PANEL DROPDOWN */}
            {isAdmin && (
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'admin' ? null : 'admin')}
                  className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold px-4 h-10 flex items-center justify-center rounded-lg transition-colors whitespace-nowrap shadow-lg hover:shadow-yellow-500/20 gap-2"
                >
                  Admin Panel
                  <svg
                    className={`w-4 h-4 text-gray-900 transition-transform ${openDropdown === 'admin' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {openDropdown === 'admin' && (
                  <div className="absolute top-full right-0 mt-2 bg-[#111827] border border-white/10 rounded-xl shadow-2xl py-2 w-64 z-50">
                    <Link href="/admin?tab=students" onClick={() => setOpenDropdown(null)} className="block px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors">
                      📊 View Student Progress
                    </Link>
                    <hr className="my-2 border-white/5" />
                    <Link href="/admin?tab=passages" onClick={() => setOpenDropdown(null)} className="block px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors">
                      📄 Manage Typing Passages
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Account Dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'profile' ? null : 'profile')}
                className="text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {profile?.full_name || 'Account'}
                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform ${openDropdown === 'profile' ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openDropdown === 'profile' && (
                <div className="absolute top-full mt-2 bg-[#111827] border border-white/10 rounded-xl shadow-2xl py-2 w-56 z-50 right-0">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="font-semibold text-sm text-white truncate">{profile?.full_name || 'Typist'}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>

                  <Link href="/profile" className="block px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors">
                    My Profile
                  </Link>

                  <button
                    onClick={handleLogOut}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 font-semibold hover:bg-red-500/10 transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </nav>
  );
}