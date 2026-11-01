import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Tag,
  Plus,
  Check,
  Zap,
  Gift,
  Percent,
  Truck,
  Layers,
  Sparkles,
  Trash2,
  Edit2,
  Copy,
  CheckCircle,
  AlertCircle,
  X,
  TrendingUp,
  Sliders,
  DollarSign
} from 'lucide-react';

export default function DiscountsView() {
  const { discounts, addDiscount, updateDiscount, deleteDiscount, activeStore } = useStore();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'auto' | 'bogo' | 'threshold' | 'tier' | 'code'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    ruleType: 'percentage', // 'percentage' | 'fixed' | 'shipping' | 'bogo' | 'threshold' | 'volume_tier'
    type: 'percentage',
    value: 20,
    minSubtotal: 0,
    description: '',
    isAutoApplied: false,
    buyQuantity: 2,
    getQuantity: 1,
    getDiscountPercent: 100,
    applicableCategory: 'all',
    isActive: true
  });

  const handleCopy = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const openCreateModal = () => {
    setEditingPromo(null);
    setFormData({
      code: 'PROMO_' + Math.floor(1000 + Math.random() * 9000),
      ruleType: 'percentage',
      type: 'percentage',
      value: 15,
      minSubtotal: 0,
      description: '15% discount on your order',
      isAutoApplied: false,
      buyQuantity: 2,
      getQuantity: 1,
      getDiscountPercent: 100,
      applicableCategory: 'all',
      isActive: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (promo) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code || '',
      ruleType: promo.ruleType || promo.type || 'percentage',
      type: promo.type || 'percentage',
      value: promo.value || 0,
      minSubtotal: promo.minSubtotal || 0,
      description: promo.description || '',
      isAutoApplied: Boolean(promo.isAutoApplied),
      buyQuantity: promo.buyQuantity || 2,
      getQuantity: promo.getQuantity || 1,
      getDiscountPercent: typeof promo.getDiscountPercent === 'number' ? promo.getDiscountPercent : 100,
      applicableCategory: promo.applicableCategory || 'all',
      isActive: promo.isActive !== false
    });
    setIsModalOpen(true);
  };

  const handleSavePromo = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      alert('Please enter a promotion code');
      return;
    }

    if (editingPromo) {
      await updateDiscount(editingPromo.id, {
        ...formData,
        code: formData.code.trim().toUpperCase()
      });
    } else {
      await addDiscount({
        ...formData,
        code: formData.code.trim().toUpperCase()
      });
    }

    setIsModalOpen(false);
  };

  const handleToggleActive = async (promo) => {
    await updateDiscount(promo.id, {
      ...promo,
      isActive: !promo.isActive
    });
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this promotion rule?')) {
      await deleteDiscount(id);
    }
  };

  // KPIs
  const totalCampaigns = (discounts || []).length;
  const activeCount = (discounts || []).filter((d) => d.isActive !== false).length;
  const autoAppliedCount = (discounts || []).filter((d) => d.isAutoApplied).length;
  const bogoCount = (discounts || []).filter((d) => d.ruleType === 'bogo' || d.type === 'bogo').length;

  // Filtered List
  const filteredDiscounts = (discounts || []).filter((d) => {
    if (activeTab === 'auto') return Boolean(d.isAutoApplied);
    if (activeTab === 'bogo') return d.ruleType === 'bogo' || d.type === 'bogo';
    if (activeTab === 'threshold') return d.ruleType === 'threshold' || (d.minSubtotal > 0 && d.type === 'fixed');
    if (activeTab === 'tier') return d.ruleType === 'volume_tier';
    if (activeTab === 'code') return !d.isAutoApplied && d.ruleType !== 'volume_tier';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-zinc-900">Promotions & Discount Rules</h2>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage BOGO (Buy X Get Y), cart value milestones, auto-applied checkout discounts, and quantity tier pricing.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-[#008060] hover:bg-[#006e52] text-white rounded-xl text-xs font-bold shadow-md shadow-[#008060]/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Promotion</span>
        </button>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-2xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Active Rules</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-zinc-900 font-mono mt-1">
            {activeCount} <span className="text-xs text-zinc-400 font-normal">/ {totalCampaigns}</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">Live in Storefront</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Auto-Applied</span>
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-zinc-900 font-mono mt-1">
            {autoAppliedCount}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Zero-typing checkout rules</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">BOGO & Milestones</span>
            <Gift className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-zinc-900 font-mono mt-1">
            {bogoCount}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Buy X Get Y & Thresholds</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Volume Tier Pricing</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-zinc-900 font-mono mt-1">
            3 Tiers
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">10% - 15% Savings</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-zinc-200">
        {[
          { id: 'all', label: 'All Promotions', count: totalCampaigns },
          { id: 'auto', label: '⚡ Auto-Applied', count: autoAppliedCount },
          { id: 'bogo', label: '🎁 BOGO (Buy X Get Y)', count: bogoCount },
          { id: 'threshold', label: '🎯 Cart Thresholds', count: (discounts || []).filter((d) => d.ruleType === 'threshold' || d.minSubtotal > 0).length },
          { id: 'tier', label: '📦 Volume Tier Pricing', count: (discounts || []).filter((d) => d.ruleType === 'volume_tier').length },
          { id: 'code', label: '🏷️ Coupon Codes', count: (discounts || []).filter((d) => !d.isAutoApplied).length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === tab.id ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-200 text-zinc-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Promotions List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDiscounts.map((d) => {
          const isBogo = d.ruleType === 'bogo' || d.type === 'bogo';
          const isThreshold = d.ruleType === 'threshold';
          const isTier = d.ruleType === 'volume_tier';
          const isShipping = d.type === 'shipping';
          const isAuto = Boolean(d.isAutoApplied);

          return (
            <div
              key={d.id || d.code}
              className={`p-5 rounded-2xl border transition-all space-y-3.5 bg-white shadow-xs hover:shadow-md ${
                d.isActive !== false ? 'border-zinc-200' : 'border-zinc-200 opacity-60 bg-zinc-50'
              }`}
            >
              {/* Card Header: Code & Status */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleCopy(d.code)}
                    className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
                    title="Click to copy promo code"
                  >
                    <span>{d.code}</span>
                    {copiedCode === d.code ? (
                      <Check className="w-3 h-3 text-emerald-700" />
                    ) : (
                      <Copy className="w-3 h-3 text-emerald-600 opacity-60" />
                    )}
                  </button>

                  {isAuto && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                      ⚡ Auto
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleActive(d)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer transition-colors ${
                      d.isActive !== false
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                    }`}
                  >
                    {d.isActive !== false ? 'Active' : 'Disabled'}
                  </button>

                  <button
                    onClick={() => openEditModal(d)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                    title="Edit Rule"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(d.id)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete Rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-bold text-zinc-900 leading-snug">
                  {d.description}
                </h4>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                  {isBogo ? (
                    <span className="flex items-center gap-1 text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      <Gift className="w-3 h-3" />
                      <span>Buy {d.buyQuantity || 2}, Get {d.getQuantity || 1} Free</span>
                    </span>
                  ) : isThreshold ? (
                    <span className="flex items-center gap-1 text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <Zap className="w-3 h-3 text-amber-600" />
                      <span>Min Order: ₹{(d.minSubtotal || 0).toLocaleString('en-IN')}</span>
                    </span>
                  ) : isTier ? (
                    <span className="flex items-center gap-1 text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                      <Layers className="w-3 h-3" />
                      <span>Volume Tiers (2+ and 3+ qty)</span>
                    </span>
                  ) : isShipping ? (
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <Truck className="w-3 h-3" />
                      <span>Free Express Shipping</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-zinc-700 font-semibold bg-zinc-100 px-2 py-0.5 rounded-md">
                      <Percent className="w-3 h-3" />
                      <span>{d.type === 'percentage' ? `${d.value}% Off` : `₹${d.value} Off`}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Rule Summary & Usage Details */}
              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                <span>Category: <strong className="text-zinc-700 capitalize">{d.applicableCategory || 'All Store'}</strong></span>
                <span>Type: <strong className="text-zinc-700 uppercase">{d.ruleType || d.type}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT PROMOTION RULE                      */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-5 animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-zinc-900">
                  {editingPromo ? 'Edit Promotion Rule' : 'Create New Promotion'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePromo} className="space-y-4">
              {/* Rule Type Selector */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Promotion Engine Rule Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'bogo', label: '🎁 BOGO', desc: 'Buy X, Get Y Free' },
                    { id: 'threshold', label: '🎯 Threshold', desc: 'Order Subtotal Goal' },
                    { id: 'percentage', label: '🏷️ Percentage', desc: '% Off Entire Cart' },
                    { id: 'fixed', label: '💵 Fixed Amount', desc: '₹ Off Entire Cart' },
                    { id: 'shipping', label: '🚚 Free Shipping', desc: 'Zero Shipping Fee' },
                    { id: 'volume_tier', label: '📦 Volume Tier', desc: 'Quantity Tiers' }
                  ].map((rule) => (
                    <button
                      key={rule.id}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          ruleType: rule.id,
                          type: rule.id === 'bogo' ? 'bogo' : rule.id === 'threshold' ? 'fixed' : rule.id
                        }));
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        formData.ruleType === rule.id
                          ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/20'
                          : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50'
                      }`}
                    >
                      <div className="text-xs font-bold text-zinc-900">{rule.label}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">{rule.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Code & Auto-Applied Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Promotion Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. BOGO21, FLAT500"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Checkout Behavior
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl border border-zinc-200 bg-zinc-50 cursor-pointer hover:bg-zinc-100/70 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.isAutoApplied}
                      onChange={(e) => setFormData({ ...formData, isAutoApplied: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-zinc-900 block">Auto-Apply</span>
                      <span className="text-[10px] text-zinc-500">No code required</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Customer Description (Shown in Cart & Checkout)
                </label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Buy 2 T-Shirts, Get 1 Free (BOGO)"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Specific Rule Configurations */}
              {formData.ruleType === 'bogo' && (
                <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
                  <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-blue-600" />
                    <span>BOGO Formula Settings</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[11px] text-blue-800 font-semibold block mb-1">Buy Quantity</span>
                      <input
                        type="number"
                        min="1"
                        value={formData.buyQuantity}
                        onChange={(e) => setFormData({ ...formData, buyQuantity: parseInt(e.target.value) || 2 })}
                        className="w-full bg-white border border-blue-200 rounded-lg p-2 text-xs font-mono font-bold text-blue-900 text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-blue-800 font-semibold block mb-1">Get Free/Discounted</span>
                      <input
                        type="number"
                        min="1"
                        value={formData.getQuantity}
                        onChange={(e) => setFormData({ ...formData, getQuantity: parseInt(e.target.value) || 1 })}
                        className="w-full bg-white border border-blue-200 rounded-lg p-2 text-xs font-mono font-bold text-blue-900 text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-blue-800 font-semibold block mb-1">Discount %</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.getDiscountPercent}
                        onChange={(e) => setFormData({ ...formData, getDiscountPercent: parseInt(e.target.value) || 100 })}
                        className="w-full bg-white border border-blue-200 rounded-lg p-2 text-xs font-mono font-bold text-blue-900 text-center"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(formData.ruleType === 'threshold' || formData.ruleType === 'fixed' || formData.ruleType === 'percentage') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Discount Value ({formData.ruleType === 'percentage' ? '%' : '₹'})
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Min Order Subtotal (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minSubtotal}
                      onChange={(e) => setFormData({ ...formData, minSubtotal: parseFloat(e.target.value) || 0 })}
                      placeholder="e.g. 2999"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-zinc-900"
                    />
                  </div>
                </div>
              )}

              {/* Submit / Cancel Actions */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#008060] hover:bg-[#006e52] text-white shadow-md shadow-[#008060]/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingPromo ? 'Update Promotion' : 'Save & Publish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
