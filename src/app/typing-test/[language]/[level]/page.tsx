'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/config/supabase';
import Link from 'next/link';
import { jsPDF } from 'jspdf';

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

  // ⚙️ Toggles & Settings
  const [backspaceEnabled, setBackspaceEnabled] = useState(true); // Default enabled

  // 🛡️ Track submit locks
  const [isSubmitting, setIsSubmitting] = useState(false); 

  // 📜 References to bypass stale closures
  const passageContainerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const userInputRef = useRef(''); 

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

  // 🧮 WORD-BASED Metric Calculation
  const calculateMetrics = useCallback(() => {
    if (!passage) return { wpm: 0, accuracy: 0, strokes: 0, correctWords: 0, mistakes: 0, marks: 0, passed: false };

    const strokes = userInput.length;
    
    const targetWords = passage.text.trim().split(/\s+/).filter(Boolean);
    const typedWords = userInput.trim().split(/\s+/).filter(Boolean);

    let correctWords = 0;
    let mistakes = 0;

    // Loop through TARGET WORDS to penalize skipped words
    targetWords.forEach((word, index) => {
      if (index < typedWords.length) {
        if (typedWords[index] === word) {
          correctWords++;
        } else {
          mistakes++; // Wrong word
        }
      } else {
        mistakes++; // Skipped word
      }
    });

    const elapsedSeconds = 600 - timeLeft;

    // ⏳ FIX: Cap the minimum elapsed time to 10 seconds to stop WPM spikes at start!
    const activeElapsedSeconds = Math.max(elapsedSeconds, 10);
    const elapsedMinutes = activeElapsedSeconds / 60;
    const wpm = Math.round((strokes / 5) / elapsedMinutes);

    // ✅ ACCURACY KEPT EXACTLY THE SAME (Untouched as requested)
    const accuracy = targetWords.length > 0 ? Math.round((correctWords / targetWords.length) * 100) : 0;

    const deductionPerMistake = level.toLowerCase() === 'senior' ? 1.25 : 1.8;
    const baseMarks = 100 - (mistakes * deductionPerMistake);
    const marks = Math.max(0, parseFloat(baseMarks.toFixed(2))); 
    const passed = marks >= 50; 

    return { wpm, accuracy, strokes, correctWords, mistakes, marks, passed, deductionPerMistake };
  }, [passage, userInput, timeLeft, level]);

  // Submit test
  const submitTest = useCallback(async (currentInput: string, currentTimeLeft: number) => {
    if (!user || !passage || isSubmitting) return; 

    setIsSubmitting(true); 

    const strokes = currentInput.length;
    const targetWords = passage.text.trim().split(/\s+/).filter(Boolean);
    const typedWords = currentInput.trim().split(/\s+/).filter(Boolean);

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
    const activeElapsedSeconds = Math.max(elapsedSeconds, 10);
    const elapsedMinutes = activeElapsedSeconds / 60;
    const wpm = Math.round((strokes / 5) / elapsedMinutes);

    // ✅ ACCURACY KEPT EXACTLY THE SAME (Untouched as requested)
    const accuracy = targetWords.length > 0 ? Math.round((correctWords / targetWords.length) * 100) : 0;

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
      console.warn('⚠️ Metrics saved locally without Supabase persistence.');
      setResults(metrics);
      setTestComplete(true);
    } finally {
      setIsSubmitting(false); 
    }
  }, [user, passage, isSubmitting, language, level]);

  // Timer
  useEffect(() => {
    if (!testStarted || testComplete) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTestComplete(true);
          submitTest(userInputRef.current, 0); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, testComplete, submitTest]);

  // Word-Based Scroll Effect
  useEffect(() => {
    if (activeWordRef.current && passageContainerRef.current) {
      const container = passageContainerRef.current;
      const activeWord = activeWordRef.current;

      const containerTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const wordOffsetTop = activeWord.offsetTop - container.offsetTop;

      if (wordOffsetTop >= containerTop + containerHeight - 80) {
        container.scrollTo({
          top: wordOffsetTop - 100, 
          behavior: 'smooth',
        });
      }
    }
  }, [userInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!testStarted || testComplete) return;

    if (e.key === 'Backspace' && !backspaceEnabled) {
      e.preventDefault();
      return;
    }

    if (e.key === ' ') {
      const lastChar = userInput[userInput.length - 1];
      if (lastChar === ' ' || userInput === '') {
        e.preventDefault(); 
        return;
      }
    }
  };

  // 📝 Standard White Paper PDF (Unlimited Auto Multi-paging)
  const generatePDFReport = () => {
    if (!results || !passage) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const bottomMargin = 20; // Trigger line for page breaking

    // 🏷️ 1. Institute Branding Header
    doc.addImage('/lakshmi-logo.png', 'PNG', (pageWidth / 2) - 15, 15, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0); // Black
    doc.text('LAKSHMI TECHNICAL INSTITUTE', pageWidth / 2, 55, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Official Typing Examination Statement of Marks', pageWidth / 2, 65, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(20, 72, pageWidth - 20, 72);

    // 👤 2. Student & Exam Info
    doc.setFontSize(12);
    doc.text(`Student ID: ${user?.email || 'N/A'}`, 20, 85);
    doc.text(`Language: ${language.toUpperCase()}`, 20, 93);
    doc.text(`Exam Level: ${level.toUpperCase()}`, 20, 101);
    doc.text(`Date generated: ${new Date().toLocaleDateString()}`, pageWidth - 20, 85, { align: 'right' });

    // 📊 3. Table Metrics
    doc.setFillColor(245, 245, 245); // Light Gray
    doc.rect(20, 110, pageWidth - 40, 10, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.text('Examination Parameter', 25, 116);
    doc.text('Obtained Metric', pageWidth - 25, 116, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.text('Gross Speed', 25, 128);
    doc.text(`${results.wpm} WPM`, pageWidth - 25, 128, { align: 'right' });
    doc.line(20, 132, pageWidth - 20, 132);

    doc.text('Total Strokes Keyed', 25, 140);
    doc.text(`${results.strokes}`, pageWidth - 25, 140, { align: 'right' });
    doc.line(20, 144, pageWidth - 20, 144);

    doc.text('Word Mistakes Committed', 25, 152);
    doc.text(`${results.mistakes}`, pageWidth - 25, 152, { align: 'right' });
    doc.line(20, 156, pageWidth - 20, 156);

    doc.text('Grade Accuracy Ratio', 25, 164);
    doc.text(`${results.accuracy}%`, pageWidth - 25, 164, { align: 'right' });
    doc.line(20, 168, pageWidth - 20, 168);

    doc.setFont('helvetica', 'bold');
    
    // ✅ ADDED FIX: Light Grey color override sets painter so it doesn't default to Black redacted box
    doc.setFillColor(245, 245, 245); 
    
    doc.rect(20, 175, pageWidth - 40, 12, 'FD');
    doc.text('NET AGGREGATE MARKS', 25, 183);
    doc.text(`${results.marks} / 100`, pageWidth - 25, 183, { align: 'right' });

    // 🔴 🔍 4. HIGHLIGHT WRONG + SKIPPED WORDS EVALUATION
    doc.setFontSize(14);
    doc.text('Individual Word Mistake Analysis Log', 20, 205);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const targetWords = passage.text.trim().split(/\s+/).filter(Boolean);
    const typedWords = userInput.trim().split(/\s+/).filter(Boolean);

    let startX = 20;
    let startY = 215;
    const marginY = 8;
    const marginX = doc.getTextWidth(' ') + 2; 

    targetWords.forEach((word, index) => {
      const isTyped = index < typedWords.length;
      const isWrong = isTyped && typedWords[index] !== word;
      const isSkipped = !isTyped;
      
      const wordWidth = doc.getTextWidth(word);

      // Horizontal text-wrap check
      if (startX + wordWidth > pageWidth - 20) {
        startX = 20;
        startY += marginY;
      }

      // 🚨 AUTOMATIC VERTICAL PAGE-OVERFLOW CHECK
      if (startY > pageHeight - bottomMargin) {
        doc.addPage();
        startY = 25; // Reset to top of secondary page
        startX = 20; // Reset left margin
      }

      if (isWrong) {
        doc.setTextColor(220, 50, 50); // High-contrast Red
        doc.setFont('helvetica', 'bold');
        doc.text(typedWords[index], startX, startY);
        doc.setDrawColor(220, 50, 50);
        doc.line(startX, startY + 1, startX + wordWidth, startY + 1); 
        doc.setTextColor(0, 0, 0); 
        doc.setFont('helvetica', 'normal');
      } else if (isSkipped) {
        doc.setTextColor(150, 150, 150); // Classic gray for skipped
        doc.setFont('helvetica', 'italic');
        doc.text(word, startX, startY);
        doc.setTextColor(0, 0, 0); 
        doc.setFont('helvetica', 'normal');
      } else {
        doc.text(word, startX, startY);
      }

      startX += wordWidth + marginX;
    });

    // 🏁 5. Final Verdict (Check if verdict needs its own page)
    if (startY + 30 > pageHeight - bottomMargin) {
      doc.addPage();
      startY = 25;
    }

    const passedText = results.passed ? 'VERDICT: EXAMINATION PASSED ✅' : 'VERDICT: EXAMINATION UNSUCCESSFUL ❌';
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(passedText, pageWidth / 2, startY + 20, { align: 'center' });

    doc.save(`LTITypingTest-${language}-${level}.pdf`);
  };

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
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Speed</p>
                <p className="text-3xl font-extrabold mt-2 text-white">
                  {results.wpm} <span className="text-xs font-normal text-slate-400">WPM</span>
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white/5 border border-white/5">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Correct Words</p>
                <p className="text-3xl font-extrabold mt-2 text-emerald-400">
                  {results.correctWords}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white/5 border border-white/5">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Mistakes</p>
                <p className="text-3xl font-extrabold mt-2 text-red-400">
                  {results.mistakes}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">-{results.deductionPerMistake} per mistake</p>
              </div>

              <div className="p-5 rounded-xl bg-white/5 border border-white/5">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Strokes</p>
                <p className="text-3xl font-extrabold mt-2 text-white">
                  {results.strokes}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white/5 border border-white/5">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Accuracy</p>
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

            {/* 👇 BUTTON HUB */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-3 rounded-xl font-bold transition-all duration-300"
              >
                Try Again
              </button>
              <button
                onClick={generatePDFReport}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-emerald-500/30"
              >
                Download PDF Statement
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

  const targetWordsArray = passage.text.trim().split(/\s+/).filter(Boolean);
  const typedWordsArray = userInput.trim().split(/\s+/).filter(Boolean);

  const activeWordValue = userInput.endsWith(' ') ? '' : typedWordsArray[typedWordsArray.length - 1] || '';

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
            
            <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
              <span className="text-xs text-slate-300 font-medium">Backspace:</span>
              <button
                onClick={() => setBackspaceEnabled(!backspaceEnabled)}
                disabled={testStarted && !testComplete} 
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all duration-300 ${
                  backspaceEnabled 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                    : 'bg-white/10 text-slate-400 hover:bg-white/20'
                }`}
              >
                {backspaceEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            <div className="flex items-center gap-4">
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
              <div className="text-slate-300 text-lg leading-relaxed font-mono flex flex-wrap gap-x-2 gap-y-1">
                {targetWordsArray.map((word, i) => {
                  let wordClass = "text-slate-400"; 
                  const isCurrent = i === (userInput.endsWith(' ') ? typedWordsArray.length : typedWordsArray.length - 1);

                  if (i < (userInput.endsWith(' ') ? typedWordsArray.length : typedWordsArray.length - 1)) {
                    wordClass = typedWordsArray[i] === word 
                      ? "text-emerald-400 font-bold" 
                      : "text-red-400 font-bold underline decoration-wavy";
                  } else if (isCurrent) {
                    const isMismatch = activeWordValue !== word.slice(0, activeWordValue.length);
                    
                    wordClass = isMismatch 
                      ? "bg-red-500/20 text-red-400 font-bold animate-pulse ring-2 ring-red-500/50" 
                      : "bg-indigo-500/30 text-white font-bold animate-pulse ring-2 ring-indigo-500/50";
                  }

                  return (
                    <span
                      key={i}
                      ref={isCurrent ? activeWordRef : null}
                      className={`${wordClass} px-1.5 py-0.5 rounded-md transition-all duration-200`}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Your Typing</h2>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown} 
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