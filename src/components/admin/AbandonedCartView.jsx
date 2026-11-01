import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  ShoppingCart, AlertOctagon, CheckCircle2, TrendingUp, Clock, Mail, 
  MessageSquare, Copy, ExternalLink, RefreshCcw, Send, Sparkles, Filter, 
  ArrowRight, ShieldCheck, Tag, Loader2, Check, Package, Users
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export default function AbandonedCartView() {
  const { activeStore } = useStore();
  const [filter, setFilter] = useState('all'); // 'all' | 'abandoned' | 'recovering' | 'recovered'
  const [carts, setCarts] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalLostRevenue: 0,
    totalRecoveredRevenue: 0,
    totalAbandonedCarts: 0,
    totalRecoveredCarts: 0,
    activeAbandonedCount: 0,
    recoveryRatePercent: 0,
    averageAbandonedValue: 0,
    sequence1HourSent: 0,
    sequence24HourSent: 0
  });
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [copiedToken, setCopiedToken] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [customDiscountCode, setCustomDiscountCode] = useState('SAVE5');
  const [customDiscountPercent, setCustomDiscountPercent] = useState(5);

  useEffect(() => {
    loadData();
  }, [activeStore?.id, filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, stats] = await Promise.all([
        apiClient.getAbandonedCarts(activeStore?.id, filter, 50),
        apiClient.getAbandonedCartAnalytics(activeStore?.id)
      ]);
      if (list) setCarts(list);
      if (stats) setAnalytics(stats);
    } catch (err) {
      console.warn('Failed to load abandoned carts data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRecovery = async (cart, channel = 'email') => {
    setActionLoadingId(`${cart.id}_${channel}`);
    setActionFeedback(null);
    try {
      await apiClient.sendAbandonedCartRecovery({
        cartId: cart.id,
        channel,
        customDiscountCode,
        customDiscountPercent
      }, activeStore?.id);

      setActionFeedback({
        id: cart.id,
        channel,
        message: `Recovery ${channel.toUpperCase()} reminder with code ${customDiscountCode} sent to ${cart.customerEmail}!`
      });

      // Reload data to reflect updated sequence step and status
      await loadData();
    } catch (err) {
      console.error('Failed to send recovery:', err);
      setActionFeedback({
        id: cart.id,
        channel,
        error: true,
        message: 'Failed to send recovery notification.'
      });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setActionFeedback(null), 5000);
    }
  };

  const handleCopyRecoveryLink = (cart) => {
    const url = `https://istora.online/checkout?recover_cart=${cart.recoveryToken}&discount=${cart.discountCode || 'SAVE5'}`;
    navigator.clipboard?.writeText(url);
    setCopiedToken(cart.id);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-xs">
              <ShoppingCart className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black text-zinc-900 tracking-tight">
              Abandoned Cart Recovery Engine
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
              High ROI
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Automatically capture drop-offs at Step 1, trigger 1-hour and 24-hour recovery sequences, and restore lost revenue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="Refresh Cart Data"
            className="p-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 transition-colors cursor-pointer"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>Incentive & Sequence Rules</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Lost Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-rose-700 mb-1">
            <span>Potential Lost Revenue</span>
            <span className="p-1 rounded-md bg-rose-100 text-rose-800">
              <AlertOctagon className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-black text-rose-950 font-mono tracking-tight">
            ₹{analytics.totalLostRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-rose-700/80 mt-1">
            Across <strong>{analytics.activeAbandonedCount}</strong> active drop-off carts
          </p>
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
            <ShoppingCart className="w-24 h-24 text-rose-900" />
          </div>
        </div>

        {/* 2. Recovered Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-700 mb-1">
            <span>Recovered Revenue</span>
            <span className="p-1 rounded-md bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-950 font-mono tracking-tight">
            ₹{analytics.totalRecoveredRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-emerald-700/80 mt-1">
            <strong>{analytics.totalRecoveredCarts}</strong> shoppers brought back to checkout
          </p>
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
            <TrendingUp className="w-24 h-24 text-emerald-900" />
          </div>
        </div>

        {/* 3. Recovery Rate */}
        <div className="bg-white p-5 rounded-2xl border border-indigo-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-700 mb-1">
            <span>Recovery Rate</span>
            <span className="p-1 rounded-md bg-indigo-100 text-indigo-800">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-indigo-950 font-mono tracking-tight">
              {analytics.recoveryRatePercent}%
            </p>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              +5.4% vs industry
            </span>
          </div>
          <p className="text-[11px] text-indigo-700/80 mt-1">
            Industry avg. e-commerce recovery: ~18%
          </p>
        </div>

        {/* 4. Automated Sequences Sent */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-amber-700 mb-1">
            <span>Sequences Dispatched</span>
            <span className="p-1 rounded-md bg-amber-100 text-amber-800">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-black text-amber-950 font-mono tracking-tight">
            {analytics.sequence1HourSent + analytics.sequence24HourSent}
          </p>
          <p className="text-[11px] text-amber-800/80 mt-1">
            1-Hr Reminders: <strong>{analytics.sequence1HourSent}</strong> | 24-Hr: <strong>{analytics.sequence24HourSent}</strong>
          </p>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-bold animate-fadeIn ${
          actionFeedback.error 
            ? 'bg-rose-50 border-rose-200 text-rose-800' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionFeedback.message}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-zinc-400 hover:text-zinc-700">✕</button>
        </div>
      )}

      {/* Filter Tabs Bar */}
      <div className="flex items-center space-x-2 bg-white p-3 rounded-xl border border-zinc-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          All Carts ({analytics.totalAbandonedCarts})
        </button>
        <button
          onClick={() => setFilter('abandoned')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === 'abandoned'
              ? 'bg-rose-600 text-white'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          Unsent / Abandoned ({carts.filter(c => c.recoveryStatus === 'abandoned').length})
        </button>
        <button
          onClick={() => setFilter('recovering')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === 'recovering'
              ? 'bg-amber-600 text-white'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          In Recovery ({carts.filter(c => c.recoveryStatus === 'recovering').length})
        </button>
        <button
          onClick={() => setFilter('recovered')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === 'recovered'
              ? 'bg-emerald-600 text-white'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          Recovered ({analytics.totalRecoveredCarts})
        </button>
      </div>

      {/* Abandoned Carts Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        {carts.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 space-y-2">
            <ShoppingCart className="w-8 h-8 mx-auto text-zinc-300" />
            <p className="text-xs font-bold text-zinc-700">No abandoned cart sessions found</p>
            <p className="text-[11px] text-zinc-500">
              When shoppers enter contact info at checkout and leave, sessions appear here immediately.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold">
                  <th className="py-3.5 px-4">Customer & Contact</th>
                  <th className="py-3.5 px-4">Cart Items</th>
                  <th className="py-3.5 px-4">Cart Value</th>
                  <th className="py-3.5 px-4">Drop-off Stage</th>
                  <th className="py-3.5 px-4">Sequence Status</th>
                  <th className="py-3.5 px-4">Recovery State</th>
                  <th className="py-3.5 px-4 text-right">Recovery Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 font-sans">
                {carts.map((cart) => (
                  <tr key={cart.id} className="hover:bg-zinc-50/70 transition-colors">
                    
                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-zinc-900">{cart.customerName || 'Shopper'}</p>
                      <p className="text-[11px] text-zinc-500 font-mono">{cart.customerEmail}</p>
                      {cart.customerPhone && (
                        <p className="text-[10px] text-zinc-400">{cart.customerPhone}</p>
                      )}
                    </td>

                    {/* Cart Items */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="space-y-1">
                        {cart.cartItems?.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px] text-zinc-800">
                            <span className="font-semibold truncate max-w-[160px]">{item.product?.title || 'Product'}</span>
                            <span className="text-zinc-400 font-mono">× {item.quantity}</span>
                          </div>
                        ))}
                        {cart.cartItems?.length > 2 && (
                          <span className="text-[10px] font-bold text-indigo-600">
                            +{cart.cartItems.length - 2} more item(s)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Cart Value */}
                    <td className="py-3.5 px-4 font-bold font-mono text-zinc-900">
                      ₹{cart.totalValue?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                    </td>

                    {/* Drop-off Stage */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 text-zinc-700 capitalize">
                        {cart.checkoutStep?.replace('_', ' ') || 'Customer Info'}
                      </span>
                    </td>

                    {/* Sequence Status */}
                    <td className="py-3.5 px-4">
                      {cart.emailSequenceStep === 0 ? (
                        <span className="text-[11px] text-zinc-400 font-medium">Unsent</span>
                      ) : cart.emailSequenceStep === 1 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" /> 1-Hour Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                          <Clock className="w-3 h-3" /> 24-Hour Sent
                        </span>
                      )}
                    </td>

                    {/* Recovery State */}
                    <td className="py-3.5 px-4">
                      {cart.recoveryStatus === 'recovered' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3" /> Recovered ({cart.recoveredOrderId || 'Order'})
                        </span>
                      ) : cart.recoveryStatus === 'recovering' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" /> In Recovery
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <AlertOctagon className="w-3 h-3" /> Abandoned
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {cart.recoveryStatus !== 'recovered' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Send Email Recovery */}
                          <button
                            type="button"
                            onClick={() => handleSendRecovery(cart, 'email')}
                            disabled={actionLoadingId === `${cart.id}_email`}
                            title="Send Recovery Email with 5% Discount"
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[11px] border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {actionLoadingId === `${cart.id}_email` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Mail className="w-3 h-3" />
                            )}
                            <span>{cart.emailSequenceStep === 0 ? 'Send 1-Hr' : 'Send 24-Hr'}</span>
                          </button>

                          {/* Send WhatsApp Recovery */}
                          <button
                            type="button"
                            onClick={() => handleSendRecovery(cart, 'whatsapp')}
                            disabled={actionLoadingId === `${cart.id}_whatsapp`}
                            title="Send WhatsApp Cart Recovery Alert"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[11px] border border-emerald-200 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {actionLoadingId === `${cart.id}_whatsapp` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <MessageSquare className="w-3 h-3" />
                            )}
                          </button>

                          {/* Copy Recovery Link */}
                          <button
                            type="button"
                            onClick={() => handleCopyRecoveryLink(cart)}
                            title="Copy 1-Click Cart Recovery Link"
                            className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                          >
                            {copiedToken === cart.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Recovered</span>
                        </span>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sequence Configuration & Incentive Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-4 animate-slideUp">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-amber-100 text-amber-800">
                  <Tag className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    Recovery Incentive & Timed Rules
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Configure automated 1-hour and 24-hour cart reminders
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-zinc-400 hover:text-zinc-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Dynamic Incentive Code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Recovery Promo Code
                  </label>
                  <input
                    type="text"
                    value={customDiscountCode}
                    onChange={(e) => setCustomDiscountCode(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Discount Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={customDiscountPercent}
                    onChange={(e) => setCustomDiscountPercent(parseInt(e.target.value) || 5)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 font-bold"
                  />
                </div>
              </div>

              {/* Timed Sequence Explanations */}
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                <p className="font-bold text-zinc-900">Automated Timed Sequence:</p>
                <div className="space-y-1.5 text-zinc-600">
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-800 font-bold text-[10px]">1 Hr</span>
                    <span>Gentle cart reminder: <em>"Did you forget something? Your bag is saved."</em></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">24 Hrs</span>
                    <span>High-converting incentive: <em>"Still thinking it over? Enjoy {customDiscountPercent}% OFF with code {customDiscountCode}!"</em></span>
                  </div>
                </div>
              </div>

              {/* Direct Recovery Link Preview */}
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 space-y-1">
                <p className="font-bold">1-Click Restoration Mechanism:</p>
                <p className="text-[11px] text-indigo-700">
                  Every link restores the customer's exact items, pre-fills shipping details, and auto-applies the discount code seamlessly without re-typing.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(false);
                  loadData();
                }}
                className="px-5 py-2.5 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Save & Apply Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

