import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import ShopifyMigrationModal from './ShopifyMigrationModal';
import { Settings, Save, CheckCircle, RefreshCcw, Sparkles, Upload, ArrowRight, CreditCard, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function SettingsView() {
  const { settings, setSettings, resetToDefaults, activeStore } = useStore();
  const [formData, setFormData] = useState({ ...settings });
  const [saved, setSaved] = useState(false);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [showRazorpaySecret, setShowRazorpaySecret] = useState(false);
  const [showStripeSecret, setShowStripeSecret] = useState(false);

  useEffect(() => {
    setFormData({ ...settings });
  }, [activeStore?.id, JSON.stringify(settings)]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes('Rate') || name.includes('Threshold') ? parseFloat(value) || 0 : value
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-zinc-200 shadow-xs space-y-6">
        <div>
          <h3 className="text-sm font-bold text-zinc-900">General Store Configuration</h3>
          <p className="text-xs text-zinc-500">Shop details and currency parameters</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">Store Name</label>
            <input
              type="text"
              name="storeName"
              value={formData.storeName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#008060]"
            />
          </div>

          {/* Custom Domain & Dedicated Live Endpoints */}
          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-zinc-900">Custom Domain (Live Production)</label>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Dedicated Routing Ready
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                When visitors open this domain, the platform locks directly into this store and hides the admin switcher.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Custom Domain</label>
                <input
                  type="text"
                  name="customDomain"
                  placeholder="e.g. apexstore.fashion.com"
                  value={formData.customDomain || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#008060]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Platform Subdomain</label>
                <input
                  type="text"
                  disabled
                  value={formData.storeDomain}
                  className="w-full px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-500"
                />
              </div>
            </div>

            {/* Direct Test Link */}
            <div className="pt-2 border-t border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-[11px]">
                <span className="text-zinc-500">Live Dedicated URL: </span>
                <code className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold">
                  {formData.customDomain ? `https://${formData.customDomain}` : `https://${formData.storeDomain || 'istora.online'}`}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const url = formData.customDomain ? `https://${formData.customDomain}` : `https://${formData.storeDomain || 'istora.online'}`;
                    navigator.clipboard?.writeText(url);
                    alert(`Copied dedicated live store URL:\n${url}`);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-zinc-100 border border-zinc-300 rounded text-[11px] font-semibold text-zinc-700 transition-colors cursor-pointer"
                >
                  Copy URL
                </button>
                <a
                  href={formData.customDomain ? `https://${formData.customDomain}` : `https://${formData.storeDomain || 'istora.online'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-[#008060] hover:bg-[#006e52] text-white rounded text-[11px] font-bold transition-colors"
                >
                  Open Live Storefront ↗
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">Tax Rate (Decimal e.g. 0.08 for 8%)</label>
              <input
                type="number"
                step="0.01"
                name="taxRate"
                value={formData.taxRate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs text-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">Free Shipping Threshold ($)</label>
              <input
                type="number"
                step="1"
                name="freeShippingThreshold"
                value={formData.freeShippingThreshold}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs text-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">Standard Shipping ($)</label>
              <input
                type="number"
                step="0.01"
                name="standardShippingRate"
                value={formData.standardShippingRate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs text-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">Express Courier ($)</label>
              <input
                type="number"
                step="0.01"
                name="expressShippingRate"
                value={formData.expressShippingRate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs text-zinc-900"
              />
            </div>
          </div>
        </div>

        {/* Payment Gateways & Checkout Engine */}
        <div className="pt-6 border-t border-zinc-200 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#008060]" />
                <h3 className="text-sm font-bold text-zinc-900">Payment Gateways & Checkout</h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Multi-Gateway Isolation
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Configure Razorpay for Indian UPI & cards, Stripe for international credit cards, and Cash on Delivery.
            </p>
          </div>

          {/* Razorpay Gateway Card */}
          <div className={`p-4 rounded-xl border transition-all ${formData.razorpayEnabled ? 'bg-white border-blue-200 shadow-xs' : 'bg-zinc-50/60 border-zinc-200'}`}>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                  R
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900">Razorpay</span>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                      UPI, GPay, PhonePe, Cards, NetBanking
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500">Fastest checkout in India with instant settlement</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="razorpayEnabled"
                  checked={!!formData.razorpayEnabled}
                  onChange={(e) => setFormData(p => ({ ...p, razorpayEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {formData.razorpayEnabled && (
              <div className="mt-3.5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Key ID (Public)
                    </label>
                    <input
                      type="text"
                      name="razorpayKeyId"
                      placeholder="rzp_live_... or rzp_test_..."
                      value={formData.razorpayKeyId || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Key Secret
                    </label>
                    <div className="relative">
                      <input
                        type={showRazorpaySecret ? 'text' : 'password'}
                        name="razorpayKeySecret"
                        placeholder="••••••••••••••••"
                        value={formData.razorpayKeySecret || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 pr-9 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRazorpaySecret(!showRazorpaySecret)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                      >
                        {showRazorpaySecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                  <span>
                    Status:{' '}
                    {formData.razorpayKeyId ? (
                      <span className="font-semibold text-emerald-700">Production Live Keys Configured</span>
                    ) : (
                      <span className="font-semibold text-amber-600">Test Sandbox Mode (Auto-Simulated)</span>
                    )}
                  </span>
                  <a
                    href="https://dashboard.razorpay.com/#/access/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Get Razorpay API Keys ↗
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Stripe Gateway Card */}
          <div className={`p-4 rounded-xl border transition-all ${formData.stripeEnabled ? 'bg-white border-violet-200 shadow-xs' : 'bg-zinc-50/60 border-zinc-200'}`}>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#635BFF] text-white flex items-center justify-center font-black text-xs shadow-xs">
                  S
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900">Stripe</span>
                    <span className="text-[10px] font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">
                      Global Credit Cards, Apple Pay, Google Pay
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500">Accept 135+ currencies worldwide with 3D Secure</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="stripeEnabled"
                  checked={!!formData.stripeEnabled}
                  onChange={(e) => setFormData(p => ({ ...p, stripeEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#635BFF]"></div>
              </label>
            </div>

            {formData.stripeEnabled && (
              <div className="mt-3.5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Publishable Key (Public)
                    </label>
                    <input
                      type="text"
                      name="stripePublishableKey"
                      placeholder="pk_live_... or pk_test_..."
                      value={formData.stripePublishableKey || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Secret Key
                    </label>
                    <div className="relative">
                      <input
                        type={showStripeSecret ? 'text' : 'password'}
                        name="stripeSecretKey"
                        placeholder="••••••••••••••••"
                        value={formData.stripeSecretKey || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 pr-9 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStripeSecret(!showStripeSecret)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                      >
                        {showStripeSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                  <span>
                    Status:{' '}
                    {formData.stripePublishableKey ? (
                      <span className="font-semibold text-emerald-700">Production Live Keys Configured</span>
                    ) : (
                      <span className="font-semibold text-amber-600">Test Sandbox Mode (Auto-Simulated)</span>
                    )}
                  </span>
                  <a
                    href="https://dashboard.stripe.com/apikeys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-violet-600 hover:underline font-medium"
                  >
                    Get Stripe API Keys ↗
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Cash on Delivery (COD) Card */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-white flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900">Cash on Delivery (COD)</span>
                <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full">
                  Post-paid delivery
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">Allow customers to pay in cash upon doorstep delivery</p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="codEnabled"
                checked={!!formData.codEnabled}
                onChange={(e) => setFormData(p => ({ ...p, codEnabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#008060]"></div>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-200 flex items-center justify-between">
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#008060] hover:bg-[#006e52] text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saved ? 'Settings Saved' : 'Save Changes'}</span>
          </button>
        </div>
      </form>

      {/* Shopify Data Migration Section */}
      <div className="bg-gradient-to-br from-emerald-50/80 via-white to-zinc-50 p-6 rounded-2xl border border-emerald-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-emerald-600 text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <h4 className="text-sm font-bold text-zinc-900">Shopify Store Migration</h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              CSV & Live API
            </span>
          </div>
          <p className="text-xs text-zinc-600 max-w-lg leading-relaxed">
            Switching from Shopify? Import your complete catalog, variants, Cloudflare R2 media, and customer database in seconds with zero tech hurdles.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsMigrationModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Open Migrator</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Factory Reset */}
      <div className="bg-red-50/60 p-5 rounded-xl border border-red-200 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-red-900">Reset Demo Data</h4>
          <p className="text-[11px] text-red-600">
            Restore original seed catalog, orders, and clear localStorage.
          </p>
        </div>
        <button
          onClick={() => {
            if (confirm('Reset store back to default seed data?')) {
              resetToDefaults();
              alert('Store reset to defaults!');
            }
          }}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>Reset All</span>
        </button>
      </div>

      {/* Shopify Migration Modal */}
      <ShopifyMigrationModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
      />
    </div>
  );
}
