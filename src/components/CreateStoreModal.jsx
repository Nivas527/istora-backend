import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  X,
  Store,
  Calendar,
  Zap,
  FlaskConical,
  Rocket,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Check,
  Globe,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CreateStoreModal({ onClose }) {
  const { createStore } = useStore();

  // 1. Basic Details
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [isHandleCustom, setIsHandleCustom] = useState(false);
  const [email, setEmail] = useState('');

  // 2. Subscription Plan: 'monthly' | 'yearly'
  const [plan, setPlan] = useState('monthly');

  // 3. Store Purpose: 'testing' | 'production'
  const [purpose, setPurpose] = useState('production');

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleNameChange = (val) => {
    setName(val);
    if (!isHandleCustom) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setHandle(generated);
    }
    if (!email && val.trim()) {
      const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '');
      setEmail(`owner@${slug || 'store'}.com`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter your store name.');
      return;
    }

    const cleanHandle = (handle.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/(^-|-$)/g, '');
    setIsSubmitting(true);
    setErrorMessage('');
    setStatusMessage('Provisioning store database & generating merchant admin access...');

    try {
      // Create store, obtain merchant access token, and auto-navigate to admin panel
      await createStore({
        name: name.trim(),
        handle: cleanHandle,
        location: 'India',
        plan: plan,
        purpose: purpose,
        contactEmail: email.trim() || `owner@${cleanHandle}.com`,
        emptyCatalog: false // starter products pre-loaded for easy testing
      });

      // Celebration
      try {
        confetti({
          particleCount: 130,
          spread: 75,
          origin: { y: 0.55 }
        });
      } catch (err) {}

      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error('Store creation error:', err);
      setErrorMessage(err.message || 'Failed to create store. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-zinc-200 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#008060] to-[#00a67e] text-white flex items-center justify-center shadow-md">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 leading-tight">Create a New Store</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Select your plan, purpose, and launch directly into your Admin Panel</p>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="font-medium flex-1">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Store Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Store Name <span className="text-red-500">*</span>
            </label>
            <input
              required
              autoFocus
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Mouse Store, Aura Audio, Bharat Crafts"
              className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#008060] font-medium"
            />
          </div>

          {/* 2. Subdomain URL */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-zinc-500" />
                <span>Store Domain (Subdomain)</span>
              </span>
              <button
                type="button"
                onClick={() => setIsHandleCustom(!isHandleCustom)}
                className="text-[11px] text-[#008060] hover:underline font-medium cursor-pointer"
              >
                {isHandleCustom ? 'Auto-slug' : 'Customize URL'}
              </button>
            </label>
            <div className="flex items-center rounded-xl border border-zinc-300 overflow-hidden bg-zinc-50 focus-within:ring-2 focus-within:ring-[#008060]">
              <span className="pl-3 pr-1 text-xs text-zinc-400 font-mono select-none">https://</span>
              <input
                type="text"
                value={handle}
                readOnly={!isHandleCustom}
                onChange={(e) => {
                  setIsHandleCustom(true);
                  setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''));
                }}
                placeholder="store-name"
                className={`flex-1 py-2 text-xs font-mono text-zinc-900 focus:outline-none ${
                  isHandleCustom ? 'bg-white' : 'bg-transparent text-zinc-700'
                }`}
              />
              <span className="px-3 py-2 text-xs font-mono font-semibold text-zinc-600 bg-zinc-100 border-l border-zinc-200 select-none">
                .istora.online
              </span>
            </div>
          </div>

          {/* 3. Subscription Plan (Monthly vs Yearly) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1.5 flex items-center justify-between">
              <span>Subscription Billing Plan</span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                14-Day Free Trial
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPlan('monthly')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  plan === 'monthly'
                    ? 'border-[#008060] bg-emerald-50/40 ring-1 ring-[#008060] shadow-xs'
                    : 'border-zinc-200 bg-zinc-50/60 hover:bg-white text-zinc-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-700" />
                    <span>Monthly</span>
                  </span>
                  {plan === 'monthly' && <Check className="w-3.5 h-3.5 text-[#008060]" />}
                </div>
                <div className="text-sm font-extrabold text-zinc-900">₹1,499 <span className="text-[10px] font-normal text-zinc-500">/mo</span></div>
                <p className="text-[10px] text-zinc-500 mt-0.5">Flexible pay-as-you-go</p>
              </button>

              <button
                type="button"
                onClick={() => setPlan('yearly')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  plan === 'yearly'
                    ? 'border-[#008060] bg-emerald-50/40 ring-1 ring-[#008060] shadow-xs'
                    : 'border-zinc-200 bg-zinc-50/60 hover:bg-white text-zinc-600'
                }`}
              >
                <div className="absolute top-0 right-0 bg-[#008060] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                  SAVE 20%
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Yearly</span>
                  </span>
                  {plan === 'yearly' && <Check className="w-3.5 h-3.5 text-[#008060]" />}
                </div>
                <div className="text-sm font-extrabold text-zinc-900">₹14,990 <span className="text-[10px] font-normal text-zinc-500">/yr</span></div>
                <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Includes 2 Months Free</p>
              </button>
            </div>
          </div>

          {/* 4. Store Purpose / Environment (Testing vs Production) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
              Store Environment & Purpose
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPurpose('production')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  purpose === 'production'
                    ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                    : 'border-zinc-200 bg-zinc-50/60 hover:bg-white text-zinc-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
                  <Rocket className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Production (Live)</span>
                </div>
                <p className={`text-[10px] ${purpose === 'production' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  Ready for live customer orders & payments
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPurpose('testing')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  purpose === 'testing'
                    ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                    : 'border-zinc-200 bg-zinc-50/60 hover:bg-white text-zinc-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
                  <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
                  <span>Testing (Sandbox)</span>
                </div>
                <p className={`text-[10px] ${purpose === 'testing' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  Test orders, simulated payments & dev
                </p>
              </button>
            </div>
          </div>

          {/* 5. Default Currency & Gateway Badge (Defaults to India INR) */}
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">🇮🇳</span>
              <div>
                <div className="font-bold text-zinc-900 flex items-center gap-1">
                  <span>Defaulted to India (INR ₹)</span>
                  <span className="text-[10px] font-normal text-zinc-400">• 18% GST</span>
                </div>
                <p className="text-[10px] text-zinc-500">Razorpay (UPI / QR / NetBanking) & COD pre-enabled</p>
              </div>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>

          {/* 6. Contact Email (Optional / auto-filled) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Admin Contact Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@store.com"
              className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="w-full py-3 px-4 bg-[#008060] hover:bg-[#006e52] disabled:bg-zinc-200 disabled:text-zinc-400 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{statusMessage || 'Creating store & opening admin panel...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Create Store & Open Admin Panel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-[10px] text-zinc-400 text-center mt-2">
              Generates private access token & logs you straight into your store admin
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
