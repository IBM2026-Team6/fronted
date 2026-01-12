import React, { useState } from 'react';
import { generateFlowSummary } from '../services/geminiService';
import { extractTextFromPDF } from '../utils/pdfHelper';
import { FlowSummary } from '../types';

export const PrepFlow: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FlowSummary | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        try {
          setLoading(true);
          const text = await extractTextFromPDF(file);
          setInputText(text); // Store text in state for API
          setFileName(file.name);
          setLoading(false);
        } catch (err) {
          alert('PDF 읽기 실패: ' + err);
          setLoading(false);
        }
      } else {
        alert('PDF 파일만 업로드 가능합니다.');
      }
    }
  };

  const handleAnalyze = async () => {
    if (!inputText) return;
    setLoading(true);
    try {
      const summary = await generateFlowSummary(inputText);
      setResult(summary);
    } catch (e) {
      alert("문제가 발생했습니다. API 키를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8 relative">
       {/* Cinematic Loading Overlay - Glassmorphism */}
       {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/60 backdrop-blur-md transition-all duration-500">
            <div className="relative mb-10">
                <div className="absolute inset-0 bg-brand-green rounded-full animate-ping opacity-20 duration-1000"></div>
                <div className="relative w-24 h-24 bg-brand-dark rounded-full flex items-center justify-center shadow-2xl">
                    <span className="font-serif text-5xl text-brand-green font-bold animate-pulse">L</span>
                </div>
                {/* Orbiting particles */}
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-3 h-3 bg-brand-green rounded-full shadow-lg"></div>
                </div>
            </div>
            <h3 className="text-3xl font-serif font-bold text-brand-dark mb-3 animate-slide-up drop-shadow-sm">자료 분석 중</h3>
            <p className="text-stone-600 font-sans animate-slide-up text-lg font-medium" style={{animationDelay: '0.1s'}}>
                논리적 구조를 파악하고 핵심 흐름을 추출하고 있습니다.
            </p>
            
            <div className="mt-8 flex gap-3">
                <div className="w-3 h-3 bg-brand-gold rounded-full animate-bounce" style={{animationDelay: '0.0s'}}></div>
                <div className="w-3 h-3 bg-brand-gold rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-3 h-3 bg-brand-gold rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
            </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif font-bold text-brand-dark">발표 흐름 분석</h2>
          <p className="mt-2 text-stone-600">발표 자료의 논리적 구조를 분석하고 시각화합니다.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="p-8">
            <div className="mb-6">
              <label className="block text-sm font-bold text-stone-700 mb-2 uppercase tracking-wide">
                발표 자료 업로드 (PDF)
              </label>
              
              {!fileName ? (
                <div className="flex items-center justify-center w-full mb-4">
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-stone-300 border-dashed rounded-lg cursor-pointer bg-stone-50 hover:bg-stone-100 transition-colors group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-10 h-10 mb-4 text-stone-400 group-hover:text-brand-green transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                          <p className="text-sm text-stone-500"><span className="font-semibold text-brand-green">PDF 파일 업로드</span> (Click)</p>
                          <p className="text-xs text-stone-400 mt-1">최대 10MB</p>
                      </div>
                      <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                  </label>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-brand-cream border border-brand-lightGreen rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-green/10 rounded flex items-center justify-center text-brand-green">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-dark">{fileName}</p>
                      <p className="text-xs text-brand-green">업로드 완료</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setFileName(''); setInputText(''); }}
                    className="text-stone-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}

              {/* Optional Manual Input Toggle - Hidden by default unless file is empty and user wants to type? 
                  For now, we just keep the textarea but make it clear it's optional if file not provided, 
                  or hide it if file is present. 
              */}
              {!fileName && (
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-stone-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-stone-500">또는 직접 입력</span>
                    </div>
                </div>
              )}
              
              {!fileName && (
                 <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="발표 내용을 여기에 직접 붙여넣으셔도 됩니다..."
                  className="w-full h-32 mt-4 p-4 border border-stone-200 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none resize-none font-sans text-stone-700 text-sm"
                />
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleAnalyze}
                disabled={loading || !inputText}
                className="bg-brand-dark text-white px-8 py-3 rounded-md font-medium hover:bg-brand-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-brand-green/30"
              >
                {loading ? '분석 중...' : '분석 시작'}
              </button>
            </div>
          </div>
        </div>

        {result && (
          <div className="mt-12 space-y-8 animate-slide-up">
            <h3 className="text-xl font-serif font-bold text-stone-800 border-b border-stone-200 pb-4">
              구조 분석 결과
            </h3>
            <div className="relative border-l-2 border-brand-green ml-4 space-y-12 pb-4">
              {result.steps.map((step, idx) => (
                <div key={idx} className="relative pl-8">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-brand-green ring-4 ring-white"></div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
                    <span className="text-xs font-bold text-brand-green uppercase tracking-wider mb-2 block">Part {idx + 1}</span>
                    <h4 className="text-lg font-bold text-brand-dark mb-2">{step.title}</h4>
                    <p className="text-stone-600 mb-4 text-sm leading-relaxed">{step.description}</p>
                    <div className="bg-brand-cream p-3 rounded border border-stone-200">
                      <span className="font-bold text-xs text-brand-dark mr-2">핵심 요약:</span>
                      <span className="text-sm text-stone-700 italic">{step.keyPoint}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};