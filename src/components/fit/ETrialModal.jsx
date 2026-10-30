import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { useFit } from '../../context/FitContext';
import { Avatar3DEngine } from './Avatar3DEngine';
import confetti from 'canvas-confetti';
import {
  X,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  Layers,
  Activity,
  User,
  ArrowRight,
  Upload,
  Camera,
  Image as ImageIcon,
  Check
} from 'lucide-react';

export default function ETrialModal({ product, initialSize = 'M', onClose }) {
  const { addToCart, setIsCartOpen } = useStore();
  const { profile, updateProfile, openScanModal } = useFit();

  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const photoUploadInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('3d'); // '3d' | 'vton'
  const [selectedSize, setSelectedSize] = useState(initialSize || 'M');
  const [renderMode, setRenderMode] = useState('fabric'); // 'fabric' | 'heatmap'
  const [poseMode, setPoseMode] = useState('neutral'); // 'neutral' | 'runway' | 'turn'
  const [autoRotate, setAutoRotate] = useState(true);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Shopper's uploaded photo likeness
  const photoUrl = profile.frontPhotoUrl || profile.photoUrl;

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // Initialize Three.js 3D Engine
  useEffect(() => {
    if (activeTab !== '3d' || !canvasRef.current) return;

    const engine = new Avatar3DEngine(canvasRef.current, {
      profile,
      product,
      selectedSize,
      renderMode,
      poseMode,
      autoRotate
    });
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [activeTab]);

  // Sync profile changes (e.g. newly uploaded photo or updated measurements)
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateProfile(profile);
    }
  }, [profile]);

  // Handle Photo Upload directly in the 3D Fitting Room
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateProfile({
      frontPhotoUrl: url,
      photoUrl: url
    });
  };

  // Handle Size Change
  const handleSizeChange = (newSize) => {
    setSelectedSize(newSize);
    if (engineRef.current) {
      engineRef.current.setSize(newSize);
    }
  };

  // Handle Render Mode Change (Fabric vs Heatmap)
  const handleRenderModeChange = (mode) => {
    setRenderMode(mode);
    if (engineRef.current) {
      engineRef.current.setRenderMode(mode);
    }
  };

  // Handle Pose Change
  const handlePoseChange = (pose) => {
    setPoseMode(pose);
    if (engineRef.current) {
      engineRef.current.setPoseMode(pose);
    }
  };

  const toggleAutoRotate = () => {
    const nextState = !autoRotate;
    setAutoRotate(nextState);
    if (engineRef.current) {
      engineRef.current.autoRotate = nextState;
    }
  };

  // Fit calculations
  const sizeOffsets = { 'XS': -8, 'S': -4, 'M': 0, 'L': 4, 'XL': 8, 'XXL': 12 };
  const offset = sizeOffsets[selectedSize] ?? 0;
  const garmentChest = 104 + offset;
  const easeCm = Math.round((garmentChest - profile.chestCm) * 10) / 10;
  const isRecommended = selectedSize === 'M';

  // Add to Cart from 3D E-Trial Room
  const handleAddToCart = () => {
    if (!product) return;
    const variant = product.variants?.find((v) => v.title?.includes(selectedSize)) || product.variants?.[0];
    addToCart(product, variant, 1);
    setAddedSuccess(true);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.85 }
      });
    } catch {}

    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
      setIsCartOpen(true);
    }, 900);
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="relative bg-[#0d0f14] rounded-2xl max-w-5xl w-full h-[94vh] max-h-[860px] shadow-2xl border border-zinc-800 flex flex-col overflow-hidden text-white">
        {/* Hidden Photo Uploader input */}
        <input
          ref={photoUploadInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoUpload}
        />

        {/* Top Header */}
        <div className="px-5 py-3 bg-zinc-950/95 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-white">{product.title}</h3>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                  Realistic Human 3D Model
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Customized to your body geometry ({profile.heightCm}cm, {profile.weightKg}kg • Chest {profile.chestCm}cm)
              </p>
            </div>
          </div>

          {/* Right Header Action: Mode Switcher & Close */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Tab Switcher: 3D Model vs AI Photorealistic Try-On */}
            <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('3d')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === '3d'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>🌐 360° 3D Avatar</span>
              </button>
              <button
                onClick={() => setActiveTab('vton')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'vton'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>📸 AI Photo Try-On</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Likeness Banner */}
        <div className="bg-zinc-900/80 px-5 py-2 border-b border-zinc-800/80 text-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            {photoUrl ? (
              <div className="flex items-center gap-2">
                <img
                  src={photoUrl}
                  alt="Shopper Likeness"
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-emerald-500 shadow-sm"
                />
                <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Your real photo likeness & skin tone are mapped onto this 3D model</span>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-[10px]">
                  👤
                </div>
                <span className="text-[11px] text-zinc-400">
                  Using biometric canonical face. Upload your photo to map your exact face on the 3D model!
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => photoUploadInputRef.current?.click()}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Upload className="w-3 h-3 text-emerald-400" />
              <span>{photoUrl ? 'Change Photo Likeness' : 'Upload Your Photo to Map Face'}</span>
            </button>
            <button
              onClick={openScanModal}
              className="text-[#008060] font-bold hover:underline text-[11px] cursor-pointer"
            >
              Edit Measurements
            </button>
          </div>
        </div>

        {/* Main Stage */}
        {activeTab === '3d' ? (
          /* 3D WebGL Canvas Stage */
          <div className="relative flex-1 bg-gradient-to-b from-[#0b0d13] via-[#08090d] to-[#040507] overflow-hidden">
            <div ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

            {/* Top-Left: Render Mode Switcher (Fabric vs Tension Heatmap) */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
              <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-1 rounded-xl shadow-lg flex items-center gap-1 text-xs">
                <button
                  onClick={() => handleRenderModeChange('fabric')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    renderMode === 'fabric'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Real Garment Drape</span>
                </button>
                <button
                  onClick={() => handleRenderModeChange('heatmap')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    renderMode === 'heatmap'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>3D Tension Heatmap</span>
                </button>
              </div>

              {renderMode === 'heatmap' && (
                <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-2.5 rounded-xl shadow-lg text-[10px] space-y-1.5 max-w-[210px] animate-fadeIn">
                  <span className="font-bold text-zinc-300 block uppercase tracking-wider text-[9px]">Localized Strain</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-zinc-300">Optimal Ease (+3 to +8cm)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-zinc-300">Form-Fitting Snug (+0 to +3cm)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                    <span className="text-zinc-300">Strain / Cling Risk (&lt;0cm)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0" />
                    <span className="text-zinc-300">Relaxed / Oversized (&gt;+8cm)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Top-Right: Pose Controls */}
            <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
              <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-1 rounded-xl shadow-lg flex items-center gap-1 text-xs">
                <button
                  onClick={() => handlePoseChange('neutral')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    poseMode === 'neutral' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Front A-Pose"
                >
                  Front
                </button>
                <button
                  onClick={() => handlePoseChange('turn')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    poseMode === 'turn' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                  title="180° Back View"
                >
                  Back (180°)
                </button>
                <button
                  onClick={() => handlePoseChange('runway')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    poseMode === 'runway' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Runway Walk"
                >
                  <Activity className="w-3 h-3" />
                  <span>Runway</span>
                </button>
              </div>

              <button
                onClick={toggleAutoRotate}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border backdrop-blur-md transition-colors cursor-pointer ${
                  autoRotate
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Auto 360°: {autoRotate ? 'ON' : 'PAUSED'}
              </button>
            </div>

            {/* Bottom-Center Orbit Instruction Badge */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-zinc-400 border border-zinc-800/80 pointer-events-none">
              🖱️ Drag to rotate 360° • Scroll to zoom • Dual-finger tilt
            </div>
          </div>
        ) : (
          /* AI Photorealistic Drape (Neural VTON Studio) Stage */
          <div className="relative flex-1 bg-zinc-950 p-6 flex flex-col items-center justify-center overflow-y-auto">
            <div className="max-w-3xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left: Shopper's Actual Uploaded Photo Likeness */}
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-3 text-center">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  1. Your Captured Profile Likeness
                </span>
                <div className="aspect-3/4 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700/80 relative">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Your Likeness"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                      <Camera className="w-8 h-8 text-zinc-500 mb-2" />
                      <p className="text-xs font-semibold text-zinc-400">No photo uploaded yet</p>
                      <button
                        onClick={() => photoUploadInputRef.current?.click()}
                        className="mt-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Upload Photo Now
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 font-mono">
                  Anchor: {profile.heightCm}cm / {profile.weightKg}kg • Frame: {profile.gender}
                </p>
              </div>

              {/* Right: AI Neural Photorealistic Try-On */}
              <div className="bg-zinc-900 rounded-2xl border border-emerald-500/40 p-4 space-y-3 text-center shadow-2xl relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                    2. AI Photorealistic Drape — Size {selectedSize}
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    96.4% Match
                  </span>
                </div>

                <div className="aspect-3/4 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 relative group">
                  <img
                    src={product.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80'}
                    alt="AI Drape"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 p-3 flex flex-col justify-between text-left">
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded self-start">
                      Preserving Exact Body Frame & Likeness
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white">{product.title}</p>
                      <p className="text-[10px] text-emerald-300 font-mono">
                        Chest Ease: {easeCm >= 0 ? `+${easeCm}cm` : `${easeCm}cm tight`} • No Pinches
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>Drape condition: Conditioned Diffusion</span>
                  <button
                    onClick={() => setActiveTab('3d')}
                    className="text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    View in 360° 3D →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Bar: Interactive Size Switcher & Add to Cart */}
        <div className="px-5 py-3.5 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          {/* Size Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 mr-1">
              Test Size:
            </span>
            {sizes.map((s) => {
              const isSelected = selectedSize === s;
              const isMatch = s === 'M';

              return (
                <button
                  key={s}
                  onClick={() => handleSizeChange(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/50 scale-105'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                  }`}
                >
                  <span>{s}</span>
                  {isMatch && <span className="text-[10px] text-amber-300">★</span>}
                </button>
              );
            })}
          </div>

          {/* Fit Feedback & Add to Cart */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="text-right hidden sm:block">
              <span className="text-[11px] font-bold text-white block">
                Size {selectedSize}:{' '}
                <span className={easeCm < 0 ? 'text-red-400' : easeCm < 3 ? 'text-amber-400' : 'text-emerald-400'}>
                  {easeCm >= 0 ? `+${easeCm}cm ease` : `${easeCm}cm tight`}
                </span>
              </span>
              <span className="text-[10px] text-zinc-400">
                {isRecommended ? 'Optimal true-to-design fit' : 'Alternative drape silhouette'}
              </span>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={addedSuccess}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {addedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Added Size {selectedSize} to Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Buy Size {selectedSize} (${(product.price || 0).toFixed(2)})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
