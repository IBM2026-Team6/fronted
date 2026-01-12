import React, { useEffect, useRef, useState } from 'react';
import { AppView } from '../types';

interface HomeProps {
  onStart: (view: AppView) => void;
}

// Tilt Card Component for "Wow" factor
const TiltCard = ({ children, onClick, delay }: { children?: React.ReactNode, onClick: () => void, delay: string }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg rotation
    const rotateY = ((x - centerX) / centerX) * 10;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
  };

  return (
    <div 
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative h-[500px] rounded-2xl overflow-hidden cursor-pointer shadow-xl transition-all duration-200 ease-out reveal-on-scroll"
      style={{ transitionDelay: delay }}
    >
      {children}
    </div>
  );
};

export const Home: React.FC<HomeProps> = ({ onStart }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Testimonial Data
    const testimonials = [
        {
          id: 1,
          name: "김민준",
          role: "스타트업 CEO",
          image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop",
          impact: "시리즈 A 투자 유치 성공",
          quote: "복잡한 기술 용어들을 투자자들이 이해하기 쉬운 스토리로 바꿔주었습니다. LiveCoach가 없었다면 5분 안에 설득하지 못했을 겁니다.",
          stars: 5
        },
        {
          id: 2,
          name: "이서연",
          role: "대학생 (졸업작품 발표)",
          image: "https://img.freepik.com/free-photo/asian-student-woman-with-laptop-bag-education-concept_1150-12831.jpg?semt=ais_hybrid&w=740&q=80",
          impact: "졸업 프로젝트 최우수상",
          quote: "대본을 쓰는 게 항상 막막했는데, 제 아이디어만 넣으니 완벽한 흐름이 나왔어요. 발표 공포증을 극복하게 해준 최고의 도구입니다.",
          stars: 5
        },
        {
          id: 3,
          name: "박지훈",
          role: "마케팅 팀장",
          image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop",
          impact: "제안서 수락률 200% 증가",
          quote: "논리적 흐름 분석 기능이 정말 놀랍습니다. 제가 놓친 논리적 비약을 정확히 짚어주더군요. 이제 모든 클라이언트 미팅 전에 사용합니다.",
          stars: 5
        }
      ];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach(el => observer.observe(el));

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      elements.forEach(el => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col w-full min-h-screen bg-stone-50 overflow-x-hidden font-sans">
      
      {/* 1. Hero Section: Cinematic & Immersive with Spotlight */}
      <section className="relative w-full h-screen max-h-[900px] overflow-hidden flex items-center justify-center bg-stone-900">
        
        {/* Dynamic Spotlight Effect */}
        <div 
            className="absolute pointer-events-none z-10 inset-0 transition-opacity duration-300"
            style={{
                background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(21, 128, 61, 0.15), transparent 40%)`
            }}
        />

        {/* Background Image with Zoom Effect */}
        <div className="absolute inset-0 z-0">
            <img 
                src="https://doctorjoy.net/wp-content/uploads/2025/11/%ED%8F%AC%EB%A7%B7%EB%B3%80%ED%99%98%EC%8A%A4%ED%8B%B0%EB%B8%8C%EC%9E%A1%EC%8A%A4.jpg" 
                alt="Presentation Stage" 
                className="w-full h-full object-cover animate-slow-zoom opacity-80"
            />
            <div className="absolute inset-0 bg-stone-900/60 mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-stone-900/30"></div>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto flex flex-col items-center">
            
            {/* Audio Wave Animation - Hackathon Wow Factor */}
            <div className="flex items-center justify-center gap-1 h-10 mb-6 animate-slide-up">
                <div className="bar h-4"></div>
                <div className="bar h-8"></div>
                <div className="bar h-6"></div>
                <div className="bar h-8"></div>
                <div className="bar h-4"></div>
            </div>

            <div className="overflow-hidden mb-4">
                <span className="inline-block text-brand-green font-bold tracking-[0.2em] text-sm md:text-base uppercase animate-slide-up">
                    Professional Presentation Suite
                </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-sans font-bold leading-tight tracking-tight mb-8 drop-shadow-lg text-brand-cream animate-slide-up" style={{ animationDelay: '0.2s' }}>
                무대 위, 당신의 언어가 <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-lightGreen to-white font-serif">예술이 되다.</span>
            </h1>
            <p className="text-lg md:text-xl text-stone-200 font-light max-w-2xl mb-12 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                복잡한 아이디어를 명확한 울림으로. <br/>
                완벽한 흐름과 대본, 그리고 실전 코칭까지 AI가 함께합니다.
            </p>
            
            <button 
                onClick={() => onStart('prep-flow')}
                className="group relative px-10 py-5 bg-white text-brand-dark rounded-full overflow-hidden transition-all hover:shadow-[0_0_40px_-10px_rgba(74,222,128,0.4)] animate-slide-up hover:scale-105"
                style={{ animationDelay: '0.6s' }}
            >
                <div className="absolute inset-0 w-0 bg-brand-green transition-all duration-500 ease-out group-hover:w-full"></div>
                <span className="relative flex items-center gap-2 font-bold tracking-wider text-sm uppercase group-hover:text-white transition-colors">
                    시작하기
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </span>
            </button>
        </div>

        {/* Floating Abstract Elements */}
        <div className="absolute bottom-20 right-10 w-24 h-24 border border-white/10 rounded-full animate-float hidden md:block backdrop-blur-sm z-10"></div>
        <div className="absolute top-40 left-10 w-16 h-16 bg-brand-green/20 rounded-full animate-float hidden md:block backdrop-blur-md z-10" style={{ animationDelay: '1s' }}></div>
      </section>

      {/* 2. Marquee Strip: Presentation Quotes */}
      <div className="w-full bg-brand-dark py-6 overflow-hidden border-y border-stone-800">
        <div className="relative flex overflow-x-hidden group">
            <div className="py-2 animate-marquee whitespace-nowrap flex gap-8 items-center">
                <span className="text-2xl md:text-3xl font-serif font-light text-white opacity-90 italic">"Designing a presentation without an audience in mind is like writing a love letter and addressing it 'To Whom It May Concern'." — Ken Haemer</span>
                <span className="w-3 h-3 bg-brand-green rounded-full"></span>
                <span className="text-2xl md:text-3xl font-serif font-light text-white opacity-90 italic">"Speech is power: speech is to persuade, to convert, to compel." — Ralph Waldo Emerson</span>
                <span className="w-3 h-3 bg-brand-green rounded-full"></span>
                {/* Repeat for seamless loop */}
                <span className="text-2xl md:text-3xl font-serif font-light text-white opacity-90 italic">"The success of your presentation will be judged not by the knowledge you send but by what the listener receives." — Lilly Walters</span>
                <span className="w-3 h-3 bg-brand-green rounded-full"></span>
                <span className="text-2xl md:text-3xl font-serif font-light text-white opacity-90 italic">"Designing a presentation without an audience in mind is like writing a love letter and addressing it 'To Whom It May Concern'." — Ken Haemer</span>
            </div>
        </div>
      </div>

      {/* 3. Value Proposition - "Tilt Cards" Layout */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-24 reveal-on-scroll">
            <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-6">현대적인 연설가를 위한 <span className="italic text-brand-green font-serif">설계</span></h2>
            <p className="text-stone-500 max-w-2xl mx-auto font-light">AI 지능과 무대 심리학을 결합하여 당신의 준비와 공연 방식을 혁신합니다.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <TiltCard onClick={() => onStart('prep-flow')} delay="0.1s">
                <div className="absolute inset-0 bg-stone-900 group-hover:bg-brand-green transition-colors duration-500"></div>
                <img 
                    src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop" 
                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500 group-hover:scale-110" 
                    alt="Planning"
                />
                <div className="absolute bottom-0 left-0 p-8 w-full z-10">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 text-white">
                        <span className="font-bold">01</span>
                    </div>
                    <h3 className="text-2xl font-serif text-white mb-2">구조 설계</h3>
                    <p className="text-stone-300 group-hover:text-white transition-colors text-sm leading-relaxed">
                        흩어진 생각들을 논리적이고 설득력 있는 흐름으로 자동 정리합니다.
                    </p>
                </div>
            </TiltCard>

            {/* Card 2 */}
            <TiltCard onClick={() => onStart('prep-script')} delay="0.3s">
                <div className="absolute inset-0 bg-stone-900 group-hover:bg-brand-green transition-colors duration-500"></div>
                <img 
                    src="https://images.unsplash.com/photo-1555421689-d68471e189f2?q=80&w=2070&auto=format&fit=crop" 
                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500 group-hover:scale-110" 
                    alt="Scripting"
                />
                <div className="absolute bottom-0 left-0 p-8 w-full z-10">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 text-white">
                        <span className="font-bold">02</span>
                    </div>
                    <h3 className="text-2xl font-serif text-white mb-2">대본 작성</h3>
                    <p className="text-stone-300 group-hover:text-white transition-colors text-sm leading-relaxed">
                        청중, 톤앤매너, 발표 시간을 고려한 전문적인 대본을 생성합니다.
                    </p>
                </div>
            </TiltCard>

            {/* Card 3 */}
            <TiltCard onClick={() => onStart('live')} delay="0.5s">
                <div className="absolute inset-0 bg-stone-900 group-hover:bg-brand-green transition-colors duration-500"></div>
                <img 
                    src="https://mblogthumb-phinf.pstatic.net/MjAyNTA0MDJfMjc1/MDAxNzQzNTM3MzI1Njg1.hncB-nPTO2T6zlHmvFC-7JhgTwGFC9KpcPYOWhkR5DAg.u6TPM4rKH-DOdlES51qoQ-un10kf3eb7Y-3WkWdvnwcg.JPEG/image.JPEG?type=w800" 
                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500 group-hover:scale-110" 
                    alt="Live"
                />
                <div className="absolute bottom-0 left-0 p-8 w-full z-10">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 text-white">
                        <span className="font-bold">03</span>
                    </div>
                    <h3 className="text-2xl font-serif text-white mb-2">실전 연습</h3>
                    <p className="text-stone-300 group-hover:text-white transition-colors text-sm leading-relaxed">
                        타이머, 체크리스트, 프롬프터가 포함된 실시간 대시보드로 리허설하세요.
                    </p>
                </div>
            </TiltCard>
        </div>
      </section>

      {/* 4. Feature Highlight: "Bento" Style or Split */}
      <section className="w-full bg-stone-900 py-32 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-green/20 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
              <div className="w-full md:w-1/2 space-y-8 z-10 reveal-on-scroll">
                  <h2 className="text-4xl md:text-6xl font-bold leading-tight">
                    당신만의 <br/>
                    <span className="text-brand-green font-serif">AI 무대 코치.</span>
                  </h2>
                  <p className="text-stone-400 text-lg font-light leading-relaxed">
                      프레젠테이션은 단순히 슬라이드를 읽는 것이 아닙니다. 리듬, 타이밍, 그리고 관객과의 교감이 핵심입니다. 
                      LiveCoach는 세계적인 연사들이 사용하는 도구를 누구나 쉽게 사용할 수 있도록 제공합니다.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-8 pt-8">
                      <div>
                          <p className="text-4xl font-bold text-white mb-1">50%</p>
                          <p className="text-sm text-brand-green uppercase tracking-widest">준비 시간 단축</p>
                      </div>
                      <div>
                          <p className="text-4xl font-bold text-white mb-1">2x</p>
                          <p className="text-sm text-brand-green uppercase tracking-widest">청중 몰입도</p>
                      </div>
                  </div>
              </div>
              
              <div className="w-full md:w-1/2 relative h-[500px] z-10 reveal-on-scroll" style={{ transitionDelay: '0.3s' }}>
                   <div className="absolute inset-0 bg-gradient-to-tr from-stone-800 to-stone-700 rounded-3xl transform rotate-3 opacity-50"></div>
                   <div className="absolute inset-0 bg-stone-800 rounded-3xl overflow-hidden shadow-2xl border border-stone-700 hover:scale-[1.02] transition-transform duration-700">
                        <img 
                            src="https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1974&auto=format&fit=crop" 
                            className="w-full h-full object-cover opacity-80"
                            alt="Dashboard Preview"
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                <span className="text-white font-mono text-sm">LIVE MONITORING</span>
                            </div>
                            <p className="text-stone-300 text-sm">실시간 페이스 조절 및 핵심 포인트 트래킹</p>
                        </div>
                   </div>
              </div>
          </div>
      </section>

        {/* 5. User Reviews / Testimonials */}
      <section className="py-24 bg-stone-50 relative overflow-hidden">
        {/* Background decorative blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-20 -left-20 w-96 h-96 bg-brand-green/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 -right-20 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16 reveal-on-scroll">
                <span className="text-brand-green font-bold tracking-widest uppercase text-sm">Success Stories</span>
                <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mt-3 mb-6">
                    수많은 발표자들이 <br/>
                    <span className="font-serif italic text-brand-green">LiveCoach</span>와 함께 증명했습니다.
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((t, idx) => (
                    <div 
                        key={t.id} 
                        className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group reveal-on-scroll flex flex-col"
                        style={{ transitionDelay: `${idx * 0.15}s` }}
                    >
                        {/* Impact Tag - Shows value prominently */}
                        <div className="inline-block self-start px-3 py-1 bg-brand-lightGreen/50 text-brand-green text-xs font-bold rounded-full mb-6 group-hover:bg-brand-green group-hover:text-white transition-colors duration-300">
                            🚀 {t.impact}
                        </div>

                        {/* Stars */}
                        <div className="flex gap-1 mb-4 text-brand-gold">
                                {[...Array(t.stars)].map((_, i) => (
                                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                ))}
                        </div>

                        {/* Quote */}
                        <p className="text-stone-600 font-serif italic text-lg mb-8 leading-relaxed flex-grow">
                            "{t.quote}"
                        </p>

                        {/* User Profile */}
                        <div className="flex items-center gap-4 mt-auto border-t border-stone-100 pt-6">
                            <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md group-hover:scale-110 transition-transform duration-300" />
                            <div>
                                <h4 className="font-bold text-brand-dark text-sm">{t.name}</h4>
                                <p className="text-stone-400 text-xs uppercase tracking-wide">{t.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* 5. Big CTA Footer */}
      <section className="py-32 bg-stone-50 flex items-center justify-center relative overflow-hidden">
         <div className="max-w-4xl mx-auto px-6 text-center z-10 reveal-on-scroll">
            <h2 className="text-8xl md:text-5xl font-bold text-brand-dark mb-8">Ready to shine?</h2>
            <p className="text-stone-500 text-lg mb-12">당신의 이야기가 청중을 사로잡는 순간, 그 시작을 함께합니다. </p>
            <button 
                onClick={() => onStart('prep-flow')}
                className="bg-brand-dark text-white text-lg px-12 py-4 rounded-full font-bold hover:bg-brand-green transition-colors duration-300 shadow-2xl hover:shadow-brand-green/30"
            >
                발표 준비 시작하기
            </button>
         </div>
         {/* Decorative big text in background */}
         <div className="absolute -bottom-20 left-0 w-full text-center pointer-events-none select-none">
             <span className="text-[200px] font-serif font-bold text-stone-100 opacity-50 leading-none">LiveCoach</span>
         </div>
      </section>

      {/* Aesthetic Minimal Footer */}
      <footer className="py-8 bg-white border-t border-stone-200">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-1 mb-4 md:mb-0">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-serif font-bold text-s">🗣️</div>
                  <span className="font-serif font-bold text-brand-dark">LiveCoach</span>
              </div>
              <div className="flex gap-8 text-xs font-medium text-stone-400 uppercase tracking-wider">
                  <span>(c)IBM</span>
                  <span>강원대x강릉원주대</span>
                  <span>2026.01</span>
              </div>
          </div>
      </footer>
    </div>
  );
};