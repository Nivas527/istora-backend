import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Lock,
  ShieldCheck,
  Key,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Store,
  AlertCircle
} from 'lucide-react';

export default function MerchantLoginView() {
  const {
    activeStore,
    settings,
    loginMerchant,
    setActiveMode,
    publicStorefrontToken,
    privateMerchantToken
  } = useStore();

  const storeName = activeStore?.name || settings.storeName || 'Store Admin';
  const defaultEmail = activeStore?.contactEmail || `owner@${activeStore?.slug || 'store'}.com`;

  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const res = loginMerchant(email, password);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.message || 'Invalid credentials or private merchant token.');
    }
  };

  const handleQuickLogin = () => {
    setEmail(defaultEmail);
    setPassword('admin');
    loginMerchant(defaultEmail, 'admin');
  };

  const handleTokenLogin = () => {
    setEmail(defaultEmail);
    setPassword(privateMerchantToken);
    loginMerchant(defaultEmail, privateMerchantToken);
  };

  return (
    <div className="min-h-screen bg-[#f1f2f4] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Store Identifier Badge */}
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg mb-3"
            style={{ backgroundColor: activeStore?.accentColor || '#008060' }}
          >
            {storeName.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
            {storeName}
          </h2>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs font-mono text-zinc-500">
              {activeStore?.subdomain || `${activeStore?.slug || 'store'}.istora.online`}
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Dedicated Store
            </span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-zinc-200/80 space-y-6">
          <div className="border-b border-zinc-100 pb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900">
                Merchant Admin Login
              </h3>
              <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-zinc-500" /> Private Portal
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Sign in with your store owner credentials or private merchant access token.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Store Owner Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@yourstore.com"
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008060] transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-zinc-700">
                  Password or Private Token
                </label>
                <span className="text-[10px] text-zinc-400 font-mono">
                  Default: admin
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••• or shppa_sec_..."
                  className="w-full px-3.5 py-2.5 pr-10 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008060] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-[#008060] hover:bg-[#006e52] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 active:scale-98"
            >
              <span>Authenticate & Enter Admin</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="pt-4 border-t border-zinc-100 space-y-2.5">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-center">
              Quick 1-Click Verification
            </p>

            <button
              type="button"
              onClick={handleQuickLogin}
              className="w-full py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Quick Login as Owner (admin)</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 bg-white px-2 py-0.5 rounded border border-zinc-200">
                1-Click
              </span>
            </button>

            <button
              type="button"
              onClick={handleTokenLogin}
              className="w-full py-2 px-3 bg-violet-50 hover:bg-violet-100 text-violet-900 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer border border-violet-200/60"
            >
              <div className="flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-violet-600" />
                <span>Sign in with Private Token</span>
              </div>
              <span className="text-[10px] font-mono text-violet-700 bg-white px-1.5 py-0.5 rounded border border-violet-200">
                {privateMerchantToken.slice(0, 14)}...
              </span>
            </button>
          </div>

          {/* Scoped Token Architecture Details */}
          <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-2 text-[11px]">
            <div className="flex items-center justify-between font-bold text-zinc-800">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#008060]" />
                Dual Scoped Access Tokens
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">Shopify Core Parity</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-zinc-500">Public Storefront Token:</span>
                <code className="text-emerald-700 font-mono text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded truncate max-w-[190px]">
                  {publicStorefrontToken}
                </code>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-zinc-500">Private Merchant Token:</span>
                <code className="text-violet-700 font-mono text-[10px] bg-violet-50 px-1.5 py-0.5 rounded truncate max-w-[190px]">
                  {privateMerchantToken}
                </code>
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 pt-1 border-t border-zinc-200/70">
              Shoppers browsing the storefront use the Public Token (read-only). Admin panel requires the Private Token.
            </p>
          </div>
        </div>

        {/* Back to Storefront Link */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => setActiveMode('storefront')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Storefront</span>
          </button>
        </div>
      </div>
    </div>
  );
}
