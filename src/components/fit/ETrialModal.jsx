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
  ArrowRight
} from 'lucide-react';

export default function ETrialModal({ product, initialSize = 'M', onClose }) {
  const { addToCart, setIsCartOpen } = useStore();
  const { profile, openScanModal } = useFit();

  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  const [selectedSize, setSelectedSize] = useState(initialSize || 'M');
  const [renderMode, setRenderMode] = useState('fabric'); // 'fabric' | 'heatmap'
  const [poseMode, setPoseMode] = useState('neutral'); // 'neutral' | 'runway' | 'turn'
  const [autoRotate, setAutoRotate] = useState(true);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Available sizes
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // Initialize Three.js 3D Engine
  useEffect(() => {
    if (!canvasRef.current) return;

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
  }, []);

  // Sync profile changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateProfile(profile);
    }
  }, [profile]);

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

  // Toggle Auto-Rotate
  const toggleAutoRotate = () => {
    const nextState = !autoRotate;
    setAutoRotate(nextState);
    if (engineRef.current) {
      engineRef.current.autoRotate = nextState;
    }
  };

  // Determine fit tension details for the active size
  const sizeOffsets = { 'XS': -8, 'S': -4, 'M': 0, 'L': 4, 'XL': 8, 'XXL': 12 };
  const offset = sizeOffsets[selectedSize] ?? 0;
  const garmentChest = 104 + offset;
  const easeCm = Math.round((garmentChest - profile.chestCm) * 10) / 10;

  const isRecommended = selectedSize === 'M'; // Default biometric anchor match

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
      <div className="relative bg-[#0d0f14] rounded-2xl max-w-4xl w-full h-[92vh] max-h-[820px] shadow-2xl border border-zinc-800 flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="px-5 py-3.5 bg-zinc-950/90 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-white">{product.title}</h3>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                  3D E-Trial Room
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Parametric mesh draped over your metric frame ({profile.heightCm}cm, {profile.weightKg}kg)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-emerald-400 font-mono hidden sm:inline">
              ${(product.price || 0).toFixed(2)}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3D Studio Stage */}
        <div className="relative flex-1 bg-gradient-to-b from-[#0c0e12] via-[#090b0e] to-[#050608] overflow-hidden">
          {/* Three.js Canvas Container */}
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
                <span>Fabric Drape</span>
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

            {/* Heatmap Legend Overlay when active */}
            {renderMode === 'heatmap' && (
              <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-2.5 rounded-xl shadow-lg text-[10px] space-y-1.5 max-w-[210px] animate-fadeIn">
                <span className="font-bold text-zinc-300 block uppercase tracking-wider text-[9px]">Tension Index</span>
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

          {/* Top-Right: Pose Controls & Orbit Helpers */}
          <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
            <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-1 rounded-xl shadow-lg flex items-center gap-1 text-xs">
              <button
                onClick={() => handlePoseChange('neutral')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  poseMode === 'neutral' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="A-Pose Front View"
              >
                Front View
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
                title="Dynamic Runway Walk"
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

        {/* Bottom Bar: Interactive Size Switcher & Add to Cart */}
        <div className="px-5 py-4 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          {/* Size Pills */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 mr-1">
              Select Size:
            </span>
            {sizes.map((s) => {
              const isSelected = selectedSize === s;
              const isMatch = s === 'M'; // Recommended size

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

          {/* Fit Feedback & Add to Cart CTA */}
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
