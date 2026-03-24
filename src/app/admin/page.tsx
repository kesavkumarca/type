'use client';

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

export default function AdminPanel() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();

  const [passages, setPassages] = useState<Passage[]>([]);
  const [formData, setFormData] = useState({
    text: '',
    language: 'english',
    level: 'junior',
  });
  const [submitting, setSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // 📂 PDF Upload States
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadReport, setUploadReport] = useState<{ fileName: string; status: string }[]>([]);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, loading, router]);

  const fetchPassages = async () => {
    try {
      const { data, error } = await supabase
        .from('passages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPassages(data || []);
    } catch (err) {
      console.error('Error fetching passages:', err);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchPassages();
    }
  }, [isAdmin]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 📁 Track files locally without instantly uploading
  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
    }
  };

  // 🚀 Manual Multi-PDF Upload Handler (Hits the correct bulk API endpoint!)
  const handleBulkPdfUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploadingPdf(true);
    setUploadReport([]);

    const pdfFormData = new FormData();
    // Append all selected files to the form
    for (let i = 0; i < selectedFiles.length; i++) {
      pdfFormData.append('files', selectedFiles[i]);
    }
    pdfFormData.append('language', formData.language);
    pdfFormData.append('level', formData.level);

    try {
      const response = await fetch('/api/upload-multiple-pdfs', {
        method: 'POST',
        body: pdfFormData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadReport(data.results);
        alert('Bulk PDF Processing Complete!');
        setSelectedFiles(null); // Clear the file picker
        fetchPassages(); // Refresh the visual table
      } else {
        alert(data.error || 'Failed to upload PDFs');
      }
    } catch (err) {
      console.error('Error during bulk upload:', err);
      alert('An error occurred while uploading PDFs.');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.text.trim()) return;

    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('passages')
        .insert([
          {
            text: formData.text,
            language: formData.language,
            level: formData.level,
          },
        ])
        .select();

      if (error) throw error;

      if (data) {
        setPassages([data[0], ...passages]);
        setFormData({ text: '', language: 'english', level: 'junior' });
        alert('Passage added successfully!');
      }
    } catch (err) {
      console.error('Error adding passage:', err);
      alert('Failed to add passage');
    } finally {
      setSubmitting(false);
    }
  };

  const deletePassage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this passage?')) return;

    try {
      const { error } = await supabase.from('passages').delete().eq('id', id);

      if (error) throw error;

      setPassages(passages.filter(p => p.id !== id));
      alert('Passage deleted successfully!');
    } catch (err) {
      console.error('Error deleting passage:', err);
      alert('Failed to delete passage');
    }
  };

  if (pageLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-12">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Admin Panel - Manage Passages</h1>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Passage (PDF or Manual)</h2>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
                >
                  <option value="english">English</option>
                  <option value="tamil">Tamil</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
                >
                  <option value="junior">Junior</option>
                  <option value="senior">Senior</option>
                </select>
              </div>
            </div>

            <hr className="my-6 border-gray-200" />

            {/* 📂 QUICK BULK PDF ZONE */}
            <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center bg-slate-50">
              <label className="block text-lg font-bold text-gray-800 mb-2">
                📂 Select Multiple Question PDFs
              </label>
              <p className="text-xs text-gray-500 mb-4">
                Select Language and Level above, choose your PDF files, and then click upload!
              </p>
              <input
                type="file"
                accept="application/pdf"
                multiple
                onChange={handleFileSelection}
                disabled={isUploadingPdf}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 cursor-pointer"
              />
              
              {selectedFiles && selectedFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-700 font-medium mb-2">Selected: {selectedFiles.length} file(s)</p>
                  <button
                    onClick={handleBulkPdfUpload}
                    disabled={isUploadingPdf}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingPdf ? 'Uploading...' : '🚀 Upload PDFs to Database'}
                  </button>
                </div>
              )}
            </div>

            {/* 📊 Bulk Upload Report Card */}
            {uploadReport.length > 0 && (
              <div className="bg-slate-50 p-4 border rounded-lg h-36 overflow-y-auto">
                <h3 className="text-sm font-bold text-gray-800 mb-2">Upload Logs:</h3>
                {uploadReport.map((rep, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1 border-b">
                    <span className="text-gray-700 truncate max-w-sm">{rep.fileName}</span>
                    <span className="font-semibold">{rep.status}</span>
                  </div>
                ))}
              </div>
            )}

            <hr className="my-6 border-gray-200" />

            {/* ✍️ FALLBACK MANUAL TEXT BOX */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Or Paste Text Manually</label>
                <textarea
                  name="text"
                  value={formData.text}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-gray-900"
                  placeholder="Paste or type a single passage here..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !formData.text.trim() || isUploadingPdf}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Adding...' : 'Add Passage Manually'}
              </button>
            </form>
          </div>
        </div>

        {/* Passages List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">All Live Passages ({passages.length})</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Language</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Level</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Preview</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Created</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {passages.map(passage => (
                  <tr key={passage.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {passage.language}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {passage.level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 truncate max-w-xs">
                        {passage.text ? passage.text.substring(0, 100) : 'N/A'}...
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">
                        {new Date(passage.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => deletePassage(passage.id)}
                        className="text-red-600 hover:text-red-700 font-semibold text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {passages.length === 0 && (
            <div className="p-6 text-center text-gray-600">
              No passages yet. Add one to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}