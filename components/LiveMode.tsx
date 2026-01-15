import React, { useState, useEffect, useRef, useCallback } from 'react';
import { prepareLiveSession } from '../services/geminiService';
import { LiveSessionData, LiveScriptStep } from '../types';

// Speech Recognition Type Definition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

// Levenshtein Distance Helper for Fuzzy Matching
const getLevenshteinDistance = (a: string, b: string) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const al = a.length;
  const bl = b.length;
  
  // Optimization: If length difference is bigger than threshold, don't bother
  // We generally don't care about distances > 3 for short keywords
  if (Math.abs(al - bl) > 3) return Math.max(al, bl);

  // Optimized: Use two rows instead of full matrix for O(min(m,n)) space
  let row = new Array(al + 1);
  for (let j = 0; j <= al; j++) row[j] = j;

  let prevRow;
  for (let i = 1; i <= bl; i++) {
    prevRow = row;
    row = new Array(al + 1);
    row[0] = i;
    for (let j = 1; j <= al; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        row[j] = prevRow[j - 1];
      } else {
        row[j] = Math.min(prevRow[j - 1], prevRow[j], row[j - 1]) + 1;
      }
    }
  }
  return row[al];
};

export const LiveMode: React.FC = () => {
  // Mode: upload -> loading -> live -> finished
  const [status, setStatus] = useState<'upload' | 'loading' | 'live' | 'finished'>('upload');
  const [sessionData, setSessionData] = useState<LiveSessionData | null>(null);
  
  // Settings
  const [useFuzzyMatching, setUseFuzzyMatching] = useState(false);

  // Live State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isRunning, setIsRunning] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Speech & Keywords
  const [spokenKeywords, setSpokenKeywords] = useState<Set<string>>(new Set());
  
  // Refs to handle closures in callbacks
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Refs for data access inside event listeners without dependency array issues
  const sessionDataRef = useRef<LiveSessionData | null>(null);
  const currentStepIndexRef = useRef(0);
  const spokenKeywordsRef = useRef<Set<string>>(new Set());
  const useFuzzyRef = useRef(false);
  const isRunningRef = useRef(false);

  // Sync refs with state
  useEffect(() => { sessionDataRef.current = sessionData; }, [sessionData]);
  useEffect(() => { currentStepIndexRef.current = currentStepIndex; }, [currentStepIndex]);
  useEffect(() => { spokenKeywordsRef.current = spokenKeywords; }, [spokenKeywords]);
  useEffect(() => { useFuzzyRef.current = useFuzzyMatching; }, [useFuzzyMatching]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);

  // 1. Initialize Speech Recognition (Fixed Lifecycle)
  useEffect(() => {
    if (typeof window !== 'undefined' && status === 'live') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      // cleanup old instance if any
      if (recognitionRef.current) {
         try { recognitionRef.current.stop(); } catch(e) {}
         recognitionRef.current = null;
      }

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ko-KR'; 

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscriptChunk = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscriptChunk += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          if (finalTranscriptChunk) {
            checkKeywordsImmediate(finalTranscriptChunk); 
          }
          if (interimTranscript) {
             checkKeywordsImmediate(interimTranscript);
          }
        };
        
        recognition.onend = () => {
          // Only restart if we are supposed to be running and in live mode
          if (isRunningRef.current && status === 'live') {
            try {
                recognition.start();
            } catch (e) {
                // Ignore
            }
          }
        };

        recognitionRef.current = recognition;
      }
    }
    
    return () => {
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch(e) {}
        }
    };
  }, [status]); // Only re-run if status changes (e.g. live -> finished)

  // 2. Manage Start/Stop based on isRunning
  useEffect(() => {
      if (status === 'live' && recognitionRef.current) {
          if (isRunning) {
              try { recognitionRef.current.start(); } catch(e) {}
          } else {
              try { recognitionRef.current.stop(); } catch(e) {}
          }
      }
  }, [isRunning, status]);


  // Optimized Keyword Matching Logic with Safety Checks
  const checkKeywordsImmediate = useCallback((textToCheck: string) => {
    if (!sessionDataRef.current || !textToCheck) return;
    
    // Performance Guard: Don't process if text is too short to matter or too huge
    if (textToCheck.length < 2) return;

    try {
        const currentStep = sessionDataRef.current.steps[currentStepIndexRef.current];
        if (!currentStep) return;

        const currentKeywords = currentStep.keywords;
        const cleanInput = textToCheck.replace(/\s+/g, '').toLowerCase();
        // Optimization: limit input size
        const effectiveInput = cleanInput.length > 80 ? cleanInput.slice(-80) : cleanInput;
        
        let foundNewKeyword = false;
        const newSpoken = new Set(spokenKeywordsRef.current);

        // Pre-calculate input length for loop bounds
        const inputLen = effectiveInput.length;

        for (const keyword of currentKeywords) {
           if (newSpoken.has(keyword)) continue;
           
           const cleanKeyword = keyword.replace(/\s+/g, '').toLowerCase();
           const kwLen = cleanKeyword.length;
           let isMatch = false;

           if (useFuzzyRef.current) {
              // --- FUZZY LOGIC (Optimized) ---
              // 1. Fast path: Direct inclusion
              if (effectiveInput.includes(cleanKeyword)) {
                 isMatch = true;
              } else {
                 // 2. Sliding window with Levenshtein
                 // Only check if input is at least as long as keyword - 1
                 if (inputLen >= kwLen - 1) {
                     // Limit loop iterations
                     const maxStart = inputLen - kwLen + 1;
                     for (let i = 0; i <= maxStart; i++) {
                         // Check window of size kwLen +/- 1
                         // Just check kwLen to keep it fast, or maybe kwLen and kwLen+1
                         // Checking too many variations kills perf.
                         // Let's check exactly kwLen substring first.
                         
                         const sub = effectiveInput.substr(i, kwLen);
                         const dist = getLevenshteinDistance(sub, cleanKeyword);
                         
                         // Strict threshold: 25% length
                         const threshold = Math.max(1, Math.floor(kwLen * 0.25)); 
                         
                         if (dist <= threshold) {
                             isMatch = true;
                             break;
                         }
                         
                         // Optional: Check kwLen + 1 if needed for insertion errors?
                         // Keeping it simple for performance prevents "infinite loading" feel
                     }
                 }
              }
           } else {
              // --- SIMPLE LOGIC ---
              if (effectiveInput.includes(cleanKeyword)) {
                isMatch = true;
              }
           }
           
           if (isMatch) {
             newSpoken.add(keyword);
             foundNewKeyword = true;
           }
        }

        if (foundNewKeyword) {
            setSpokenKeywords(newSpoken);
            spokenKeywordsRef.current = newSpoken; 
        }
    } catch (e) {
        console.warn("Keyword check error:", e);
    }
  }, []);

  // 3. Timer Logic (Continuous)
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
            if (prev <= 0) return 0;
            return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]); 

  // Fullscreen Handler
  const toggleFullScreen = () => {
      if (!document.fullscreenElement) {
          containerRef.current?.requestFullscreen().catch(err => {
              console.error(`Error attempting to enable full-screen mode: ${err.message}`);
          });
          setIsFullScreen(true);
      } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
            setIsFullScreen(false);
          }
      }
  };

  useEffect(() => {
      const handleFsChange = () => {
          setIsFullScreen(!!document.fullscreenElement);
      };
      document.addEventListener('fullscreenchange', handleFsChange);
      return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/plain') {
      alert('TXT 파일만 지원됩니다.');
      return;
    }

    setStatus('loading');
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      try {
        const data = await prepareLiveSession(text);
        if (!data || !data.steps || data.steps.length === 0) {
            throw new Error("Invalid script data");
        }
        setSessionData(data);
        setStatus('live');
        setCurrentStepIndex(0);
        setTimeLeft(data.steps[0].duration); 
      } catch (err) {
        alert('대본 분석 실패: ' + err);
        setStatus('upload');
      }
    };
    reader.readAsText(file);
  };

  const toggleSession = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  const nextSlide = useCallback(() => {
    if (!sessionData) return;
    if (currentStepIndex < sessionData.steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      
      // RESET TIMER
      setTimeLeft(sessionData.steps[nextIdx].duration);
      setSpokenKeywords(new Set()); 
      // Do not stop running automatically
    } else {
      setStatus('finished');
      setIsRunning(false);
    }
  }, [sessionData, currentStepIndex]);

  const prevSlide = useCallback(() => {
     if (!sessionData) return;
     if (currentStepIndex > 0) {
       const prevIdx = currentStepIndex - 1;
       setCurrentStepIndex(prevIdx);
       
       // RESET TIMER
       setTimeLeft(sessionData.steps[prevIdx].duration);
       setSpokenKeywords(new Set());
     }
  }, [sessionData, currentStepIndex]);

  // Keyboard Navigation Effect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== 'live') return;

      switch (e.key) {
        case 'ArrowRight':
          nextSlide();
          break;
        case 'ArrowLeft':
          prevSlide();
          break;
        case ' ': // Spacebar toggles timer
          e.preventDefault(); // Prevent scrolling
          toggleSession();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, nextSlide, prevSlide, toggleSession]);

  const handleManualKeywordComplete = (keyword: string) => {
    setSpokenKeywords(prev => {
        const next = new Set(prev).add(keyword);
        spokenKeywordsRef.current = next; 
        return next;
    });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- RENDERERS ---

  if (status === 'upload') {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center text-white p-6">
        <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
          <div className="w-20 h-20 bg-brand-green/20 rounded-full flex items-center justify-center mx-auto ring-4 ring-brand-green/10">
            <span className="text-4xl">🎙️</span>
          </div>
          <h2 className="text-3xl font-bold font-serif">Live Rehearsal Studio</h2>
          <p className="text-stone-400 leading-relaxed">
            AI가 대본을 분석하여 실시간 프롬프터와 키워드 트래커를 생성합니다.<br/>
            준비된 <span className="text-brand-green font-bold">.txt 대본 파일</span>을 업로드하세요.
          </p>
          
          <div className="space-y-4">
              <label className="block w-full cursor-pointer group">
                <div className="w-full h-32 border-2 border-dashed border-stone-700 rounded-xl flex flex-col items-center justify-center hover:bg-stone-800 hover:border-brand-green transition-all group-hover:scale-[1.02]">
                    <span className="text-stone-500 group-hover:text-brand-green font-bold">대본 업로드 (Click)</span>
                    <span className="text-xs text-stone-600 mt-2">.txt format supported</span>
                </div>
                <input type="file" className="hidden" accept=".txt" onChange={handleFileUpload} />
              </label>

              {/* Fuzzy Matching Toggle */}
              <div 
                className="flex items-center justify-between p-4 rounded-lg border border-stone-800 bg-stone-800/50 hover:bg-stone-800 transition-colors cursor-pointer"
                onClick={() => setUseFuzzyMatching(!useFuzzyMatching)}
              >
                  <div className="flex flex-col text-left">
                      <span className="font-bold text-sm text-stone-300">발음 보정 모드 (Fuzzy Matching)</span>
                      <span className="text-xs text-stone-500">발음이 부정확해도 문맥상 유사하면 인식합니다.</span>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${useFuzzyMatching ? 'bg-brand-green' : 'bg-stone-600'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${useFuzzyMatching ? 'left-7' : 'left-1'}`}></div>
                  </div>
              </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-stone-800 border-t-brand-green rounded-full animate-spin mb-6"></div>
        <h3 className="text-xl font-mono text-brand-green animate-pulse">SYSTEM INITIALIZING...</h3>
        <p className="text-stone-500 mt-2 text-sm">Extracting keywords & calculating timing logic</p>
      </div>
    );
  }

  if (status === 'finished') {
    return (
        <div className="min-h-screen bg-stone-900 flex items-center justify-center text-white">
            <div className="text-center space-y-6">
                <h2 className="text-5xl font-serif font-bold text-brand-gold">Great Job!</h2>
                <p className="text-xl text-stone-300">리허설이 종료되었습니다.</p>
                <button onClick={() => window.location.reload()} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-brand-green hover:text-white transition-colors">
                    다시 하기
                </button>
            </div>
        </div>
    );
  }

  const currentStep = sessionData!.steps[currentStepIndex];
  const isUrgent = timeLeft <= 5 && timeLeft > 0;

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white overflow-hidden flex flex-col relative font-sans">
      
      {/* Background Ambience */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${isUrgent ? 'opacity-20 bg-red-900' : 'opacity-0'}`}></div>

      {/* 1. HUD Top Bar */}
      <div className="flex justify-between items-center p-6 border-b border-stone-800 bg-stone-900/50 backdrop-blur-sm z-10 transition-all">
        <div className="flex items-center gap-6">
           <div className="flex flex-col">
              <span className="text-stone-500 text-xs font-bold uppercase tracking-widest">Slide</span>
              <span className="text-2xl font-mono font-bold text-white">
                {currentStepIndex + 1} <span className="text-stone-600 text-lg">/ {sessionData?.steps.length}</span>
              </span>
           </div>
           <div className="h-8 w-px bg-stone-700"></div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-red-500 animate-pulse' : 'bg-stone-500'}`}></div>
                 <span className="font-bold tracking-wide">{isRunning ? 'ON AIR' : 'PAUSED'}</span>
                 {/* Keyboard Hint */}
                 <span className="text-[10px] text-stone-500 border border-stone-700 px-1 rounded ml-2 hidden md:inline-block">SPACE to Toggle</span>
              </div>
              {useFuzzyMatching && (
                 <span className="text-[10px] bg-brand-green/20 text-brand-green border border-brand-green/30 px-2 py-0.5 rounded ml-2 font-bold">Fuzzy Mode ON</span>
              )}
           </div>
        </div>

        <div className="flex items-center gap-6">
           {/* Time Display */}
           <div className="flex flex-col items-end">
              <span className="text-stone-500 text-xs font-bold uppercase tracking-widest">Time Remaining</span>
              <div className={`text-5xl font-mono font-bold tracking-tighter tabular-nums transition-colors ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                  {formatTime(timeLeft)}
              </div>
           </div>

           {/* Full Screen Toggle */}
           <button 
             onClick={toggleFullScreen}
             className="p-3 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-all"
             title="Toggle Full Screen"
           >
             {isFullScreen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
             ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
             )}
           </button>
        </div>
      </div>

      {/* 2. Main Prompt Area */}
      <div className="flex-1 flex flex-col relative z-10 p-8 max-w-7xl mx-auto w-full">
         
         {/* Title & Keywords */}
         <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-stone-400 text-sm uppercase tracking-widest mb-4 border-b border-stone-800 pb-2 flex justify-between">
                <span>Say these keywords ({spokenKeywords.size}/{currentStep.keywords.length})</span>
                <span className="text-[10px] normal-case opacity-50 font-normal">Tip: Click keyword to manually mark as done</span>
            </h2>
            
            <div className="flex flex-wrap gap-4 content-start min-h-[300px]">
                {currentStep.keywords.map((kw, idx) => {
                    const isDone = spokenKeywords.has(kw);
                    return (
                        <div 
                            key={idx}
                            onClick={() => handleManualKeywordComplete(kw)}
                            title="Click to mark as done"
                            className={`px-8 py-4 rounded-full text-2xl md:text-5xl font-bold transition-all duration-700 transform border-2 cursor-pointer active:scale-95 hover:bg-stone-800/80 ${
                                isDone 
                                ? 'opacity-20 scale-90 border-transparent text-stone-600 blur-sm pointer-events-none' 
                                : 'opacity-100 scale-100 border-stone-700 bg-stone-800/50 text-brand-lightGreen shadow-[0_0_15px_rgba(74,222,128,0.2)]'
                            }`}
                        >
                            {kw}
                        </div>
                    );
                })}
            </div>
         </div>

         {/* 3. Emergency Prompts (Bottom Sticky) */}
         <div className={`mt-auto transition-all duration-500 transform ${timeLeft <= 10 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl backdrop-blur-md">
                    <span className="text-red-400 text-xs font-bold uppercase flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        마무리 멘트 (Wrap Up)
                    </span>
                    <p className="text-lg text-white font-medium leading-snug">
                        "{currentStep.wrapUpSentence}"
                    </p>
                </div>
                <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl backdrop-blur-md">
                    <span className="text-blue-400 text-xs font-bold uppercase flex items-center gap-2 mb-1">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                        다음 연결 (Transition)
                    </span>
                    <p className="text-lg text-white font-medium leading-snug">
                        "{currentStep.transitionSentence}"
                    </p>
                </div>
            </div>
         </div>

      </div>

      {/* 4. Controls Footer */}
      <div className="p-6 bg-stone-900 border-t border-stone-800 flex justify-between items-center z-20">
          <button 
            onClick={prevSlide}
            disabled={currentStepIndex === 0}
            className="px-6 py-3 rounded-lg border border-stone-700 text-stone-400 hover:text-white hover:border-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Left Arrow"
          >
            Previous Slide
          </button>

          <div className="flex gap-4">
              <button 
                onClick={toggleSession}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-transform transform active:scale-95 ${isRunning ? 'bg-stone-700 hover:bg-stone-600' : 'bg-brand-green hover:bg-green-600'}`}
                title="Spacebar"
              >
                  {isRunning ? (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                      <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  )}
              </button>
          </div>

          <button 
            onClick={nextSlide}
            className="group px-6 py-3 rounded-lg bg-white text-black font-bold hover:bg-brand-gold hover:text-white transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            title="Right Arrow"
          >
            {currentStepIndex === sessionData!.steps.length - 1 ? 'Finish' : 'Next Slide'}
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
      </div>

    </div>
  );
};