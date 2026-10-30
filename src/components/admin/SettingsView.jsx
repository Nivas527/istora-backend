import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import ShopifyMigrationModal from './ShopifyMigrationModal';
import { 
  Settings, Save, CheckCircle, RefreshCcw, Sparkles, Upload, ArrowRight, 
  CreditCard, ShieldCheck, Eye, EyeOff, Film, Video, Play, Trash2, Plus, 
  AlertCircle, Link2, Clock, CheckCircle2, FileText, Building2 
} from 'lucide-react';
import { INDIAN_GST_STATES, GST_RATE_SLABS, isValidGSTIN, getStateFromGSTIN } from '../../utils/gstUtils';

export default function SettingsView() {
  const { 
    settings, 
    setSettings, 
    resetToDefaults, 
    activeStore, 
    products, 
    uploadVideo, 
    setBannerVideo, 
    addPreviewVideo, 
    deletePreviewVideo 
  } = useStore();
  const [formData, setFormData] = useState({ ...settings });
  const [saved, setSaved] = useState(false);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [showRazorpaySecret, setShowRazorpaySecret] = useState(false);
  const [showStripeSecret, setShowStripeSecret] = useState(false);

  // Video Management States
  const currentBannerVideo = activeStore?.bannerVideoUrl || settings?.bannerVideoUrl || '';
  const currentPreviewVideos = activeStore?.previewVideos || settings?.previewVideos || [];
  const MAX_PREVIEW_LIMIT = 5;
  const isQuotaFull = currentPreviewVideos.length >= MAX_PREVIEW_LIMIT;
  const remainingSlots = Math.max(0, MAX_PREVIEW_LIMIT - currentPreviewVideos.length);

  const [bannerUrlInput, setBannerUrlInput] = useState(currentBannerVideo);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerUploadError, setBannerUploadError] = useState(null);
  const [bannerUploadSuccess, setBannerUploadSuccess] = useState(null);

  const [newPreviewTitle, setNewPreviewTitle] = useState('');
  const [newPreviewUrl, setNewPreviewUrl] = useState('');
  const [newPreviewDuration, setNewPreviewDuration] = useState('0:30');
  const [newPreviewProductId, setNewPreviewProductId] = useState('');
  const [isUploadingPreview, setIsUploadingPreview] = useState(false);
  const [previewUploadError, setPreviewUploadError] = useState(null);
  const [previewUploadSuccess, setPreviewUploadSuccess] = useState(null);

  useEffect(() => {
    setFormData({ ...settings });
    setBannerUrlInput(activeStore?.bannerVideoUrl || settings?.bannerVideoUrl || '');
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

  // Video Actions
  const handleBannerFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    setBannerUploadError(null);
    setBannerUploadSuccess(null);
    try {
      const res = await uploadVideo(file, 'banner');
      await setBannerVideo(res.url);
      setBannerUrlInput(res.url);
      setBannerUploadSuccess('Banner video uploaded and applied successfully!');
      setTimeout(() => setBannerUploadSuccess(null), 3500);
    } catch (err) {
      setBannerUploadError(err.message || 'Failed to upload banner video');
    } finally {
      setIsUploadingBanner(false);
      e.target.value = '';
    }
  };

  const handleSaveBannerUrl = async (urlToSet) => {
    const target = urlToSet || bannerUrlInput;
    if (!target?.trim()) {
      setBannerUploadError('Please specify a video URL or upload a file.');
      return;
    }
    setIsUploadingBanner(true);
    setBannerUploadError(null);
    try {
      await setBannerVideo(target.trim());
      setBannerUrlInput(target.trim());
      setBannerUploadSuccess('Banner video updated!');
      setTimeout(() => setBannerUploadSuccess(null), 3000);
    } catch (err) {
      setBannerUploadError(err.message || 'Failed to update banner video');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleRemoveBannerVideo = async () => {
    if (!confirm('Remove hero banner video from this store?')) return;
    try {
      await setBannerVideo('');
      setBannerUrlInput('');
      setBannerUploadSuccess('Banner video removed.');
      setTimeout(() => setBannerUploadSuccess(null), 2500);
    } catch (err) {
      setBannerUploadError(err.message || 'Failed to remove banner video');
    }
  };

  const handlePreviewFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isQuotaFull) {
      setPreviewUploadError('Maximum limit of 5 preview videos reached. Please delete a clip first.');
      return;
    }
    setIsUploadingPreview(true);
    setPreviewUploadError(null);
    try {
      const res = await uploadVideo(file, 'preview');
      setNewPreviewUrl(res.url);
      if (!newPreviewTitle) {
        setNewPreviewTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    } catch (err) {
      setPreviewUploadError(err.message || 'Failed to upload preview video');
    } finally {
      setIsUploadingPreview(false);
      e.target.value = '';
    }
  };

  const handleAddPreviewVideo = async (e) => {
    if (e) e.preventDefault();
    if (!newPreviewUrl.trim()) {
      setPreviewUploadError('Please upload a video or provide a video URL.');
      return;
    }
    if (isQuotaFull) {
      setPreviewUploadError('Maximum limit of 5 preview videos reached. Delete a clip to add another.');
      return;
    }
    setIsUploadingPreview(true);
    setPreviewUploadError(null);
    try {
      const linkedProduct = products.find(p => p.id === newPreviewProductId);
      await addPreviewVideo({
        title: newPreviewTitle.trim() || 'Product Feature Clip',
        videoUrl: newPreviewUrl.trim(),
        duration: newPreviewDuration.trim() || '0:30',
        productId: newPreviewProductId || undefined,
        productTitle: linkedProduct?.title || undefined
      });
      setNewPreviewTitle('');
      setNewPreviewUrl('');
      setNewPreviewDuration('0:30');
      setNewPreviewProductId('');
      setPreviewUploadSuccess('Preview video added successfully!');
      setTimeout(() => setPreviewUploadSuccess(null), 3000);
    } catch (err) {
      setPreviewUploadError(err.message || 'Failed to add preview video');
    } finally {
      setIsUploadingPreview(false);
    }
  };

  const handleAddSamplePreviewVideo = async () => {
    if (isQuotaFull) {
      setPreviewUploadError('Maximum limit of 5 preview videos reached.');
      return;
    }
    const sampleProduct = products[0] || null;
    const sampleClips = [
      {
        title: 'Air Precision Motion & Fit',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        duration: '0:15',
        productId: sampleProduct?.id,
        productTitle: sampleProduct?.title
      },
      {
        title: 'Unboxing Apex Studio Master',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        duration: '0:20',
        productId: products[1]?.id,
        productTitle: products[1]?.title
      }
    ];
    const pick = sampleClips[currentPreviewVideos.length % sampleClips.length];
    setIsUploadingPreview(true);
    try {
      await addPreviewVideo(pick);
      setPreviewUploadSuccess(`Added demo clip: "${pick.title}"!`);
      setTimeout(() => setPreviewUploadSuccess(null), 3000);
    } catch (err) {
      setPreviewUploadError(err.message || 'Failed to add demo clip');
    } finally {
      setIsUploadingPreview(false);
    }
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

          {/* Indian GST Invoicing & Compliance Card */}
          <div className="p-5 rounded-xl border border-indigo-200 bg-linear-to-br from-indigo-50/50 via-white to-indigo-50/30 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900">Indian GST Invoicing & Compliance</span>
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                      Rule 46 CGST
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500">Automated B2B/B2C Tax Invoices, CGST/SGST/IGST split, HSN summary & PDF generation</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="gstEnabled"
                  checked={formData.gstEnabled !== false}
                  onChange={(e) => setFormData(p => ({ ...p, gstEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {formData.gstEnabled !== false && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Merchant GSTIN (15 Digits)
                    </label>
                    <input
                      type="text"
                      name="gstin"
                      maxLength={15}
                      value={formData.gstin || ''}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        const stateObj = getStateFromGSTIN(val);
                        setFormData(p => ({
                          ...p,
                          gstin: val,
                          ...(stateObj ? { stateCode: stateObj.code, stateName: stateObj.name } : {})
                        }));
                      }}
                      placeholder="e.g. 29AABCU9603R1ZM"
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-mono font-medium text-zinc-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
                    />
                    <div className="flex items-center gap-1.5 mt-1">
                      {isValidGSTIN(formData.gstin) ? (
                        <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Valid GSTIN ({getStateFromGSTIN(formData.gstin)?.name})
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-600">
                          Format: 2 state digits + 10 PAN chars + 1 entity + 1 Z + 1 check digit
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Legal Registered Entity Name
                    </label>
                    <input
                      type="text"
                      name="legalBusinessName"
                      value={formData.legalBusinessName || ''}
                      onChange={handleChange}
                      placeholder="e.g. Apex Commerce India Pvt. Ltd."
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="text-[10px] text-zinc-400">Printed on legal tax invoices and tax returns</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Supplier State (Place of Supply)
                    </label>
                    <select
                      name="stateCode"
                      value={formData.stateCode || '29'}
                      onChange={(e) => {
                        const code = e.target.value;
                        const match = INDIAN_GST_STATES.find(s => s.code === code);
                        setFormData(p => ({ ...p, stateCode: code, stateName: match?.name || '' }));
                      }}
                      className="w-full px-2.5 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {INDIAN_GST_STATES.map(s => (
                        <option key={s.code} value={s.code}>
                          [{s.code}] {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Default GST Tax Rate Slab
                    </label>
                    <select
                      name="gstRatePercent"
                      value={formData.gstRatePercent ?? 18}
                      onChange={(e) => setFormData(p => ({ ...p, gstRatePercent: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-2.5 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {GST_RATE_SLABS.map(s => (
                        <option key={s.rate} value={s.rate}>
                          {s.label} ({s.rate}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Default HSN Code
                    </label>
                    <input
                      type="text"
                      name="defaultHsnCode"
                      value={formData.defaultHsnCode || '6109'}
                      onChange={handleChange}
                      placeholder="e.g. 6109"
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Invoice Prefix Format
                    </label>
                    <input
                      type="text"
                      name="invoicePrefix"
                      value={formData.invoicePrefix || 'INV-2026/'}
                      onChange={handleChange}
                      placeholder="e.g. INV-2026/"
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="text-[10px] text-zinc-400">Generated invoices will be numbered e.g. {formData.invoicePrefix || 'INV-2026/'}10042</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-zinc-200 mt-auto">
                    <div>
                      <span className="text-xs font-semibold text-zinc-800 block">Catalog Prices Include GST</span>
                      <span className="text-[10px] text-zinc-500 block">Tax is back-calculated from product retail price</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="pricesIncludeGst"
                        checked={!!formData.pricesIncludeGst}
                        onChange={(e) => setFormData(p => ({ ...p, pricesIncludeGst: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}
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

      {/* Store Media & Video Experiences */}
      <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#008060] flex items-center justify-center">
                <Video className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900">Store Media & Video Experiences</h3>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Elevate your storefront conversion with ambient hero banner loops and interactive preview reels.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full self-start sm:self-auto">
            HTML5 Video & Fast CDN Streaming
          </span>
        </div>

        {/* 1. Hero Banner Video Section */}
        <div className="bg-zinc-50/70 p-4 rounded-xl border border-zinc-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-zinc-700" />
                <h4 className="text-xs font-bold text-zinc-900">Hero Banner Video (Ambient Loop)</h4>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Displays as a seamless background video on your top storefront hero banner (MP4/WebM, max 50 MB).
              </p>
            </div>
            {currentBannerVideo && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 self-start sm:self-auto">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active Video Live
              </span>
            )}
          </div>

          {/* Banner Status Messages */}
          {bannerUploadError && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{bannerUploadError}</span>
            </div>
          )}
          {bannerUploadSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{bannerUploadSuccess}</span>
            </div>
          )}

          {/* Video Preview Player if set */}
          {currentBannerVideo ? (
            <div className="relative rounded-lg overflow-hidden border border-zinc-300 bg-black aspect-video max-h-56 group">
              <video
                src={currentBannerVideo}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-90 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-300 bg-black/60 px-2 py-0.5 rounded">
                    Ambient Hero Background Loop
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveBannerVideo}
                    className="p-1.5 bg-red-600/90 hover:bg-red-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Banner Video</span>
                  </button>
                </div>
                <div className="text-[11px] text-zinc-200 truncate font-mono">
                  {currentBannerVideo}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 border-2 border-dashed border-zinc-300 rounded-lg bg-white/60 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-700">No Hero Banner Video Configured</p>
                <p className="text-[11px] text-zinc-500">Upload an MP4 clip or enter a public video link to activate the ambient background.</p>
              </div>
            </div>
          )}

          {/* Upload Controls & URL Input */}
          <div className="space-y-2 pt-1">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <label className={`relative px-4 py-2 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs ${isUploadingBanner ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload className="w-3.5 h-3.5 text-[#008060]" />
                <span>{isUploadingBanner ? 'Uploading Video...' : 'Upload Video File (Max 50MB)'}</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                  onChange={handleBannerFileUpload}
                  className="sr-only"
                  disabled={isUploadingBanner}
                />
              </label>

              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Or paste video URL (e.g. https://.../banner.mp4)"
                  value={bannerUrlInput}
                  onChange={(e) => setBannerUrlInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#008060]"
                />
                <button
                  type="button"
                  onClick={() => handleSaveBannerUrl()}
                  disabled={isUploadingBanner || !bannerUrlInput?.trim()}
                  className="px-3.5 py-2 bg-zinc-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 shrink-0"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
              <span>Supports `.mp4`, `.webm`, `.mov` format with HTTP 206 streaming</span>
              <button
                type="button"
                onClick={() => handleSaveBannerUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4')}
                className="text-[#008060] hover:underline font-semibold cursor-pointer"
              >
                + Try Demo Video
              </button>
            </div>
          </div>
        </div>

        {/* 2. Preview Videos Showcase Section (Strict Max 5 Quota) */}
        <div className="bg-zinc-50/70 p-4 rounded-xl border border-zinc-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-purple-600" />
                <h4 className="text-xs font-bold text-zinc-900">Preview Videos Showcase (Reels & Demos)</h4>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Vertical short videos shown on your storefront home page with instant "Buy Now" links.
              </p>
            </div>

            {/* Quota Badge */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                isQuotaFull 
                  ? 'bg-amber-50 text-amber-800 border-amber-300' 
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isQuotaFull ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                <span>Quota: {currentPreviewVideos.length} / {MAX_PREVIEW_LIMIT} Used</span>
              </span>
            </div>
          </div>

          {/* Feedback Messages */}
          {previewUploadError && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{previewUploadError}</span>
            </div>
          )}
          {previewUploadSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{previewUploadSuccess}</span>
            </div>
          )}

          {/* Current Uploaded Preview Videos List */}
          {currentPreviewVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {currentPreviewVideos.map((clip, idx) => (
                <div key={clip.id || idx} className="bg-white rounded-lg border border-zinc-200 p-2.5 shadow-xs flex flex-col justify-between group hover:border-purple-300 transition-all">
                  <div className="relative rounded overflow-hidden bg-black aspect-video mb-2">
                    <video
                      src={clip.videoUrl}
                      className="w-full h-full object-cover"
                      preload="metadata"
                      muted
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                      <div className="w-7 h-7 rounded-full bg-white/90 text-zinc-900 flex items-center justify-center shadow">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                    </div>
                    {clip.duration && (
                      <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] font-mono text-white px-1.5 py-0.5 rounded">
                        {clip.duration}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-zinc-900 line-clamp-1">{clip.title}</h5>
                    {clip.productTitle ? (
                      <div className="flex items-center gap-1 text-[10px] text-purple-700 font-medium truncate">
                        <Link2 className="w-3 h-3 shrink-0" />
                        <span className="truncate">{clip.productTitle}</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-zinc-400 italic">No linked product</div>
                    )}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-400">Clip #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => deletePreviewVideo(clip.id)}
                      className="text-red-600 hover:text-red-700 text-xs flex items-center gap-1 cursor-pointer font-medium p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 border border-dashed border-zinc-300 rounded-lg bg-white/60 text-center">
              <p className="text-xs font-medium text-zinc-600">No preview videos uploaded yet.</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Add up to 5 video clips to showcase on your storefront reel section.</p>
            </div>
          )}

          {/* Add Preview Video Form */}
          {isQuotaFull ? (
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Quota Limit Reached:</strong> Your store has used all 5 available preview video slots. To upload or link another preview clip, delete one of your existing clips above.
              </span>
            </div>
          ) : (
            <div className="bg-white p-4 rounded-xl border border-zinc-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-purple-600" />
                  <span>Add New Preview Video Clip ({remainingSlots} slot{remainingSlots > 1 ? 's' : ''} left)</span>
                </span>
                <button
                  type="button"
                  onClick={handleAddSamplePreviewVideo}
                  disabled={isUploadingPreview}
                  className="text-[11px] text-purple-700 hover:underline font-semibold cursor-pointer"
                >
                  + Add Demo Sample Clip
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                    Clip Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Studio Audio Quality Demo"
                    value={newPreviewTitle}
                    onChange={(e) => setNewPreviewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                    Duration Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0:24"
                    value={newPreviewDuration}
                    onChange={(e) => setNewPreviewDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Video Source (Upload file or paste URL)
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <label className={`relative px-3.5 py-2 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0 ${isUploadingPreview ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Upload className="w-3.5 h-3.5 text-purple-600" />
                    <span>{isUploadingPreview ? 'Uploading...' : 'Upload Clip (Max 25MB)'}</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                      onChange={handlePreviewFileUpload}
                      className="sr-only"
                      disabled={isUploadingPreview}
                    />
                  </label>
                  <input
                    type="text"
                    placeholder="Or video URL (https://.../reel.mp4)"
                    value={newPreviewUrl}
                    onChange={(e) => setNewPreviewUrl(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Link to Catalog Product (Enables 1-Click "Buy Now" in Video Modal)
                </label>
                <select
                  value={newPreviewProductId}
                  onChange={(e) => setNewPreviewProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">-- None (General Brand Video) --</option>
                  {(products || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} (${p.price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddPreviewVideo}
                  disabled={isUploadingPreview || !newPreviewUrl?.trim()}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Video to Storefront</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

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
