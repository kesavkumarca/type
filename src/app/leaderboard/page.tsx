'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/config/supabase'; // 🎯 Uses your centralized config

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avg_wpm: number;
  avg_accuracy: number;
  total_tests: number;
}

export default function Leaderboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setPageLoading(true);

        // 🎯 1. Fetch data with an explicit foreign key map to get names
        const { data: testData, error: testError } = await supabase
          .from('test_results')
          .select(`
            user_id,
            wpm,
            accuracy,
            profiles:user_id (
              full_name
            )
          `);

        if (testError) throw testError;

        if (!testData || testData.length === 0) {
          setLeaderboard([]);
          return;
        }

        // 🎯 2. Group tests by user_id to find averages
        const userStatsMap: { [key: string]: { wpmSum: number; accuracySum: number; count: number; name: string } } = {};

        testData.forEach((test: any) => {
          const uId = test.user_id;
          
          // Checks both standard profiles and mapped profiles variables for safety
          const profileInfo = test.profiles;
          const name = profileInfo?.full_name || 'Anonymous Student';

          if (!userStatsMap[uId]) {
            userStatsMap[uId] = { wpmSum: 0, accuracySum: 0, count: 0, name };
          }

          userStatsMap[uId].wpmSum += test.wpm || 0;
          userStatsMap[uId].accuracySum += test.accuracy || 0;
          userStatsMap[uId].count += 1;
        });

        // 🎯 3. Form standard leaderboard array and calculate final averages
        const unsortedLeaderboard: LeaderboardEntry[] = Object.keys(userStatsMap).map((uId) => {
          const stats = userStatsMap[uId];
          return {
            user_id: uId,
            full_name: stats.name,
            avg_wpm: Math.round(stats.wpmSum / stats.count),
            avg_accuracy: Math.round(stats.accuracySum / stats.count),
            total_tests: stats.count,
          };
        });

        // 🎯 4. Sort by highest WPM (Speed) first!
        unsortedLeaderboard.sort((a, b) => {
          if (b.avg_wpm === a.avg_wpm) {
            return b.avg_accuracy - a.avg_accuracy; // Tie-breaker: Highest Accuracy
          }
          return b.avg_wpm - a.avg_wpm;
        });

        setLeaderboard(unsortedLeaderboard);
      } catch (err) {
        console.error('Error calculating live leaderboard:', err);
      } finally {
        setPageLoading(false);
      }
    };

    if (user) {
      fetchLeaderboardData();
    }
  }, [user]);

  if (pageLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading Rankings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">🏆 Institute Leaderboard</h1>

        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Avg WPM</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Avg Accuracy</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Tests Taken</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-900">
                {leaderboard.map((entry, index) => (
                  <tr
                    key={entry.user_id}
                    className={`hover:bg-gray-50 ${
                      index === 0 ? 'bg-yellow-50' : index === 1 ? 'bg-gray-100' : index === 2 ? 'bg-orange-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold">{entry.full_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-lg font-bold text-indigo-600">{entry.avg_wpm}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-lg font-bold text-blue-600">{entry.avg_accuracy}%</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-lg font-bold text-purple-600">{entry.total_tests}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {leaderboard.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-gray-600 text-lg">No test results yet. Practice to see rankings!</p>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <a
            href="/dashboard"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}