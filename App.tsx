import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './components/Home';
import { PrepFlow } from './components/PrepFlow';
import { PrepScript } from './components/PrepScript';
import { PrepEval } from './components/PrepEval';
import { LiveMode } from './components/LiveMode';
import { AppView } from './types';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home onStart={setCurrentView} />;
      case 'prep-flow':
        return <PrepFlow />;
      case 'prep-script':
        return <PrepScript />;
      case 'prep-eval':
        return <PrepEval />;
      case 'live':
        return <LiveMode />;
      default:
        return <Home onStart={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-brand-green selection:text-white">
      {/* Navbar is visible on all pages, though style might adapt slightly */}
      <Navbar currentView={currentView} onChangeView={setCurrentView} />
      
      <main className="pt-0">
        {renderView()}
      </main>
    </div>
  );
}

export default App;
