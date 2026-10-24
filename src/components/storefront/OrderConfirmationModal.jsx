import React from 'react';
import { useStore } from '../../context/StoreContext';
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  ArrowRight,
  Sliders,
  Sparkles
} from 'lucide-react';

export default function OrderConfirmationModal({ order, onClose, onGoToAdmin, onTrackOrder }) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 text-center animate-slideUp">
        {/* Success Icon */}
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
          <CheckCircle2 className="w-10 h-10 text-[#008060]" />
        </div>

        <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
          Order {order.orderNumber} Confirmed
        </span>

        <h2 className="text-2xl font-black text-zinc-900 mt-2">
          Thank you for your purchase!
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          A confirmation receipt was sent to <strong>{order.customer.email}</strong>
        </p>

        {/* Order Step Timeline */}
        <div className="my-6 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-[#008060] text-white flex items-center justify-center mb-1">
                ✓
              </div>
              <span className="font-bold text-zinc-900">Confirmed</span>
              <span className="text-[10px] text-zinc-400">Inventory locked</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center mb-1 animate-pulse">
                <Package className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-amber-600">Preparing</span>
              <span className="text-[10px] text-zinc-400">Unfulfilled</span>
            </div>

            <div className="flex flex-col items-center opacity-40">
              <div className="w-7 h-7 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center mb-1">
                <Truck className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium text-zinc-600">Shipped</span>
              <span className="text-[10px] text-zinc-400">Pending tracking</span>
            </div>
          </div>
        </div>

        {/* Shipping address & items recap */}
        <div className="text-left text-xs bg-zinc-50/80 p-4 rounded-xl border border-zinc-200 mb-6 space-y-2">
          <div className="flex items-start gap-2 text-zinc-700">
            <MapPin className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-zinc-900">Shipping to:</p>
              <p className="text-zinc-600">
                {order.customer.firstName} {order.customer.lastName} • {order.customer.address}, {order.customer.city}, {order.customer.state} {order.customer.zip}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-200/60 flex justify-between font-bold text-zinc-900">
            <span>Total Paid</span>
            <span className="text-emerald-700 font-black">${order.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          {onTrackOrder && (
            <button
              onClick={() => onTrackOrder(order.orderNumber)}
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Truck className="w-4 h-4" />
              <span>Track Live Delivery</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs rounded-xl transition-all"
          >
            Continue Shopping
          </button>

          <button
            onClick={onGoToAdmin}
            className="flex-1 py-3 px-4 bg-zinc-900 hover:bg-black text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Merchant Admin</span>
          </button>
        </div>
      </div>
    </div>
  );
}
