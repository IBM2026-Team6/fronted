import React, { useState } from 'react';
import { extractTextFromPDF } from '../utils/pdfHelper';
import { evaluatePresentation } from '../services/geminiService';
import { EvaluationResult } from '../types';

export const PrepEval: React.FC = () => {
  const [scriptText, setScriptText] = useState('');
  const [reportText, setReportText] = useState('');
  const [docsText, setDocsText] = useState('');
  
  const [files, setFiles] = useState<{ report: File | null; docs: File | null }>({ report: null, docs: null });
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'report' | 'docs') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        try {
          const text = await extractTextFromPDF(file);
          setFiles(prev => ({ ...prev, [type]: file }));
          if (type === 'report') setReportText(text);
          if (type === 'docs') setDocsText(text);
        } catch (err) {
          alert('파일 읽기 실패: ' + err);
        }
      }
    }
  };

  // New handler for .txt script import
  const handleScriptFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setScriptText(ev.target.result as string);
                }
            };
            reader.readAsText(file);
        } else {
            alert('.txt 파일만 업로드 가능합니다.');
        }
    }
  };

  const handleEvaluate = async () => {
    if (!scriptText || !docsText) {
      alert("대본(Script)과 공고/평가기준(docs.pdf)은 필수입니다.");
      return;
    }
    setLoading(true);
    try {
      const evalResult = await evaluatePresentation(scriptText, reportText, docsText);
      setResult(evalResult);
    } catch (e) {
      alert("평가 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-brand-green';
    if (score >= 70) return 'bg-brand-gold';
    return 'bg-red-500';
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
        case 'S': return 'text-brand-green border-brand-green bg-brand-green/10';
        case 'A': return 'text-blue-600 border-blue-600 bg-blue-100';
        case 'B': return 'text-brand-gold border-brand-gold bg-yellow-50';
        default: return 'text-red-500 border-red-500 bg-red-50';
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8 relative">
       {/* Loading Overlay */}
       {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md">
            <div className="w-16 h-16 border-4 border-stone-200 border-t-brand-green rounded-full animate-spin mb-4"></div>
            <h3 className="text-2xl font-serif font-bold text-brand-dark">AI 심사위원 평가 중</h3>
            <p className="text-stone-500 mt-2">공고의 기준에 맞춰 엄격하게 심사하고 있습니다.</p>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-bold text-brand-dark mb-4">AI Presentation Evaluator</h2>
            <p className="text-lg text-stone-600">공고(Docs)의 평가 기준을 바탕으로 대본과 보고서를 모의 심사합니다.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Input Panel */}
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 sticky top-24">
                    <h3 className="text-xl font-bold text-brand-dark mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-brand-gold rounded-full"></span>
                        심사 자료 제출
                    </h3>
                    
                    <div className="space-y-6">
                        {/* 1. Script Input with .txt Import */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-stone-500 uppercase">대본 (Script)</label>
                                <label className="cursor-pointer text-xs text-brand-green hover:underline flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Import .txt
                                    <input type="file" className="hidden" accept=".txt" onChange={handleScriptFileImport} />
                                </label>
                            </div>
                            <textarea 
                                value={scriptText}
                                onChange={(e) => setScriptText(e.target.value)}
                                className="w-full h-40 p-3 border border-stone-200 rounded text-sm focus:ring-1 focus:ring-brand-green outline-none resize-none font-sans"
                                placeholder="작성된 대본을 붙여넣거나 .txt 파일을 불러오세요..."
                            />
                        </div>

                        {/* 2. Report PDF */}
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-2">결과 보고서 (Report.pdf)</label>
                            <div className={`border rounded-lg p-3 ${files.report ? 'bg-brand-cream border-brand-green' : 'bg-stone-50 border-stone-200'}`}>
                                {!files.report ? (
                                    <label className="flex items-center justify-center w-full h-12 cursor-pointer hover:bg-white transition-colors">
                                        <span className="text-xs text-stone-500">+ PDF 업로드</span>
                                        <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileChange(e, 'report')} />
                                    </label>
                                ) : (
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-brand-green font-bold truncate">{files.report.name}</span>
                                        <button onClick={() => {setFiles(prev => ({...prev, report: null})); setReportText('');}} className="text-red-400">삭제</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Docs PDF */}
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-2">평가 기준 (Docs.pdf) <span className="text-red-500">*</span></label>
                            <div className={`border rounded-lg p-3 ${files.docs ? 'bg-brand-cream border-brand-green' : 'bg-stone-50 border-stone-200'}`}>
                                {!files.docs ? (
                                    <label className="flex items-center justify-center w-full h-12 cursor-pointer hover:bg-white transition-colors">
                                        <span className="text-xs text-stone-500">+ PDF 업로드</span>
                                        <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileChange(e, 'docs')} />
                                    </label>
                                ) : (
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-brand-green font-bold truncate">{files.docs.name}</span>
                                        <button onClick={() => {setFiles(prev => ({...prev, docs: null})); setDocsText('');}} className="text-red-400">삭제</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleEvaluate}
                            disabled={loading}
                            className="w-full bg-brand-dark text-white py-4 rounded font-bold shadow-lg hover:bg-brand-green transition-all transform hover:-translate-y-1 disabled:opacity-50"
                        >
                            모의 심사 시작
                        </button>
                    </div>
                </div>
            </div>

            {/* Right: Dashboard */}
            <div className="lg:col-span-8">
                {result ? (
                    <div className="space-y-8 animate-slide-up">
                        {/* Summary Card */}
                        <div className="bg-white rounded-2xl p-8 shadow-xl border border-stone-100 flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-shrink-0 text-center">
                                <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center text-5xl font-serif font-bold shadow-inner mb-2 ${getGradeColor(result.grade)}`}>
                                    {result.grade}
                                </div>
                                <div className="text-sm font-bold text-stone-500 uppercase tracking-widest">Total Grade</div>
                            </div>
                            <div className="flex-grow border-l border-stone-100 pl-0 md:pl-8">
                                <h3 className="text-2xl font-bold text-brand-dark mb-2">종합 평가 요약</h3>
                                <p className="text-stone-600 leading-relaxed italic">"{result.summary}"</p>
                                <div className="mt-4 flex items-center gap-2">
                                    <span className="text-3xl font-bold text-brand-green">{result.totalScore}</span>
                                    <span className="text-stone-400 text-sm">/ 100 점</span>
                                </div>
                            </div>
                        </div>

                        {/* Visual Charts (Criteria) */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100">
                            <h3 className="text-xl font-bold text-brand-dark mb-6 flex items-center gap-2">
                                <span className="w-2 h-6 bg-brand-green rounded-full"></span>
                                세부 평가 항목
                            </h3>
                            <div className="space-y-6">
                                {result.criteria.map((c, idx) => (
                                    <div key={idx} className="relative">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="font-bold text-stone-700 text-sm">{c.name}</span>
                                            <span className="text-sm font-mono text-stone-500">{c.score} / {c.maxScore}</span>
                                        </div>
                                        {/* Progress Bar Background */}
                                        <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden">
                                            {/* Actual Bar */}
                                            <div 
                                                className={`h-full ${getScoreColor(c.score)} transition-all duration-1000 ease-out`}
                                                style={{ width: `${(c.score / 100) * 100}%` }}
                                            ></div>
                                        </div>
                                        <p className="mt-2 text-xs text-stone-500 bg-stone-50 p-2 rounded border border-stone-100">
                                            💡 {c.feedback}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Improvements */}
                        <div className="bg-stone-900 rounded-2xl p-8 text-white shadow-2xl">
                            <h3 className="text-xl font-bold text-brand-gold mb-6">🏆 개선을 위한 제안</h3>
                            <ul className="space-y-4">
                                {result.improvements.map((imp, idx) => (
                                    <li key={idx} className="flex items-start gap-4">
                                        <div className="w-6 h-6 rounded-full bg-brand-green flex items-center justify-center flex-shrink-0 text-xs font-bold">
                                            {idx + 1}
                                        </div>
                                        <p className="text-stone-300 leading-relaxed">{imp}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="h-full min-h-[500px] flex items-center justify-center border-2 border-dashed border-stone-200 rounded-2xl text-stone-400">
                        <div className="text-center p-8">
                            <div className="text-6xl mb-4">⚖️</div>
                            <h3 className="text-xl font-bold text-stone-500 mb-2">평가 준비 완료</h3>
                            <p className="max-w-md mx-auto">
                                왼쪽 패널에 대본(.txt)과 공고(평가 기준) 파일을 업로드하면 <br/>
                                AI가 객관적인 시각으로 점수를 매겨드립니다.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};