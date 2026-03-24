'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/config/supabase';

export default function AdminPassages() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [language, setLanguage] = useState<'english' | 'tamil'>('english');
  const [level, setLevel] = useState<'junior' | 'senior'>('junior');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // 🛡️ Wait for load to finish so you don't get booted to dashboard
  useEffect(() => {
    if (loading === false) {
      if (isAdmin === false) {
        router.push('/dashboard');
      }
    }
  }, [isAdmin, loading, router]);

  const strokeLimit = level === 'junior' ? 1500 : 2250;
  const currentStrokes = content.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title || !content) {
      setError('Please fill in both the title and text content.');
      return;
    }

    setUploading(true);

    try {
      const { error: insertError } = await supabase
        .from('typing_passages') // Ensure this matches your Supabase table name
        .insert([
          {
            title,
            content,
            language,
            level,
            stroke_limit: strokeLimit,
            created_by: user?.id,
          },
        ]);

      if (insertError) throw insertError;

      setSuccess(`Passage added successfully for ${language} ${level}!`);
      setTitle('');
      setContent('');
    } catch (err: any) {
      setError(err.message || 'Failed to upload passage');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="text-xl text-slate-400 animate-pulse">Loading Admin Gate...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white relative overflow-hidden">
      
      {/* 🔮 Aesthetic Glowing Background Orbs */}
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-indigo-600 rounded-full filter blur-[120px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-emerald-600 rounded-full filter blur-[120px] opacity-10 pointer-events-none" />

      <div className="relative z-10">
        <Navbar />

        <div className="max-w-4xl mx-auto px-4 py-12">
          
          <div className="mb-12">
            <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase mb-1 block">
              Test Syllabus Master
            </span>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
              Add New Typing Passage
            </h1>
            <p className="text-slate-400 mt-1">Populate standardized text parameters for your students</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm">
                🎉 {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Dropdown Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'english' | 'tamil')}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-white"
                  >
                    <option value="english" className="bg-[#111827]">English</option>
                    <option value="tamil" className="bg-[#111827]">Tamil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty Grade</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as 'junior' | 'senior')}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-white"
                  >
                    <option value="junior" className="bg-[#111827]">Junior (30 WPM - 1500 Strokes)</option>
                    <option value="senior" className="bg-[#111827]">Senior (45 WPM - 2250 Strokes)</option>
                  </select>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Passage Title / Reference Number</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., English Junior Test Set 1"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-white placeholder-slate-500"
                />
              </div>

              {/* Character Textarea */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-300">Typing Content</label>
                  <span className={`text-xs font-semibold ${currentStrokes > strokeLimit ? 'text-red-400' : 'text-indigo-400'}`}>
                    Strokes: {currentStrokes} / {strokeLimit}
                  </span>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  placeholder="Paste your standardized typing passage text here..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-white placeholder-slate-500 font-mono tracking-wide leading-relaxed"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all duration-300 hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading to Database...' : 'Add Passage 🚀'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}