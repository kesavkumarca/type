'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/config/supabase';

interface Passage {
  id: string;
  text: string;
  language: string;
  level: string;
  created_at: string;
}

export default function AdminUploadPDF() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [language, setLanguage] = useState<'english' | 'tamil'>('english');
  const [level, setLevel] = useState<'junior' | 'senior'>('junior');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Existing passages state
  const [passages, setPassages] = useState<Passage[]>([]);
  const [loadingPassages, setLoadingPassages] = useState(true);

  // 🛡️ Route Guard
  useEffect(() => {
    if (loading === false) {
      if (isAdmin === false) {
        router.push('/dashboard');
      }
    }
  }, [isAdmin, loading, router]);

  // 📊 Fetch Existing Passages
  const fetchPassages = async () => {
    try {
      setLoadingPassages(true);
      const { data, error: fetchError } = await supabase
        .from('passages') // Ensure this matches your exact table name in Supabase
        .select('id, text, language, level, created_at')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPassages(data || []);
    } catch (err) {
      console.error('Error loading passages:', err);
    } finally {
      setLoadingPassages(false);
    }
  };

  useEffect(() => {
    if (loading === false && isAdmin === true) {
      fetchPassages();
    }
  }, [isAdmin, loading]);

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

      // 🔍 Read the actual response from your route.ts
      const result = await response.json();

      if (!response.ok) {
        // 🚀 Display the exact server error (e.g., blank PDF, database crash, etc.)
        throw new Error(result.error || 'Failed to parse the PDF file into text.');
      }

      setSuccess(`🎉 PDF parsed and saved successfully as a passage!`);
      setTitle('');
      setFile(null);
      
      // Refresh the table list after a successful upload
      fetchPassages();
    } catch (err: any) {
      setError(err.message || 'Failed to upload PDF passage');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (passageId: string) => {
    if (!confirm('Are you sure you want to delete this passage?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('passages') // 👈 Changed from typing_passages to passages
        .delete()
        .eq('id', passageId);

      if (deleteError) throw deleteError;

      // Update the local state UI to remove it
      setPassages((prev) => prev.filter((p) => p.id !== passageId));
    } catch (err) {
      console.error('Error deleting passage:', err);
      alert('Failed to delete passage.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0b0f19] flex items-center justify-center transition-colors duration-300">
        <div className="text-xl text-zinc-500 dark:text-slate-400 animate-pulse">Loading Admin Gate...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b0f19] text-zinc-900 dark:text-white relative overflow-hidden transition-colors duration-300">
      
      {/* 🔮 Aesthetic Glowing Background Orbs */}
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-indigo-600 rounded-full filter blur-[120px] opacity-10 dark:opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-emerald-600 rounded-full filter blur-[120px] opacity-10 dark:opacity-10 pointer-events-none" />

      <div className="relative z-10">
        <Navbar />

        <div className="max-w-5xl mx-auto px-4 py-12">
          
          <div className="mb-12">
            <span className="text-xs font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase mb-1 block">
              Test Syllabus Master
            </span>
            <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-slate-300 transition-colors">
              Passage Management
            </h1>
            <p className="text-zinc-500 dark:text-slate-400 mt-1">Upload and oversee standardized typing syllabus parameters</p>
          </div>

          {/* 📤 Upload Form Section */}
          <div className="bg-zinc-50 dark:bg-white/5 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl p-8 shadow-2xl mb-12 transition-colors duration-300">
            <h2 className="text-xl font-bold mb-6 text-zinc-900 dark:text-white">Upload New PDF Passage</h2>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400 text-sm">
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-600 dark:text-emerald-400 text-sm">
                ✅ {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-slate-300 mb-2">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'english' | 'tamil')}
                    className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900 dark:text-white transition-colors duration-300"
                  >
                    <option value="english" className="bg-white dark:bg-[#111827] text-zinc-900 dark:text-white">English</option>
                    <option value="tamil" className="bg-white dark:bg-[#111827] text-zinc-900 dark:text-white">Tamil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-slate-300 mb-2">Difficulty Grade</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as 'junior' | 'senior')}
                    className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900 dark:text-white transition-colors duration-300"
                  >
                    <option value="junior" className="bg-white dark:bg-[#111827] text-zinc-900 dark:text-white">Junior (1500 Strokes)</option>
                    <option value="senior" className="bg-white dark:bg-[#111827] text-zinc-900 dark:text-white">Senior (2250 Strokes)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-slate-300 mb-2">Passage Title / Reference Number</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., English Junior Test Set 1"
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 transition-colors duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-slate-300 mb-2">PDF File</label>
                <div className="border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-xl px-6 py-10 flex flex-col items-center justify-center hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <svg className="w-12 h-12 text-zinc-400 dark:text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-zinc-900 dark:text-white text-base font-semibold">
                    {file ? file.name : "Drag and drop your PDF here, or click to browse"}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1">Supports standard text PDFs</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all duration-300 hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Parsing PDF Text...' : 'Add Passage 🚀'}
              </button>
            </form>
          </div>

          {/* 📜 ⬇️ Existing Passages Table Subsection ⬇️ 📜 */}
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-colors duration-300">
            <div className="p-6 border-b border-zinc-200 dark:border-white/10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Existing Database Passages</h2>
                <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1">Review active passages calibrated for testing</p>
              </div>
              <div className="bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-md border border-emerald-500/30">
                Total Loaded: {passages.length}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-white/5 text-zinc-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Language</th>
                    <th className="px-6 py-4">Grade Level</th>
                    <th className="px-6 py-4">Date Created</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-white/5 text-sm">
                  {loadingPassages ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-zinc-500 dark:text-slate-400 animate-pulse">
                        Synchronizing database passages list...
                      </td>
                    </tr>
                  ) : passages.length > 0 ? (
                    passages.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-white truncate max-w-xs">{p.text}</td>
                        <td className="px-6 py-4 capitalize text-indigo-600 dark:text-indigo-300">{p.language}</td>
                        <td className="px-6 py-4 capitalize text-emerald-600 dark:text-emerald-400">{p.level}</td>
                        <td className="px-6 py-4 text-zinc-500 dark:text-slate-400">
                          {new Date(p.created_at).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500 text-red-600 dark:text-red-400 hover:text-white px-3 py-1.5 rounded-md text-xs font-bold transition-all"
                          >
                            Delete 🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-zinc-400 dark:text-slate-500">
                        No passages found in the database. Use the uploader above to add one!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}