import React, { useState } from 'react';
import { AppView } from '../types';

interface NavbarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onChangeView }) => {
  const [isPrepOpen, setIsPrepOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <div 
          onClick={() => onChangeView('home')}
          className="cursor-pointer flex items-center gap-2 group"
        >
          <div className="w-8 h-8 bg-brand-gray rounded-full flex items-center justify-center text-white font-serif font-bold text-xl group-hover:scale-105 transition-transform">
            🗣️
          </div>
          <span className="font-serif text-2xl font-bold text-brand-dark tracking-tight">
            PitchMate
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 font-sans font-medium text-stone-600">
          
          {/* Presentation Prep Dropdown */}
          <div 
            className="relative group h-20 flex items-center"
            onMouseEnter={() => setIsPrepOpen(true)}
            onMouseLeave={() => setIsPrepOpen(false)}
          >
            <button className={`flex items-center gap-1 hover:text-brand-green transition-colors ${currentView.startsWith('prep') ? 'text-brand-green font-bold' : ''}`}>
              PREPARATION
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            
            {/* Dropdown Menu */}
            <div className={`absolute top-full left-1/2 -translate-x-1/2 w-64 bg-white shadow-xl rounded-b-xl overflow-hidden transition-all duration-300 transform origin-top ${isPrepOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'}`}>
              <div className="py-2">
                <button 
                  onClick={() => { onChangeView('prep-flow'); setIsPrepOpen(false); }}
                  className="w-full text-left px-6 py-3 hover:bg-stone-50 hover:text-brand-green transition-colors"
                >
                  <span className="block text-sm font-bold">발표플로우 요약</span>
                  <span className="block text-xs text-stone-400 font-normal">Structure your content logic</span>
                </button>
                <div className="h-px bg-stone-100 mx-4"></div>
                <button 
                  onClick={() => { onChangeView('prep-script'); setIsPrepOpen(false); }}
                  className="w-full text-left px-6 py-3 hover:bg-stone-50 hover:text-brand-green transition-colors"
                >
                  <span className="block text-sm font-bold">발표대본 제작</span>
                  <span className="block text-xs text-stone-400 font-normal">Generate polished scripts</span>
                </button>
                <div className="h-px bg-stone-100 mx-4"></div>
                <button 
                  onClick={() => { onChangeView('prep-eval'); setIsPrepOpen(false); }}
                  className="w-full text-left px-6 py-3 hover:bg-stone-50 hover:text-brand-green transition-colors"
                >
                  <span className="block text-sm font-bold">AI 모의평가</span>
                  <span className="block text-xs text-stone-400 font-normal">Score against criteria</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Mode */}
          <button 
            onClick={() => onChangeView('live')}
            className={`px-6 py-2 rounded-full border transition-all duration-300 ${
              currentView === 'live' 
                ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-200' 
                : 'border-stone-300 hover:border-brand-green hover:text-brand-green'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${currentView === 'live' ? 'bg-white animate-pulse' : 'bg-red-500'}`}></span>
              ON AIR
            </span>
          </button>
        </div>

        {/* Mobile Menu Icon (Placeholder) */}
        <div className="md:hidden text-stone-800">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </div>
      </div>
    </nav>
  );
};
