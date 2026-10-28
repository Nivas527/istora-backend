import React, { useState } from 'react';
import { useFit } from '../../context/FitContext';
import { useStore } from '../../context/StoreContext';
import {
  X,
  FileSpreadsheet,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Layers,
  Save,
  Check
} from 'lucide-react';

export default function TechPackIngestionModal({ isOpen, onClose, selectedProductId }) {
  const { parseTechPack, saveProductGarmentSpec } = useFit();
  const { products } = useStore();

  const [productId, setProductId] = useState(selectedProductId || products[0]?.id || '');
  const [rawText, setRawText] = useState(
`Material: 98% Organic Cotton, 2% Spandex Stretch Denim
Intended Fit: Regular Tailored
Chest (half measure): S=48, M=51, L=54, XL=57.5, XXL=61
Waist: S=80, M=86, L=92, XL=98, XXL=105
Across Shoulder: S=43, M=44.5, L=46, XL=47.5, XXL=49
Sleeve Length: S=62, M=63.5, L=65, XL=66.5, XXL=68`
  );

  const [fabricType, setFabricType] = useState('denim');
  const [stretchPercent, setStretchPercent] = useState(0.04);
  const [intendedFit, setIntendedFit] = useState('regular');
  const [parsedSpec, setParsedSpec] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleParse = async () => {
    setIsParsing(true);
    setError(null);
    try {
      const data = await parseTechPack(rawText, fabricType, Number(stretchPercent), intendedFit);
      setParsedSpec(data);
    } catch (err) {
      setError(err.message || 'Failed to parse tech pack text');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveToProduct = async () => {
    if (!productId || !parsedSpec) return;
    setIsSaving(true);
    setError(null);
    try {
      await saveProductGarmentSpec(productId, parsedSpec);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to save specification');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-zinc-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">Automated Brand Tech Pack Parser</h3>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Phase 1 Spec Ingestion
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Zero 3D CAD modeling required. Ingest point-of-measure charts & fabric stretch coefficients.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Garment spec linked and saved to product successfully!</span>
            </div>
          )}

          {/* Product Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1">Target Catalog Product</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs bg-white text-zinc-900"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} (${p.price}) — {p.category}
                </option>
              ))}
            </select>
          </div>

          {/* Fabric Mechanics Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Textile Type</label>
              <select
                value={fabricType}
                onChange={(e) => setFabricType(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-lg text-xs bg-white text-zinc-900"
              >
                <option value="woven">Rigid Woven (Poplin / Wool)</option>
                <option value="denim">Denim (1-3% Elastane)</option>
                <option value="knit">Knitwear / Sweater</option>
                <option value="jersey">Stretch Jersey / Spandex</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                Usable Stretch: {Math.round(stretchPercent * 100)}%
              </label>
              <input
                type="range"
                min="0.0"
                max="0.30"
                step="0.01"
                value={stretchPercent}
                onChange={(e) => setStretchPercent(Number(e.target.value))}
                className="w-full accent-[#008060] cursor-pointer mt-1"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Intended Cut</label>
              <select
                value={intendedFit}
                onChange={(e) => setIntendedFit(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-lg text-xs bg-white text-zinc-900"
              >
                <option value="slim">Slim / Form-Fitting (+2cm ease)</option>
                <option value="regular">Regular Designer Fit (+4cm ease)</option>
                <option value="relaxed">Relaxed / Oversized (+8cm ease)</option>
              </select>
            </div>
          </div>

          {/* Raw Spec Table Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-zinc-800">
                Paste Factory Tech Pack / Spec Sheet Text
              </label>
              <span className="text-[10px] text-zinc-400">Accepts half-measurements & standard grading</span>
            </div>
            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full p-3 border border-zinc-300 rounded-xl text-xs font-mono text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-[#008060]"
              placeholder="e.g. Chest: S=96, M=102, L=108..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleParse}
              disabled={isParsing}
              className="px-4 py-2 bg-zinc-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isParsing ? 'Parsing Point of Measure...' : 'Extract Normalized Measurements'}</span>
            </button>
          </div>

          {/* Parsed Output Preview */}
          {parsedSpec && parsedSpec.sizes && (
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Normalized Points of Measure (Full Circumferences)</span>
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    Composition: {parsedSpec.fabricComposition} • Usable Stretch: {Math.round(parsedSpec.usableStretchPercent * 100)}%
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveToProduct}
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#008060] hover:bg-[#006e52] text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Link Spec to Product'}</span>
                </button>
              </div>

              <div className="overflow-x-auto bg-white rounded-lg border border-zinc-200">
                <table className="w-full text-left text-xs text-zinc-700">
                  <thead>
                    <tr className="bg-zinc-100/70 border-b border-zinc-200 text-[10px] font-bold text-zinc-500 uppercase">
                      <th className="p-2">Size</th>
                      <th className="p-2">Chest (Circ.)</th>
                      <th className="p-2">Waist (Circ.)</th>
                      <th className="p-2">Low Hip</th>
                      <th className="p-2">Shoulder</th>
                      <th className="p-2">Sleeve</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-mono text-[11px]">
                    {Object.entries(parsedSpec.sizes).map(([s, m]) => (
                      <tr key={s} className="hover:bg-zinc-50">
                        <td className="p-2 font-bold text-zinc-900 font-sans">{s}</td>
                        <td className="p-2 text-emerald-700 font-semibold">{m.chestCm} cm</td>
                        <td className="p-2">{m.waistCm} cm</td>
                        <td className="p-2">{m.lowHipCm} cm</td>
                        <td className="p-2">{m.acrossShoulderCm} cm</td>
                        <td className="p-2">{m.sleeveLengthCm} cm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
