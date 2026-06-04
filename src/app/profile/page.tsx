'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, CheckCircle2, Mail, Phone, Save, User, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/config/supabase';

interface ProfileData {
  full_name?: string | null;
  mobile_number?: string | null;
  date_of_birth?: string | null;
  created_at?: string | null;
}

interface PersonalBests {
  best_wpm: number;
  best_accuracy: number;
  tests_taken: number;
  avg_marks: number;
}

interface ProfileForm {
  full_name: string;
  mobile_number: string;
  date_of_birth: string;
}

export default function Profile() {
  const router = useRouter();
  const { user, loading, refreshProfile } = useAuth();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    full_name: '',
    mobile_number: '',
    date_of_birth: '',
  });
  const [stats, setStats] = useState<PersonalBests>({ best_wpm: 0, best_accuracy: 0, tests_taken: 0, avg_marks: 0 });
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const formatToDDMMYYYY = (dateString: string) => {
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
        setForm({
          full_name: profile.full_name ?? '',
          mobile_number: profile.mobile_number ?? '',
          date_of_birth: profile.date_of_birth ?? '',
        });

        const { data: testResults, error: testError } = await supabase
          .from('test_results')
          .select('wpm, accuracy')
          .eq('user_id', user.id);

        if (testError) throw testError;

        if (testResults && testResults.length > 0) {
          const validWpms = testResults.map((t) => Number(t.wpm)).filter((w) => w > 0);
          const validAccs = testResults.map((t) => Number(t.accuracy)).filter((a) => a > 0);

          setStats({
            best_wpm: Math.max(...(validWpms.length > 0 ? validWpms : [0])),
            best_accuracy: Math.max(...(validAccs.length > 0 ? validAccs : [0])),
            tests_taken: testResults.length,
            avg_marks: 0,
          });
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setStatus({ type: 'error', message: 'Failed to load profile details.' });
      } finally {
        setFetchingProfile(false);
      }
    };

    if (user) {
      fetchRealProfileAndStats();
    }
  }, [user, loading, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const fullName = form.full_name.trim();
    const mobileNumber = form.mobile_number.trim();

    if (!fullName) {
      setStatus({ type: 'error', message: 'Full name is required.' });
      return;
    }

    try {
      setSaving(true);
      setStatus(null);

      const updatedProfile = {
        full_name: fullName,
        mobile_number: mobileNumber || null,
        date_of_birth: form.date_of_birth || null,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', user.id);

      if (error) throw error;

      setProfileData((current) => ({ ...current, ...updatedProfile }));
      setForm({
        full_name: updatedProfile.full_name,
        mobile_number: updatedProfile.mobile_number ?? '',
        date_of_birth: updatedProfile.date_of_birth ?? '',
      });
      await refreshProfile();
      setStatus({ type: 'success', message: 'Profile changes saved.' });
    } catch (err) {
      console.error('Error updating profile:', err);
      setStatus({ type: 'error', message: 'Could not save profile changes.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || fetchingProfile) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="text-xl text-slate-400 animate-pulse">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">
      <Navbar />

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-2xl border border-indigo-500/30 bg-slate-950/80 p-6 shadow-2xl shadow-indigo-950/30 md:p-8">
          <div className="mb-7 border-b border-white/10 pb-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-indigo-300">Student Profile Details</p>
            <h1 className="text-3xl font-extrabold text-white">Manage Your Account</h1>
            <p className="mt-2 text-sm text-slate-400">Update the details used for certificates, dashboard records, and admin verification.</p>
          </div>

          {status && (
            <div className={`mb-6 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
              status.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border-red-500/30 bg-red-500/10 text-red-200'
            }`}>
              {status.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-400">
                <Mail className="h-5 w-5 text-slate-500" />
                <input value={user?.email ?? ''} readOnly className="w-full bg-transparent text-sm outline-none" />
              </div>
              <p className="mt-2 text-xs text-slate-500">Email is your account ID and cannot be changed here.</p>
            </div>

            <div>
              <label htmlFor="full_name" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</label>
              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-900/80 px-4 py-3 focus-within:border-indigo-400">
                <User className="h-5 w-5 text-slate-500" />
                <input
                  id="full_name"
                  value={form.full_name}
                  onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
                  className="w-full bg-transparent text-sm font-semibold text-white outline-none"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="mobile_number" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Mobile Number</label>
              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-900/80 px-4 py-3 focus-within:border-indigo-400">
                <Phone className="h-5 w-5 text-slate-500" />
                <input
                  id="mobile_number"
                  value={form.mobile_number}
                  onChange={(event) => setForm((current) => ({ ...current, mobile_number: event.target.value }))}
                  className="w-full bg-transparent text-sm font-semibold text-white outline-none"
                  inputMode="tel"
                  placeholder="Enter your mobile number"
                />
              </div>
            </div>

            <div>
              <label htmlFor="date_of_birth" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Date of Birth</label>
              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-900/80 px-4 py-3 focus-within:border-indigo-400">
                <Calendar className="h-5 w-5 text-slate-500" />
                <input
                  id="date_of_birth"
                  type="date"
                  value={form.date_of_birth}
                  onChange={(event) => setForm((current) => ({ ...current, date_of_birth: event.target.value }))}
                  className="w-full bg-transparent text-sm font-semibold text-white outline-none [color-scheme:dark]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-950/40 transition hover:from-indigo-400 hover:to-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-5 w-5" />
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </form>
        </section>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Record</p>
            <h2 className="mt-2 text-xl font-extrabold">{profileData?.full_name || 'Anonymous Typist'}</h2>
            <p className="mt-1 truncate text-sm text-slate-400">{user?.email}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/5 p-4">
                <p className="text-2xl font-extrabold text-indigo-300">{stats.tests_taken}</p>
                <p className="text-xs uppercase text-slate-500">Tests</p>
              </div>
              <div className="rounded-lg bg-white/5 p-4">
                <p className="text-2xl font-extrabold text-emerald-300">{stats.best_wpm}</p>
                <p className="text-xs uppercase text-slate-500">Best WPM</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Personal Best Accuracy</p>
            <p className="mt-3 text-5xl font-extrabold text-emerald-300">{stats.best_accuracy}%</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Member Since</p>
            <p className="mt-3 text-lg font-bold">
              {profileData?.created_at ? formatToDDMMYYYY(profileData.created_at) : 'Not Available'}
            </p>
          </div>

          <Link
            href="/dashboard"
            className="block rounded-lg border border-white/10 bg-white/10 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-white/15"
          >
            Back to Dashboard
          </Link>
        </aside>
      </main>
    </div>
  );
}
