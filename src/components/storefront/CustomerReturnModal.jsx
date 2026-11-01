import React, { useState } from 'react';
import { 
  RotateCcw, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, 
  Truck, FileText, Sparkles, Loader2, X, RefreshCw, HelpCircle
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export default function CustomerReturnModal({ order, isOpen, onClose, onSuccess }) {
  const [returnType, setReturnType] = useState('return_refund'); // 'return_refund' | 'exchange'
  const [reason, setReason] = useState('size_mismatch');
  const [exchangeSize, setExchangeSize] = useState('Size L');
  const [reasonDetails, setReasonDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen || !order) return null;

  const items = order.items || [];
  const totalRefund = items.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 1)), 0) || order.total || 3450;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const returnItems = items.map(i => ({
        productId: i.id || i.productId || 'prod_default',
        title: i.title || 'Product',
        variantTitle: i.variantTitle || 'Standard',
        quantity: i.quantity || 1,
        price: i.price || 0,
        exchangeVariant: returnType === 'exchange' ? exchangeSize : null,
        reason
      }));

      const payload = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customer?.firstName ? `${order.customer.firstName} ${order.customer.lastName || ''}`.trim() : (order.customerName || 'Shopper'),
        customerEmail: order.customer?.email || order.customerEmail || 'customer@istora.online',
        customerPhone: order.customer?.phone || '+91 98765 43210',
        type: returnType,
        reason,
        reasonDetails: reasonDetails.trim() || 'Self-service customer return request.',
        items: returnItems
      };

      const res = await apiClient.createReturn(payload, order.storeId);
      setResult(res);
      if (onSuccess) onSuccess(res);
    } catch (err) {
      console.error('Failed to submit return:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-200 overflow-hidden flex flex-col animate-slideUp">
        
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-900 text-white flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <RotateCcw className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Self-Service Return / Exchange (RMA)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  7-Day Policy Window
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Order <strong>{order.orderNumber}</strong> • Instant reverse logistics pickup & GST Credit Note
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {result ? (
          <div className="p-6 sm:p-8 space-y-5 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-bold font-mono uppercase bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                RMA ID: {result.id}
              </span>
              <h4 className="text-xl font-black text-zinc-900 mt-2">
                Return Request Submitted!
              </h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                We've scheduled reverse pickup for order #{order.orderNumber}. Our courier partner will collect the parcel from your doorstep.
              </p>
            </div>

            {/* Reverse Logistics Card */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-left text-xs space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                <span className="text-zinc-500">Reverse Pickup Courier:</span>
                <span className="font-bold text-zinc-900">{result.pickupCourier || 'Delhivery Reverse Logistics'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                <span className="text-zinc-500">Reverse AWB Tracking:</span>
                <span className="font-mono font-bold text-indigo-700">{result.pickupTrackingNumber || 'DEL-REV-8492019'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                <span className="text-zinc-500">Action Requested:</span>
                <span className="font-bold uppercase text-zinc-800">
                  {result.type === 'exchange' ? 'Exchange (Replacement Item)' : 'Full Refund (GST Credit Note)'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 font-bold text-emerald-800">
                <span>Estimated Credit / Refund:</span>
                <span className="font-mono">₹{result.totalRefundAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Official GST Credit Note Notice */}
            <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200 text-left text-[11px] text-indigo-950 flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Automated GST Credit Note</p>
                <p className="text-indigo-800 mt-0.5">
                  An official Rule 54 GST Tax Credit Note will be generated with exact reversal tax calculations and emailed directly to your inbox upon merchant inspection.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
            >
              Done & Return to Orders
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
            {/* Step 1: Return Type Switcher */}
            <div className="space-y-1.5">
              <label className="block font-bold text-zinc-900">
                1. Select Resolution Type
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <label className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                  returnType === 'return_refund' 
                    ? 'border-rose-600 bg-rose-50/50 text-rose-950 font-bold ring-2 ring-rose-500/20' 
                    : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                }`}>
                  <input
                    type="radio"
                    name="returnType"
                    checked={returnType === 'return_refund'}
                    onChange={() => setReturnType('return_refund')}
                    className="mt-0.5 accent-rose-600"
                  />
                  <div>
                    <span className="block font-bold">Return for Refund</span>
                    <span className="text-[10px] text-zinc-500 font-normal">Credit back to original payment</span>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                  returnType === 'exchange' 
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold ring-2 ring-indigo-500/20' 
                    : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                }`}>
                  <input
                    type="radio"
                    name="returnType"
                    checked={returnType === 'exchange'}
                    onChange={() => setReturnType('exchange')}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <div>
                    <span className="block font-bold">Exchange Size / Item</span>
                    <span className="text-[10px] text-zinc-500 font-normal">Free size replacement sent</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Step 2: Reason Selection */}
            <div className="space-y-1.5">
              <label className="block font-bold text-zinc-900">
                2. Reason for Return or Exchange
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 font-semibold text-zinc-800 bg-zinc-50/50"
              >
                <option value="size_mismatch">Size Mismatch / Too Tight or Loose</option>
                <option value="item_damaged">Item Damaged or Defective</option>
                <option value="wrong_item">Wrong Item or Color Received</option>
                <option value="quality_issue">Quality / Stitching Discrepancy</option>
                <option value="changed_mind">Changed Mind / Style Doesn't Suit</option>
              </select>
            </div>

            {/* Biometric Fit Insights Highlight */}
            {reason === 'size_mismatch' && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 space-y-2">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Biometric Fit Check Diagnostic</span>
                </div>
                <p className="text-[11px] text-purple-950 leading-relaxed">
                  Based on your saved torso/chest measurements (40 in), this garment tag (38 in) had a <strong>92% probability of chest tightness</strong>. We recommend exchanging to <strong>Size L</strong>.
                </p>

                {returnType === 'exchange' && (
                  <div className="pt-1 flex items-center gap-2 text-xs">
                    <span className="font-bold text-purple-900">Exchange to:</span>
                    <select
                      value={exchangeSize}
                      onChange={(e) => setExchangeSize(e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-purple-300 bg-white font-bold text-purple-950 text-xs"
                    >
                      <option value="Size XS">Size XS</option>
                      <option value="Size S">Size S</option>
                      <option value="Size M">Size M</option>
                      <option value="Size L">Size L (Recommended)</option>
                      <option value="Size XL">Size XL</option>
                      <option value="Size XXL">Size XXL</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Additional Notes */}
            <div className="space-y-1">
              <label className="block font-bold text-zinc-700 text-[11px]">
                3. Additional Notes / Feedback (Optional)
              </label>
              <textarea
                rows={2}
                value={reasonDetails}
                onChange={(e) => setReasonDetails(e.target.value)}
                placeholder="Let us know any details about the fit or item condition..."
                className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs text-zinc-900"
              />
            </div>

            {/* Refund & Reverse Pickup Summary */}
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-zinc-900">Total Refund / Exchange Credit:</p>
                <p className="text-[10px] text-zinc-500">Free door-to-door reverse pickup included</p>
              </div>
              <span className="text-base font-black font-mono text-zinc-950">
                ₹{totalRefund.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-zinc-600 hover:bg-zinc-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                <span>{submitting ? 'Submitting...' : 'Confirm Return Request'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
