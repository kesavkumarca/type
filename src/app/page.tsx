import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-600">
      <nav className="bg-transparent text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Lakshmi Technical Institute</h1>
          <div className="flex gap-4">
            <Link href="/login" className="hover:bg-indigo-700 px-4 py-2 rounded-lg transition">
              Log In
            </Link>
            <Link
              href="/signup"
              className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center text-white mb-16">
          <h2 className="text-6xl font-bold mb-6">Master Your Typing Skills</h2>
          <p className="text-2xl mb-8 opacity-90">
            Join Lakshmi Technical Institute's typing test platform and improve your speed and accuracy.
          </p>
          <Link
            href="/signup"
            className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition inline-block"
          >
            Get Started Now
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          {/* Card 1 */}
          <div className="bg-white bg-opacity-90 backdrop-blur-lg rounded-lg p-8 text-gray-900 hover:bg-opacity-100 transition shadow-lg">
            <div className="text-5xl mb-4">⚡</div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Real-Time Metrics</h3>
            <p className="text-lg text-gray-700">
              Track your WPM, accuracy, and progress in real-time during each typing test.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white bg-opacity-90 backdrop-blur-lg rounded-lg p-8 text-gray-900 hover:bg-opacity-100 transition shadow-lg">
            <div className="text-5xl mb-4">🌍</div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Multiple Languages</h3>
            <p className="text-lg text-gray-700">
              Practice typing in English and Tamil with difficulty levels for all skill levels.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white bg-opacity-90 backdrop-blur-lg rounded-lg p-8 text-gray-900 hover:bg-opacity-100 transition shadow-lg">
            <div className="text-5xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Leaderboard</h3>
            <p className="text-lg text-gray-700">
              Compete with other students and see where you stand on our global leaderboard.
            </p>
          </div>
        </div>

        <div className="mt-20 bg-white rounded-lg p-12 shadow-lg">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Sign Up</h4>
              <p className="text-gray-600">Create your account in seconds</p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Choose Test</h4>
              <p className="text-gray-600">Select language and difficulty level</p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Type Away</h4>
              <p className="text-gray-600">Complete the 10-minute typing test</p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                4
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Track Progress</h4>
              <p className="text-gray-600">View results and climb the leaderboard</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-black bg-opacity-20 text-white mt-20 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>&copy; 2026 Lakshmi Technical Institute. All rights reserved.</p>
          <div className="mt-4 flex justify-center gap-6">
            <Link href="/contact" className="hover:text-indigo-200 transition">
              Contact Us
            </Link>
            <Link href="/login" className="hover:text-indigo-200 transition">
              Log In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}