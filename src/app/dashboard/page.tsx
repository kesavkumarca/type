'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/config/supabase';

// 📊 Standard Recharts imports
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Stats {
  avgWPM: number;
  avgAccuracy: number;
  totalTests: number;
}

interface GraphData {
  testDate: string;
  wpm: number;
  accuracy: number;
}

export default function Dashboard() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [stats, setStats] = useState<Stats>({
    avgWPM: 0,
    avgAccuracy: 0,
    totalTests: 0,
  });
  const [graphData, setGraphData] = useState<GraphData[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Updated to grab 'created_at' so we can plot it in a timeline
        const { data, error } = await supabase
          .from('test_results')
          .select('wpm, accuracy, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const avgWPM = data.reduce((sum, result) => sum + result.wpm, 0) / data.length;
          const avgAccuracy = data.reduce((sum, result) => sum + result.accuracy, 0) / data.length;

          setStats({
            avgWPM: Math.round(avgWPM),
            avgAccuracy: Math.round(avgAccuracy),
            totalTests: data.length,
          });

          // Grab the last 10 tests for the visual chart
          const formattedData = data.slice(-10).map((result, index) => ({
            testDate: `Test ${index + 1}`,
            wpm: result.wpm,
            accuracy: result.accuracy,
          }));

          setGraphData(formattedData);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{profile?.full_name || 'Welcome'}</h1>
              <p className="text-gray-600 mt-2">{profile?.email}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600">Mobile</p>
              <p className="text-2xl font-semibold text-indigo-600">{profile?.mobile_number}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Average WPM Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Average WPM</p>
                <p className="text-4xl font-bold text-indigo-600 mt-2">
                  {statsLoading ? '-' : stats.avgWPM}
                </p>
              </div>
              <div className="bg-indigo-100 p-4 rounded-lg">
                <svg className="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Average Accuracy Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Average Accuracy</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">
                  {statsLoading ? '-' : `${stats.avgAccuracy}%`}
                </p>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Tests Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Tests Taken</p>
                <p className="text-4xl font-bold text-purple-600 mt-2">
                  {statsLoading ? '-' : stats.totalTests}
                </p>
              </div>
              <div className="bg-purple-100 p-4 rounded-lg">
                <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 📈 Graph Section (Below stats, above quick actions) */}
        <div className="bg-white rounded-lg shadow-lg p-8 mt-12 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Performance Progress</h2>
          
          {graphData.length > 0 ? (
            <div className="h-96 text-gray-900">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="testDate" stroke="#4b5563" />
                  <YAxis stroke="#4b5563" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    labelStyle={{ fontWeight: 'bold', color: '#111827' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="wpm" 
                    name="Speed (WPM)" 
                    stroke="#4f46e5" 
                    strokeWidth={3} 
                    dot={{ fill: '#4f46e5', r: 5 }} 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="accuracy" 
                    name="Accuracy (%)" 
                    stroke="#2563eb" 
                    strokeWidth={3} 
                    dot={{ fill: '#2563eb', r: 5 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <p className="text-lg">No test data available yet.</p>
              <p className="text-sm mt-1">Take your first typing test to see your progress graph!</p>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/typing-test/english/junior"
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-lg shadow-lg transition text-center font-semibold"
            >
              Start English Test
            </a>
            <a
              href="/leaderboard"
              className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg shadow-lg transition text-center font-semibold"
            >
              View Leaderboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}