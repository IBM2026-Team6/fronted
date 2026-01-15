import React, { useRef, useState } from 'react';
import html2pdf from 'html2pdf.js';
import ReactMarkdown from "react-markdown";
import { generateScriptViaBackend, downloadScript } from '../services/backendService';
import { extractTextFromPDF } from '../utils/pdfHelper';
import { GeneratedScript, PresentationConfig } from '../types';

export const PrepScript: React.FC = () => {
  const [config, setConfig] = useState<PresentationConfig & { 
    slideContent?: string; 
    reportContent?: string; 
    docsContent?: string; 
  }>({
    topic: '',
    rawContent: '', // 기존 백엔드 호환용 (slideContent와 동기화)
    slideContent: '',
    reportContent: '',
    docsContent: '',
    audience: 'general',
    useNonVerbal: false,
    aiTool: 'Upstage',
  });

  // 파일 상태 관리 (3개로 분리)
  const [files, setFiles] = useState<{
    paper: File | null;
    report: File | null;
    docs: File | null;
  }>({ paper: null, report: null, docs: null });

  const [fileName, setFileName] = useState(''); // 기존 다운로드 로직 호환용 (paper 파일명)
  
  const [result, setResult] = useState<GeneratedScript | null>(null);
  const [loading, setLoading] = useState(false);

  // 다운로드 드롭다운
  const [downloadOpen, setDownloadOpen] = useState(false);

  // 프론트 디자인 기반 PDF 템플릿 ref
  const pdfRef = useRef<HTMLDivElement | null>(null);
  const isIbmSelected = (config as any).aiTool === 'IBM-Watson';

  /* ---------------- 파일 핸들링 (신규 구조 적용) ---------------- */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'paper' | 'report' | 'docs') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        try {
          const text = await extractTextFromPDF(file);
          
          setFiles(prev => ({ ...prev, [type]: file }));

          if (type === 'paper') {
            setFileName(file.name);
            setConfig(prev => ({ 
              ...prev, 
              slideContent: text, 
              rawContent: text // 기존 백엔드 호환성 유지
            }));
          } else if (type === 'report') {
            setConfig(prev => ({ ...prev, reportContent: text }));
          } else if (type === 'docs') {
            setConfig(prev => ({ ...prev, docsContent: text }));
          }

        } catch (err) {
          alert(`${type} 파일 읽기 실패: ` + err);
        }
      } else {
        alert('PDF 파일만 업로드 가능합니다.');
      }
    }
  };

  const removeFile = (type: 'paper' | 'report' | 'docs') => {
    setFiles(prev => ({ ...prev, [type]: null }));
    
    if (type === 'paper') {
      setFileName('');
      setConfig(prev => ({ ...prev, slideContent: '', rawContent: '' }));
    } else if (type === 'report') {
      setConfig(prev => ({ ...prev, reportContent: '' }));
    } else if (type === 'docs') {
      setConfig(prev => ({ ...prev, docsContent: '' }));
    }
  };

  /* ---------------- 대본 생성 (백엔드 기존 로직 유지) ---------------- */
  const handleGenerate = async () => {
    // slideContent(rawContent)는 필수
    if (!config.rawContent) {
      alert("발표 자료(Paper) 업로드 또는 내용 입력은 필수입니다.");
      return;
    }

    setLoading(true);
    try {
      const fileToSend =
        files.paper ??
        new File([config.rawContent], 'direct_input.txt', {
          type: 'text/plain',
        });

      const script = await generateScriptViaBackend(config, {
        paper: fileToSend,
        report: files.report,
        docs: files.docs,
      });      
      setResult(script);
    } catch (e: any) {
      alert(e?.message || '대본 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- 시간 수정 (원본 유지) ---------------- */
  const handleDurationChange = (index: number, newDuration: string) => {
    if (!result) return;
    const val = parseInt(newDuration) || 0;

    const newSections = [...result.sections];
    newSections[index] = { ...newSections[index], duration: val };

    const newTotal = newSections.reduce((acc, curr) => acc + (curr.duration || 0), 0);

    setResult({
      ...result,
      sections: newSections,
      totalTime: newTotal,
    });
  };

  /* ---------------- 프론트 디자인 기반 PDF 생성(원본 유지) ---------------- */
  const downloadStyledPdf = async () => {
    if (!result || !pdfRef.current) return;

    const stem =
      (result as any).fileStem ||
      (fileName ? fileName.split('.').slice(0, -1).join('.') : 'presentation');

    const opt = {
      margin: 0,
      filename: `script_${stem}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: pdfRef.current.scrollWidth,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'avoid-all', 'legacy'] },
    };

    await html2pdf().set(opt).from(pdfRef.current).save();
  };

  /* ---------------- 다운로드 핸들러 (원본 유지) ---------------- */
  const triggerDownload = async (format: 'txt' | 'pdf') => {
    if (!result) return;

    try {
      if (format === 'pdf') {
        await downloadStyledPdf();
        return;
      }

      const blob = await downloadScript((result as any).jobId, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const stem =
        (result as any).fileStem ||
        (fileName ? fileName.split('.').slice(0, -1).join('.') : 'presentation');

      a.download = `script_${stem}.txt`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('다운로드 실패');
    } finally {
      setDownloadOpen(false);
    }
  };

  const totalTime = result?.totalTime || 0;

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Cinematic Loading Overlay - Glassmorphism (원본 디자인 유지) */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/60 backdrop-blur-md transition-all duration-500">
          <div className="relative mb-10">
            <div className="absolute inset-0 bg-brand-green rounded-full animate-ping opacity-20 duration-1000"></div>
            <div className="relative w-24 h-24 bg-brand-dark rounded-full flex items-center justify-center shadow-2xl">
              <span className="font-serif text-5xl text-brand-green font-bold animate-pulse">
                L
              </span>
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-3 h-3 bg-brand-green rounded-full shadow-lg"></div>
            </div>
          </div>
          <h3 className="text-3xl font-serif font-bold text-brand-dark mb-3 animate-slide-up drop-shadow-sm">
            AI 대본 작가 실행 중
          </h3>
          <p
            className="text-stone-600 font-sans animate-slide-up text-lg font-medium"
            style={{ animationDelay: '0.1s' }}
          >
            청중의 관점에서 단어를 선택하고 리듬을 조율하고 있습니다.
          </p>
          <div className="mt-8 flex gap-3">
            <div className="w-3 h-3 bg-brand-gold rounded-full animate-bounce" style={{ animationDelay: '0.0s' }}></div>
            <div className="w-3 h-3 bg-brand-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-brand-gold rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Panel: Configuration */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 sticky top-24">
            <h2 className="text-xl font-serif font-bold text-brand-dark mb-6">대본 설정</h2>

            <div className="space-y-4">
              
              {/* === 1. 발표 자료 업로드 (Paper) - 필수 === */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-stone-500 uppercase">
                    발표 자료 (Papers) <span className="text-red-500">*</span>
                  </label>
                  {files.paper && (
                    <button onClick={() => removeFile('paper')} className="text-xs text-red-400 hover:text-red-600">삭제</button>
                  )}
                </div>

                {!files.paper ? (
                  <>
                    <div className="flex items-center justify-center w-full mb-2">
                      <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-stone-200 border-dashed rounded-lg cursor-pointer bg-stone-50 hover:bg-stone-100 transition-colors group">
                        <div className="flex flex-col items-center justify-center pt-2 pb-2">
                          <svg className="w-5 h-5 mb-1 text-stone-400 group-hover:text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-[10px] text-stone-500">PDF 업로드 (Paper)</p>
                        </div>
                        <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileChange(e, 'paper')} />
                      </label>
                    </div>
                    {/* 직접 입력 텍스트 영역 */}
                    <textarea
                      className="w-full h-24 p-3 border border-stone-200 rounded text-sm focus:ring-1 focus:ring-brand-green outline-none"
                      placeholder="또는 발표 내용을 직접 입력하세요..."
                      value={config.rawContent}
                      onChange={e => setConfig({ ...config, rawContent: e.target.value, slideContent: e.target.value })}
                    />
                  </>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-brand-cream border border-brand-lightGreen rounded">
                    <div className="flex items-center gap-2 overflow-hidden">
                       <svg className="w-4 h-4 text-brand-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs font-bold text-brand-dark truncate">{files.paper.name}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* === 2. 상세 보고서 (Report) - 선택 === */}
              <div className={`border rounded-lg p-3 transition-colors ${files.report ? 'bg-brand-cream border-brand-green' : 'bg-white border-stone-200'}`}>
                <div className="flex justify-between items-center mb-2">
                   <span className="text-xs font-bold text-stone-500 uppercase">상세 보고서 (Report)</span>
                   {files.report && <button onClick={() => removeFile('report')} className="text-xs text-red-400 hover:text-red-600">삭제</button>}
                </div>
                {!files.report ? (
                   <label className="flex items-center justify-center w-full h-10 border border-dashed border-stone-300 rounded cursor-pointer hover:bg-stone-50 transition-colors">
                      <span className="text-xs text-stone-500">+ 보고서 PDF 추가</span>
                      <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileChange(e, 'report')} />
                  </label>
                ) : (
                  <div className="text-xs text-brand-green font-medium flex items-center gap-1">
                      <span className="truncate">{files.report.name}</span>
                  </div>
                )}
              </div>

              {/* === 3. 평가 기준 (Docs) - 선택 === */}
              <div className={`border rounded-lg p-3 transition-colors ${files.docs ? 'bg-brand-cream border-brand-green' : 'bg-white border-stone-200'}`}>
                <div className="flex justify-between items-center mb-2">
                   <span className="text-xs font-bold text-stone-500 uppercase">평가 기준 (Docs)</span>
                   {files.docs && <button onClick={() => removeFile('docs')} className="text-xs text-red-400 hover:text-red-600">삭제</button>}
                </div>
                {!files.docs ? (
                   <label className="flex items-center justify-center w-full h-10 border border-dashed border-stone-300 rounded cursor-pointer hover:bg-stone-50 transition-colors">
                      <span className="text-xs text-stone-500">+ 평가 기준 PDF 추가</span>
                      <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileChange(e, 'docs')} />
                  </label>
                ) : (
                  <div className="text-xs text-brand-green font-medium flex items-center gap-1">
                      <span className="truncate">{files.docs.name}</span>
                  </div>
                )}
              </div>

              {/* === 청중 타겟 === */}
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-2">
                  청중 타겟
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'general', label: '비전문가 (일반인)' },
                    { val: 'expert', label: '전문가 (관계자)' },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setConfig({ ...config, audience: opt.val as any })}
                      className={`py-3 px-1 text-xs rounded border transition-all duration-200 ${
                        config.audience === opt.val
                          ? 'bg-brand-dark text-white border-brand-dark shadow-md transform scale-[1.02]'
                          : 'bg-white text-stone-500 border-stone-200 hover:border-brand-dark hover:text-brand-dark'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* === AI Tool === */}
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-2">
                  AI Tool
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'IBM-Watson', label: 'IBM-Watson' },
                    { val: 'Upstage', label: 'Upstage ✓' },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setConfig({ ...config, aiTool: opt.val as any })}
                      className={`py-3 px-1 text-xs rounded border transition-all duration-200 ${
                        (config as any).aiTool === opt.val
                          ? 'bg-brand-dark text-white border-brand-dark shadow-md transform scale-[1.02]'
                          : 'bg-white text-stone-500 border-stone-200 hover:border-brand-dark hover:text-brand-dark'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {isIbmSelected && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
                    <div className="flex items-start gap-2">
                      <span className="mt-[1px]">⚠️</span>
                      <div className="flex-1">
                        <div className="font-bold">IBM-Watson은 토큰 부족으로 실패할 수 있습니다.</div>
                        <div className="text-amber-800 mt-1">
                          안정성을 위해 <span className="font-bold">Upstage</span> 사용을 권장합니다.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* === 비언어적 지시문 === */}
              <div className="flex items-center justify-between py-2">
                <label className="text-xs font-bold text-stone-500 uppercase">
                  비언어적 지시문(제스처 등) 포함
                </label>
                <button
                  onClick={() => setConfig({ ...config, useNonVerbal: !config.useNonVerbal })}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${
                    config.useNonVerbal ? 'bg-brand-green' : 'bg-stone-200'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${
                      config.useNonVerbal ? 'left-7' : 'left-1'
                    }`}
                  ></div>
                </button>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !config.rawContent}
                className="w-full mt-4 bg-brand-green text-white py-4 rounded font-bold tracking-wide hover:bg-green-700 transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-brand-green/30 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? '작성 중...' : '대본 생성하기'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Output (원본 로직 유지) */}
        <div className="lg:col-span-8">
          {result ? (
            <div className="bg-white rounded-xl shadow-lg border border-stone-100 overflow-hidden animate-fade-in">
              <div className="bg-brand-dark p-6 flex justify-between items-center text-white">
                <div className="flex items-center gap-4">
                  <h3 className="font-serif text-xl">생성된 대본</h3>
                  <span className="text-xs px-2 py-1 rounded bg-stone-700 text-stone-300 border border-stone-600">
                    Total: {Math.floor(totalTime / 60)}분 {totalTime % 60}초
                  </span>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setDownloadOpen(v => !v)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-green hover:bg-green-600 text-white rounded text-sm font-bold transition-colors shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    대본 다운로드
                  </button>

                  {downloadOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded shadow-lg z-50 overflow-hidden">
                      <button
                        onClick={() => triggerDownload('txt')}
                        className="w-full px-5 py-3 text-left text-sm text-stone-700 hover:bg-brand-cream hover:text-brand-green font-medium transition-colors flex items-center justify-between group"
                      >
                        <span>
                          TXT <span className="text-xs text-stone-400 font-normal ml-1">(대본만)</span>
                        </span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">📄</span>
                      </button>
                      <button
                        onClick={() => triggerDownload('pdf')}
                        className="w-full px-5 py-3 text-left text-sm text-stone-700 hover:bg-brand-cream hover:text-brand-green font-medium transition-colors flex items-center justify-between group"
                      >
                        <span>
                          PDF{' '}
                          <span className="text-xs text-stone-400 font-normal ml-1">
                            (대본 + 예상질문)
                          </span>
                        </span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">📑</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 space-y-8">
                <div className="space-y-6">
                  {result.sections.map((section: any, idx: number) => (
                    <div
                      key={idx}
                      className="group hover:bg-stone-50 p-4 rounded-lg transition-colors border border-transparent hover:border-stone-200"
                    >
                      <div className="flex items-baseline justify-between mb-2">
                        <h4 className="font-bold text-brand-green uppercase tracking-wider text-sm">
                          {section.title}
                        </h4>

                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-stone-400">예상 시간:</span>
                          <input
                            type="number"
                            className="w-12 bg-transparent border-b border-stone-300 text-right font-bold text-stone-700 focus:outline-none focus:border-brand-green transition-colors"
                            value={section.duration ?? 0}
                            onChange={e => handleDurationChange(idx, e.target.value)}
                          />
                          <span className="text-stone-400">초</span>
                        </div>
                      </div>

                      {section.cue && (
                        <div className="mb-2 text-xs text-stone-500 italic bg-stone-100 inline-block px-2 py-1 rounded">
                          💡 {section.cue}
                        </div>
                      )}

                      <div className="prose prose-stone max-w-none text-lg leading-relaxed font-serif">
                        <ReactMarkdown>
                          {section.content}
                        </ReactMarkdown>
                      </div>

                      {Array.isArray(section.qa) && section.qa.length > 0 && (
                        <div className="mt-6 border-t border-stone-200 pt-4">
                          <div className="text-xs font-bold text-stone-500 uppercase mb-2">
                            예상 질문
                          </div>
                          <div className="space-y-3">
                            {section.qa.map((item: any, qIdx: number) => (
                              <div
                                key={qIdx}
                                className="p-3 bg-stone-50 rounded border border-stone-200"
                              >
                                <div className="text-sm font-bold">
                                  Q{qIdx + 1}. {item.q}
                                </div>
                                <div className="text-sm mt-1">
                                  A{qIdx + 1}. {item.a}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center min-h-[400px] border-2 border-dashed border-stone-200 rounded-xl text-stone-400">
              <div className="text-center">
                <p className="mb-2 text-4xl">✍️</p>
                <p>설정을 완료하고 맞춤형 대본을 생성하세요.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===================== PDF 전용 템플릿 (원본 유지) ===================== */}
      <div className="fixed left-[-99999px] top-0">
        <div
          ref={pdfRef}
          className="w-[210mm] min-h-[297mm] bg-white text-stone-800 box-border"
        >
          <div className="p-[14mm]">
            <div className="bg-brand-dark text-white rounded-2xl px-8 py-7 border border-stone-700">
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <div className="font-serif text-3xl leading-tight">PitchMate AI Script</div>
                  <div className="text-sm text-stone-200 mt-2">
                    {fileName ? `File: ${fileName}` : 'File: Direct Input'}
                  </div>
                </div>
                <div className="shrink-0">
                  <div className="text-sm bg-white/10 border border-white/20 px-4 py-2 rounded-xl">
                    <span className="text-stone-200 mr-2">Total</span>
                    <span className="font-bold">
                      {Math.floor(totalTime / 60)}m {totalTime % 60}s
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/10 my-5"></div>

              <div className="flex flex-wrap gap-2">
                {[
                  { k: 'Audience', v: config.audience },
                  { k: 'Non-verbal', v: config.useNonVerbal ? 'ON' : 'OFF' },
                  { k: 'AI Tool', v: (config as any).aiTool },
                ].map((x, i) => (
                  <div
                    key={i}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white/10 border border-white/15"
                  >
                    <span className="text-stone-200">{x.k}:</span>{' '}
                    <span className="font-semibold">{x.v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 space-y-8">
              {(result?.sections || []).map((section: any, idx: number) => (
                <div key={idx} className={idx > 0 ? 'pdf-page-break' : ''}>
                  <div className="pdf-avoid-break border border-stone-200 rounded-2xl overflow-hidden">
                    <div className="bg-stone-50 px-7 py-5 flex items-center justify-between border-b border-stone-200">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-green"></div>
                        <div className="font-bold text-brand-green uppercase tracking-wider text-sm truncate">
                          {section.title}
                        </div>
                      </div>
                      <div className="text-xs text-stone-500 shrink-0">
                        예상 시간:{' '}
                        <span className="font-bold text-stone-700">{section.duration ?? 0}</span>초
                      </div>
                    </div>

                    <div className="px-7 py-7">
                      {section.cue && (
                        <div className="mb-4 inline-flex items-center gap-2 text-xs text-stone-600 italic bg-stone-100 px-3 py-2 rounded-lg border border-stone-200">
                          <span>💡</span>
                          <span>{section.cue}</span>
                        </div>
                      )}

                      <div className="font-serif text-[14.5px] leading-[1.85] text-stone-800 whitespace-pre-wrap">
                        {section.content}
                      </div>

                      {Array.isArray(section.qa) && section.qa.length > 0 && (
                        <div className="mt-7 pt-6 border-t border-stone-200">
                          <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-4">
                            예상 질문 (Q&A)
                          </div>

                          <div className="space-y-4">
                            {section.qa.map((item: any, qIdx: number) => (
                              <div
                                key={qIdx}
                                className="pdf-avoid-break p-5 bg-stone-50 rounded-2xl border border-stone-200"
                              >
                                <div className="text-sm font-bold text-stone-900">
                                  Q{qIdx + 1}. {item.q}
                                </div>
                                <div className="h-px bg-stone-200 my-3"></div>
                                <div className="text-sm text-stone-700 leading-relaxed">
                                  <span className="font-bold text-stone-900 mr-2">
                                    A{qIdx + 1}.
                                  </span>
                                  {item.a}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 text-xs text-stone-400 flex items-center justify-between">
                    <span>Generated by PitchMate</span>
                    <span>{new Date().toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .pdf-page-break { page-break-before: always; }
        .pdf-avoid-break { break-inside: avoid; page-break-inside: avoid; }
      `}</style>
    </div>
  );
};