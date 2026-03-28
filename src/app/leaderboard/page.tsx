'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/config/supabase';

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  max_wpm: number;
  avg_accuracy: number;
  total_tests: number;
}

export default function Leaderboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // 🛠️ 1. Fetch ALL test results and inner join the user's name from profiles
        const { data, error } = await supabase
          .from('test_results')
          .select(`
            wpm,
            accuracy,
            user_id,
            profiles (
              full_name
            )
          `);

        if (error) throw error;

        if (data) {
          const userBestScores: { [key: string]: LeaderboardEntry } = {};

          // 🛠️ 2. Loop through results to aggregate by user (Finding their personal best WPM)
          data.forEach((row: any) => {
            const userId = row.user_id;
            const wpm = row.wpm;
            const accuracy = row.accuracy;
            const name = row.profiles?.full_name || 'Anonymous Typist';

            if (!userBestScores[userId]) {
              userBestScores[userId] = {
                user_id: userId,
                full_name: name,
                max_wpm: wpm,
                avg_accuracy: accuracy,
                total_tests: 1,
              };
            } else {
              userBestScores[userId].total_tests += 1;
              userBestScores[userId].avg_accuracy += accuracy;
              if (wpm > userBestScores[userId].max_wpm) {
                userBestScores[userId].max_wpm = wpm; // Overwrite if it's a new personal record!
              }
            }
          });

          // 🛠️ 3. Finish averages and push into an array
          const finalLeaderboard = Object.values(userBestScores).map((entry) => ({
            ...entry,
            avg_accuracy: Math.round(entry.avg_accuracy / entry.total_tests),
          }));

          // 🛠️ 4. Sort from Highest WPM to Lowest
          finalLeaderboard.sort((a, b) => b.max_wpm - a.max_wpm);

          setLeaderboard(finalLeaderboard);
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0b0f19] flex items-center justify-center transition-colors duration-300">
        <div className="text-xl text-zinc-500 dark:text-slate-400 animate-pulse">Loading Leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b0f19] text-zinc-900 dark:text-white relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-indigo-600 rounded-full filter blur-[120px] opacity-10 dark:opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-emerald-600 rounded-full filter blur-[120px] opacity-10 dark:opacity-10 pointer-events-none" />

      <div className="relative z-10">
        <Navbar />

        <div className="max-w-6xl mx-auto px-4 py-12">
          
          <div className="bg-zinc-50 dark:bg-white/5 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl p-8 mb-8 shadow-2xl transition-colors duration-300">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase mb-1 block">
                  Global Leaderboard
                </span>
                <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-slate-300 transition-colors">
                  Top Typists Rankings
                </h1>
                <p className="text-zinc-500 dark:text-slate-400 mt-1">See how you measure up against standard class percentiles</p>
              </div>
            </div>
          </div>

          {/* 🏆 Rank Display Table */}
          <div className="bg-white dark:bg-white/5 backdrop-blur-md border border-zinc-200 dark:border-white/10 rounded-2xl p-8 mb-12 shadow-2xl overflow-x-auto transition-colors duration-300">
            {statsLoading ? (
              <div className="text-center text-zinc-500 dark:text-slate-400 py-12 animate-pulse">Pulling scoreboard metrics...</div>
            ) : leaderboard.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-slate-300 text-sm font-semibold tracking-wider uppercase">
                    <th className="py-4 px-4">Rank</th>
                    <th className="py-4 px-4">Name</th>
                    <th className="py-4 px-4 text-center">Best WPM</th>
                    <th className="py-4 px-4 text-center">Avg Accuracy</th>
                    <th className="py-4 px-4 text-center">Total Tests</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => {
                    const isCurrentUser = entry.user_id === user?.id;
                    const rank = index + 1;

                    return (
                      <tr 
                        key={entry.user_id} 
                        className={`border-b border-zinc-100 dark:border-white/5 transition-colors hover:bg-zinc-50 dark:hover:bg-white/5 ${isCurrentUser ? 'bg-indigo-500/10 dark:bg-indigo-500/20 font-bold' : ''}`}
                      >
                        <td className="py-5 px-4">
                          {rank === 1 ? '🥇 1st' : rank === 2 ? '🥈 2nd' : rank === 3 ? '🥉 3rd' : `${rank}th`}
                        </td>
                        <td className="py-5 px-4 flex items-center gap-2">
                          <span className="text-zinc-900 dark:text-white">{entry.full_name}</span> 
                          {isCurrentUser && <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">You</span>}
                        </td>
                        <td className="py-5 px-4 text-center text-indigo-600 dark:text-indigo-300 font-bold">{entry.max_wpm}</td>
                        <td className="py-5 px-4 text-center text-emerald-600 dark:text-emerald-300">{entry.avg_accuracy}%</td>
                        <td className="py-5 px-4 text-center text-purple-600 dark:text-purple-300">{entry.total_tests}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-500 dark:text-slate-500">
                <p className="text-lg font-medium">No entries found yet.</p>
                <p className="text-sm mt-1">Be the first to finish a typing trial and stake your claim!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}