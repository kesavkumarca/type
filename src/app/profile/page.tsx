'use client';

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

export default function Profile() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
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

    const fetchRealProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, mobile_number, date_of_birth, created_at')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfileData(data);
      } catch (err) {
        console.error('Error fetching profile data:', err);
      } finally {
        setFetchingProfile(false);
      }
    };

    if (user) {
      fetchRealProfile();
    }
  }, [user, loading, router]);

  if (loading || fetchingProfile) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="text-xl text-slate-400 animate-pulse">Loading profile information...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white relative overflow-hidden">
      {/* 🔮 Aesthetic Background Orbs */}
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-indigo-600 rounded-full filter blur-[120px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-emerald-600 rounded-full filter blur-[120px] opacity-10 pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-600 rounded-full filter blur-[100px] opacity-10 pointer-events-none" />

      <div className="relative z-10">
        <Navbar />

        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            
            <div className="mb-8">
              <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase mb-1 block">
                User Settings
              </span>
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                My Profile
              </h1>
              <p className="text-slate-400 mt-1">Manage your account and viewing personal metrics parameters</p>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-all duration-300">
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Full Name</label>
                <p className="text-xl font-bold text-white">
                  {profileData?.full_name || 'Not Available'}
                </p>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-all duration-300">
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Email Address</label>
                <p className="text-xl font-bold text-white">{user?.email}</p>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-all duration-300">
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Mobile Number</label>
                <p className="text-xl font-bold text-indigo-300">
                  {profileData?.mobile_number || 'Not Available'}
                </p>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-all duration-300">
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Date of Birth</label>
                <p className="text-xl font-bold text-white">
                  {profileData?.date_of_birth 
                    ? formatToDDMMYYYY(profileData.date_of_birth) 
                    : 'Not Available'}
                </p>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-all duration-300">
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Member Since</label>
                <p className="text-xl font-bold text-emerald-300">
                  {profileData?.created_at 
                    ? formatToDDMMYYYY(profileData.created_at) 
                    : 'Not Available'}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/dashboard"
                className="group bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-center transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/20"
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