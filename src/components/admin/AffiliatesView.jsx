import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { apiClient } from '../../services/apiClient';
import {
  Award,
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  Check,
  Search,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Building,
  RefreshCw
} from 'lucide-react';

export default function AffiliatesView() {
  const { activeStore } = useStore();
  const [affiliates, setAffiliates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const loadAffiliates = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getAdminAffiliates(activeStore?.id);
      if (Array.isArray(data)) {
        setAffiliates(data);
      }
    } catch (err) {
      console.warn('[AffiliatesView] Failed to load server affiliates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAffiliates();
  }, [activeStore?.id]);

  const handleApprovePayout = async (payoutId) => {
    setApprovingId(payoutId);
    setActionSuccess('');
    try {
      await apiClient.approveAdminAffiliatePayout(payoutId, activeStore?.id);
      setActionSuccess(`Payout #${payoutId} approved successfully and marked transferred.`);
      await loadAffiliates();
    } catch (err) {
      alert('Could not approve payout: ' + (err.message || ''));
    } finally {
      setApprovingId(null);
    }
  };

  // Extract pending payouts across all affiliates
  const pendingPayouts = affiliates.flatMap((a) =>
    (a.pendingPayouts || []).map((p) => ({ ...p, affiliateName: a.name, affiliateEmail: a.email, referralCode: a.referralCode }))
  );

  const totalGrossSales = affiliates.reduce((sum, a) => sum + (a.grossSales || 0), 0);
  const totalCommission = affiliates.reduce((sum, a) => sum + (a.totalCommission || 0), 0);
  const totalUnpaidBalance = affiliates.reduce((sum, a) => sum + (a.unpaidBalance || 0), 0);

  const filteredAffiliates = affiliates.filter((a) =>
    a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.referralCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-zinc-900">
              Affiliate, Referral & Influencer Engine
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-purple-100 text-purple-800 border border-purple-200">
              Viral Growth
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage creator partners, track attributed order commissions, and approve UPI/Bank payouts
          </p>
        </div>

        <button
          onClick={loadAffiliates}
          disabled={isLoading}
          className="px-3.5 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-zinc-400 hover:text-zinc-700 font-bold px-2">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Partners</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-zinc-900 font-mono mt-1">
            {affiliates.length}
          </p>
          <span className="text-[11px] text-zinc-500">Registered creators</span>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Attributed Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-zinc-900 font-mono mt-1">
            ₹{totalGrossSales.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold">Gross sales volume</span>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Commission Accrued</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-indigo-700 font-mono mt-1">
            ₹{totalCommission.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-zinc-500">10% standard partner rate</span>
        </div>

        <div className="p-5 rounded-2xl border border-amber-300 bg-amber-50/50 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Payouts</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-900 font-mono mt-1">
            {pendingPayouts.length}
          </p>
          <span className="text-[11px] text-amber-800 font-semibold">
            ₹{pendingPayouts.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString('en-IN')} ready to transfer
          </span>
        </div>
      </div>

      {/* Pending Payout Requests Section */}
      {pendingPayouts.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/30 overflow-hidden shadow-xs">
          <div className="p-4 bg-amber-100/60 border-b border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                Action Required: {pendingPayouts.length} Pending Payout Requests
              </h3>
            </div>
            <span className="text-[11px] text-amber-800 font-semibold">Transfers requested via UPI / Bank</span>
          </div>

          <div className="divide-y divide-amber-200/60 bg-white">
            {pendingPayouts.map((p) => (
              <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900">{p.affiliateName}</span>
                    <span className="text-zinc-400">({p.affiliateEmail})</span>
                    <span className="font-mono text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700">{p.referralCode}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 flex items-center gap-3">
                    <span>Requested: {new Date(p.createdAt).toLocaleDateString('en-IN')}</span>
                    <span>Method: <strong>{p.method}</strong></span>
                    <span className="font-mono text-zinc-800 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200">{p.details}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-base font-extrabold text-emerald-700 font-mono">
                    ₹{p.amount.toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={() => handleApprovePayout(p.id)}
                    disabled={approvingId === p.id}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{approvingId === p.id ? 'Approving...' : 'Approve & Mark Paid'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Influencers & Affiliates Directory Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-xs space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search partner by name, email, or referral code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#008060]"
            />
          </div>

          <span className="text-xs text-zinc-400">
            Showing {filteredAffiliates.length} registered partners
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider text-[10px] border-y border-zinc-200">
              <tr>
                <th className="py-3 px-4">Partner</th>
                <th className="py-3 px-4">Referral Code</th>
                <th className="py-3 px-4 text-center">Clicks</th>
                <th className="py-3 px-4 text-center">Orders</th>
                <th className="py-3 px-4 text-right">Gross Sales</th>
                <th className="py-3 px-4 text-right">Commission (10%)</th>
                <th className="py-3 px-4 text-right">Unpaid Balance</th>
                <th className="py-3 px-4">Payout Destination</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredAffiliates.length > 0 ? (
                filteredAffiliates.map((aff) => (
                  <tr key={aff.customerId} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-zinc-900">{aff.name}</p>
                      <p className="text-[11px] text-zinc-400">{aff.email}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-700">
                      <span className="bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-lg text-[11px]">
                        {aff.referralCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-zinc-700">
                      {aff.clicks}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-700">
                      {aff.ordersCount}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-900">
                      ₹{aff.grossSales.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-700">
                      ₹{aff.totalCommission.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                      ₹{aff.unpaidBalance.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-zinc-500 font-mono">
                      {aff.payoutDetails ? (
                        <span>{aff.payoutMethod || 'UPI'}: {aff.payoutDetails}</span>
                      ) : (
                        <span className="text-zinc-400 italic">None specified</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-zinc-400">
                    No affiliates found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
