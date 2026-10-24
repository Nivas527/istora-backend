import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Package, Clock, CheckCircle, Truck, Search, Eye } from 'lucide-react';

export default function OrdersView() {
  const { orders, fulfillOrder } = useStore();
  const [filter, setFilter] = useState('all'); // 'all' | 'unfulfilled' | 'fulfilled'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [customTracking, setCustomTracking] = useState('');

  const filteredOrders = orders.filter((ord) => {
    if (filter === 'unfulfilled') return ord.fulfillmentStatus === 'unfulfilled';
    if (filter === 'fulfilled') return ord.fulfillmentStatus === 'fulfilled';
    return true;
  });

  const handleFulfill = (orderId) => {
    fulfillOrder(orderId, customTracking || null);
    setCustomTracking('');
    setSelectedOrder(null);
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 bg-white p-3 rounded-xl border border-zinc-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'all'
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          All ({orders.length})
        </button>
        <button
          onClick={() => setFilter('unfulfilled')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'unfulfilled'
              ? 'bg-amber-500 text-white'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          Unfulfilled ({orders.filter((o) => o.fulfillmentStatus === 'unfulfilled').length})
        </button>
        <button
          onClick={() => setFilter('fulfilled')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'fulfilled'
              ? 'bg-[#008060] text-white'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          Fulfilled ({orders.filter((o) => o.fulfillmentStatus === 'fulfilled').length})
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold">
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Fulfillment</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-zinc-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold font-mono text-zinc-900">
                    {ord.orderNumber}
                  </td>

                  <td className="py-3 px-4 text-zinc-500">
                    {new Date(ord.createdAt).toLocaleDateString()}
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-semibold text-zinc-900">
                      {ord.customer?.firstName || ord.customerName || 'Customer'} {ord.customer?.lastName || ''}
                    </p>
                    <p className="text-[11px] text-zinc-400">{ord.customer?.email || ord.customerEmail || 'No email'}</p>
                  </td>

                  <td className="py-3 px-4">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Paid
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    {ord.fulfillmentStatus === 'fulfilled' ? (
                      <div>
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Fulfilled
                        </span>
                        {ord.trackingNumber && (
                          <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                            {ord.trackingNumber}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        Unfulfilled
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 font-bold text-zinc-900">
                    ${ord.total.toFixed(2)}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(ord)}
                      className="px-2.5 py-1 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded transition-colors"
                    >
                      Inspect / Fulfill
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Fulfillment Modal / Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  Order {selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-zinc-500">
                  Customer: {selectedOrder.customer?.firstName || selectedOrder.customerName || 'Customer'} {selectedOrder.customer?.lastName || ''} ({selectedOrder.customer?.email || selectedOrder.customerEmail || 'No email'})
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-zinc-400 hover:text-zinc-700 font-bold text-lg"
              >
                ×
              </button>
            </div>

            {/* Line items list */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs p-2 bg-zinc-50 rounded-lg border border-zinc-200">
                  <div>
                    <p className="font-bold text-zinc-900">{item.title}</p>
                    <p className="text-[11px] text-zinc-500">{item.variantTitle} × {item.quantity}</p>
                  </div>
                  <span className="font-semibold text-zinc-900">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Fulfillment Action */}
            {selectedOrder.fulfillmentStatus === 'unfulfilled' ? (
              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
                <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-600" />
                  Mark Order as Fulfilled & Dispatch Tracking
                </p>
                <input
                  type="text"
                  value={customTracking}
                  onChange={(e) => setCustomTracking(e.target.value)}
                  placeholder="Enter courier tracking (or leave blank for auto-generate)"
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs text-zinc-900"
                />
                <button
                  onClick={() => handleFulfill(selectedOrder.id)}
                  className="w-full py-2.5 bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Confirm & Fulfill Order
                </button>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Order is already fulfilled with tracking: <strong>{selectedOrder.trackingNumber}</strong></span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
