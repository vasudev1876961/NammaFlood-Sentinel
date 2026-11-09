import React from 'react';
import { 
  CloudRain, ShieldCheck, UserCheck, Languages, 
  Cpu, Download, CloudSun, Radio, ExternalLink
} from 'lucide-react';
import { downloadIncidentsCSV } from '../services/api';

interface NavbarProps {
  activeTab: 'citizen' | 'admin' | 'analytics';
  setActiveTab: (tab: 'citizen' | 'admin' | 'analytics') => void;
  lang: 'en' | 'kn';
  setLang: (lang: 'en' | 'kn') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, lang, setLang }) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-2.5 transition-colors shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Brand & Status Indicator */}
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center space-x-3.5 cursor-pointer group"
            onClick={() => setActiveTab('citizen')}
          >
            <div className="relative p-2.5 bg-gradient-to-br from-sky-500/25 via-blue-600/20 to-indigo-600/25 text-sky-400 rounded-2xl border border-sky-500/30 shadow-lg shadow-sky-500/10 group-hover:border-sky-400 transition-all duration-300">
              <CloudRain className="w-6 h-6 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-black text-lg text-white tracking-tight group-hover:text-sky-300 transition-colors">
                  {lang === 'en' ? 'NammaFlood Sentinel' : 'ನಮ್ಮಫ್ಲಡ್ ಸೆಂಟಿನೆಲ್'}
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/25 tracking-wider">
                  Bengaluru
                </span>
                <span className="hidden sm:inline-flex items-center space-x-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Radio className="w-2.5 h-2.5 animate-pulse" />
                  <span>GRID ACTIVE</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block tracking-wide">
                {lang === 'en' 
                  ? 'Multimodal Agentic Intelligence for Urban Flood Detection & Civic Coordination' 
                  : 'ನಗರ ಪ್ರವಾಹ ಪತ್ತೆ ಮತ್ತು ನಾಗರಿಕ ಪ್ರತಿಕ್ರಿಯೆ ವ್ಯವಸ್ಥೆ'}
              </p>
            </div>
          </div>

          {/* Mobile Weather Pill */}
          <div className="flex md:hidden items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-sky-400 font-medium">
            <CloudSun className="w-3.5 h-3.5" />
            <span>24.2°C &bull; Light Rain</span>
          </div>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Live Bengaluru Weather Badge (Desktop) */}
          <div className="hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800/90 text-xs text-slate-300 shadow-inner">
            <CloudSun className="w-4 h-4 text-sky-400" />
            <span>Bengaluru: <span className="text-white font-bold">24.2°C</span> | IMD Rainfall Alert Active</span>
          </div>

          {/* Navigation Pill Switcher */}
          <nav className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setActiveTab('citizen')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'citizen'
                  ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/25 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Citizen Portal' : 'ನಾಗರಿಕ ವರದಿ'}</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/25 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Civic Control' : 'ಕಂಟ್ರೋಲ್ ರೂಮ್'}</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/25 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'AI & ML Analytics' : 'ಎಐ ವಿಶ್ಲೇಷಣೆ'}</span>
            </button>
          </nav>

          {/* Export Incidents CSV */}
          <button
            onClick={downloadIncidentsCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-800 hover:border-slate-700 transition shadow-sm"
            title="Download BBMP Dispatch Incident CSV"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'en' ? 'kn' : 'en')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-800 hover:border-slate-700 transition shadow-sm"
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
