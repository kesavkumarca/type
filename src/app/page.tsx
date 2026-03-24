'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-white relative overflow-hidden">
      
      {/* 🔮 Aesthetic Glowing Background Orbs */}
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-indigo-600 rounded-full filter blur-[120px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-emerald-600 rounded-full filter blur-[120px] opacity-10 pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-600 rounded-full filter blur-[100px] opacity-10 pointer-events-none" />

      <div className="relative z-10">
        
        {/* 🛰️ Glassy Landing Navbar */}
        <nav className="bg-white/5 backdrop-blur-md border-b border-white/10 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight text-white hover:text-indigo-300 transition-colors">
              Lakshmi Tech
            </h1>
            <div className="flex gap-4">
              <Link href="/login" className="text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors">
                Log In
              </Link>
              <Link
                href="/signup"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-indigo-500/20 transition-all"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 py-20">
          
          {/* 🎯 Hero Section */}
          <div className="text-center text-white mb-16">
            <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase mb-2 block">
              Authorized Typing Master Center
            </span>
            <h2 className="text-6xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
              Master Your Typing Skills
            </h2>
            <p className="text-xl mb-8 text-slate-400 max-w-2xl mx-auto">
              Join Lakshmi Technical Institute's typing test platform and improve your speed and accuracy metrics.
            </p>
            <Link
              href="/signup"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-emerald-500/20 inline-block"
            >
              Get Started Now 🚀
            </Link>
          </div>

          {/* ✨ Feature Glass Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 shadow-xl group">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">⚡</div>
              <h3 className="text-2xl font-bold mb-4 text-white">Real-Time Metrics</h3>
              <p className="text-base text-slate-400">
                Track your WPM, accuracy, and progress metrics live during each standardized typing test sequence.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 shadow-xl group">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🌍</div>
              <h3 className="text-2xl font-bold mb-4 text-white">Multiple Languages</h3>
              <p className="text-base text-slate-400">
                Practice typing seamlessly in English and Tamil with calibration modules for all student skill parameters.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 shadow-xl group">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🏆</div>
              <h3 className="text-2xl font-bold mb-4 text-white">Global Ranking</h3>
              <p className="text-base text-slate-400">
                Compete with other students and see where you stand on our live institute ranking boards.
              </p>
            </div>
          </div>

          {/* 🛠️ How it Works section translated to dark glass */}
          <div className="mt-20 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 shadow-2xl">
            <h3 className="text-3xl font-bold text-white text-center mb-12">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              
              <div className="text-center group">
                <div className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/10">
                  1
                </div>
                <h4 className="font-bold text-white mb-2">Sign Up</h4>
                <p className="text-sm text-slate-400">Create your secure profile dashboard parameters in seconds</p>
              </div>

              <div className="text-center group">
                <div className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/10">
                  2
                </div>
                <h4 className="font-bold text-white mb-2">Choose Test</h4>
                <p className="text-sm text-slate-400">Select language dynamics and target accuracy metrics</p>
              </div>

              <div className="text-center group">
                <div className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/10">
                  3
                </div>
                <h4 className="font-bold text-white mb-2">Type Away</h4>
                <p className="text-sm text-slate-400">Complete standard 10-minute automated typing sessions</p>
              </div>

              <div className="text-center group">
                <div className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/10">
                  4
                </div>
                <h4 className="font-bold text-white mb-2">Track Metrics</h4>
                <p className="text-sm text-slate-400">View analytics results and climb the live ranking logs</p>
              </div>

            </div>
          </div>
        </div>

        {/* 🦶 Glassy Footer */}
        <footer className="bg-white/5 backdrop-blur-md border-t border-white/10 text-white mt-20 py-12">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-slate-400">&copy; 2026 Lakshmi Technical Institute. All rights reserved.</p>
            <div className="mt-4 flex justify-center gap-6">
              <Link href="/contact" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
                Contact Us
              </Link>
              <Link href="/login" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
                Log In
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}