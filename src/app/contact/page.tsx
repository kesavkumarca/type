'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function ContactUs() {
  const { user } = useAuth();
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
    <div className="min-h-screen bg-white dark:bg-[#0b0f19] text-zinc-900 dark:text-white relative overflow-hidden transition-colors duration-300">
      {/* 🔮 Background Neon Orbs for Glassmorphism Context */}
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-indigo-600 rounded-full filter blur-[120px] opacity-10 dark:opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-emerald-600 rounded-full filter blur-[120px] opacity-10 dark:opacity-10 pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-600 rounded-full filter blur-[100px] opacity-10 dark:opacity-10 pointer-events-none" />

      <div className="relative z-10">
        {user ? <Navbar /> : (
          <nav className="bg-white dark:bg-[#0b0f19] border-b border-zinc-200 dark:border-white/5 shadow-lg transition-colors duration-300">
            <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
              <Link href="/" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors">
                Lakshmi Tech
              </Link>
              <div className="flex gap-4">
                <Link href="/login" className="text-zinc-600 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10 px-4 py-2 rounded-lg transition-colors">
                  Log In
                </Link>
                <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                  Sign Up
                </Link>
              </div>
            </div>
          </nav>
        )}

        <div className="max-w-2xl mx-auto px-4 py-12">
          
          <div className="bg-zinc-50 dark:bg-white/5 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl p-8 shadow-2xl mb-12 transition-colors duration-300">
            <span className="text-xs font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase mb-1 block text-center">
              Reach Out
            </span>
            <h1 className="text-4xl font-extrabold text-center text-zinc-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-slate-300 mb-4">
              Contact Us
            </h1>
            <p className="text-center text-zinc-500 dark:text-slate-400 mb-8">
              Have a question or suggestion? Send us a message on WhatsApp!
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-slate-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 transition-colors duration-300"
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-slate-300 mb-2">
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
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 transition-colors duration-300"
                  placeholder="10 digit mobile number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-slate-300 mb-2">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 transition-colors duration-300"
                  placeholder="Type your question here..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/20"
              >
                {loading ? 'Opening WhatsApp...' : 'Send to WhatsApp 📱'}
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a 
              href="mailto:lakshmitechinstitute97@gmail.com" 
              className="bg-zinc-50 dark:bg-white/5 backdrop-blur-md border border-zinc-200 dark:border-white/10 p-6 rounded-2xl shadow-lg text-center hover:bg-white dark:hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center group"
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">📧</div>
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Email</h3>
              <p className="text-indigo-600 dark:text-indigo-300 break-all text-xs font-mono">lakshmitechinstitute97@gmail.com</p>
            </a>

            <a 
              href="https://maps.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-zinc-50 dark:bg-white/5 backdrop-blur-md border border-zinc-200 dark:border-white/10 p-6 rounded-2xl shadow-lg text-center hover:bg-white dark:hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center group"
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">📍</div>
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Location</h3>
              <p className="text-emerald-600 dark:text-emerald-300 text-sm">Madurai, India</p>
            </a>

            <div className="bg-zinc-50 dark:bg-white/5 backdrop-blur-md border border-zinc-200 dark:border-white/10 p-6 rounded-2xl shadow-lg text-center flex flex-col items-center hover:bg-white dark:hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 group transition-colors duration-300">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">📱</div>
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Phone</h3>
              <div className="flex flex-col gap-1 text-xs">
                <a href="tel:+918973120153" className="text-indigo-600 dark:text-indigo-300 hover:underline">+91 89731 20153</a>
                <a href="tel:+917397161516" className="text-indigo-600 dark:text-indigo-300 hover:underline">+91 73971 61516</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}