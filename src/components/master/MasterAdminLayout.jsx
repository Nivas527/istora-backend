import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import GlobalHeader from '../common/GlobalHeader';
import {
  ShieldCheck,
  Store,
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  Search,
  LogIn,
  ExternalLink,
  Ban,
  CheckCircle2,
  Trash2,
  Plus,
  Activity,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Clock,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

export default function MasterAdminLayout() {
  const {
    stores,
    totalPlatformGmv,
    totalPlatformOrders,
    totalPlatformProducts,
    totalPlatformCustomers,
    totalPlatformFeesCollected,
    allPlatformOrders,
    loginAsMerchant,
    toggleStoreStatus,
    deleteStore,
    switchStore,
    setActiveMode,
    setIsCreateStoreModalOpen
  } = useStore();

  const [activeTab, setActiveTab] = useState('stores'); // 'stores' | 'orders' | 'customers' | 'system'
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStores = (stores || []).filter(
    (s) =>
      (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.subdomain || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Top Global Command Hub / Module Switcher */}
      <GlobalHeader currentSection="master" />

      {/* Top Bar for Master Admin */}
      <header className="bg-zinc-900/90 border-b border-zinc-800 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-12 z-40 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-white tracking-wide uppercase">
                Shopify Master Platform Operations
              </span>
              <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Super Admin
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              Global Tenant Supervisor • Multi-Store Observability & Impersonation
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateStoreModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Store Tenant</span>
        </button>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* Global Master KPI Metrics (Cross-Tenant Aggregates) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              Global Platform Metrics (All Stores Combined)
            </h2>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Real-time Sync Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total GMV */}
            <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-xl shadow-lg">
              <span className="text-[11px] font-semibold text-zinc-400 block mb-1">Total Platform GMV</span>
              <p className="text-2xl font-black text-white">${totalPlatformGmv.toFixed(2)}</p>
              <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <ArrowUpRight className="w-3 h-3" />
                <span>Gross merchandise volume</span>
              </div>
            </div>

            {/* Platform Revenue (2.5% take rate) */}
            <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-xl shadow-lg">
              <span className="text-[11px] font-semibold text-zinc-400 block mb-1">Platform Revenue (2.5%)</span>
              <p className="text-2xl font-black text-amber-400">${totalPlatformFeesCollected.toFixed(2)}</p>
              <div className="mt-2 text-[10px] text-zinc-400 font-mono">
                Take-rate on transactions
              </div>
            </div>

            {/* Total Stores */}
            <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-xl shadow-lg">
              <span className="text-[11px] font-semibold text-zinc-400 block mb-1">Active Stores</span>
              <p className="text-2xl font-black text-blue-400">{stores.length}</p>
              <div className="mt-2 text-[10px] text-zinc-400 font-mono">
                Isolated tenant instances
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-xl shadow-lg">
              <span className="text-[11px] font-semibold text-zinc-400 block mb-1">Platform Orders</span>
              <p className="text-2xl font-black text-purple-400">{totalPlatformOrders}</p>
              <div className="mt-2 text-[10px] text-zinc-400 font-mono">
                Across all channels
              </div>
            </div>

            {/* Total Catalog Items */}
            <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-xl shadow-lg">
              <span className="text-[11px] font-semibold text-zinc-400 block mb-1">Total SKUs & Items</span>
              <p className="text-2xl font-black text-emerald-400">{totalPlatformProducts}</p>
              <div className="mt-2 text-[10px] text-zinc-400 font-mono">
                Variants indexed in engine
              </div>
            </div>
          </div>
        </div>

        {/* Master Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-zinc-800 pb-3">
          <button
            onClick={() => setActiveTab('stores')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'stores'
                ? 'bg-white text-zinc-900 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            Stores Fleet ({stores.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-white text-zinc-900 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            Live Global Transactions ({allPlatformOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'system'
                ? 'bg-white text-zinc-900 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            Platform Architecture & Health
          </button>
        </div>

        {/* TAB 1: STORES FLEET MANAGER */}
        {activeTab === 'stores' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter stores by name, domain, or category..."
                  className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                onClick={() => setIsCreateStoreModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Provision New Store</span>
              </button>
            </div>

            {/* Stores Fleet Table */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-semibold">
                      <th className="py-3.5 px-4">Store Tenant</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Catalog</th>
                      <th className="py-3.5 px-4">Orders & GMV</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Master Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredStores.map((st) => {
                      const storeGmv = (st.orders || []).reduce((s, o) => s + (o.total || 0), 0);
                      const isSuspended = st.status === 'suspended';

                      return (
                        <tr key={st.id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <span
                                className="w-3.5 h-3.5 rounded-full shrink-0"
                                style={{ backgroundColor: st.accentColor || '#008060' }}
                              />
                              <div>
                                <p className="font-bold text-white text-sm">{st.name}</p>
                                <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                                  https://{st.subdomain}
                                </p>
                                <p className="text-[10px] text-zinc-500 mt-0.5">
                                  Owner: {st.contactEmail}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 text-zinc-300">
                            <span className="bg-zinc-800 px-2.5 py-1 rounded-md text-[11px] border border-zinc-700/60">
                              {st.category}
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            <span className="font-semibold text-zinc-200">
                              {st.products.length} products
                            </span>
                            <p className="text-[10px] text-zinc-500 font-mono">
                              {st.products.reduce((acc, p) => acc + (p.variants?.length || 1), 0)} variants
                            </p>
                          </td>

                          <td className="py-4 px-4">
                            <span className="font-bold text-emerald-400 block">
                              ${storeGmv.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {(st.orders || []).length} orders processed
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            {isSuspended ? (
                              <span className="inline-flex items-center gap-1 bg-red-950/60 text-red-400 border border-red-800/50 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Suspended
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                Active
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Impersonate Button */}
                              <button
                                onClick={() => loginAsMerchant(st.id)}
                                className="px-2.5 py-1.5 bg-[#008060] hover:bg-[#006e52] text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                title="Log in as merchant to view and edit this store"
                              >
                                <LogIn className="w-3 h-3" />
                                <span>Enter Admin</span>
                              </button>

                              {/* View Storefront */}
                              <button
                                onClick={() => {
                                  switchStore(st.id);
                                  setActiveMode('storefront');
                                }}
                                className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
                                title="View Storefront as Customer"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>

                              {/* Suspend/Activate */}
                              <button
                                onClick={() => toggleStoreStatus(st.id)}
                                className={`p-1.5 rounded transition-colors ${
                                  isSuspended ? 'text-emerald-400 hover:bg-zinc-800' : 'text-amber-400 hover:bg-zinc-800'
                                }`}
                                title={isSuspended ? 'Reactivate Store' : 'Suspend Store'}
                              >
                                <Ban className="w-4 h-4" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => {
                                  if (confirm(`Delete store "${st.name}" and all its catalog/orders permanently?`)) {
                                    deleteStore(st.id);
                                  }
                                }}
                                className="p-1.5 text-zinc-500 hover:text-red-400 rounded hover:bg-zinc-800 transition-colors"
                                title="Delete Store"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GLOBAL TRANSACTIONS (CROSS-STORE SURVEILLANCE FEED) */}
        {activeTab === 'orders' && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">Cross-Tenant Live Transaction Stream</h3>
                <p className="text-xs text-zinc-400">All customer orders across all stores in chronological order</p>
              </div>
              <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-full">
                {allPlatformOrders.length} total orders
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-semibold">
                    <th className="py-3 px-4">Order</th>
                    <th className="py-3 px-4">Origin Store</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Fulfillment</th>
                    <th className="py-3 px-4 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {allPlatformOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {ord.orderNumber}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-xs font-semibold text-zinc-200 block">
                          {ord.storeName}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {ord.subdomain}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-400">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-zinc-200">
                        {ord.customer?.firstName || ord.customerName || 'Customer'} {ord.customer?.lastName || ''}
                        <span className="block text-[11px] text-zinc-500 font-mono">
                          {ord.customer?.email || ord.customerEmail || 'No email'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        ${ord.total.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.fulfillmentStatus === 'fulfilled'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                            : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                        }`}>
                          {ord.fulfillmentStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => loginAsMerchant(ord.storeId)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded transition-colors"
                        >
                          View in Store Admin →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PLATFORM ARCHITECTURE & HEALTH */}
        {activeTab === 'system' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                Multi-Tenant Architecture Specification
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                This platform implements a <strong>Shared Application, Scoped Data Store</strong> pattern matching Shopify's core.
              </p>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 flex justify-between">
                  <span className="text-zinc-500">Tenant Scoping Mode:</span>
                  <span className="text-emerald-400 font-bold">Domain & Store ID Scoped</span>
                </div>
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 flex justify-between">
                  <span className="text-zinc-500">Inventory Lock Engine:</span>
                  <span className="text-emerald-400 font-bold">Sub-second Atomic Decrement</span>
                </div>
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 flex justify-between">
                  <span className="text-zinc-500">Platform Fee (Commission):</span>
                  <span className="text-amber-400 font-bold">2.5% per Checkout Session</span>
                </div>
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 flex justify-between">
                  <span className="text-zinc-500">API Gateway Version:</span>
                  <span className="text-blue-400 font-bold">Shopify REST 2024-01 Parity</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Super Admin Security & Access
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Super Admins hold root authority over all provisioned tenants. You can inspect any store's orders, alter inventories, suspend compromised shops, or launch new stores on behalf of merchants.
              </p>
              <div className="p-4 bg-emerald-950/30 rounded-xl border border-emerald-800/40 text-xs text-emerald-300">
                <strong>Impersonation Capability:</strong> Clicking "Enter Admin" on any store grants you full Polaris Merchant access with automatic return routing to this Master Operations console.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
