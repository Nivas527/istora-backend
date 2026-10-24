import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Settings, Save, CheckCircle, RefreshCcw } from 'lucide-react';

export default function SettingsView() {
  const { settings, setSettings, resetToDefaults } = useStore();
  const [formData, setFormData] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

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

        <div className="pt-4 border-t border-zinc-200 flex items-center justify-between">
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#008060] hover:bg-[#006e52] text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saved ? 'Settings Saved' : 'Save Changes'}</span>
          </button>
        </div>
      </form>

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
    </div>
  );
}
