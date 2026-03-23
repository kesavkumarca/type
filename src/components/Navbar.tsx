'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Navbar() {
  const { user, profile, isAdmin, logOut } = useAuth();
  const router = useRouter();
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
    <nav className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="text-2xl font-bold">
            Lakshmi Technical Institute
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-6" ref={dropdownRef}>
            {/* Typing Tests Dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'tests' ? null : 'tests')}
                className="hover:bg-indigo-700 px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                Typing Tests
                <svg
                  className={`w-4 h-4 transition-transform ${
                    openDropdown === 'tests' ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>

              {/* Tests Dropdown Menu */}
              {openDropdown === 'tests' && (
                <div className="absolute top-full mt-2 bg-white text-gray-900 rounded-lg shadow-xl py-2 w-64 z-50">
                  {/* English */}
                  <div>
                    <p className="px-4 py-2 font-semibold text-indigo-600 text-sm">English</p>
                    <a
                      href="/typing-test/english/junior"
                      className="block px-4 py-2 hover:bg-gray-100 transition text-sm"
                    >
                      Junior (Target: 30 WPM / 1500 strokes)
                    </a>
                    <a
                      href="/typing-test/english/senior"
                      className="block px-4 py-2 hover:bg-gray-100 transition text-sm"
                    >
                      Senior (Target: 45 WPM / 2250 strokes)
                    </a>
                  </div>

                  <hr className="my-2" />

                  {/* Tamil */}
                  <div>
                    <p className="px-4 py-2 font-semibold text-indigo-600 text-sm">Tamil</p>
                    <a
                      href="/typing-test/tamil/junior"
                      className="block px-4 py-2 hover:bg-gray-100 transition text-sm"
                    >
                      Junior (Target: 30 WPM / 1500 strokes)
                    </a>
                    <a
                      href="/typing-test/tamil/senior"
                      className="block px-4 py-2 hover:bg-gray-100 transition text-sm"
                    >
                      Senior (Target: 45 WPM / 2250 strokes)
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Leaderboard Link */}
            <Link
              href="/leaderboard"
              className="hover:bg-indigo-700 px-4 py-2 rounded-lg transition"
            >
              Leaderboard
            </Link>

            {/* Contact Link */}
            <Link
              href="/contact"
              className="hover:bg-indigo-700 px-4 py-2 rounded-lg transition"
            >
              Contact
            </Link>

            {/* Admin Panel Link */}
            {isAdmin && (
              <Link
                href="/admin"
                className="hover:bg-yellow-600 px-4 py-2 rounded-lg transition bg-yellow-500"
              >
                Admin Panel
              </Link>
            )}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'profile' ? null : 'profile')}
                className="hover:bg-indigo-700 px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                {profile?.full_name || 'Profile'}
                <svg
                  className={`w-4 h-4 transition-transform ${
                    openDropdown === 'profile' ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>

              {/* Profile Dropdown Menu */}
              {openDropdown === 'profile' && (
                <div className="absolute top-full mt-2 bg-white text-gray-900 rounded-lg shadow-xl py-2 w-48 z-50 right-0">
                  <div className="px-4 py-2 border-b">
                    <p className="font-semibold text-sm">{profile?.full_name}</p>
                    <p className="text-xs text-gray-600">{user?.email}</p>
                  </div>
                  <a
                    href="/profile"
                    className="block px-4 py-2 hover:bg-gray-100 transition text-sm"
                  >
                    My Profile
                  </a>
                  <button
                    onClick={handleLogOut}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition text-sm text-red-600 font-semibold"
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
