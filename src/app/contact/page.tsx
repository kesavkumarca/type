'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function ContactUs() {
  const { user } = useAuth(); // ✅ Fixed the typo here!
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const adminPhone = '918973120153';

    const textMessage = `Hello Lakshmi Tech Institute,\n\n` +
                        `I have a query.\n` +
                        `*Name:* ${formData.name}\n` +
                        `*Mobile:* ${formData.mobile}\n` +
                        `*Message:* ${formData.message}`;

    const encodedMessage = encodeURIComponent(textMessage);
    const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');

    setLoading(false);
    setFormData({ name: '', mobile: '', message: '' }); 
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {user ? <Navbar /> : (
        <nav className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold">
              Lakshmi Tech Institute
            </Link>
            <div className="flex gap-4">
              <Link href="/login" className="hover:bg-indigo-700 px-4 py-2 rounded-lg">
                Log In
              </Link>
              <Link href="/signup" className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold">
                Sign Up
              </Link>
            </div>
          </div>
        </nav>
      )}

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">Contact Us</h1>
          <p className="text-center text-gray-600 mb-8">
            Have a question or suggestion? Send us a message on WhatsApp!
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
                placeholder="Your Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                required
                pattern="[0-9]{10}"
                title="Please enter a valid 10 digit mobile number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
                placeholder="10 digit mobile number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-gray-900"
                placeholder="Type your question here..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Opening WhatsApp...' : 'Send to WhatsApp 📱'}
            </button>
          </form>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <a 
            href="mailto:lakshmitechinstitute97@gmail.com" 
            className="bg-white p-6 rounded-lg shadow-lg text-center hover:shadow-xl transition flex flex-col items-center"
          >
            <div className="text-3xl mb-4">📧</div>
            <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
            <p className="text-blue-600 break-all text-sm">lakshmitechinstitute97@gmail.com</p>
          </a>

          <a 
            href="https://maps.app.goo.gl/pDLXUHWAcjYPLhfb6" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white p-6 rounded-lg shadow-lg text-center hover:shadow-xl transition flex flex-col items-center"
          >
            <div className="text-3xl mb-4">📍</div>
            <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
            <p className="text-blue-600">Madurai, India</p>
          </a>

          <div className="bg-white p-6 rounded-lg shadow-lg text-center flex flex-col items-center">
            <div className="text-3xl mb-4">📱</div>
            <h3 className="font-semibold text-gray-900 mb-2">Phone</h3>
            <div className="flex flex-col gap-1 text-sm">
              <a href="tel:+918973120153" className="text-blue-600 hover:underline">+91 89731 20153</a>
              <a href="tel:+917397161516" className="text-blue-600 hover:underline">+91 73971 61516</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}