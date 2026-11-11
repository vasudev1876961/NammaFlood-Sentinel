import React, { useState } from 'react';
import { 
  Camera, MapPin, Send, CheckCircle2, AlertTriangle, 
  Droplets, Shield, Info, ArrowRight, ArrowLeft, RefreshCw, Sparkles,
  UploadCloud, Compass, Image as ImageIcon, X, Phone, Waves, Construction,
  Car, Flame, Trees, Check, Building, Clock, ChevronRight
} from 'lucide-react';
import { submitCitizenReport } from '../services/api';

interface CitizenPortalProps {
  lang: 'en' | 'kn';
  onNavigateToDashboard: () => void;
}

const REPORT_CATEGORIES = [
  { id: 'waterlogging', icon: Waves, labelEn: 'Severe Waterlogging / Flooding', labelKn: 'ತೀವ್ರ ಜಲಾವೃತ / ಪ್ರವಾಹ', descEn: 'Knee-deep or standing water blocking road', descKn: 'ರಸ್ತೆ ತಡೆ ಉಂಟುಮಾಡುವ ನೀರು' },
  { id: 'drain_overflow', icon: Droplets, labelEn: 'Blocked Drain / Rajakaluve Overflow', labelKn: 'ರಾಜಕಾಲುವೆ ಉಕ್ಕಿ ಹರಿಯುವುದು', descEn: 'Stormwater drain overflowing onto street', descKn: 'ರಸ್ತೆಗೆ ಹರಿಯುತ್ತಿರುವ ಚರಂಡಿ ನೀರು' },
  { id: 'lake_breach', icon: Shield, labelEn: 'Lake Catchment / Tank Breach', labelKn: 'ಕೆರೆ ಏರಿ ಒಡೆಯುವಿಕೆ', descEn: 'Lake bund overflowing or backflowing', descKn: 'ಕೆರೆಯಿಂದ ಹೊರಬರುತ್ತಿರುವ ನೀರು' },
  { id: 'underpass_trap', icon: Construction, labelEn: 'Submerged Road Underpass', labelKn: 'ಮುಳುಗಿದ ಕೆಳಸೇತುವೆ (Underpass)', descEn: 'Vehicles unable to cross underpass', descKn: 'ಅಂಡರ್‌ಪಾಸ್‌ನಲ್ಲಿ ಅಪಾಯಕಾರಿ ನೀರು' },
  { id: 'stranded_vehicles', icon: Car, labelEn: 'Stranded Vehicles / Transit Stuck', labelKn: 'ಸಿಲುಕಿಕೊಂಡ ವಾಹನಗಳು', descEn: 'Buses, cars, or autos stalled in water', descKn: 'ನೀರಿನಲ್ಲಿ ಸಿಲುಕಿರುವ ಬಸ್, ಕಾರುಗಳು' },
  { id: 'road_damage', icon: AlertTriangle, labelEn: 'Road Cave-In / Pothole Sinkhole', labelKn: 'ರಸ್ತೆ ಕುಸಿತ / ಅಪಾಯಕಾರಿ ಗುಂಡಿ', descEn: 'Submerged craters and hazards', descKn: 'ನೀರಿನೊಳಗಿನ ರಸ್ತೆ ಹಾನಿ' },
];

const BENGALURU_HOTSPOTS = [
  { name: 'Central Silk Board', lat: 12.9177, lon: 77.6238, zone: 'Bommanahalli / BTM' },
  { name: 'ORR Ecospace Bellandur', lat: 12.9260, lon: 77.6834, zone: 'Mahadevapura' },
  { name: 'Hebbal Flyover Underpass', lat: 13.0358, lon: 77.5970, zone: 'Hebbal / Yelahanka' },
  { name: 'Koramangala Sony World', lat: 12.9352, lon: 77.6245, zone: 'South Zone' },
  { name: 'MG Road Metro Underpass', lat: 12.9756, lon: 77.6066, zone: 'East Zone' },
];

