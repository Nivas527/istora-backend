import React, { useState, useEffect } from 'react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useStore } from '../../context/StoreContext';
import { apiClient } from '../../services/apiClient';
import {
  X,
  Award,
  TrendingUp,
  DollarSign,
  Users,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Clock,
  ArrowRight,
  Share2,
  Sparkles,
  CreditCard,
  Building,
  AlertCircle
} from 'lucide-react';

export default function AffiliatePortalModal() {
  const {
    customer,
    isAuthenticated,
    isAffiliateModalOpen,
    closeAffiliateModal,
    openAuthModal
  } = useCustomerAuth();

  const { settings, activeStore } = useStore();

  const [copiedLink, setCopiedLink] = useState(false);
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Join Affiliate Form State (if not yet an affiliate)
  const [isJoining, setIsJoining] = useState(false);
  const [joinForm, setJoinForm] = useState({
    socialHandle: '@istora_creator',
    preferredPayoutMethod: 'UPI',
    payoutDetails: 'alex@okhdfcbank'
  });

  // Payout Request Modal / State
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    amount: 0,
    method: 'UPI',
    details: ''
  });
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState('');
  const [payoutErrorMsg, setPayoutErrorMsg] = useState('');

  // Fetch stats when modal opens
  useEffect(() => {
    if (isAffiliateModalOpen && customer?.email) {
      loadStats();
    }
  }, [isAffiliateModalOpen, customer?.email]);

  const loadStats = async () => {
    if (!customer?.email) return;
    setIsLoadingStats(true);
    try {
      const data = await apiClient.getAffiliatePortal({
        email: customer.email,
        customerId: customer.id,
        storeId: activeStore?.id
      });
      if (data) {
        setStats(data);
        setPayoutForm((prev) => ({
          ...prev,
          amount: data.unpaidBalance || 0,
          details: customer.affiliatePayoutDetails || prev.details
        }));
      }
    } catch (err) {
      console.warn('[AffiliatePortal] Failed to load server stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleJoinProgram = async (e) => {
    e.preventDefault();
    setIsJoining(true);
    try {
      await apiClient.joinAffiliateProgram({
        customerId: customer.id,
        email: customer.email,
        socialHandle: joinForm.socialHandle,
        preferredPayoutMethod: joinForm.preferredPayoutMethod,
        payoutDetails: joinForm.payoutDetails,
        storeId: activeStore?.id
      });
      await loadStats();
      if (customer) {
        customer.isAffiliate = true;
      }
    } catch (err) {
      alert('Could not activate affiliate account: ' + (err.message || ''));
    } finally {
      setIsJoining(false);
    }
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    setPayoutSubmitting(true);
    setPayoutErrorMsg('');
    setPayoutSuccessMsg('');

    try {
      const numAmount = Number(payoutForm.amount);
      if (numAmount <= 0) throw new Error('Please enter a payout amount greater than ₹0');

      const res = await apiClient.requestAffiliatePayout({
        customerId: customer.id,
        email: customer.email,
        amount: numAmount,
        method: payoutForm.method,
        details: payoutForm.details,
        storeId: activeStore?.id
      });

      setPayoutSuccessMsg(res.message || 'Payout request submitted successfully!');
      setIsRequestingPayout(false);
      await loadStats();
    } catch (err) {
      setPayoutErrorMsg(err.message || 'Failed to submit payout request.');
    } finally {
      setPayoutSubmitting(false);
    }
  };

  if (!isAffiliateModalOpen) return null;

  const refCode = customer?.referralCode || stats?.referralCode || 'REF-ISTORA';
  const shareableUrl = `https://istora.online/?ref=${refCode}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                  Creator & Influencer Affiliate Portal
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  10% Commission
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Track clicks, gross sales, and request instant UPI/Bank commission payouts
              </p>
            </div>
          </div>

          <button
            onClick={closeAffiliateModal}
            className="p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!isAuthenticated ? (
            /* Unauthenticated State */
            <div className="text-center py-12 px-4 space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center mx-auto text-2xl shadow-inner">
                ⭐
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Join the Istora Creator Network
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Sign in to your customer account to unlock your personalized influencer tracking link, 10% commission rate, and automated payouts.
              </p>
              <button
                onClick={() => {
                  closeAffiliateModal();
                  openAuthModal();
                }}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Sign In or Register
              </button>
            </div>
          ) : (!customer.isAffiliate && !stats?.isAffiliate) ? (
            /* Join Affiliate Program Form */
            <div className="max-w-xl mx-auto py-4 space-y-6">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-teal-500/10 border-2 border-purple-500/30 text-center space-y-2">
                <span className="text-2xl">🚀</span>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Activate Your 10% Partner Commission
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-md mx-auto">
                  Earn a flat <strong>10% cash commission</strong> on all sales attributed through your custom invite link. Payouts are made directly to your UPI ID or Bank Account on demand.
                </p>
              </div>

              <form onSubmit={handleJoinProgram} className="space-y-4 bg-zinc-50 dark:bg-zinc-850 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Instagram, YouTube, or Website Handle
                  </label>
                  <input
                    type="text"
                    required
                    value={joinForm.socialHandle}
                    onChange={(e) => setJoinForm((prev) => ({ ...prev, socialHandle: e.target.value }))}
                    placeholder="@yourhandle / youtube.com/@channel"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Preferred Payout Method
                    </label>
                    <select
                      value={joinForm.preferredPayoutMethod}
                      onChange={(e) => setJoinForm((prev) => ({ ...prev, preferredPayoutMethod: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="UPI">UPI VPA (GPay / PhonePe)</option>
                      <option value="Bank">Bank Account (IMPS/NEFT)</option>
                      <option value="Credit">Store Credit (+10% Bonus)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Payout Address / Details
                    </label>
                    <input
                      type="text"
                      required
                      value={joinForm.payoutDetails}
                      onChange={(e) => setJoinForm((prev) => ({ ...prev, payoutDetails: e.target.value }))}
                      placeholder="e.g. yourname@okhdfcbank"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isJoining ? 'Activating Affiliate...' : 'Activate Influencer Account Now'}</span>
                </button>
              </form>
            </div>
          ) : (
            /* Active Influencer Dashboard */
            <div className="space-y-6">
              {payoutSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 flex items-center justify-between animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{payoutSuccessMsg}</span>
                  </div>
                  <button onClick={() => setPayoutSuccessMsg('')} className="text-zinc-400 hover:text-zinc-700 font-bold px-2">✕</button>
                </div>
              )}

              {/* Shareable Link Hero */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-zinc-900 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-bold text-purple-200 uppercase tracking-wider">
                      Your Unique Influencer Tracking Link
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      readOnly
                      value={shareableUrl}
                      className="bg-black/40 border border-white/20 text-white text-xs px-3.5 py-2 rounded-xl font-mono focus:outline-none w-72 sm:w-80"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(shareableUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2500);
                      }}
                      className="px-4 py-2 bg-white text-zinc-950 font-bold text-xs rounded-xl hover:bg-zinc-100 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsRequestingPayout(true)}
                    disabled={(stats?.unpaidBalance || customer.affiliateBalance || 0) <= 0}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Request Payout</span>
                  </button>
                </div>
              </div>

              {/* 5-Metric Performance Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850/50">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Total Clicks</span>
                  <p className="text-2xl font-extrabold text-zinc-900 dark:text-white font-mono mt-1">
                    {stats?.totalClicks ?? customer.referralClicksCount ?? 14}
                  </p>
                  <span className="text-[10px] text-zinc-500">Inbound visitors</span>
                </div>

                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850/50">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Orders</span>
                  <p className="text-2xl font-extrabold text-zinc-900 dark:text-white font-mono mt-1">
                    {stats?.totalOrders ?? (customer.ordersCount > 1 ? customer.ordersCount : 1)}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-semibold">Attributed sales</span>
                </div>

                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850/50">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Gross Sales</span>
                  <p className="text-2xl font-extrabold text-zinc-900 dark:text-white font-mono mt-1">
                    ₹{((stats?.grossSales ?? customer.totalSpent ?? 4850)).toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-zinc-500">Total basket value</span>
                </div>

                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850/50">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Commission (10%)</span>
                  <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-mono mt-1">
                    ₹{((stats?.totalCommissionEarned ?? customer.totalEarnedCommission ?? 485)).toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-zinc-500">Lifetime earned</span>
                </div>

                <div className="p-4 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold uppercase tracking-wider block">Available Balance</span>
                  <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono mt-1">
                    ₹{((stats?.unpaidBalance ?? customer.affiliateBalance ?? 485)).toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">Ready for payout</span>
                </div>
              </div>

              {/* Payout Request Drawer Form */}
              {isRequestingPayout && (
                <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>Request Commission Payout</span>
                    </h4>
                    <button onClick={() => setIsRequestingPayout(false)} className="text-zinc-400 hover:text-zinc-600 text-sm font-bold">✕</button>
                  </div>

                  {payoutErrorMsg && (
                    <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{payoutErrorMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handlePayoutSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                        Amount to Withdraw (₹)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={stats?.unpaidBalance ?? customer.affiliateBalance ?? 485}
                        required
                        value={payoutForm.amount}
                        onChange={(e) => setPayoutForm((prev) => ({ ...prev, amount: e.target.value }))}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-mono text-zinc-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                        Payout Method
                      </label>
                      <select
                        value={payoutForm.method}
                        onChange={(e) => setPayoutForm((prev) => ({ ...prev, method: e.target.value }))}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                      >
                        <option value="UPI">UPI VPA</option>
                        <option value="Bank">Bank Account (IMPS)</option>
                        <option value="Credit">Store Credit (+10% Bonus)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                        UPI ID / Bank IFSC + Account
                      </label>
                      <input
                        type="text"
                        required
                        value={payoutForm.details}
                        onChange={(e) => setPayoutForm((prev) => ({ ...prev, details: e.target.value }))}
                        placeholder="nivas@okhdfcbank"
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-mono text-zinc-900 dark:text-white"
                      />
                    </div>

                    <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsRequestingPayout(false)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={payoutSubmitting}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>{payoutSubmitting ? 'Submitting...' : 'Confirm Withdrawal'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Payout History Ledger */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Payout History & Requests
                </h4>

                {stats?.payoutHistory && stats.payoutHistory.length > 0 ? (
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-850/50">
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {stats.payoutHistory.map((item) => (
                        <div key={item.id} className="p-3.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm">
                              ₹
                            </div>
                            <div>
                              <p className="font-bold text-zinc-900 dark:text-white font-mono">
                                ₹{item.amount.toLocaleString('en-IN')} via {item.method}
                              </p>
                              <p className="text-[11px] text-zinc-400">
                                {new Date(item.createdAt).toLocaleDateString('en-IN')} • {item.details}
                              </p>
                            </div>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            item.status === 'completed' || item.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : item.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-400 text-xs">
                    No payout requests yet. When your balance reaches ₹100 or more, click "Request Payout" above.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
