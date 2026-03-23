'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { createBrowserClient } from '@supabase/ssr';

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

  // 🛰️ Hardcoded your Supabase details directly to skip .env issues
  const supabase = createBrowserClient(
    'https://abfwcdtcloaxtvhxieof.supabase.co',
    'sb_publishable_rvOc0n0VwggL8IhWXBdVWA_R_-YkqmV'
  );

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
  }, [user, loading, router, supabase]);

  if (loading || fetchingProfile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading profile information...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-600">Full Name</label>
              <p className="text-xl font-semibold text-gray-900">
                {profileData?.full_name || 'Not Available (Blank in DB)'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Email Address</label>
              <p className="text-xl font-semibold text-gray-900">{user?.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Mobile Number</label>
              <p className="text-xl font-semibold text-gray-900">
                {profileData?.mobile_number || 'Not Available (Blank in DB)'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Date of Birth</label>
              <p className="text-xl font-semibold text-gray-900">
                {profileData?.date_of_birth 
                  ? new Date(profileData.date_of_birth).toLocaleDateString() 
                  : 'Not Available (Blank in DB)'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Member Since</label>
              <p className="text-xl font-semibold text-gray-900">
                {profileData?.created_at 
                  ? new Date(profileData.created_at).toLocaleDateString() 
                  : 'Not Available'}
              </p>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <a
              href="/dashboard"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}