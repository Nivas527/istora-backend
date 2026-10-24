import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { X, Sparkles, Store, Palette, CheckCircle2, Star, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CreateStoreModal({ onClose }) {
  const { createStore, storeTemplates, themes } = useStore();

  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [templateId, setTemplateId] = useState('apparel');
  const [selectedThemeId, setSelectedThemeId] = useState('theme_apex_velocity');
  const [email, setEmail] = useState('merchant@example.com');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNameChange = (val) => {
    setName(val);
    const generated = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setHandle(generated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.5 }
        });
      } catch (err) {
        console.error(err);
      }

      createStore({
        name: name.trim(),
        handle: handle.trim(),
        templateId,
        themeId: selectedThemeId,
        contactEmail: email.trim()
      });

      setIsSubmitting(false);
      onClose();
    }, 700);
  };

  const currentChosenTheme = (themes || []).find((t) => t.id === selectedThemeId) || (themes && themes[0]) || {};

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#008060] to-[#00a67e] text-white flex items-center justify-center shadow-md">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 leading-tight">Create & Launch a New Store</h2>
            <p className="text-xs text-zinc-500">Pick a developer-crafted website design with instant API synchronization</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Store Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Store Name <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Luna Minimalist Jewelry, Forge Roasters"
              className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
            />
          </div>

          {/* Subdomain URL */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Store URL (Subdomain)
            </label>
            <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden bg-zinc-50">
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="store-name"
                className="flex-1 px-3 py-2 text-xs text-zinc-900 bg-white border-r border-zinc-200 focus:outline-none"
              />
              <span className="px-3 text-xs font-mono text-zinc-500 bg-zinc-100">
                .myshopify.local
              </span>
            </div>
          </div>

          {/* Developer Theme Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-zinc-800">
                Choose Website Design (Developer Themes)
              </label>
              <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                <Palette className="w-3 h-3" />
                <span>Selected: {currentChosenTheme.name} ({currentChosenTheme.priceFormatted})</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {themes.map((thm) => {
                const isSelected = selectedThemeId === thm.id;
                return (
                  <div
                    key={thm.id}
                    onClick={() => setSelectedThemeId(thm.id)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#008060] bg-emerald-50/50 ring-2 ring-[#008060]/30 shadow-sm'
                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-zinc-100 mb-2">
                        <img src={thm.previewImage} alt="" className="w-full h-full object-cover" />
                        <span className="absolute top-1 right-1 bg-zinc-900/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          {thm.priceFormatted}
                        </span>
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#008060]/30 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>

                      <p className="font-bold text-xs text-zinc-900 truncate">{thm.name}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{thm.developer}</p>
                    </div>

                    <div className="mt-1 pt-1 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-500">
                      <span>{thm.rating} ★</span>
                      <span className="font-semibold text-emerald-700">{thm.priceFormatted}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Your catalog and checkout APIs automatically bind to whichever design you pick.
            </p>
          </div>

          {/* Starter Inventory Template */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
              Starter Products
            </label>
            <div className="grid grid-cols-3 gap-2">
              {storeTemplates.map((tmpl) => {
                const isSelected = templateId === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => setTemplateId(tmpl.id)}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-50 font-bold'
                        : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
                    }`}
                  >
                    <span className="text-xs block truncate">{tmpl.name}</span>
                    <span className="text-[10px] text-zinc-400 block truncate">{tmpl.category}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Merchant Email */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Store Owner Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@yourstore.com"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-6 py-2.5 bg-[#008060] hover:bg-[#006e52] text-white rounded-xl text-xs font-bold shadow-md shadow-[#008060]/20 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Binding Design & Deploying APIs...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Launch My Store</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
