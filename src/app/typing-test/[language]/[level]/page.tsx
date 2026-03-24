'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/config/supabase';

interface Passage {
  id: string;
  text: string;
  language: string;
  level: string;
}

export default function TypingTest() {
  const params = useParams();
  const language = (params.language as string) || 'english';
  const level = (params.level as string) || 'junior';

  const router = useRouter();
  const { user, loading } = useAuth();

  const [passage, setPassage] = useState<Passage | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [testComplete, setTestComplete] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // 🛡️ NEW STATE: Blocks users from double clicking the submit button!
  const [isSubmitting, setIsSubmitting] = useState(false); 

  // Fetch passage
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }

    const fetchPassage = async () => {
      try {
        const { data, error } = await supabase
          .from('passages')
          .select('*')
          .eq('language', language)
          .eq('level', level);

        if (error) throw error;

        if (data && data.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.length);
          setPassage(data[randomIndex]);
        } else {
          setPassage(null);
        }
      } catch (err) {
        console.error('Error fetching passage:', err);
      } finally {
        setPageLoading(false);
      }
    };

    fetchPassage();
  }, [user, loading, router, language, level]);

  // Timer
  useEffect(() => {
    if (!testStarted || testComplete) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setTestComplete(true);
          clearInterval(timer);
          submitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, testComplete]);

  // 🧮 Calculate Metrics, Mistakes, and Marks!
  const calculateMetrics = useCallback(() => {
    if (!passage) return { wpm: 0, accuracy: 0, strokes: 0, correctWords: 0, mistakes: 0, marks: 0, passed: false };

    const strokes = userInput.length;
    
    // Split texts into words array
    const typedWords = userInput.trim().split(/\s+/).filter(Boolean);
    const targetWords = passage.text.trim().split(/\s+/).filter(Boolean);

    let correctWords = 0;
    let mistakes = 0;

    targetWords.forEach((word, index) => {
      if (index < typedWords.length) {
        if (typedWords[index] === word) {
          correctWords++;
        } else {
          mistakes++; // Typing error
        }
      } else {
        mistakes++; // Missed/Incomplete word
      }
    });

    const elapsedSeconds = 600 - timeLeft;
    const elapsedMinutes = elapsedSeconds / 60;
    const wpm = elapsedMinutes > 0 ? Math.round(typedWords.length / elapsedMinutes) : 0;

    let correctChars = 0;
    for (let i = 0; i < Math.min(userInput.length, passage.text.length); i++) {
      if (userInput[i] === passage.text[i]) {
        correctChars++;
      }
    }
    const accuracy = userInput.length > 0 ? Math.round((correctChars / userInput.length) * 100) : 0;

    const baseMarks = 100 - (mistakes * 1.5);
    const marks = Math.max(0, baseMarks);
    const passed = marks >= 50; 

    return { wpm, accuracy, strokes, correctWords, mistakes, marks, passed };
  }, [passage, userInput, timeLeft]);

  // Submit test
  const submitTest = async () => {
    if (!user || !passage || isSubmitting) return; // 🛡️ Stop if already submitting!

    setIsSubmitting(true); // 🔒 Lock it!
    const metrics = calculateMetrics();
    const elapsedSeconds = 600 - timeLeft;

    try {
      const { error } = await supabase.from('test_results').insert([
        {
          user_id: user.id,
          passage_id: passage.id,
          wpm: metrics.wpm,
          accuracy: metrics.accuracy,
          strokes: metrics.strokes,
          duration_seconds: elapsedSeconds,
          language: language,
          level: level,
          typed_text: userInput,
        },
      ]);

      if (error) {
        console.error('❌ Supabase Insert Error:', error);
        throw error; 
      }

      setResults(metrics);
      setTestComplete(true);
    } catch (err) {
      console.warn('⚠️ Supabase Error occurred. Bypassing to show results to user directly.');
      setResults(metrics);
      setTestComplete(true);
    } finally {
      setIsSubmitting(false); // 🔓 Unlock it
    }
  };

  if (pageLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!passage) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">No Passage Available</h1>
            <p className="text-gray-600 mb-8">No passage found for {language} {level}.</p>
            <a href="/dashboard" className="text-indigo-600 hover:text-indigo-700">
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (testComplete && results) {
    const overallPassed = results.passed;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-12">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center text-gray-900">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Test Complete!</h1>

            <div className="mb-8 max-w-sm mx-auto p-6 rounded-lg border-2 flex flex-col items-center justify-center bg-white shadow-md">
              <span className="text-sm font-semibold tracking-wider text-gray-500 uppercase">Total Marks</span>
              <span className="text-6xl font-black text-indigo-600 my-2">{results.marks}</span>
              <span className={`px-4 py-1 rounded-full text-sm font-bold text-white mt-1 ${overallPassed ? 'bg-green-600' : 'bg-red-600'}`}>
                {overallPassed ? 'PASSED ✅' : 'FAILED ❌'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
              <div className="p-6 rounded-lg bg-gray-50">
                <p className="text-gray-600 text-sm font-medium">Speed</p>
                <p className="text-3xl font-bold mt-2 text-gray-900">
                  {results.wpm} <span className="text-base font-normal">WPM</span>
                </p>
              </div>

              <div className="p-6 rounded-lg bg-green-50">
                <p className="text-gray-600 text-sm font-medium">Correct Words</p>
                <p className="text-3xl font-bold mt-2 text-green-600">
                  {results.correctWords}
                </p>
              </div>

              <div className={`p-6 rounded-lg ${results.mistakes > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <p className="text-gray-600 text-sm font-medium">Mistakes</p>
                <p className="text-3xl font-bold mt-2 text-red-600">
                  {results.mistakes}
                </p>
                <p className="text-xs text-gray-500 mt-1">-1.5 per mistake</p>
              </div>

              <div className="p-6 rounded-lg bg-gray-50">
                <p className="text-gray-600 text-sm font-medium">Strokes</p>
                <p className="text-3xl font-bold mt-2 text-gray-900">
                  {results.strokes}
                </p>
              </div>

              <div className="p-6 rounded-lg bg-blue-50">
                <p className="text-gray-600 text-sm font-medium">Accuracy</p>
                <p className="text-3xl font-bold mt-2 text-blue-600">
                  {results.accuracy}%
                </p>
              </div>
            </div>

            <div className="mb-8">
              {overallPassed ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <p className="text-green-700 font-semibold text-lg">🎉 Congratulations! You cleared the exam of Lakshmi Tech!</p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <p className="text-red-700 font-semibold text-lg">Keep practicing! You need a minimum of 50 marks to pass.</p>
                </div>
              )}
            </div>

            <div className="flex gap-4 justify-center">
              <a href="/dashboard" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition">
                Back to Dashboard
              </a>
              <button
                onClick={() => {
                  setTestComplete(false);
                  setUserInput('');
                  setTimeLeft(600);
                  setTestStarted(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { wpm, accuracy, strokes } = calculateMetrics();
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {language.charAt(0).toUpperCase() + language.slice(1)} - {level.charAt(0).toUpperCase() + level.slice(1)}
              </h1>
            </div>
            <div className="flex items-center gap-6">
              <div className={`text-4xl font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-indigo-600'}`}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>

              {!testStarted && (
                <button
                  onClick={() => setTestStarted(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition"
                >
                  Start Test
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">WPM</p>
              <p className="text-3xl font-bold text-indigo-600">{wpm}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">Accuracy</p>
              <p className="text-3xl font-bold text-blue-600">{accuracy}%</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">Strokes</p>
              <p className="text-3xl font-bold text-purple-600">{strokes}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Original Passage</h2>
            <div className="bg-gray-50 p-6 rounded-lg h-64 overflow-y-auto">
              <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                {passage.text.split('').map((char, i) => (
                  <span
                    key={i}
                    className={
                      i < userInput.length
                        ? userInput[i] === char
                          ? 'bg-green-200 text-green-900'
                          : 'bg-red-200 text-red-900'
                        : ''
                    }
                  >
                    {char}
                  </span>
                ))}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Typing</h2>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={!testStarted}
              autoFocus={testStarted}
              onPaste={(e) => {
                e.preventDefault(); 
              }}
              onCopy={(e) => {
                e.preventDefault(); 
              }}
              onCut={(e) => {
                e.preventDefault(); 
              }}
              onDrop={(e) => {
                e.preventDefault(); 
              }}
              onContextMenu={(e) => e.preventDefault()} 
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:opacity-50 disabled:cursor-not-allowed resize-none text-gray-900"
              placeholder={testStarted ? 'Start typing here...' : 'Click "Start Test" to begin'}
            />
          </div>
        </div>

        {testStarted && !testComplete && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={submitTest}
              disabled={isSubmitting} // 🔒 Locks button in HTML
              className={`text-white px-8 py-3 rounded-lg font-semibold transition ${
                isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isSubmitting ? 'Saving...' : 'Submit Test Early'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}