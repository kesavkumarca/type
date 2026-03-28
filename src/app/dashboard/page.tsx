'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/config/supabase';
import Link from 'next/link';

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
}import { useTheme } from 'next-themes';

export default function Dashboard() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const { theme } = useTheme();
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
            ? recentData.reduce((sum: number, result: any) => sum + result.wpm, 0) / recentData.length
            : 0;

          const avgAccuracy = recentData.length > 0 
            ? recentData.reduce((sum: number, result: any) => sum + result.accuracy, 0) / recentData.length 
            : 0;

          setStats({
            avgWPM: Math.round(avgWPM),
            avgAccuracy: Math.round(avgAccuracy),
            totalTests: data.length, 
          });

          const formattedData = recentData.map((result: any) => {
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
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0b0f19] flex items-center justify-center transition-colors duration-300">
        <div className="text-xl text-zinc-500 dark:text-slate-400 animate-pulse">Loading Dashboard...</div>
      </div>
    );
  }

  const isDarkMode = theme === 'dark';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0b0f19] text-zinc-900 dark:text-white relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-indigo-600 rounded-full filter blur-[120px] opacity-10 dark:opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-emerald-600 rounded-full filter blur-[120px] opacity-10 dark:opacity-10 pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-600 rounded-full filter blur-[100px] opacity-10 dark:opacity-10 pointer-events-none" />

      <div className="relative z-10">
        <Navbar />

        <div className="max-w-6xl mx-auto px-4 py-12">
          
          <div className="bg-zinc-50 dark:bg-white/5 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl p-8 mb-8 shadow-2xl transition-colors duration-300">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase mb-1 block">
                  Student Profile
                </span>
                <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-slate-300">
                  {profile?.full_name || 'Welcome Back!'}
                </h1>
                <p className="text-zinc-500 dark:text-slate-400 mt-1">{profile?.email}</p>
              </div>
              <div className="md:text-right bg-white dark:bg-white/5 p-4 rounded-xl border border-zinc-200 dark:border-white/5 transition-colors duration-300">
                <p className="text-xs text-zinc-500 dark:text-slate-400 uppercase font-medium tracking-wide">Registered Mobile</p>
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-300 mt-1">{profile?.mobile_number}</p>
              </div>
            </div>
          </div>

          {/* ✨ Stats Grid with Hover Box Shadows and Lift */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            
            {/* ⚡ Average Speed (Indigo) */}
            <div className="bg-zinc-50 dark:bg-white/5 backdrop-blur-md border border-zinc-200 dark:border-white/10 rounded-2xl p-6 hover:bg-white dark:hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 dark:hover:shadow-[0_0_50px_-12px_rgba(79,70,229,0.5)] group shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Average Speed</p>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <p className="text-4xl font-extrabold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                      {statsLoading ? '-' : stats.avgWPM}
                    </p>
                    <span className="text-sm text-zinc-500 dark:text-slate-400">WPM</span>
                  </div>
                </div>
                <div className="bg-indigo-100 dark:bg-indigo-500/20 p-3 rounded-xl border border-indigo-200 dark:border-indigo-500/30 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 🎯 Average Accuracy (Emerald) */}
            <div className="bg-zinc-50 dark:bg-white/5 backdrop-blur-md border border-zinc-200 dark:border-white/10 rounded-2xl p-6 hover:bg-white dark:hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 dark:hover:shadow-[0_0_50px_-12px_rgba(16,185,129,0.5)] group shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Average Accuracy</p>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <p className="text-4xl font-extrabold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                      {statsLoading ? '-' : `${stats.avgAccuracy}%`}
                    </p>
                  </div>
                </div>
                <div className="bg-emerald-100 dark:bg-emerald-500/20 p-3 rounded-xl border border-emerald-200 dark:border-emerald-500/30 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 📝 Total Tests Completed (Purple) */}
            <div className="bg-zinc-50 dark:bg-white/5 backdrop-blur-md border border-zinc-200 dark:border-white/10 rounded-2xl p-6 hover:bg-white dark:hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 dark:hover:shadow-[0_0_50px_-12px_rgba(168,85,247,0.5)] group shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Total Tests Completed</p>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <p className="text-4xl font-extrabold text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                      {statsLoading ? '-' : stats.totalTests}
                    </p>
                  </div>
                </div>
                <div className="bg-purple-100 dark:bg-purple-500/20 p-3 rounded-xl border border-purple-200 dark:border-purple-500/30 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                </div>
              </div>
            </div>

          </div>

          <div className="bg-zinc-50 dark:bg-white/5 backdrop-blur-md border border-zinc-200 dark:border-white/10 rounded-2xl p-8 mb-12 shadow-2xl transition-colors duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Metrics Over Time</h2>
                <p className="text-sm text-zinc-500 dark:text-slate-400 mt-1">Breakdown of speed vs accuracy over your last 10 tests</p>
              </div>
              <div className="flex space-x-6 text-xs font-semibold">
                <span className="flex items-center text-zinc-700 dark:text-white"><span className="w-3 h-3 bg-indigo-500 rounded-full mr-2 shadow-[0_0_8px_#4f46e5]"></span> Speed</span>
                <span className="flex items-center text-zinc-700 dark:text-white"><span className="w-3 h-3 bg-emerald-400 rounded-full mr-2 shadow-[0_0_8px_#10b981]"></span> Accuracy</span>
              </div>
            </div>

            {graphData.length > 0 ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#ffffff" : "#000000"} opacity={0.05} vertical={false} />
                    <XAxis dataKey="testDate" tickLine={false} tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                    <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fill: '#818cf8', fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fill: '#34d399', fontSize: 12 }} domain={[0, 105]} />
                    
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
                        borderRadius: '12px', 
                        border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', 
                        backdropFilter: 'blur(10px)',
                        color: isDarkMode ? '#f8fafc' : '#0f172a'
                      }}
                      labelStyle={{ fontWeight: 'bold', color: isDarkMode ? '#f8fafc' : '#0f172a' }}
                      itemStyle={{ color: isDarkMode ? '#fff' : '#000' }}
                    />

                    <Area yAxisId="left" type="monotone" dataKey="wpm" name="WPM" stroke="#6366f1" strokeWidth={3} fill="url(#colorWpm)" dot={{ fill: '#6366f1', stroke: '#fff', strokeWidth: 1.5, r: 4 }} activeDot={{ r: 7 }} />
                    <Area yAxisId="right" type="monotone" dataKey="accuracy" name="Accuracy" stroke="#10b981" strokeWidth={3} fill="url(#colorAccuracy)" dot={{ fill: '#10b981', stroke: '#fff', strokeWidth: 1.5, r: 4 }} activeDot={{ r: 7 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-500 dark:text-slate-500">
                <p className="text-lg font-medium">No metrics available yet.</p>
                <p className="text-sm mt-1">Take your first typing test to light up the grid!</p>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/typing-test/english/junior" className="group bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white p-6 rounded-2xl shadow-lg transition-all duration-300 font-bold flex items-center justify-between">
                <div>
                  <p className="text-xl">Launch Practice Test</p>
                  <p className="text-xs font-normal text-indigo-200 mt-1">Improve your English WPM and precision</p>
                </div>
                <div className="p-2 bg-white/10 rounded-lg group-hover:translate-x-1 transition-transform">→</div>
              </Link>

              <Link href="/leaderboard" className="group bg-zinc-50 dark:bg-white/5 backdrop-blur-md border border-zinc-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 text-zinc-900 dark:text-white p-6 rounded-2xl shadow-lg transition-all duration-300 font-bold flex items-center justify-between">
                <div>
                  <p className="text-xl">View Leaderboards</p>
                  <p className="text-xs font-normal text-zinc-500 dark:text-slate-400 mt-1">Check how you compare against peers</p>
                </div>
                <div className="p-2 bg-zinc-200 dark:bg-white/10 rounded-lg group-hover:translate-x-1 transition-transform">→</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}