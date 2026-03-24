'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/config/supabase';
import Link from 'next/link';

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

  // 🛡️ Track submit locks
  const [isSubmitting, setIsSubmitting] = useState(false); 

  // 📜 References to bypass stale closures
  const passageContainerRef = useRef<HTMLDivElement>(null);
  const activeCharRef = useRef<HTMLSpanElement>(null);
  const userInputRef = useRef(''); // Keeps track of live input for the timer

  // Keep the ref updated as the user types
  useEffect(() => {
    userInputRef.current = userInput;
  }, [userInput]);

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

  // 🧮 Calculate Metrics (Scoped for dynamic mark deductions)
  const calculateMetrics = useCallback(() => {
    if (!passage) return { wpm: 0, accuracy: 0, strokes: 0, correctWords: 0, mistakes: 0, marks: 0, passed: false };

    const strokes = userInput.length;
    const typedWords = userInput.trim().split(/\s+/).filter(Boolean);
    const targetWords = passage.text.trim().split(/\s+/).filter(Boolean);

    let correctWords = 0;
    let mistakes = 0;

    targetWords.forEach((word, index) => {
      if (index < typedWords.length) {
        if (typedWords[index] === word) {
          correctWords++;
        } else {
          mistakes++;
        }
      } else {
        mistakes++;
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

    const deductionPerMistake = level.toLowerCase() === 'senior' ? 1.25 : 1.8;
    const baseMarks = 100 - (mistakes * deductionPerMistake);
    const marks = Math.max(0, parseFloat(baseMarks.toFixed(2))); 
    const passed = marks >= 50; 

    return { wpm, accuracy, strokes, correctWords, mistakes, marks, passed, deductionPerMistake };
  }, [passage, userInput, timeLeft, level]);

  // Submit test (Scoped with single ref execution to avoid closures)
  const submitTest = useCallback(async (currentInput: string, currentTimeLeft: number) => {
    if (!user || !passage || isSubmitting) return; 

    setIsSubmitting(true); 

    const strokes = currentInput.length;
    const typedWords = currentInput.trim().split(/\s+/).filter(Boolean);
    const targetWords = passage.text.trim().split(/\s+/).filter(Boolean);

    let correctWords = 0;
    let mistakes = 0;

    targetWords.forEach((word, index) => {
      if (index < typedWords.length) {
        if (typedWords[index] === word) {
          correctWords++;
        } else {
          mistakes++;
        }
      } else {
        mistakes++;
      }
    });

    const elapsedSeconds = 600 - currentTimeLeft;
    const elapsedMinutes = elapsedSeconds / 60;
    const wpm = elapsedMinutes > 0 ? Math.round(typedWords.length / elapsedMinutes) : 0;

    let correctChars = 0;
    for (let i = 0; i < Math.min(currentInput.length, passage.text.length); i++) {
      if (currentInput[i] === passage.text[i]) {
        correctChars++;
      }
    }
    const accuracy = currentInput.length > 0 ? Math.round((correctChars / currentInput.length) * 100) : 0;

    const deductionPerMistake = level.toLowerCase() === 'senior' ? 1.25 : 1.8;
    const baseMarks = 100 - (mistakes * deductionPerMistake);
    const marks = Math.max(0, parseFloat(baseMarks.toFixed(2)));
    const passed = marks >= 50; 

    const metrics = { wpm, accuracy, strokes, correctWords, mistakes, marks, passed, deductionPerMistake };

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
          typed_text: currentInput,
        },
      ]);

      if (error) throw error; 

      setResults(metrics);
      setTestComplete(true);
    } catch (err) {
      console.warn('⚠️ Saved metrics locally without Supabase persistence.');
      setResults(metrics);
      setTestComplete(true);
    } finally {
      setIsSubmitting(false); 
    }
  }, [user, passage, isSubmitting, language, level]);

  // 🕒 Fixed Timer: Independent of typing keystrokes
  useEffect(() => {
    if (!testStarted || testComplete) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTestComplete(true);
          // Grab the live text snapshot using the mutable Ref
          submitTest(userInputRef.current, 0); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // 🔍 Removed `userInput` and `submitTest` dependencies to keep the interval uninterrupted!
  }, [testStarted, testComplete]);

  // Auto scroll effect
  useEffect(() => {
    if (activeCharRef.current && passageContainerRef.current) {
      const container = passageContainerRef.current;
      const activeChar = activeCharRef.current;

      const containerTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const charOffsetTop = activeChar.offsetTop - container.offsetTop;

      if (charOffsetTop >= containerTop + containerHeight - 80) {
        container.scrollTo({
          top: charOffsetTop - 100, 
          behavior: 'smooth',
        });
      }
    }
  }, [userInput]);

  if (pageLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="text-xl text-slate-400 animate-pulse">Loading typing trial...</div>
      </div>
    );
  }

  if (!passage) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-12 rounded-2xl text-center shadow-2xl">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 mb-4">No Passage Available</h1>
            <p className="text-slate-400 mb-8">No passage found for {language} {level}.</p>
            <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (testComplete && results) {
    const overallPassed = results.passed;

    return (
      <div className="min-h-screen bg-[#0b0f19] text-white relative overflow-hidden pb-12">
        <div className="absolute top-0 -left-1/4 w-96 h-96 bg-indigo-600 rounded-full filter blur-[120px] opacity-20 pointer-events-none" />
        <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-emerald-600 rounded-full filter blur-[120px] opacity-10 pointer-events-none" />

        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-12 relative z-10">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 mb-8">Test Complete!</h1>

            <div className="mb-8 max-w-sm mx-auto p-6 rounded-2xl border border-white/10 bg-white/5 shadow-2xl flex flex-col items-center justify-center">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Total Marks Obtained</span>
              <span className="text-6xl font-black text-indigo-400 my-2">{results.marks}</span>
              <span className={`px-4 py-1 rounded-full text-xs font-bold text-white mt-1 shadow-md ${overallPassed ? 'bg-emerald-600 shadow-emerald-500/30' : 'bg-red-600 shadow-red-500/30'}`}>
                {overallPassed ? 'PASSED ✅' : 'FAILED ❌'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
              <div className="p-5 rounded-xl bg-white/5 border border-white/5">
                <p className="text-slate-400 text-xs font-medium uppercase">Speed</p>
                <p className="text-3xl font-extrabold mt-2 text-white">
                  {results.wpm} <span className="text-xs font-normal text-slate-400">WPM</span>
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white/5 border border-white/5">
                <p className="text-slate-400 text-xs font-medium uppercase">Correct Words</p>
                <p className="text-3xl font-extrabold mt-2 text-emerald-400">
                  {results.correctWords}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white/5 border border-white/5">
                <p className="text-slate-400 text-xs font-medium uppercase">Mistakes</p>
                <p className="text-3xl font-extrabold mt-2 text-red-400">
                  {results.mistakes}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">-{results.deductionPerMistake} per mistake</p>
              </div>

              <div className="p-5 rounded-xl bg-white/5 border border-white/5">
                <p className="text-slate-400 text-xs font-medium uppercase">Strokes</p>
                <p className="text-3xl font-extrabold mt-2 text-white">
                  {results.strokes}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white/5 border border-white/5">
                <p className="text-slate-400 text-xs font-medium uppercase">Accuracy</p>
                <p className="text-3xl font-extrabold mt-2 text-blue-400">
                  {results.accuracy}%
                </p>
              </div>
            </div>

            <div className="mb-8">
              {overallPassed ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 shadow-lg shadow-emerald-500/10">
                  <p className="text-emerald-400 font-semibold text-lg">🎉 Congratulations! You cleared the exam of Lakshmi Tech!</p>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 shadow-lg shadow-red-500/10">
                  <p className="text-red-400 font-semibold text-lg">Keep practicing! You need a minimum of 50 marks to pass.</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard" className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-8 py-3 rounded-xl font-bold transition-all duration-300">
                Back to Dashboard
              </Link>
              <button
                onClick={() => {
                  setTestComplete(false);
                  setUserInput('');
                  setTimeLeft(600);
                  setTestStarted(false);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-indigo-500/30"
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
    <div className="min-h-screen bg-[#0b0f19] text-white relative overflow-hidden">
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-indigo-600 rounded-full filter blur-[120px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-purple-600 rounded-full filter blur-[120px] opacity-10 pointer-events-none" />

      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <div>
              <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase mb-1 block">Timed Drill</span>
              <h1 className="text-3xl font-extrabold text-white">
                {language.charAt(0).toUpperCase() + language.slice(1)} - {level.charAt(0).toUpperCase() + level.slice(1)}
              </h1>
            </div>
            
            <div className="flex items-center gap-6">
              <div className={`text-4xl font-mono font-black tracking-wider ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-indigo-400'}`}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>

              {!testStarted && (
                <button
                  onClick={() => setTestStarted(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-emerald-500/30"
                >
                  Start Test
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 group hover:bg-white/10 transition-all duration-300">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">WPM</p>
              <p className="text-3xl font-extrabold text-indigo-400 mt-1 group-hover:text-indigo-300 transition-colors">{wpm}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 group hover:bg-white/10 transition-all duration-300">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Accuracy</p>
              <p className="text-3xl font-extrabold text-emerald-400 mt-1 group-hover:text-emerald-300 transition-colors">{accuracy}%</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 group hover:bg-white/10 transition-all duration-300">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Strokes</p>
              <p className="text-3xl font-extrabold text-purple-400 mt-1 group-hover:text-purple-300 transition-colors">{strokes}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Original Passage</h2>
            <div 
              ref={passageContainerRef}
              className="bg-black/30 border border-white/5 p-6 rounded-xl h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10"
            >
              <p className="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap font-mono">
                {passage.text.split('').map((char, i) => {
                  let charClass = "text-slate-400";
                  let isCurrent = i === userInput.length;

                  if (i < userInput.length) {
                    charClass = userInput[i] === char 
                      ? "text-emerald-400 bg-emerald-500/10" 
                      : "text-red-400 bg-red-500/20";
                  }

                  return (
                    <span
                      key={i}
                      ref={isCurrent ? activeCharRef : null}
                      className={`${charClass} ${isCurrent ? "bg-indigo-500/30 text-white font-bold animate-pulse" : ""}`}
                    >
                      {char}
                    </span>
                  );
                })}
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Your Typing</h2>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={!testStarted || testComplete}
              autoFocus={testStarted}
              onPaste={(e) => e.preventDefault()}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()} 
              className="w-full h-72 p-4 bg-black/30 border border-white/5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-white font-mono text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder={testStarted ? 'Start typing here...' : 'Click "Start Test" to begin'}
            />
          </div>
        </div>

        {testStarted && !testComplete && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => submitTest(userInput, timeLeft)}
              disabled={isSubmitting} 
              className={`text-white px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg ${
                isSubmitting ? 'bg-slate-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 hover:shadow-red-500/30'
              }`}
            >
              {isSubmitting ? 'Saving Metrics...' : 'Submit Test Early'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}