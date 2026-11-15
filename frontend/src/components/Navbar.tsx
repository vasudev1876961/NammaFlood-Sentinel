import React, { useState, useEffect } from 'react';
import { 
  CloudRain, ShieldCheck, UserCheck, Languages, 
  Cpu, Download, CloudSun, Radio, Sparkles, X, Key, CheckCircle2, AlertTriangle, RefreshCw
} from 'lucide-react';
import { downloadIncidentsCSV, fetchGeminiStatus, updateGeminiKey } from '../services/api';

interface NavbarProps {
  activeTab: 'citizen' | 'admin' | 'analytics';
  setActiveTab: (tab: 'citizen' | 'admin' | 'analytics') => void;
  lang: 'en' | 'kn';
  setLang: (lang: 'en' | 'kn') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, lang, setLang }) => {
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [geminiEnabled, setGeminiEnabled] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');
  const [savingKey, setSavingKey] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    checkGemini();
  }, []);

  const checkGemini = async () => {
    try {
      const res = await fetchGeminiStatus();
      setGeminiEnabled(res.enabled);
      setMaskedKey(res.masked_key);
      if (res.model) setSelectedModel(res.model);
    } catch {
      // ignore
    }
  };

  const handleSaveGeminiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKey(true);
    setStatusMsg(null);
    try {
      const res = await updateGeminiKey(inputKey, selectedModel);
      setStatusMsg({ type: 'success', text: res.message });
      setGeminiEnabled(true);
      if (res.masked_key) setMaskedKey(res.masked_key);
      setInputKey('');
      setTimeout(() => {
        setShowGeminiModal(false);
        setStatusMsg(null);
      }, 1800);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSavingKey(false);
    }
  };

  return (
    <>
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
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Gemini Multimodal Badge */}
            <button
              onClick={() => setShowGeminiModal(true)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                geminiEnabled
                  ? 'bg-gradient-to-r from-purple-500/20 to-sky-500/20 border-purple-500/40 text-purple-300 shadow-md shadow-purple-500/10 hover:border-purple-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
              title="Configure Google Gemini Vision & Multimodal AI"
            >
              <Sparkles className={`w-3.5 h-3.5 ${geminiEnabled ? 'text-purple-400 animate-spin-slow' : 'text-slate-400'}`} />
              <span>Gemini AI</span>
              {geminiEnabled ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              ) : (
                <span className="text-[9px] px-1 bg-slate-800 rounded text-slate-400">Setup</span>
              )}
            </button>

            {/* Navigation Pill Switcher */}
            <nav className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow-inner">
              <button
                onClick={() => setActiveTab('citizen')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  activeTab === 'citizen'
                    ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/25 scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Citizen' : 'ನಾಗರಿಕ'}</span>
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/25 scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Command Room' : 'ಕಂಟ್ರೋಲ್'}</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  activeTab === 'analytics'
                    ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/25 scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Analytics' : 'ವಿಶ್ಲೇಷಣೆ'}</span>
              </button>
            </nav>

            {/* Export Incidents CSV */}
            <button
              onClick={downloadIncidentsCSV}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-800 hover:border-slate-700 transition shadow-sm"
              title="Download BBMP Dispatch Incident CSV"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'en' ? 'kn' : 'en')}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-800 hover:border-slate-700 transition shadow-sm"
              title="Toggle Language (English / Kannada)"
            >
              <Languages className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'en' ? 'ಕನ್ನಡ' : 'EN'}</span>
            </button>

          </div>

        </div>
      </header>

      {/* Gemini API Key Configuration Modal */}
      {showGeminiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Google Gemini Multimodal AI</h3>
                  <p className="text-[11px] text-slate-400">Flood depth estimation, vehicle detection & hazard reasoning</p>
                </div>
              </div>

              <button
                onClick={() => setShowGeminiModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Status */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block">Status</span>
                <span className={`text-xs font-bold flex items-center space-x-1.5 ${geminiEnabled ? 'text-emerald-400' : 'text-slate-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${geminiEnabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                  <span>{geminiEnabled ? `Active: ${maskedKey}` : 'Using Local Computer Vision'}</span>
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-sky-400 border border-slate-800">
                {selectedModel}
              </span>
            </div>

            <form onSubmit={handleSaveGeminiKey} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Enter Gemini API Key:
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Keys are validated against Google Generative Language API and saved locally to `.env`.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Model:</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="gemini-1.5-flash">gemini-1.5-flash (Fast, Low Latency ~400ms)</option>
                  <option value="gemini-2.0-flash">gemini-2.0-flash (Next-Gen Multimodal)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro (Deep Reasoning & Analysis)</option>
                </select>
              </div>

              {statusMsg && (
                <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                  statusMsg.type === 'success' 
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border border-red-500/30 text-red-300'
                }`}>
                  {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
                  <span>{statusMsg.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGeminiModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingKey || !inputKey.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg transition flex items-center space-x-2 disabled:opacity-50"
                >
                  {savingKey ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying with Google...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Test & Activate</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
};
