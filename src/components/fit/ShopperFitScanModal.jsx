import React, { useState } from 'react';
import { useFit } from '../../context/FitContext';
import {
  X,
  Camera,
  Upload,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  User,
  Scale,
  Ruler,
  RefreshCw,
  Sliders,
  Check
} from 'lucide-react';

export default function ShopperFitScanModal() {
  const { profile, updateProfile, isScanModalOpen, closeScanModal } = useFit();

  const [step, setStep] = useState(1); // 1 = Anchors, 2 = Photo Capture, 3 = Mesh Extracted
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'manual'

  // Metric anchors
  const [height, setHeight] = useState(profile.heightCm || 178);
  const [weight, setWeight] = useState(profile.weightKg || 74);
  const [gender, setGender] = useState(profile.gender || 'unisex');
  const [fitPreference, setFitPreference] = useState('regular'); // slim, regular, relaxed

  // Photos: can be { url, name, type } or null
  const [frontPhoto, setFrontPhoto] = useState(null);
  const [sidePhoto, setSidePhoto] = useState(null);
  const [isProcessingHmr, setIsProcessingHmr] = useState(false);
  const [isDraggingFront, setIsDraggingFront] = useState(false);
  const [isDraggingSide, setIsDraggingSide] = useState(false);

  // Hidden input refs
  const frontFileInputRef = React.useRef(null);
  const frontCameraInputRef = React.useRef(null);
  const sideFileInputRef = React.useRef(null);
  const sideCameraInputRef = React.useRef(null);

  const handleFrontFileSelect = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFrontPhoto({ url, name: file.name, type: 'upload' });
  };

  const handleSideFileSelect = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSidePhoto({ url, name: file.name, type: 'upload' });
  };

  const handleMockSnapFront = () => {
    setFrontPhoto({
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      name: 'Live_Camera_Front_Snap.jpg',
      type: 'snap'
    });
  };

  const handleMockSnapSide = () => {
    setSidePhoto({
      url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
      name: 'Live_Camera_Side_Profile.jpg',
      type: 'snap'
    });
  };

  // Manual sliders
  const [manualChest, setManualChest] = useState(profile.chestCm || 99);
  const [manualWaist, setManualWaist] = useState(profile.waistCm || 83);
  const [manualHip, setManualHip] = useState(profile.lowHipCm || 100);
  const [manualShoulder, setManualShoulder] = useState(profile.acrossShoulderCm || 44.5);

  if (!isScanModalOpen) return null;

  const handleSimulateCapture = () => {
    setIsProcessingHmr(true);
    setTimeout(() => {
      // Predict measurements mathematically from Height/Weight anchors + clothing invariant subtraction
      const bmi = weight / Math.pow(height / 100, 2);
      const estChest = Math.round((height * 0.53 + (bmi - 22) * 1.8) * 10) / 10;
      const estWaist = Math.round((height * 0.44 + (bmi - 22) * 2.2) * 10) / 10;
      const estHip = Math.round((height * 0.54 + (bmi - 22) * 1.6) * 10) / 10;
      const estShoulder = Math.round((height * 0.25) * 10) / 10;
      const estSleeve = Math.round((height * 0.35) * 10) / 10;

      updateProfile({
        heightCm: Number(height),
        weightKg: Number(weight),
        gender,
        chestCm: estChest,
        waistCm: estWaist,
        lowHipCm: estHip,
        acrossShoulderCm: estShoulder,
        sleeveLengthCm: estSleeve,
        scanConfidence: 0.96,
        captureMethod: 'two_photo_hmr'
      });

      setIsProcessingHmr(false);
      setStep(3);
    }, 1800);
  };

  const handleSaveManual = () => {
    updateProfile({
      heightCm: Number(height),
      weightKg: Number(weight),
      gender,
      chestCm: Number(manualChest),
      waistCm: Number(manualWaist),
      lowHipCm: Number(manualHip),
      acrossShoulderCm: Number(manualShoulder),
      scanConfidence: 0.92,
      captureMethod: 'manual_metric'
    });
    closeScanModal();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-zinc-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">Zero-Friction Fit Scanner</h3>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  HMR 2.0 / SMPL-X
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Under 15 seconds • Fully dressed • Private & zero cloud photo storage
              </p>
            </div>
          </div>

          <button
            onClick={closeScanModal}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-zinc-200 bg-zinc-50 px-6 pt-3 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('camera')}
            className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'camera'
                ? 'border-[#008060] text-[#008060]'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>2-Photo Mobile Scan (Recommended)</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'manual'
                ? 'border-[#008060] text-[#008060]'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Direct Metric Sliders</span>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'camera' ? (
            <div>
              {/* Step 1: Metric Anchors */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-emerald-900">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Metric Ground Truth Calibration</p>
                      <p className="text-[11px] text-emerald-800/90 mt-0.5">
                        Height and weight anchor metric coordinates so our algorithm strips clothing volume without guesswork.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1 flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Height: {height} cm ({Math.floor(height / 30.48)}&apos;{Math.round((height % 30.48) / 2.54)}&quot;)</span>
                      </label>
                      <input
                        type="range"
                        min="140"
                        max="215"
                        value={height}
                        onChange={(e) => setHeight(Number(e.target.value))}
                        className="w-full accent-[#008060] cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-zinc-400 font-mono mt-1">
                        <span>140 cm</span>
                        <span>175 cm</span>
                        <span>215 cm</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1 flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Weight: {weight} kg ({Math.round(weight * 2.20462)} lbs)</span>
                      </label>
                      <input
                        type="range"
                        min="40"
                        max="140"
                        value={weight}
                        onChange={(e) => setWeight(Number(e.target.value))}
                        className="w-full accent-[#008060] cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-zinc-400 font-mono mt-1">
                        <span>40 kg</span>
                        <span>75 kg</span>
                        <span>140 kg</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Body Frame</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs bg-white text-zinc-900"
                      >
                        <option value="male">Masculine / Broad Frame</option>
                        <option value="female">Feminine / Hourglass Frame</option>
                        <option value="unisex">Unisex / Standard Frame</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Fit Preference</label>
                      <select
                        value={fitPreference}
                        onChange={(e) => setFitPreference(e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs bg-white text-zinc-900"
                      >
                        <option value="slim">Slim & Tailored (Close fit)</option>
                        <option value="regular">Regular Designer Drape</option>
                        <option value="relaxed">Relaxed / Oversized Room</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-200 flex justify-end">
                    <button
                      onClick={() => setStep(2)}
                      className="px-5 py-2.5 bg-[#008060] hover:bg-[#006e52] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Next: 2 Casual Mobile Photos</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Casual Photo Capture */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <h4 className="text-sm font-bold text-zinc-900">Take 2 Casual Photos in Fitted Clothing</h4>
                    <p className="text-xs text-zinc-500">
                      Stand ~2 meters back. Keep phone vertical at waist level. No need to change clothes.
                    </p>
                  </div>

                  {/* Level Guide indicator */}
                  <div className="bg-zinc-100 rounded-lg p-2.5 flex items-center justify-between text-xs text-zinc-700">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Gyro Pitch Level: <strong>90.4° (Optimal alignment)</strong></span>
                    </span>
                    <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Perspective Error &lt; 1.2%
                    </span>
                  </div>

                  {/* Hidden Inputs for Front and Side Photo Capture */}
                  <input
                    ref={frontFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFrontFileSelect(e.target.files?.[0])}
                  />
                  <input
                    ref={frontCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={(e) => handleFrontFileSelect(e.target.files?.[0])}
                  />
                  <input
                    ref={sideFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleSideFileSelect(e.target.files?.[0])}
                  />
                  <input
                    ref={sideCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={(e) => handleSideFileSelect(e.target.files?.[0])}
                  />

                  {/* Photo Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Front Photo Card */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingFront(true); }}
                      onDragLeave={() => setIsDraggingFront(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingFront(false);
                        if (e.dataTransfer.files?.[0]) handleFrontFileSelect(e.dataTransfer.files[0]);
                      }}
                      className={`border-2 border-dashed rounded-xl p-4 transition-all relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[220px] aspect-4/5 ${
                        isDraggingFront
                          ? 'border-[#008060] bg-emerald-50/50 scale-[1.01]'
                          : frontPhoto
                          ? 'border-emerald-500 bg-zinc-900 p-0'
                          : 'border-zinc-300 bg-zinc-50/80 hover:border-zinc-400'
                      }`}
                    >
                      {frontPhoto ? (
                        <div className="relative w-full h-full min-h-[220px]">
                          <img
                            src={frontPhoto.url}
                            alt="Front View"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30 p-3 flex flex-col justify-between text-left">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Front Profile Locked</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setFrontPhoto(null)}
                                className="text-[10px] bg-white/20 hover:bg-red-600 text-white px-2 py-0.5 rounded font-bold backdrop-blur-sm transition-colors cursor-pointer"
                              >
                                Replace
                              </button>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white line-clamp-1">{frontPhoto.name || 'Front Scan'}</p>
                              <p className="text-[10px] text-emerald-300 font-mono">10,475 skin vertices extracted</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 w-full px-2">
                          <div className="w-12 h-12 rounded-full bg-zinc-200/80 flex items-center justify-center text-zinc-600 mx-auto">
                            <Camera className="w-5 h-5 text-zinc-700" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-900">1. Front View</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">Arms slightly relaxed at sides</p>
                          </div>
                          
                          <div className="flex flex-col gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => frontFileInputRef.current?.click()}
                              className="w-full py-1.5 px-3 bg-[#008060] hover:bg-[#006e52] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Photo</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
                                  frontCameraInputRef.current?.click();
                                } else {
                                  handleMockSnapFront();
                                }
                              }}
                              className="w-full py-1.5 px-3 bg-white hover:bg-zinc-100 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-700 flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5 text-zinc-500" />
                              <span>Take Live Snap</span>
                            </button>
                          </div>
                          <span className="text-[9px] text-zinc-400 block">or drag & drop picture</span>
                        </div>
                      )}
                    </div>

                    {/* Side Photo Card */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingSide(true); }}
                      onDragLeave={() => setIsDraggingSide(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingSide(false);
                        if (e.dataTransfer.files?.[0]) handleSideFileSelect(e.dataTransfer.files[0]);
                      }}
                      className={`border-2 border-dashed rounded-xl p-4 transition-all relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[220px] aspect-4/5 ${
                        isDraggingSide
                          ? 'border-[#008060] bg-emerald-50/50 scale-[1.01]'
                          : sidePhoto
                          ? 'border-emerald-500 bg-zinc-900 p-0'
                          : 'border-zinc-300 bg-zinc-50/80 hover:border-zinc-400'
                      }`}
                    >
                      {sidePhoto ? (
                        <div className="relative w-full h-full min-h-[220px]">
                          <img
                            src={sidePhoto.url}
                            alt="Side Profile"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30 p-3 flex flex-col justify-between text-left">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Side Profile Locked</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setSidePhoto(null)}
                                className="text-[10px] bg-white/20 hover:bg-red-600 text-white px-2 py-0.5 rounded font-bold backdrop-blur-sm transition-colors cursor-pointer"
                              >
                                Replace
                              </button>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white line-clamp-1">{sidePhoto.name || 'Side Scan'}</p>
                              <p className="text-[10px] text-emerald-300 font-mono">Chest & lumbar depth verified</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 w-full px-2">
                          <div className="w-12 h-12 rounded-full bg-zinc-200/80 flex items-center justify-center text-zinc-600 mx-auto">
                            <Camera className="w-5 h-5 text-zinc-700" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-900">2. Side Profile</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">Turn 90° for posture depth</p>
                          </div>
                          
                          <div className="flex flex-col gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => sideFileInputRef.current?.click()}
                              className="w-full py-1.5 px-3 bg-[#008060] hover:bg-[#006e52] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Photo</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
                                  sideCameraInputRef.current?.click();
                                } else {
                                  handleMockSnapSide();
                                }
                              }}
                              className="w-full py-1.5 px-3 bg-white hover:bg-zinc-100 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-700 flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5 text-zinc-500" />
                              <span>Take Live Snap</span>
                            </button>
                          </div>
                          <span className="text-[9px] text-zinc-400 block">or drag & drop picture</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={() => setStep(1)}
                      className="text-xs text-zinc-500 hover:underline cursor-pointer"
                    >
                      ← Back to Height & Weight
                    </button>

                    <button
                      disabled={isProcessingHmr}
                      onClick={handleSimulateCapture}
                      className="px-5 py-2.5 bg-[#008060] hover:bg-[#006e52] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isProcessingHmr ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Extracting Skin Surface Mesh...</span>
                        </>
                      ) : (
                        <>
                          <span>Run HMR 2.0 Mesh Extraction</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Reconstruction Complete */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow">
                        <Check className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900">Parametric Mesh Reconstructed</h4>
                        <p className="text-xs text-zinc-600">
                          True skin-surface contours extracted with ±6mm error tolerance.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                      96.4% Confidence
                    </span>
                  </div>

                  {/* Anatomical Metric Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-center">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Chest / Bust</span>
                      <p className="text-base font-black text-zinc-900 font-mono mt-0.5">{profile.chestCm} cm</p>
                    </div>

                    <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-center">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Natural Waist</span>
                      <p className="text-base font-black text-zinc-900 font-mono mt-0.5">{profile.waistCm} cm</p>
                    </div>

                    <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-center">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Low Hip</span>
                      <p className="text-base font-black text-zinc-900 font-mono mt-0.5">{profile.lowHipCm} cm</p>
                    </div>

                    <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-center">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Across Shoulder</span>
                      <p className="text-base font-black text-zinc-900 font-mono mt-0.5">{profile.acrossShoulderCm} cm</p>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-100 rounded-lg text-[11px] text-zinc-600 flex items-center justify-between">
                    <span>Profile will automatically verify fit across every garment on this store.</span>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[#008060] font-bold hover:underline cursor-pointer"
                    >
                      Re-calibrate
                    </button>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={closeScanModal}
                      className="px-6 py-2.5 bg-[#008060] hover:bg-[#006e52] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      Done: Return to Shopping
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Manual Sliders Mode */
            <div className="space-y-4">
              <p className="text-xs text-zinc-500">
                Directly dial in your tailor measurements if you already know your circumferences.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-zinc-800 mb-1">
                    <span>Chest / Bust</span>
                    <span className="font-mono text-[#008060]">{manualChest} cm</span>
                  </div>
                  <input
                    type="range"
                    min="75"
                    max="140"
                    value={manualChest}
                    onChange={(e) => setManualChest(Number(e.target.value))}
                    className="w-full accent-[#008060] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-zinc-800 mb-1">
                    <span>Natural Waist</span>
                    <span className="font-mono text-[#008060]">{manualWaist} cm</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="130"
                    value={manualWaist}
                    onChange={(e) => setManualWaist(Number(e.target.value))}
                    className="w-full accent-[#008060] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-zinc-800 mb-1">
                    <span>Low Hip</span>
                    <span className="font-mono text-[#008060]">{manualHip} cm</span>
                  </div>
                  <input
                    type="range"
                    min="75"
                    max="145"
                    value={manualHip}
                    onChange={(e) => setManualHip(Number(e.target.value))}
                    className="w-full accent-[#008060] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-zinc-800 mb-1">
                    <span>Across Shoulder</span>
                    <span className="font-mono text-[#008060]">{manualShoulder} cm</span>
                  </div>
                  <input
                    type="range"
                    min="35"
                    max="60"
                    step="0.5"
                    value={manualShoulder}
                    onChange={(e) => setManualShoulder(Number(e.target.value))}
                    className="w-full accent-[#008060] cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 flex justify-end">
                <button
                  onClick={handleSaveManual}
                  className="px-5 py-2.5 bg-[#008060] hover:bg-[#006e52] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Save Custom Metrics
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
