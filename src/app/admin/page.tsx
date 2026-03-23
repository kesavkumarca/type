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

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, loading, router]);

  // Fetch passages
  useEffect(() => {
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

    fetchPassages();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Admin Panel - Manage Passages</h1>

        {/* Add Passage Form */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Passage</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  <option value="junior">Junior</option>
                  <option value="senior">Senior</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Passage Text</label>
              <textarea
                name="text"
                value={formData.text}
                onChange={handleInputChange}
                required
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                placeholder="Paste or type the passage here..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !formData.text.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Adding...' : 'Add Passage'}
            </button>
          </form>
        </div>

        {/* Passages List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">All Passages ({passages.length})</h2>
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
                        {passage.text.substring(0, 100)}...
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
