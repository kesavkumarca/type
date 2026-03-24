'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/config/supabase';

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

  // 🛡️ Safe Guard: Wait for Auth context to finish loading before checking permissions
  useEffect(() => {
    if (loading === false) {
      if (isAdmin === false) {
        router.push('/dashboard');
      }
    }
  }, [isAdmin, loading, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
      // Auto-fill title with file name if empty
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
      // 📝 STEP 1: Read the PDF to get the Text
      // (For a production system, you would pass this file to an API route to parse the PDF using `pdf-parse`)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('language', language);
      formData.append('level', level);

      // Example parsing via an internal Next.js API endpoint we will build
      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse the PDF file into text.');
      }

      const result = await response.json();

      setSuccess(`🎉 PDF parsed and saved successfully as a passage for ${language} ${level}!`);
      setTitle('');
      setFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to upload PDF passage');
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
              Upload PDF Passage
            </h1>
            <p className="text-slate-400 mt-1">Select a PDF to extract and store text automatically</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm">
                ✅ {success}
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
                    <option value="junior" className="bg-[#111827]">Junior (1500 Strokes)</option>
                    <option value="senior" className="bg-[#111827]">Senior (2250 Strokes)</option>
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

              {/* 📂 File Upload Drag & Drop Box */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">PDF File</label>
                <div className="border-2 border-dashed border-white/10 rounded-xl px-6 py-10 flex flex-col items-center justify-center hover:bg-white/5 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <svg className="w-12 h-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-white text-base font-semibold">
                    {file ? file.name : "Drag and drop your PDF here, or click to browse"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Supports standard text PDFs</p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all duration-300 hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Parsing PDF Text...' : 'Add Passage 🚀'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}