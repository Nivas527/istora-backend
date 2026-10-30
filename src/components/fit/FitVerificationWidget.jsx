import React, { useState, useEffect } from 'react';
import { useFit } from '../../context/FitContext';
import {
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Ruler,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function FitVerificationWidget({ product, selectedSize, onSelectSize }) {
  const { profile, openScanModal, verifyProductFit } = useFit();

  const [fitData, setFitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [inspectedSize, setInspectedSize] = useState(selectedSize || 'M');

  useEffect(() => {
    let isMounted = true;
    async function loadFit() {
      if (!product?.id) return;
      setLoading(true);
      const data = await verifyProductFit(product.id, selectedSize || 'M', ['S', 'M', 'L']);
      if (isMounted && data) {
        setFitData(data);
        if (data.recommendedSize && !selectedSize) {
          onSelectSize?.(data.recommendedSize);
        }
      }
      if (isMounted) setLoading(false);
    }
    loadFit();
    return () => { isMounted = false; };
  }, [product?.id, JSON.stringify(profile)]);

  useEffect(() => {
    if (selectedSize) {
      setInspectedSize(selectedSize);
    } else if (fitData?.recommendedSize) {
      setInspectedSize(fitData.recommendedSize);
    }
  }, [selectedSize, fitData?.recommendedSize]);

  if (!product || loading) {
    return (
      <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 animate-pulse flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-zinc-200" />
          <span>Calculating biometric fit math...</span>
        </div>
      </div>
    );
  }

  const currentEval = fitData?.sizeEvaluations?.find(
    (e) => e.size.toLowerCase() === inspectedSize.toLowerCase()
  ) || fitData?.sizeEvaluations?.[0];

  const isCurrentRecommended = currentEval?.size === fitData?.recommendedSize;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'optimal':
        return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', text: 'True-to-Design Fit', color: 'emerald' };
      case 'snug':
        return { bg: 'bg-amber-50 text-amber-800 border-amber-200', text: 'Snug / Form-Fitting', color: 'amber' };
      case 'tight':
        return { bg: 'bg-red-50 text-red-800 border-red-200', text: 'Tight / Strain Risk', color: 'red' };
      case 'relaxed':
        return { bg: 'bg-teal-50 text-teal-800 border-teal-200', text: 'Relaxed Room', color: 'teal' };
      case 'oversized':
        return { bg: 'bg-blue-50 text-blue-800 border-blue-200', text: 'Oversized Drape', color: 'blue' };
      default:
        return { bg: 'bg-zinc-100 text-zinc-800 border-zinc-200', text: 'Standard', color: 'zinc' };
    }
  };

  const badge = getStatusBadge(currentEval?.overallStatus);

  return (
    <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50/80 via-white to-zinc-50/40 p-3.5 space-y-3 shadow-xs">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-zinc-900">Geometric Fit Verification</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                {badge.text}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Matched against your metric frame ({profile.heightCm}cm, {profile.weightKg}kg)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {fitData?.recommendedSize && (
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 block font-semibold">Recommended</span>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Size {fitData.recommendedSize} ({fitData.recommendedScore}%)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Advisory Message */}
      <div className="text-xs text-zinc-700 bg-white p-2.5 rounded-lg border border-zinc-100 shadow-2xs space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] text-zinc-600 leading-relaxed">
            {currentEval?.summaryText || fitData?.summary}
          </p>
          {currentEval && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 shrink-0">
              {currentEval.overallFitScore}% Match
            </span>
          )}
        </div>

        {/* If user picked a non-recommended size, offer 1-click switch */}
        {!isCurrentRecommended && fitData?.recommendedSize && (
          <div className="pt-1.5 border-t border-zinc-100 flex items-center justify-between">
            <span className="text-[11px] text-amber-800 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Size {inspectedSize} has higher return probability ({currentEval?.returnRiskPercent}%).</span>
            </span>
            <button
              type="button"
              onClick={() => {
                onSelectSize?.(fitData.recommendedSize);
                setInspectedSize(fitData.recommendedSize);
              }}
              className="text-[11px] text-[#008060] font-bold hover:underline cursor-pointer shrink-0"
            >
              Switch to Size {fitData.recommendedSize} →
            </button>
          </div>
        )}
      </div>

      {/* Interactive Size Inspector Tabs */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-1">Inspect:</span>
          {fitData?.sizeEvaluations?.map((se) => (
            <button
              key={se.size}
              type="button"
              onClick={() => {
                setInspectedSize(se.size);
                onSelectSize?.(se.size);
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                inspectedSize.toLowerCase() === se.size.toLowerCase()
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {se.size}
              {se.size === fitData.recommendedSize && (
                <span className="ml-1 text-[9px] text-emerald-400">★</span>
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="text-[11px] text-[#008060] font-bold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>{showHeatmap ? 'Hide Tension Map' : 'View Tension Heatmap'}</span>
          {showHeatmap ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expandable Tension Heatmap Drawer */}
      {showHeatmap && currentEval?.zones && (
        <div className="pt-2 border-t border-zinc-200 space-y-3 animate-fadeIn">
          {/* Wireframe Landmark Visualizer */}
          <div className="bg-zinc-900 text-white p-3.5 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold flex items-center gap-1.5 text-zinc-300">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Anatomical Tension Map — Size {inspectedSize}</span>
              </span>
              <span className="font-mono text-[10px] text-zinc-400">
                Fabric Stretch: {Math.round((fitData?.usableStretchPercent || 0) * 100)}%
              </span>
            </div>

            {/* Zone Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(currentEval.zones).map(([key, zone]) => {
                const isOptimal = zone.status === 'optimal';
                const isTight = zone.status === 'tight';
                const isSnug = zone.status === 'snug';

                const borderCol = isOptimal
                  ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300'
                  : isTight
                  ? 'border-red-500/60 bg-red-950/40 text-red-300'
                  : isSnug
                  ? 'border-amber-500/60 bg-amber-950/40 text-amber-300'
                  : 'border-blue-500/60 bg-blue-950/40 text-blue-300';

                return (
                  <div key={key} className={`p-2 rounded-lg border ${borderCol} text-center space-y-0.5`}>
                    <div className="text-[10px] uppercase font-semibold text-zinc-400">{zone.label}</div>
                    <div className="text-xs font-mono font-bold">
                      {zone.easeCm >= 0 ? `+${zone.easeCm}` : zone.easeCm} cm
                    </div>
                    <div className="text-[9px] capitalize">{zone.status}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Metric Details Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] text-zinc-600">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-400 font-semibold uppercase text-[10px]">
                  <th className="pb-1.5">Zone</th>
                  <th className="pb-1.5">Garment Spec</th>
                  <th className="pb-1.5">Your Body</th>
                  <th className="pb-1.5">Net Ease</th>
                  <th className="pb-1.5 text-right">Tension Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {Object.entries(currentEval.zones).map(([key, zone]) => (
                  <tr key={key} className="hover:bg-zinc-50">
                    <td className="py-1.5 font-bold text-zinc-800">{zone.label}</td>
                    <td className="py-1.5 font-mono">{zone.garmentDimensionCm} cm</td>
                    <td className="py-1.5 font-mono">{zone.bodyCm} cm</td>
                    <td className="py-1.5 font-mono font-semibold">
                      {zone.easeCm >= 0 ? `+${zone.easeCm}` : zone.easeCm} cm
                    </td>
                    <td className="py-1.5 text-right">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        zone.status === 'optimal'
                          ? 'bg-emerald-100 text-emerald-800'
                          : zone.status === 'tight'
                          ? 'bg-red-100 text-red-800'
                          : zone.status === 'snug'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {zone.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
            <span className="italic">Zero 3D lag • Calculated from pure metric geometry</span>
            <button
              type="button"
              onClick={openScanModal}
              className="text-[#008060] font-bold hover:underline cursor-pointer"
            >
              Update Body Measurements ↗
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
