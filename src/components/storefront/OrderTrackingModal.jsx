import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  X,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function OrderTrackingModal({ initialOrderNumber = '', onClose }) {
  const { orders, settings } = useStore();
  const [searchQuery, setSearchQuery] = useState(initialOrderNumber);
  const [selectedOrder, setSelectedOrder] = useState(() => {
    if (initialOrderNumber) {
      return orders.find(
        (o) =>
          o.orderNumber?.toLowerCase() === initialOrderNumber.toLowerCase() ||
          o.id?.toLowerCase() === initialOrderNumber.toLowerCase()
      ) || null;
    }
    return orders[0] || null;
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const clean = searchQuery.trim().toLowerCase();
    const found = orders.find(
      (o) =>
        o.orderNumber?.toLowerCase().includes(clean) ||
        o.id?.toLowerCase().includes(clean) ||
        o.customer?.email?.toLowerCase().includes(clean) ||
        o.trackingNumber?.toLowerCase().includes(clean)
    );
    setSelectedOrder(found || null);
  };

  // Derive steps based on order fulfillment status
  const getTimelineSteps = (order) => {
    const isFulfilled = order.fulfillmentStatus === 'fulfilled';
    const tracking = order.trackingNumber || `EXP-${Math.floor(100000 + Math.random() * 900000)}`;

    return [
      {
        title: 'Order Confirmed & Payment Verified',
        desc: `Payment confirmed via ${order.financialStatus === 'paid' ? 'Secure Gateway' : 'Cash on Delivery'}.`,
        date: new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        completed: true,
        current: !isFulfilled,
        icon: ShieldCheck
      },
      {
        title: 'Processed & Packed at Warehouse',
        desc: 'Items quality-checked, barcoded, and wrapped in eco-friendly packaging.',
        date: isFulfilled ? 'Completed' : 'In Progress',
        completed: isFulfilled,
        current: isFulfilled,
        icon: Package
      },
      {
        title: 'Dispatched via Express Courier',
        desc: isFulfilled
          ? `Handed over to BlueDart / Delhivery. Tracking AWB: ${tracking}`
          : 'Courier pickup scheduled once packing completes.',
        date: isFulfilled ? 'In Transit' : 'Pending',
        completed: isFulfilled,
        current: false,
        icon: Truck
      },
      {
        title: 'Delivered to Customer',
        desc: `Estimated delivery to ${order.customer.city || 'your address'}.`,
        date: 'Estimated 2-3 Days',
        completed: false,
        current: false,
        icon: CheckCircle2
      }
    ];
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-[#008060] rounded-xl">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">Track Customer Order</h2>
              <p className="text-xs text-zinc-500">Live shipping updates & courier milestone tracking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="my-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Order # (e.g. APX-1001) or customer email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#008060]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Track
          </button>
        </form>

        {/* Order Details Body */}
        {selectedOrder ? (
          <div className="overflow-y-auto pr-1 space-y-6">
            {/* Status Card */}
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-zinc-900 text-sm">
                    {selectedOrder.orderNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      selectedOrder.fulfillmentStatus === 'fulfilled'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedOrder.fulfillmentStatus === 'fulfilled' ? 'In Transit' : 'Processing'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()} for{' '}
                  <span className="font-semibold text-zinc-800">
                    {selectedOrder.customer.firstName} {selectedOrder.customer.lastName}
                  </span>
                </p>
              </div>

              {selectedOrder.trackingNumber && (
                <div className="bg-white px-3 py-1.5 rounded-lg border border-zinc-200 text-right">
                  <span className="text-[10px] text-zinc-400 block font-semibold uppercase">AWB Courier ID</span>
                  <span className="font-mono text-xs font-bold text-[#008060]">
                    {selectedOrder.trackingNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Vertical Milestone Timeline */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200">
              {getTimelineSteps(selectedOrder).map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="relative flex items-start gap-4">
                    <div
                      className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                        step.completed
                          ? 'bg-[#008060] text-white'
                          : step.current
                          ? 'bg-amber-500 text-white animate-pulse'
                          : 'bg-zinc-200 text-zinc-400'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`text-xs font-bold ${
                            step.completed || step.current ? 'text-zinc-900' : 'text-zinc-400'
                          }`}
                        >
                          {step.title}
                        </h4>
                        <span className="text-[11px] font-mono text-zinc-400">{step.date}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Items Summary in this Order */}
            <div className="border-t border-zinc-200 pt-4">
              <h4 className="text-xs font-bold text-zinc-800 mb-2.5">
                Shipment Contents ({selectedOrder.items?.length || 0} items)
              </h4>
              <div className="space-y-2">
                {(selectedOrder.items || []).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-100 last:border-0">
                    <div className="flex items-center gap-2.5">
                      {item.image && (
                        <img
                          src={item.image}
                          alt=""
                          className="w-9 h-9 rounded-lg object-cover border border-zinc-200"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-zinc-900">{item.title}</p>
                        <p className="text-[10px] text-zinc-400">
                          Qty: {item.quantity} • {item.variantTitle || 'Standard'}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-zinc-800">
                      ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Destination */}
            <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 flex items-start gap-2.5 text-xs text-zinc-600">
              <MapPin className="w-4 h-4 text-[#008060] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-zinc-900">Delivery Address: </span>
                {selectedOrder.customer.address}, {selectedOrder.customer.city},{' '}
                {selectedOrder.customer.state} {selectedOrder.customer.zip}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-zinc-50 rounded-xl border border-dashed border-zinc-300">
            <AlertCircle className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-zinc-800">No order found matching your query</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Check the order number on your invoice or receipt email and try again.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
          <span>Need help? Contact support@{settings?.storeDomain || 'store.local'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-900 hover:bg-black text-white rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
