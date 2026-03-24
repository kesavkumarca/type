'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/config/supabase';

// 📊 Area Chart imports
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

// 🎯 FIXED: Changed Component name to Leaderboard
export default function Leaderboard() {
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
        const { data, error } = await supabase
          .from('test_results')
          .select('wpm, accuracy, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const recentData = data.slice(-10);

          const avgWPM = recentData.length > 0 
            ? recentData.reduce((sum, result) => sum + result.wpm, 0) / recentData.length 
            : 0;

          const avgAccuracy = recentData.length > 0 
            ? recentData.reduce((sum, result) => sum + result.accuracy, 0) / recentData.length 
            : 0;

          setStats({
            avgWPM: Math.round(avgWPM),
            avgAccuracy: Math.round(avgAccuracy),
            totalTests: data.length, 
          });

          const formattedData = recentData.map((result) => {
            const dateObj = new Date(result.created_at);
            return {
              testDate: dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
              wpm: result.wpm,
              accuracy: result.accuracy,
            };
          });

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
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="text-xl text-slate-400 animate-pulse">Loading Leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white relative overflow-hidden">
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-indigo-600 rounded-full filter blur-[120px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-emerald-600 rounded-full filter blur-[120px] opacity-10 pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-600 rounded-full filter blur-[100px] opacity-10 pointer-events-none" />

      <div className="relative z-10">
        <Navbar />

        <div className="max-w-6xl mx-auto px-4 py-12">
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8 shadow-2xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase mb-1 block">
                  Global Leaderboard
                </span>
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                  Top Typists Rankings
                </h1>
                <p className="text-slate-400 mt-1">See how you measure up against the class percentile</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Top Global Speed</p>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <p className="text-4xl font-extrabold text-white group-hover:text-indigo-300 transition-colors">
                      {statsLoading ? '-' : stats.avgWPM}
                    </p>
                    <span className="text-sm text-slate-400">WPM</span>
                  </div>
                </div>
                <div className="bg-indigo-500/20 p-3 rounded-xl border border-indigo-500/30 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Top Precision</p>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <p className="text-4xl font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                      {statsLoading ? '-' : `${stats.avgAccuracy}%`}
                    </p>
                  </div>
                </div>
                <div className="bg-emerald-500/20 p-3 rounded-xl border border-emerald-500/30 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Global Tests Taken</p>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <p className="text-4xl font-extrabold text-white group-hover:text-purple-300 transition-colors">
                      {statsLoading ? '-' : stats.totalTests}
                    </p>
                  </div>
                </div>
                <div className="bg-purple-500/20 p-3 rounded-xl border border-purple-500/30 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 mb-12 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Leaderboard Standings Coming Soon!</h2>
            <p className="text-slate-300">This page will render the top students pulled from Supabase!</p>
          </div>
        </div>
      </div>
    </div>
  );
}