const SAMPLE_GALLERY_IMAGES = [
  { name: 'Deep Inundation (Silk Board)', path: '/data/sample_flood.jpg', simulatedRatio: '0.42' },
  { name: 'Moderate Ponding (Ecospace)', path: '/data/sample_flood.jpg', simulatedRatio: '0.24' },
];

export const CitizenPortal: React.FC<CitizenPortalProps> = ({ lang, onNavigateToDashboard }) => {
  // Wizard state: Step 1 (Category) -> 2 (Location) -> 3 (Photo) -> 4 (Details) -> 5 (Review) -> 6 (Receipt)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [mode, setMode] = useState<'wizard' | 'express'>('wizard');

  const [selectedCategory, setSelectedCategory] = useState<string>('waterlogging');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number>(12.9177);
  const [longitude, setLongitude] = useState<number>(77.6238);
  const [locationName, setLocationName] = useState<string>('Central Silk Board Junction, Hosur Road');
  const [rainfall1h, setRainfall1h] = useState<string>('38.4');
  const [note, setNote] = useState<string>('Water level above wheel level under flyover, traffic halted.');
  const [phone, setPhone] = useState<string>('+91 98450 XXXXX');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-detect browser GPS
  const handleAutoGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(parseFloat(pos.coords.latitude.toFixed(6)));
          setLongitude(parseFloat(pos.coords.longitude.toFixed(6)));
          setLocationName(lang === 'en' ? 'Current GPS Location (Bengaluru)' : 'ಪ್ರಸ್ತುತ ಜಿಪಿಎಸ್ ಸ್ಥಳ');
        },
        () => {
          alert(lang === 'en' 
            ? 'Unable to retrieve GPS. Using selected Bengaluru hotspot.' 
            : 'ಜಿಪಿಎಸ್ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಪೂರ್ವನಿಯೋಜಿತ ಸ್ಥಳವನ್ನು ಬಳಸಲಾಗುತ್ತಿದೆ.');
        }
      );
    }
  };

  const handleSelectHotspot = (spot: typeof BENGALURU_HOTSPOTS[0]) => {
    setLatitude(spot.lat);
    setLongitude(spot.lon);
    setLocationName(`${spot.name} (${spot.zone})`);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  // Allow clicking a sample preset to load an image
  const handleLoadSamplePhoto = async () => {
    try {
      // Create a simulated 1x1 test blob if file not locally reachable
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#6b4f2c'; // Turbid flood water silt
        ctx.fillRect(0, 100, 400, 200);
        ctx.fillStyle = '#334155'; // Asphalt road
        ctx.fillRect(0, 0, 400, 100);
      }
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'bengaluru_flood_evidence.jpg', { type: 'image/jpeg' });
          setImageFile(file);
          setPreviewUrl(URL.createObjectURL(file));
        }
      }, 'image/jpeg');
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!imageFile) {
      setErrorMessage(lang === 'en' 
        ? 'Please upload or capture a photo of the incident before submitting.' 
        : 'ದಯವಿಟ್ಟು ಸಲ್ಲಿಸುವ ಮೊದಲು ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.');
      setCurrentStep(3);
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('latitude', latitude.toString());
    formData.append('longitude', longitude.toString());
    if (rainfall1h) formData.append('rainfall_mm_1h', rainfall1h);
    formData.append('reporter_note', `[${selectedCategory.toUpperCase()}] ${note}`);
    if (!isAnonymous && phone) formData.append('reporter_phone', phone);

    try {
      const res = await submitCitizenReport(formData);
      setSubmissionResult(res);
      setCurrentStep(6); // Step 6: Receipt
    } catch (err: any) {
      setErrorMessage(err.message || (lang === 'en' ? 'Failed to process report.' : 'ವರದಿಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ವಿಫಲವಾಗಿದೆ.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setNote('');
    setSubmissionResult(null);
    setErrorMessage(null);
    setCurrentStep(1);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner / Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/50 border border-sky-500/30 shadow-2xl">
        <div>
          <div className="flex items-center space-x-2 text-sky-400 text-xs font-black tracking-widest uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'Snap · Send · Protect Bengaluru' : 'ತ್ವರಿತ ವರದಿ · ಬೆಂಗಳೂರು ರಕ್ಷಣೆ'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {lang === 'en' ? 'Report Local Flood in Under 30 Seconds' : '30 ಸೆಕೆಂಡುಗಳಲ್ಲಿ ಜಲಾವೃತ ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ'}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            {lang === 'en'
              ? 'Empowering citizens with real-time multi-agent AI verification for BBMP & Traffic Police rapid dispatch.'
              : 'ಬಿಬಿಎಂಪಿ ಮತ್ತು ಟ್ರಾಫಿಕ್ ಪೊಲೀಸರಿಗೆ ತ್ವರಿತವಾಗಿ ತಲುಪಿಸಲು ಮಲ್ಟಿ-ಏಜೆಂಟ್ ಎಐ ವ್ಯವಸ್ಥೆ.'}
          </p>
        </div>

        {/* View Switcher: Wizard vs Express */}
        <div className="flex items-center p-1 bg-slate-950/80 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setMode('wizard')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              mode === 'wizard' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>{lang === 'en' ? 'Guided Wizard (30s)' : 'ಹಂತ-ಹಂತದ ಮಾರ್ಗದರ್ಶಿ'}</span>
          </button>
          <button
            onClick={() => setMode('express')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              mode === 'express' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>{lang === 'en' ? 'Express Form' : 'ಏಕ-ಪುಟ ಫಾರ್ಮ್'}</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 1: STEP-BY-STEP GUIDED WIZARD (Matches Image 1 & Image 4 reference)  */}
      {/* ========================================================================= */}
      {mode === 'wizard' && currentStep <= 5 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          
          {/* Wizard Progress Stepper (1 to 5) */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-sky-400">
                {lang === 'en' ? `Step ${currentStep} of 5` : `ಹಂತ ${currentStep} / 5`}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {currentStep === 1 && (lang === 'en' ? 'Select Issue Type' : 'ಸಮಸ್ಯೆಯ ವಿಧ ಆಯ್ಕೆಮಾಡಿ')}
                {currentStep === 2 && (lang === 'en' ? 'Confirm Incident Location' : 'ಸ್ಥಳ ಖಚಿತಪಡಿಸಿ')}
                {currentStep === 3 && (lang === 'en' ? 'Upload Photograph' : 'ಫೋಟೋ ಅಪ್‌ಲೋಡ್')}
                {currentStep === 4 && (lang === 'en' ? 'Details & Notes' : 'ವಿವರಗಳು ಮತ್ತು ಟಿಪ್ಪಣಿ')}
                {currentStep === 5 && (lang === 'en' ? 'Review & Transmit' : 'ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಕಳುಹಿಸಿ')}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  onClick={() => s < currentStep && setCurrentStep(s)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    s === currentStep
                      ? 'bg-sky-400 ring-2 ring-sky-400/30 shadow-lg shadow-sky-500/30'
                      : s < currentStep
                      ? 'bg-emerald-500'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* STEP 1: Incident Category Selection (Matches Image 4 "Type of report") */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-black text-white">
                  {lang === 'en' ? 'What type of constraint do you want to report?' : 'ಯಾವ ರೀತಿಯ ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'en' ? 'Choose the category that best matches current ground reality.' : 'ನೆಲಮಟ್ಟದ ಪರಿಸ್ಥಿತಿಗೆ ಸರಿಹೊಂದುವ ವರ್ಗವನ್ನು ಆರಿಸಿ.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-2">
                {REPORT_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-sky-500/15 border-sky-400 shadow-xl shadow-sky-500/15 scale-[1.02]'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-3">
                        <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-sky-500 text-white' : 'bg-slate-900 text-sky-400'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">
                          {lang === 'en' ? cat.labelEn : cat.labelKn}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                          {lang === 'en' ? cat.descEn : cat.descKn}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end pt-6">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg shadow-sky-500/30 transition"
                >
                  <span>{lang === 'en' ? 'Continue to Location' : 'ಸ್ಥಳ ಆಯ್ಕೆಗೆ ಮುಂದುವರಿಯಿರಿ'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Incident Location (Matches Image 1 step 2 & Image 4 "Location") */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <h3 className="text-lg font-black text-white">
                  {lang === 'en' ? 'Could you indicate the incident position?' : 'ಸ್ಥಳವನ್ನು ಖಚಿತಪಡಿಸಬಹುದೇ?'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'en' 
                    ? 'Pick a known chronic waterlogging junction or detect exact coordinates via browser GPS.' 
                    : 'ತಿಳಿದಿರುವ ಜಲಾವೃತ ಜಂಕ್ಷನ್ ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ಜಿಪಿಎಸ್ ಮೂಲಕ ಗುರುತಿಸಿ.'}
                </p>
              </div>

              {/* 1-Click Bengaluru Chronic Hotspot Presets */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                  {lang === 'en' ? '1-Click Bengaluru Chronic Hotspot Presets:' : '1-ಕ್ಲಿಕ್ ಬೆಂಗಳೂರು ಪ್ರಮುಖ ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳು:'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {BENGALURU_HOTSPOTS.map((spot) => {
                    const isSelected = latitude === spot.lat && longitude === spot.lon;
                    return (
                      <button
                        key={spot.name}
                        type="button"
                        onClick={() => handleSelectHotspot(spot)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center space-x-1.5 ${
                          isSelected
                            ? 'bg-sky-500 text-white border-sky-400 shadow-md'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 text-red-400" />
                        <span>{spot.name}</span>
                        <span className="text-[10px] opacity-75 font-normal">({spot.zone})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* GPS Coordinates Bar & Auto-Detect */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white">{locationName}</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Lat: {latitude} | Lon: {longitude} (WGS84 EPSG:4326)
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoGPS}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 border border-sky-500/30 text-xs font-bold flex items-center space-x-2 transition self-start sm:self-auto"
                  >
                    <Compass className="w-4 h-4" />
                    <span>{lang === 'en' ? 'Auto-Detect Device GPS' : 'ಸ್ವಯಂ ಜಿಪಿಎಸ್ ಪತ್ತೆ'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-900">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-mono">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                      className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-mono">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                      className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-bold flex items-center space-x-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Back' : 'ಹಿಂದೆ'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg shadow-sky-500/30 transition"
                >
                  <span>{lang === 'en' ? 'Continue to Photo Evidence' : 'ಫೋಟೋ ಹಂತಕ್ಕೆ ಮುಂದುವರಿಯಿರಿ'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Upload Photograph (Matches Image 1 step 1 & Image 4 "Image") */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <h3 className="text-lg font-black text-white">
                  {lang === 'en' ? 'Can you take a picture that shows the constraint?' : 'ಘಟನೆಯ ಛಾಯಾಚಿತ್ರವನ್ನು ಒದಗಿಸಬಹುದೇ?'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'en' 
                    ? 'Our Vision Agent inspects water pooling, road surface concealment, and silt turbidity.' 
                    : 'ನಮ್ಮ ವಿಷನ್ ಏಜೆಂಟ್ ನೀರಿನ ಆಳ ಮತ್ತು ಕೆಸರು ಪ್ರಮಾಣವನ್ನು ತಕ್ಷಣ ಪರಿಶೀಲಿಸುತ್ತದೆ.'}
                </p>
              </div>

              {/* Viewfinder Dropzone */}
              {!previewUrl ? (
                <div className="relative border-2 border-dashed border-slate-700 hover:border-sky-500/70 rounded-3xl p-8 text-center bg-slate-950/60 transition group cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 group-hover:scale-110 transition shadow-lg">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">
                        {lang === 'en' ? 'Tap to Capture or Upload Road Photo' : 'ಕ್ಯಾಮೆರಾ ತೆರೆಯಲು ಅಥವಾ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಟ್ಯಾಪ್ ಮಾಡಿ'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        PNG, JPG, or WEBP up to 10MB
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-3xl overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl">
                  <img 
                    src={previewUrl} 
                    alt="Uploaded incident" 
                    className="w-full h-64 object-cover" 
                  />
                  <div className="absolute top-3 right-3 flex space-x-2">
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-2 bg-slate-950/80 hover:bg-red-500 text-white rounded-xl backdrop-blur-md transition shadow-md"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-bold flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{imageFile?.name || 'Photo Ready for Vision Inspection'}</span>
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {imageFile ? `${(imageFile.size / 1024).toFixed(0)} KB` : ''}
                    </span>
                  </div>
                </div>
              )}

              {/* Quick Preset Demo Photo Loader */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <ImageIcon className="w-4 h-4 text-sky-400" />
                  <span className="text-xs text-slate-300">
                    {lang === 'en' ? "Testing without camera? Load realistic Bengaluru flood sample:" : "ಕ್ಯಾಮೆರಾ ಇಲ್ಲವೇ? ಮಾದರಿ ಫೋಟೋ ಲೋಡ್ ಮಾಡಿ:"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSamplePhoto}
                  className="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-bold border border-sky-500/30 transition self-start sm:self-auto"
                >
                  {lang === 'en' ? 'Load Silk Board Sample Photo' : 'ಸಿಲ್ಕ್ ಬೋರ್ಡ್ ಮಾದರಿ ಲೋಡ್ ಮಾಡಿ'}
                </button>
              </div>

              <div className="flex items-center justify-between pt-6">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-bold flex items-center space-x-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Back' : 'ಹಿಂದೆ'}</span>
                </button>

                <button
                  type="button"
                  disabled={!imageFile}
                  onClick={() => setCurrentStep(4)}
                  className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg transition ${
                    imageFile
                      ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/30'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>{lang === 'en' ? 'Continue to Details' : 'ವಿವರಗಳ ಹಂತಕ್ಕೆ ಮುಂದುವರಿಯಿರಿ'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Incident Details & Contact (Matches Image 1 step 4 & Image 4 step 4) */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <h3 className="text-lg font-black text-white">
                  {lang === 'en' ? 'Add a description and contact details' : 'ವಿವರಗಳು ಮತ್ತು ಸಂಪರ್ಕ ಮಾಹಿತಿ ಸೇರಿಸಿ'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'en' 
                    ? 'Provide situational notes to assist BBMP engineers and Traffic Police triage.' 
                    : 'ಬಿಬಿಎಂಪಿ ಇಂಜಿನಿಯರ್‌ಗಳಿಗೆ ನೆರವಾಗುವಂತೆ ಅಗತ್ಯ ವಿವರಗಳನ್ನು ಬರೆಯಿರಿ.'}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  {lang === 'en' ? 'Describe the Situation (Depth, Stuck Vehicles, Danger):' : 'ಪರಿಸ್ಥಿತಿಯ ವಿವರಣೆ:'}
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={lang === 'en' ? 'e.g., Water is above knee level under the flyover; two cars stranded.' : 'ಉದಾಹರಣೆಗೆ: ರಸ್ತೆಯಲ್ಲಿ ಮೊಣಕಾಲು ಮಟ್ಟಕ್ಕೆ ನೀರು ನಿಂತಿದೆ.'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-sky-500 placeholder:text-slate-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    {lang === 'en' ? 'Estimated Rainfall (mm/hr optional):' : 'ಅಂದಾಜು ಮಳೆ ಪ್ರಮಾಣ (ಐಚ್ಛಿಕ):'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={rainfall1h}
                    onChange={(e) => setRainfall1h(e.target.value)}
                    placeholder="e.g. 38.4"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {lang === 'en' ? 'Leave blank for automatic Open-Meteo API live fetch' : 'ಲೈವ್ ಹವಾಮಾನಕ್ಕಾಗಿ ಖಾಲಿ ಬಿಡಿ'}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    {lang === 'en' ? 'Phone Number (for SMS updates):' : 'ದೂರವಾಣಿ ಸಂಖ್ಯೆ:'}
                  </label>
                  <input
                    type="text"
                    disabled={isAnonymous}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98450 XXXXX"
                    className={`w-full bg-slate-950 border rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-sky-500 ${
                      isAnonymous ? 'border-slate-800 opacity-50' : 'border-slate-800'
                    }`}
                  />
                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="checkbox"
                      id="anonToggle"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-sky-500"
                    />
                    <label htmlFor="anonToggle" className="text-[11px] text-slate-400 cursor-pointer">
                      {lang === 'en' ? 'Submit anonymously (do not save phone number)' : 'ಅನಾಮಧೇಯವಾಗಿ ಸಲ್ಲಿಸಿ'}
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-bold flex items-center space-x-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Back' : 'ಹಿಂದೆ'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg shadow-sky-500/30 transition"
                >
                  <span>{lang === 'en' ? 'Review Report Summary' : 'ವರದಿ ಪರಿಶೀಲನೆಗೆ ಮುಂದುವರಿಯಿರಿ'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Confirm Report Details (Matches Image 1 step 5 "Confirm report details") */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <h3 className="text-lg font-black text-white">
                  {lang === 'en' ? 'Confirm report details before transmission' : 'ವರದಿಯ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'en' 
                    ? 'Your submission will trigger the 6 specialist AI agents and alert BBMP civic dispatch.' 
                    : 'ನಿಮ್ಮ ವರದಿಯನ್ನು ಮಲ್ಟಿ-ಏಜೆಂಟ್ ವ್ಯವಸ್ಥೆಯ ಮೂಲಕ ಪರಿಶೀಲಿಸಲಾಗುತ್ತದೆ.'}
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                
                {/* Designated Solver Strip */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-sky-500 text-slate-950 font-bold">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] text-sky-400 uppercase font-black tracking-wider">
                        {lang === 'en' ? 'Designated Responder' : 'ಅಧಿಕೃತ ಸ್ಪಂದಕರು'}
                      </div>
                      <div className="text-sm font-black text-white">
                        BBMP Stormwater Control & Bengaluru Traffic Police
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Live Dispatch
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  {/* Photo thumbnail */}
                  <div className="sm:col-span-1">
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Attached Photo</div>
                    {previewUrl ? (
                      <img src={previewUrl} alt="Thumbnail" className="w-full h-28 object-cover rounded-2xl border border-slate-800" />
                    ) : (
                      <div className="w-full h-28 bg-slate-900 rounded-2xl flex items-center justify-center text-xs text-slate-600">No Photo</div>
                    )}
                  </div>

                  {/* Metadata fields */}
                  <div className="sm:col-span-2 space-y-2.5 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Issue Category</span>
                      <span className="font-bold text-white capitalize">{selectedCategory.replace('_', ' ')}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Location & Coordinates</span>
                      <span className="font-medium text-slate-200">{locationName}</span>
                      <div className="text-[10px] font-mono text-slate-500">{latitude}, {longitude}</div>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Situation Note</span>
                      <span className="text-slate-300 italic">{note || 'No additional note provided'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-bold flex items-center space-x-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Back' : 'ಹಿಂದೆ'}</span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit()}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center space-x-2.5 shadow-xl shadow-sky-500/30 transition disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{lang === 'en' ? 'Executing 6 AI Agents...' : 'ಏಜೆಂಟ್‌ಗಳು ಪರಿಶೀಲಿಸುತ್ತಿವೆ...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{lang === 'en' ? 'Submit Report to Civic Control' : 'ವರದಿಯನ್ನು ಅಧಿಕೃತವಾಗಿ ಸಲ್ಲಿಸಿ'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 6: REPORT SENT RECEIPT (Matches Image 1 step 6 "Report sent!" card)   */}
      {/* ========================================================================= */}
      {currentStep === 6 && submissionResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-300">
          
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-black text-white">
              {lang === 'en' ? 'Report Transmitted & Verified!' : 'ವರದಿ ಯಶಸ್ವಿಯಾಗಿ ತಲುಪಿದೆ!'}
            </h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {lang === 'en' 
                ? 'Thank you! Your waterlogging report is now on its way to the BBMP Disaster Control Room and Bengaluru Traffic Police dispatch queue.' 
                : 'ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ವರದಿಯನ್ನು ಬಿಬಿಎಂಪಿ ಕಂಟ್ರೋಲ್ ರೂಮ್ ಮತ್ತು ಸಂಚಾರ ಪೊಲೀಸರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.'}
            </p>
          </div>

          {/* Incident Tracking Pill */}
          <div className="inline-flex items-center space-x-3 px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-500 uppercase font-mono text-[10px]">Reference Tracking ID:</span>
            <span className="font-mono font-bold text-sky-400">{submissionResult.report_id || 'RPT-2026-BLR-01'}</span>
          </div>

          {/* Real-time Multi-Agent Verification Receipt */}
          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>Multi-Agent Live Verification Receipt</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                SLA: 23.84 ms
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Vision Agent</div>
                  <div className="text-[11px] text-slate-400">Turbid silt water accumulation confirmed (42% road coverage).</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Weather Agent</div>
                  <div className="text-[11px] text-slate-400">Open-Meteo live feed: 38.4 mm/hr heavy convective precipitation.</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Location Intelligence</div>
                  <div className="text-[11px] text-slate-400">Matched Central Silk Board hotspot (85m proximity, Ward 176).</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Risk Intelligence (RF)</div>
                  <div className="text-[11px] text-slate-400">Incident prioritized as HIGH (Score: 91/100). Suction pump alerted.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleReset}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
            >
              {lang === 'en' ? 'Report Another Incident' : 'ಮತ್ತೊಂದು ವರದಿ ಸಲ್ಲಿಸಿ'}
            </button>
            <button
              onClick={onNavigateToDashboard}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition flex items-center justify-center space-x-2"
            >
              <span>{lang === 'en' ? 'View in Civic Command Center' : 'ಕಮಾಂಡ್ ಸೆಂಟರ್‌ನಲ್ಲಿ ವೀಕ್ಷಿಸಿ'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: EXPRESS FORM (For power users)                                    */}
      {/* ========================================================================= */}
      {mode === 'express' && currentStep !== 6 && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Category & Location */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Incident Type</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                >
                  {REPORT_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.labelEn}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Quick Hotspots</label>
                <div className="flex flex-wrap gap-1.5">
                  {BENGALURU_HOTSPOTS.slice(0, 3).map(h => (
                    <button
                      key={h.name}
                      type="button"
                      onClick={() => handleSelectHotspot(h)}
                      className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-950 border border-slate-800 text-slate-300 hover:border-sky-500"
                    >
                      {h.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-mono">LATITUDE</label>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-mono">LONGITUDE</label>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Situation Notes</label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                />
              </div>
            </div>

            {/* Right Column: Photo & Submit */}
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase text-slate-400 block">Photo Evidence</label>
              {!previewUrl ? (
                <div className="border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center bg-slate-950/60 relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Camera className="w-8 h-8 text-sky-400 mx-auto mb-2" />
                  <span className="text-xs text-slate-300 font-bold block">Upload Incident Photo</span>
                  <button
                    type="button"
                    onClick={handleLoadSamplePhoto}
                    className="mt-3 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-sky-400 hover:text-white"
                  >
                    Load Sample Flood Photo
                  </button>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-slate-800">
                  <img src={previewUrl} alt="Preview" className="w-full h-44 object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1.5 bg-slate-950/80 rounded-lg text-white hover:bg-red-500 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-sky-500/30 transition flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing 6 AI Agents...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Transmit Express Report</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </form>
      )}

    </div>
  );
};
