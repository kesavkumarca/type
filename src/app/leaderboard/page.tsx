'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/config/supabase';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

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
  // FIX #4: Added error state so users see a real message on fetch failure
  const [fetchError, setFetchError] = useState(false);

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
          const avgWPM =
            data.reduce((sum: number, result: { wpm: number; accuracy: number; created_at: string }) => sum + result.wpm, 0) / data.length;
          const avgAccuracy =
            data.reduce((sum: number, result: { wpm: number; accuracy: number; created_at: string }) => sum + result.accuracy, 0) /
            data.length;

          setStats({
            avgWPM: Math.round(avgWPM),
            avgAccuracy: Math.round(avgAccuracy),
            totalTests: data.length,
          });

          // FIX #2 + #3: Use actual created_at for X-axis labels and correct test numbering
          const last10 = data.slice(-10);
          const startIndex = data.length - last10.length;

          const formattedData = last10.map((result: { wpm: number; accuracy: number; created_at: string }, index: number) => ({
            testDate: new Date(result.created_at).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
            }),
            testNumber: startIndex + index + 1, // correct global test number
            wpm: result.wpm,
            accuracy: result.accuracy,
          }));

          setGraphData(formattedData);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
        // FIX #4: Set error state instead of silently failing
        setFetchError(true);
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
              <h1 className="text-4xl font-bold text-gray-900">
                {profile?.full_name || 'Welcome'}
              </h1>
              <p className="text-gray-600 mt-2">{profile?.email}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600">Mobile</p>
              <p className="text-2xl font-semibold text-indigo-600">
                {profile?.mobile_number}
              </p>
            </div>
          </div>
        </div>

        {/* FIX #4: Show error banner if fetch failed */}
        {fetchError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-6 py-4 mb-6">
            <p className="font-semibold">Could not load your stats.</p>
            <p className="text-sm mt-1">
              There was a problem fetching your test results. Please refresh the
              page or try again later.
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Average WPM Card — FIX #1: replaced smiley icon with keyboard/speed icon */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Average WPM</p>
                <p className="text-4xl font-bold text-indigo-600 mt-2">
                  {statsLoading ? '-' : stats.avgWPM}
                </p>
              </div>
              <div className="bg-indigo-100 p-4 rounded-lg">
                {/* Keyboard icon — semantically correct for typing speed */}
                <svg
                  className="w-8 h-8 text-indigo-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 5H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 5H5v-2h2v2zm9 0H8v-2h8v2zm0-3h-2v-2h2v2zm0-3h-2V8h2v2zm3 6h-2v-2h2v2zm0-3h-2v-2h2v2zm0-3h-2V8h2v2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Average Accuracy Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Average Accuracy
                </p>
                <p className="text-4xl font-bold text-blue-600 mt-2">
                  {statsLoading ? '-' : `${stats.avgAccuracy}%`}
                </p>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Tests Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Tests Taken
                </p>
                <p className="text-4xl font-bold text-purple-600 mt-2">
                  {statsLoading ? '-' : stats.totalTests}
                </p>
              </div>
              <div className="bg-purple-100 p-4 rounded-lg">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Graph Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mt-12 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Your Performance Progress
          </h2>

          {statsLoading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <p className="text-lg">Loading chart...</p>
            </div>
          ) : fetchError ? (
            <div className="flex items-center justify-center h-64 text-red-400">
              <p className="text-lg">Chart unavailable due to a data error.</p>
            </div>
          ) : graphData.length > 0 ? (
            <div className="h-96 text-gray-900">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={graphData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  {/* FIX #2 + #3: X-axis now shows real date labels */}
                  <XAxis dataKey="testDate" stroke="#4b5563" />
                  <YAxis stroke="#4b5563" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#111827' }}
                    // Show test number in tooltip for context
                    formatter={(value: number | string) => [value]}
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0) {
                        const testNum = (payload[0].payload as { testNumber: number }).testNumber;
                        return `${label} · Test #${testNum}`;
                      }
                      return label;
                    }}
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
              <p className="text-sm mt-1">
                Take your first typing test to see your progress graph!
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Quick Actions
          </h2>
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