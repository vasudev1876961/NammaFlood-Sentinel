import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { CitizenPortal } from './citizen/CitizenPortal';
import { AdminDashboard } from './dashboard/AdminDashboard';
import { AnalyticsView } from './dashboard/AnalyticsView';
import { ShieldCheck, Sparkles, Building2, PhoneCall } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'citizen' | 'admin' | 'analytics'>('admin');
  const [lang, setLang] = useState<'en' | 'kn'>('en');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      
      {/* Sticky Top Navigation Bar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        lang={lang} 
        setLang={setLang} 
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {activeTab === 'citizen' ? (
          <CitizenPortal 
            lang={lang} 
            onNavigateToDashboard={() => setActiveTab('admin')} 
          />
        ) : activeTab === 'admin' ? (
          <AdminDashboard 
            lang={lang} 
          />
        ) : (
          <AnalyticsView
            lang={lang}
            onScenarioExecuted={() => setActiveTab('admin')}
          />
        )}
      </main>

      {/* Emergency Contacts & Civic Transparency Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 backdrop-blur-md px-4 py-8 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Emergency Hotline Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-300">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-500/10 text-red-400 rounded-xl">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-500 font-bold">BBMP Flood Control Room</div>
                <div className="text-sm font-black text-white font-mono">080-22660000 / 1533</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-500 font-bold">Bengaluru Traffic Police (BTP)</div>
                <div className="text-sm font-black text-white font-mono">1095 / 080-22943030</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-500 font-bold">State Disaster Response (SDRF)</div>
                <div className="text-sm font-black text-white font-mono">1070 / 112 (National Emergency)</div>
              </div>
            </div>
          </div>

          {/* Attribution & Disclaimers */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left pt-2 border-t border-slate-900">
            <div>
              <div className="font-bold text-slate-400 text-sm">NammaFlood Sentinel</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                IBM Bobathon: Build for Bengaluru &bull; Student Category &bull; Theme: Smarter Streets, Better Living
              </div>
            </div>
            <div className="text-[11px] text-slate-500 max-w-md text-center sm:text-right">
              Advisory decision-support platform. Autonomous emergency dispatch disabled. All civic mobilization requires authorized human-in-the-loop approval.
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}

export default App;
