import React, { useState, useEffect } from 'react';

export const LiveMode: React.FC = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  // Dummy data for visual
  const checkpoints = [
    { id: 1, text: "도입부 및 흥미 유발 (Hook)", done: false },
    { id: 2, text: "문제 정의", done: false },
    { id: 3, text: "해결 방안 제시", done: false },
    { id: 4, text: "시장 분석 및 데이터", done: false },
    { id: 5, text: "마무리 및 행동 촉구 (CTA)", done: false },
  ];
  const [checks, setChecks] = useState(checkpoints);

  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const toggleCheck = (id: number) => {
    setChecks(checks.map(c => c.id === id ? { ...c, done: !c.done } : c));
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 overflow-hidden flex flex-col">
      {/* Top HUD */}
      <div className="flex justify-between items-start mb-8 border-b border-stone-800 pb-4">
         <div>
            <h2 className="text-stone-400 text-sm uppercase tracking-widest mb-1">현재 상태</h2>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-bold text-xl">LIVE</span>
            </div>
         </div>
         <div className="text-right">
            <h2 className="text-stone-400 text-sm uppercase tracking-widest mb-1">타이머</h2>
            <div className="text-6xl font-mono font-bold tracking-tighter text-white tabular-nums">
                {formatTime(time)}
            </div>
            <div className="mt-2 space-x-4">
                <button 
                    onClick={() => setIsRunning(!isRunning)}
                    className={`px-4 py-1 text-sm rounded border ${isRunning ? 'border-red-500 text-red-500' : 'border-green-500 text-green-500'}`}
                >
                    {isRunning ? '일시정지' : '시작'}
                </button>
                <button 
                    onClick={() => setTime(0)}
                    className="px-4 py-1 text-sm rounded border border-stone-600 text-stone-400 hover:text-white"
                >
                    초기화
                </button>
            </div>
         </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Checklist / Flow */}
        <div className="bg-stone-900 rounded-2xl p-6 border border-stone-800">
            <h3 className="text-brand-gold font-bold mb-6 text-lg">핵심 체크포인트</h3>
            <div className="space-y-4">
                {checks.map((check) => (
                    <div 
                        key={check.id} 
                        onClick={() => toggleCheck(check.id)}
                        className={`flex items-center p-4 rounded-lg cursor-pointer transition-all ${
                            check.done 
                            ? 'bg-green-900/20 border border-green-900 opacity-50' 
                            : 'bg-stone-800 border border-stone-700 hover:bg-stone-700'
                        }`}
                    >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${
                            check.done ? 'border-green-500 bg-green-500 text-black' : 'border-stone-500'
                        }`}>
                            {check.done && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className={`text-xl ${check.done ? 'line-through text-stone-500' : 'text-stone-100'}`}>
                            {check.text}
                        </span>
                    </div>
                ))}
            </div>
        </div>

        {/* Right: Notes / Teleprompter Area */}
        <div className="bg-stone-900 rounded-2xl p-6 border border-stone-800 flex flex-col">
            <h3 className="text-brand-gold font-bold mb-6 text-lg">메모 / 프롬프터</h3>
            <textarea 
                className="flex-1 bg-transparent text-2xl text-stone-300 font-serif leading-relaxed resize-none outline-none placeholder-stone-700"
                placeholder="여기에 메모를 입력하세요... (예: '슬라이드 3에서 천천히', '미소 짓기')"
                defaultValue="호흡 가다듬기. 왼쪽 청중과 아이컨택 유지하기."
            />
        </div>
      </div>
    </div>
  );
};
