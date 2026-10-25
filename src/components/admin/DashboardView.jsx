import React from 'react';
import { useStore } from '../../context/StoreContext';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Percent,
  Package,
  Clock,
  ArrowUpRight,
  CheckCircle,
  Truck,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function DashboardView({ onNavigateTab, onOpenImportModal }) {
  const {
    totalRevenue,
    totalOrdersCount,
    averageOrderValue,
    unfulfilledOrdersCount,
    orders,
    products,
    fulfillOrder
  } = useStore();

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Shopify Migration Quick Banner (Always accessible if merchant forgot during creation) */}
      <div className="bg-gradient-to-r from-emerald-600/10 via-emerald-500/5 to-white border border-emerald-500/20 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-900 flex items-center gap-2">
              <span>Moving from Shopify?</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full">
                Zero Tech Setup
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              If you didn't import data during store setup, you can import your CSV or connect your live Shopify store now.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenImportModal}
          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer"
        >
          <span>Import Store Data</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Overview Cards (Polaris KPI Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold">Total Sales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-900">${(totalRevenue || 0).toFixed(2)}</p>
          <div className="mt-2 flex items-center text-[11px] text-emerald-600 font-semibold gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+14.2% vs last week</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-900">{totalOrdersCount || 0}</p>
          <div className="mt-2 flex items-center text-[11px] text-blue-600 font-semibold gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+8.4% vs last week</span>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold">Average Order Value</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-900">${(averageOrderValue || 0).toFixed(2)}</p>
          <div className="mt-2 flex items-center text-[11px] text-purple-600 font-semibold gap-1">
            <span>Dynamic cart basket metric</span>
          </div>
        </div>

        {/* Unfulfilled Orders */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold">Fulfillment Queue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-900">{unfulfilledOrdersCount}</p>
          <div className="mt-2 flex items-center text-[11px] text-amber-600 font-semibold gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Orders awaiting shipment</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Orders & Quick Store Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Orders (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Recent Orders</h3>
              <p className="text-xs text-zinc-500">Live order activity across all sales channels</p>
            </div>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-semibold text-[#008060] hover:underline"
            >
              View all orders →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 font-semibold">
                  <th className="pb-2.5">Order</th>
                  <th className="pb-2.5">Customer</th>
                  <th className="pb-2.5">Total</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3 font-bold font-mono text-zinc-900">
                      {ord.orderNumber}
                    </td>
                    <td className="py-3 text-zinc-700">
                      {ord.customer?.firstName || ord.customerName || 'Customer'} {ord.customer?.lastName || ''}
                    </td>
                    <td className="py-3 font-semibold text-zinc-900">
                      ${(ord.total || 0).toFixed(2)}
                    </td>
                    <td className="py-3">
                      {ord.fulfillmentStatus === 'fulfilled' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Fulfilled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          Unfulfilled
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {ord.fulfillmentStatus === 'unfulfilled' ? (
                        <button
                          onClick={() => fulfillOrder(ord.id)}
                          className="px-2.5 py-1 bg-[#008060] hover:bg-[#006e52] text-white text-[11px] font-semibold rounded-md shadow-xs transition-colors"
                        >
                          Fulfill
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-zinc-400">
                          {ord.trackingNumber ? ord.trackingNumber.slice(0, 10) + '...' : 'Delivered'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Top Products & Architecture Insight */}
        <div className="space-y-6">
          {/* Top Products */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-zinc-900 mb-3">Top Catalog Items</h3>
            <div className="space-y-3">
              {(products || []).slice(0, 4).map((p) => {
                const totalStock = (p.variants || []).reduce((s, v) => s + (v.inventoryQuantity || 0), 0);
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <img
                      src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80'}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover border border-zinc-200 bg-zinc-100"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 truncate">{p.title}</p>
                      <p className="text-[11px] text-zinc-500">${(p.price || 0).toFixed(2)} • {(p.variants || []).length} variants</p>
                    </div>
                    <span className="text-[11px] font-mono bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">
                      {totalStock} in stock
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Engine Status */}
          <div className="bg-zinc-950 text-white rounded-xl p-5 border border-zinc-800 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Engine Status: Active
            </div>
            <p className="text-xs text-zinc-300">
              Clean-room Shopify replica running in local reactive storage. All mutations in this admin portal immediately synchronize with the customer storefront.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
