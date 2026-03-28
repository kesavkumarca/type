'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/config/supabase';
import Link from 'next/link';

interface ProfileData {
  full_name?: string;
  mobile_number?: string;
  date_of_birth?: string;
  created_at?: string;
}

interface PersonalBests {
  best_wpm: number;
  best_accuracy: number;
  tests_taken: number;
  avg_marks: number;
}

export default function Profile() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<PersonalBests>({ best_wpm: 0, best_accuracy: 0, tests_taken: 0, avg_marks: 0 });
  const [fetchingProfile, setFetchingProfile] = useState(true);

  const formatToDDMMYYYY = (dateString: string) => {
    if (!dateString) return 'Not Available';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Not Available';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    const fetchRealProfileAndStats = async () => {
      if (!user) return;

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, mobile_number, date_of_birth, created_at')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setProfileData(profile);

        const { data: testResults, error: testError } = await supabase
          .from('test_results')
          .select('wpm, accuracy')
          .eq('user_id', user.id);

        if (testError) throw testError;

        if (testResults && testResults.length > 0) {
          const validWpms: number[] = testResults.map((t: any) => Number(t.wpm)).filter((w: number) => w > 0);
          const validAccs = testResults.map((t: any) => Number(t.accuracy)).filter((a: number) => a > 0);

          const maxWpm = Math.max(...(validWpms.length > 0 ? validWpms : [0]));
          const maxAccuracy = Math.max(...(validAccs.length > 0 ? validAccs : [0]));

          setStats({
            best_wpm: maxWpm,
            best_accuracy: maxAccuracy,
            tests_taken: testResults.length,
            avg_marks: 0
          });
        }

      } catch (err) {
        console.error('Error fetching profile data:', err);
      } finally {
        setFetchingProfile(false);
      }
    };

    if (user) {
      fetchRealProfileAndStats();
    }
  }, [user, loading, router]);

  const getInitial = () => {
    if (profileData?.full_name) return profileData.full_name.trim().charAt(0).toUpperCase();
    if (user?.email) return user.email.trim().charAt(0).toUpperCase();
    return 'T';
  };

  if (loading || fetchingProfile) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="text-xl text-slate-400 animate-pulse">Loading profile vault...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white relative overflow-hidden">
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-indigo-600 rounded-full filter blur-[120px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-emerald-600 rounded-full filter blur-[120px] opacity-10 pointer-events-none" />

      <div className="relative z-10">
        <Navbar />

        <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">

          {/* ✅ SECTION 1: Centered Profile & Compact Metrics Stack */}
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center w-full">

            {/* User Details Mini Profile Card (h-fit stops stretching) */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center text-center h-fit w-full md:w-[280px]">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-full flex items-center justify-center text-3xl font-extrabold text-white shadow-xl mb-3 border-2 border-white/20 tracking-tight">
                {getInitial()}
              </div>

              <h2 className="text-lg font-bold text-white mb-1">
                {profileData?.full_name || 'Anonymous Typist'}
              </h2>
              <p className="text-xs text-slate-400 mb-3 truncate w-full max-w-[180px]">{user?.email}</p>

              <div className="w-full h-px bg-white/10 my-3" />

              <div className="grid grid-cols-2 w-full gap-2">
                <div className="text-center">
                  <p className="text-lg font-extrabold text-white">{stats.tests_taken}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Tests Taken</p>
                </div>
                <div className="text-center border-l border-white/10">
                  <p className="text-lg font-extrabold text-emerald-400">{stats.best_wpm}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Top Speed</p>
                </div>
              </div>
            </div>

            {/* ✅ Compact Metric Stack: w-fit hugging text content side-by-side with Profile */}
            <div className="flex flex-col gap-4 items-start h-fit">

              {/* Personal Best Speed Card */}
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-5 shadow-2xl border border-white/20 relative overflow-hidden group w-fit h-fit flex flex-col justify-center">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full filter blur-xl group-hover:bg-white/20 transition-all duration-300" />
                <span className="text-xs font-semibold uppercase text-indigo-200 tracking-wider mb-2 block whitespace-nowrap">Personal Best Speed</span>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-extrabold text-white">{stats.best_wpm}</p>
                  <p className="text-xs font-bold text-indigo-200">WPM</p>
                </div>
              </div>

              {/* Personal Best Accuracy Card */}
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-5 shadow-2xl border border-white/20 relative overflow-hidden group w-fit h-fit flex flex-col justify-center">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full filter blur-xl group-hover:bg-white/20 transition-all duration-300" />
                <span className="text-xs font-semibold uppercase text-emerald-200 tracking-wider mb-2 block whitespace-nowrap">Personal Best Accuracy</span>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-extrabold text-white">{stats.best_accuracy}</p>
                  <p className="text-xs font-bold text-emerald-200">%</p>
                </div>
              </div>

            </div>

          </div>

          {/* SECTION 2: System Parameters Grid (Full Width) */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="mb-6">
              <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase mb-1 block">
                Identity Records
              </span>
              <h3 className="text-2xl font-bold text-white">System Parameters</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/10 transition-all duration-300">
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Mobile Access</label>
                <p className="text-lg font-bold text-indigo-300">
                  {profileData?.mobile_number || 'Not Available'}
                </p>
              </div>

              <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/10 transition-all duration-300">
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Lifetime Avg Marks</label>
                <p className="text-lg font-bold text-emerald-400">
                  {stats.avg_marks}
                </p>
              </div>

              <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/10 transition-all duration-300">
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Date of Birth</label>
                <p className="text-lg font-bold text-white">
                  {profileData?.date_of_birth
                    ? formatToDDMMYYYY(profileData.date_of_birth)
                    : 'Not Available'}
                </p>
              </div>

              <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/10 transition-all duration-300">
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Member Since</label>
                <p className="text-lg font-bold text-white">
                  {profileData?.created_at
                    ? formatToDDMMYYYY(profileData.created_at)
                    : 'Not Available'}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/10">
              <Link
                href="/dashboard"
                className="group bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold text-center transition-all duration-300 flex items-center justify-center gap-2 border border-white/10 w-full"
              >
                Back to Dashboard
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}