'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/config/supabase';

// 📈 Importing Chart Components
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface Passage {
  id: string;
  text: string;
  language: string;
  level: string;
  created_at: string;
}

interface StudentProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
}

interface TestMetrics {
  total_tests: number;
  avg_wpm: number;
  avg_accuracy: number;
}

interface TestResult {
  user_id: string;
  wpm: number;
  accuracy: number;
  created_at: string;
}

function AdminPanelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin, loading } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<'students' | 'passages'>('students');

  // Search filter state for students
  const [searchQuery, setSearchQuery] = useState('');

  // 📈 Modal Selection state for charting
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [selectedStudentTests, setSelectedStudentTests] = useState<TestResult[]>([]);

  // PDF Uploader States
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [language, setLanguage] = useState<'english' | 'tamil'>('english');
  const [level, setLevel] = useState<'junior' | 'senior'>('junior');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Data Fetching States
  const [passages, setPassages] = useState<Passage[]>([]);
  const [loadingPassages, setLoadingPassages] = useState(true);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [allTestResults, setAllTestResults] = useState<TestResult[]>([]);
  const [metricsMap, setMetricsMap] = useState<Record<string, TestMetrics>>({});
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'passages') {
      setActiveTab('passages');
    } else {
      setActiveTab('students');
    }
  }, [searchParams]);

  useEffect(() => {
    if (loading === false && isAdmin === false) {
      router.push('/dashboard');
    }
  }, [isAdmin, loading, router]);

  const fetchPassages = async () => {
    try {
      setLoadingPassages(true);
      const { data, error: fetchError } = await supabase
        .from('passages')
        .select('id, text, language, level, created_at')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPassages((data as Passage[]) || []);
    } catch (err) {
      console.error('Error loading passages:', err);
    } finally {
      setLoadingPassages(false);
    }
  };

  const fetchStudentTelemetry = async () => {
    try {
      setLoadingStudents(true);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const typedProfiles = (profilesData as StudentProfile[]) || [];
      setStudents(typedProfiles);

      const { data: testsData, error: testsError } = await supabase
        .from('test_results')
        .select('user_id, wpm, accuracy, created_at')
        .order('created_at', { ascending: true }); // Chart goes chronologically left to right

      if (testsError) throw testsError;

      const typedTests = (testsData as TestResult[]) || [];
      setAllTestResults(typedTests);

      const userAggregates: Record<string, { sumWpm: number; sumAcc: number; count: number }> = {};

      typedTests.forEach((test) => {
        if (!test.user_id) return;
        if (test.wpm <= 0) return;

        if (!userAggregates[test.user_id]) {
          userAggregates[test.user_id] = { sumWpm: 0, sumAcc: 0, count: 0 };
        }
        userAggregates[test.user_id].sumWpm += test.wpm;
        userAggregates[test.user_id].sumAcc += test.accuracy;
        userAggregates[test.user_id].count += 1;
      });

      const finalMap: Record<string, TestMetrics> = {};

      typedProfiles.forEach((profile) => {
        if (!profile.id) return;

        const stats = userAggregates[profile.id];
        finalMap[profile.id] = {
          total_tests: stats ? stats.count : 0,
          avg_wpm: stats && stats.count > 0 ? Math.round(stats.sumWpm / stats.count) : 0,
          avg_accuracy: stats && stats.count > 0 ? Math.round(stats.sumAcc / stats.count) : 0,
        };
      });

      setMetricsMap(finalMap);
    } catch (err) {
      console.error('Error loading student metrics:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (loading === false && isAdmin === true) {
      fetchPassages();
      fetchStudentTelemetry();
    }
  }, [isAdmin, loading]);

  const handleSelectStudent = (student: StudentProfile) => {
    setSelectedStudent(student);
    const filterTests = allTestResults.filter(t => t.user_id === student.id && t.wpm > 0);
    setSelectedStudentTests(filterTests);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
      if (!title) {
        setTitle(selectedFile.name.replace('.pdf', ''));
      }
    } else {
      setFile(null);
      setError('Please upload a valid PDF file.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title || !file) {
      setError('Please provide a title and select a PDF file.');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('language', language);
      formData.append('level', level);

      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to parse the PDF file into text.');
      }

      setSuccess(`🎉 PDF parsed and saved successfully as a passage!`);
      setTitle('');
      setFile(null);
      fetchPassages();
    } catch (err: any) {
      setError(err.message || 'Failed to upload PDF passage');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePassage = async (passageId: string) => {
    if (!confirm('Are you sure you want to delete this passage?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('passages')
        .delete()
        .eq('id', passageId);

      if (deleteError) throw deleteError;
      setPassages((prev) => prev.filter((p) => p.id !== passageId));
    } catch (err) {
      console.error('Error deleting passage:', err);
      alert('Failed to delete passage.');
    }
  };

  const filteredStudents = students.filter((student) => {
    const nameMatch = student.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = student.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || emailMatch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="text-xl text-slate-400 animate-pulse">Loading Admin Gate...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white relative overflow-hidden">
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-indigo-600 rounded-full filter blur-[120px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-emerald-600 rounded-full filter blur-[120px] opacity-10 pointer-events-none" />

      <div className="relative z-10">
        <Navbar />

        <div className="max-w-6xl mx-auto px-4 py-12">

          <div className="mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase mb-1 block">
                Lakshmi Technical Institute
              </span>
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                Administrative Dashboard
              </h1>
              <p className="text-slate-400 mt-1">Track student progress and upload evaluation passages</p>
            </div>

            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 self-start">
              <button
                onClick={() => setActiveTab('students')}
                className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'students'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                📊 Student Progress
              </button>
              <button
                onClick={() => setActiveTab('passages')}
                className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'passages'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                📄 Manage Passages
              </button>
            </div>
          </div>

          {activeTab === 'students' && (
            <div className="space-y-6">

              {/* 🚨 FLOATING POP-UP MODAL OVERLAY */}
              {selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                  <div className="bg-[#111827] border border-white/10 rounded-2xl p-8 shadow-2xl w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">

                    <button
                      onClick={() => { setSelectedStudent(null); setSelectedStudentTests([]); }}
                      className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl transition-colors"
                    >
                      ✖️
                    </button>

                    <h3 className="text-2xl font-bold text-white mb-2">Performance Curve: {selectedStudent.full_name || 'Typist'}</h3>
                    <p className="text-sm text-slate-400 mb-6">Plotting chronological speeds (WPM) and accuracy fluctuations.</p>

                    {selectedStudentTests.length > 0 ? (
                      <div className="h-96 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={selectedStudentTests.map((t, idx) => ({
                            index: `Test ${idx + 1}`,
                            wpm: t.wpm,
                            accuracy: t.accuracy
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a324b" />
                            <XAxis dataKey="index" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                              labelStyle={{ color: '#fff' }}
                              itemStyle={{ color: '#818cf8' }}
                            />
                            <Line type="monotone" dataKey="wpm" stroke="#818cf8" strokeWidth={3} name="Speed (WPM)" dot={{ fill: '#818cf8', r: 4 }} />
                            <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} name="Accuracy %" strokeDasharray="5 5" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-72 w-full flex items-center justify-center text-slate-500 border border-dashed border-white/5 rounded-xl">
                        This typist has not logged any valid evaluation results yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Live Learner Progress Audits</h2>
                    <p className="text-xs text-slate-400 mt-1">Click a student's row to open their graph in a pop-up window!</p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      />
                      <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    <button onClick={fetchStudentTelemetry} className="w-full sm:w-auto bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg border border-white/10 text-xs font-semibold text-white transition-all whitespace-nowrap">
                      🔄 Refresh Metrics
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        <th className="px-6 py-4">Learner Profile</th>
                        <th className="px-6 py-4">Email Address</th>
                        <th className="px-6 py-4 text-center">Tests Completed</th>
                        <th className="px-6 py-4 text-center">Avg Speed</th>
                        <th className="px-6 py-4 text-center">Avg Accuracy</th>
                        <th className="px-6 py-4">Enrolled On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-white">
                      {loadingStudents ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-400 animate-pulse">Synchronizing student telemetry...</td>
                        </tr>
                      ) : filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => {
                          const metrics = metricsMap[student.id] || { total_tests: 0, avg_wpm: 0, avg_accuracy: 0 };
                          return (
                            <tr
                              key={student.id}
                              onClick={() => handleSelectStudent(student)}
                              className="cursor-pointer transition-colors hover:bg-white/5"
                            >
                              <td className="px-6 py-4 font-semibold text-white">{student.full_name || 'Anonymous Typist'}</td>
                              <td className="px-6 py-4 text-slate-400">{student.email || 'n/a'}</td>
                              <td className="px-6 py-4 text-center font-bold text-indigo-400">{metrics.total_tests}</td>
                              <td className="px-6 py-4 text-center"><span className="font-extrabold text-white">{metrics.avg_wpm}</span> <span className="text-xs text-slate-400">WPM</span></td>
                              <td className="px-6 py-4 text-center font-bold text-emerald-400">{metrics.avg_accuracy}%</td>
                              <td className="px-6 py-4 text-slate-400">{new Date(student.created_at).toLocaleDateString('en-IN')}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-500">No students found matching that search.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'passages' && (
            <>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl mb-12">
                <h2 className="text-xl font-bold mb-6">Upload New PDF Syllabus</h2>

                {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">⚠️ {error}</div>}
                {success && <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm">✅ {success}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Language</label>
                      <select value={language} onChange={(e) => setLanguage(e.target.value as 'english' | 'tamil')} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white">
                        <option value="english" className="bg-[#111827]">English</option>
                        <option value="tamil" className="bg-[#111827]">Tamil</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty Grade</label>
                      <select value={level} onChange={(e) => setLevel(e.target.value as 'junior' | 'senior')} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white">
                        <option value="junior" className="bg-[#111827]">Junior (1500 Strokes)</option>
                        <option value="senior" className="bg-[#111827]">Senior (2250 Strokes)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Passage Title / Reference Number</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., English Junior Test Set 1" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">PDF File</label>
                    <div className="border-2 border-dashed border-white/10 rounded-xl px-6 py-10 flex flex-col items-center justify-center hover:bg-white/5 transition-colors cursor-pointer relative">
                      <input type="file" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <svg className="w-12 h-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-white text-base font-semibold">{file ? file.name : "Drag and drop your PDF here, or click to browse"}</p>
                    </div>
                  </div>

                  <button type="submit" disabled={uploading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50">
                    {uploading ? 'Parsing PDF Text...' : 'Add Passage 🚀'}
                  </button>
                </form>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Existing Database Passages</h2>
                  <div className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-md border border-emerald-500/30">Total Loaded: {passages.length}</div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        <th className="px-6 py-4">Title Prefix</th>
                        <th className="px-6 py-4">Language</th>
                        <th className="px-6 py-4">Grade</th>
                        <th className="px-6 py-4">Created On</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-white">
                      {loadingPassages ? (
                        <tr><td colSpan={5} className="text-center py-12 text-slate-400 animate-pulse">Syncing passages...</td></tr>
                      ) : passages.length > 0 ? (
                        passages.map((p) => (
                          <tr key={p.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-semibold text-white truncate max-w-xs">{p.text.slice(0, 45)}...</td>
                            <td className="px-6 py-4 capitalize text-indigo-300">{p.language}</td>
                            <td className="px-6 py-4 capitalize text-emerald-400">{p.level}</td>
                            <td className="px-6 py-4 text-slate-400">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                            <td className="px-6 py-4 text-center">
                              <button onClick={() => handleDeletePassage(p.id)} className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white px-3 py-1.5 rounded-md text-xs font-bold transition-all">Delete 🗑️</button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={5} className="text-center py-12 text-slate-500">No passages found. Add one above!</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default function CombinedAdminPanel() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="text-xl text-slate-400 animate-pulse">Loading Admin Gate...</div>
      </div>
    }>
      <AdminPanelContent />
    </Suspense>
  );
}