import React from 'react';
import { CloudRain, ShieldCheck, UserCheck, Languages, Cpu, Download, CloudSun } from 'lucide-react';
import { downloadIncidentsCSV } from '../services/api';

interface NavbarProps {
  activeTab: 'citizen' | 'admin' | 'analytics';
  setActiveTab: (tab: 'citizen' | 'admin' | 'analytics') => void;
  lang: 'en' | 'kn';
  setLang: (lang: 'en' | 'kn') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, lang, setLang }) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3 transition-colors shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Brand & Weather Pill */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('citizen')}>
            <div className="p-2.5 bg-gradient-to-br from-sky-500/20 to-blue-600/20 text-sky-400 rounded-2xl border border-sky-500/30 shadow-lg shadow-sky-500/10">
              <CloudRain className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-black text-lg text-white tracking-tight">
                  {lang === 'en' ? 'NammaFlood Sentinel' : 'ನಮ್ಮಫ್ಲಡ್ ಸೆಂಟಿನೆಲ್'}
                </h1>
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 tracking-wider">
                  Bengaluru 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {lang === 'en' 
                  ? 'Multimodal Agentic Intelligence for Urban Flood & Civic Response' 
                  : 'ನಗರ ಪ್ರವಾಹ ಪತ್ತೆ ಮತ್ತು ನಾಗರಿಕ ಪ್ರತಿಕ್ರಿಯೆ ವ್ಯವಸ್ಥೆ'}
              </p>
            </div>
          </div>

          {/* Mobile Weather Pill */}
          <div className="flex md:hidden items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-sky-400 font-medium">
            <CloudSun className="w-3.5 h-3.5" />
            <span>24°C &bull; Light Rain</span>
          </div>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Live Bengaluru Weather Badge (Desktop) */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-medium">
            <CloudSun className="w-4 h-4 text-sky-400" />
            <span>Bengaluru: <span className="text-white font-semibold">24.2°C</span> | IMD Monsoon Grid Active</span>
          </div>

          {/* Navigation Pill Switcher */}
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('citizen')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'citizen'
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Citizen Portal' : 'ನಾಗರಿಕ ವರದಿ'}</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Civic Control' : 'ಕಂಟ್ರೋಲ್ ರೂಮ್'}</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'AI & ML Analytics' : 'ಎಐ ವಿಶ್ಲೇಷಣೆ'}</span>
            </button>
          </div>

          {/* Export Incidents CSV */}
          <button
            onClick={downloadIncidentsCSV}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
            title="Download BBMP Dispatch Incident CSV"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'en' ? 'kn' : 'en')}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
            title="Toggle Language (English / Kannada)"
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
          </button>

        </div>

      </div>
    </header>
  );
};
