'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/config/supabase'; // 🎯 Exact folder path

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

  // 🗓️ Helper function to output DD/MM/YYYY exactly
  const formatToDDMMYYYY = (dateString: string) => {
    if (!dateString) return 'Not Available';
    const date = new Date(dateString);
    
    // Check if date parsing fails
    if (isNaN(date.getTime())) return 'Not Available';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
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
                  ? formatToDDMMYYYY(profileData.date_of_birth) 
                  : 'Not Available (Blank in DB)'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Member Since</label>
              <p className="text-xl font-semibold text-gray-900">
                {profileData?.created_at 
                  ? formatToDDMMYYYY(profileData.created_at) 
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