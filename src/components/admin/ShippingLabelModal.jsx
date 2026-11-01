import React, { useRef } from 'react';
import {
  Printer,
  Download,
  X,
  Truck,
  Package,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Building,
  MapPin
} from 'lucide-react';

export default function ShippingLabelModal({ label, onClose }) {
  const printRef = useRef(null);

  if (!label) return null;

  const handlePrint = () => {
    window.print();
  };

  const isCod = label.paymentMode === 'COD';
  const isShiprocket = label.aggregator?.toLowerCase() === 'shiprocket';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
        {/* Modal Controls Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                4×6 Thermal Shipping Label
              </h3>
              <p className="text-[11px] text-zinc-500">
                Courier Aggregator: <strong>{label.aggregator}</strong> ({label.courierCarrier})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print 4×6 Label</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4x6 INCH THERMAL SHIPPING LABEL CONTAINER                */}
        {/* Formatted specifically for 4in x 6in thermal label paper */}
        {/* ======================================================== */}
        <div
          ref={printRef}
          className="mx-auto bg-white border-2 border-black text-black p-4 font-sans text-xs shadow-xs rounded-lg max-w-[380px] print:max-w-none print:w-full print:border-none print:p-0 print:m-0"
          style={{ minHeight: '520px' }}
        >
          {/* Header Band: Carrier & Routing Hub */}
          <div className="flex items-stretch justify-between border-b-2 border-black pb-2">
            <div className="space-y-0.5">
              <div className="text-[10px] font-mono uppercase font-bold tracking-widest text-zinc-600">
                {label.aggregator} Express Logistics
              </div>
              <div className="text-base font-black tracking-tight uppercase flex items-center gap-1">
                <Truck className="w-4 h-4 inline-block" />
                <span>{label.courierCarrier}</span>
              </div>
              <div className="text-[10px] font-bold">
                Order: <span className="font-mono">{label.orderNumber}</span>
              </div>
            </div>

            <div className="border-2 border-black px-3 py-1 flex flex-col items-center justify-center bg-zinc-50 text-center">
              <span className="text-[9px] uppercase font-bold tracking-wider">Destination Hub</span>
              <span className="text-base font-black font-mono tracking-tight leading-none">
                {label.routingCode || 'BLR/DEL-01'}
              </span>
              <span className="text-[9px] font-mono font-bold mt-0.5">
                PIN: {label.consigneePincode || '560001'}
              </span>
            </div>
          </div>

          {/* Barcode & AWB Section */}
          <div className="py-2.5 text-center border-b-2 border-black">
            {label.barcodeSvg ? (
              <div
                className="w-full flex justify-center py-1 overflow-hidden"
                dangerouslySetInnerHTML={{ __html: label.barcodeSvg }}
              />
            ) : (
              <div className="h-10 bg-zinc-200 flex items-center justify-center font-mono text-xs">
                ||| | || |||| | ||| |||| | ||
              </div>
            )}
            <div className="font-mono text-sm font-black tracking-widest mt-1">
              AWB: {label.awbNumber}
            </div>
          </div>

          {/* Payment Status & Weight Strip */}
          <div className="grid grid-cols-3 border-b-2 border-black text-center divide-x-2 divide-black text-[11px] font-bold bg-zinc-50">
            <div className="py-1.5">
              <span className="block text-[9px] text-zinc-500 uppercase">Payment Mode</span>
              <span className={`font-black text-xs ${isCod ? 'text-red-700' : 'text-emerald-800'}`}>
                {label.paymentMode || 'PREPAID'}
              </span>
            </div>

            <div className="py-1.5">
              <span className="block text-[9px] text-zinc-500 uppercase">Collectable Amt</span>
              <span className="font-mono font-black text-xs">
                ₹{(label.collectableAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="py-1.5">
              <span className="block text-[9px] text-zinc-500 uppercase">Dead Weight</span>
              <span className="font-mono font-black text-xs">
                {label.weightKg || '0.50'} KG
              </span>
            </div>
          </div>

          {/* Consignee / Delivery Address Block */}
          <div className="p-2.5 border-b-2 border-black space-y-1">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-500 block">
              Deliver To (Consignee):
            </span>
            <div className="text-xs font-black text-black leading-tight">
              {label.consigneeName || 'Valued Customer'}
            </div>
            <div className="text-[11px] text-black leading-snug">
              {label.consigneeAddress || 'Customer Street Address'}
            </div>
            <div className="text-[11px] font-bold text-black">
              {label.consigneeCity || 'Bangalore'}, {label.consigneeState || 'Karnataka'} - {label.consigneePincode || '560001'}
            </div>
            <div className="text-[10px] font-mono font-bold pt-0.5">
              Contact: {label.consigneePhone || '+91 98765 43210'}
            </div>
          </div>

          {/* Return Address / Shipper Block */}
          <div className="p-2 border-b-2 border-black bg-zinc-50/50 space-y-0.5 text-[10px]">
            <span className="text-[8px] font-extrabold uppercase tracking-wider text-zinc-500 block">
              Return Address (If Undelivered / Shipper):
            </span>
            <div className="font-bold text-black">
              {label.sellerName || 'Apex Commerce India Pvt. Ltd.'}
            </div>
            <div className="text-zinc-700">
              {label.sellerAddress || 'Plot 42, Electronics City Phase 1'}, {label.sellerCity || 'Bangalore'}, {label.sellerState || 'Karnataka'} - {label.sellerPincode || '560100'}
            </div>
            <div className="font-mono font-semibold text-[9px]">
              GSTIN: {label.sellerGstin || '29AABCU9603R1ZM'}
            </div>
          </div>

          {/* Items Summary Table */}
          <div className="p-2 border-b border-black text-[10px] space-y-1">
            <div className="flex justify-between font-bold border-b border-zinc-200 pb-0.5">
              <span>Item / SKU Description</span>
              <span>Qty</span>
            </div>
            {Array.isArray(label.items) && label.items.length > 0 ? (
              label.items.slice(0, 3).map((item, i) => (
                <div key={i} className="flex justify-between text-zinc-800 text-[10px]">
                  <span className="truncate max-w-[260px]">
                    {item.title} {item.selectedSize ? `(${item.selectedSize})` : ''}
                  </span>
                  <span className="font-mono font-bold">× {item.quantity || 1}</span>
                </div>
              ))
            ) : (
              <div className="flex justify-between text-zinc-800">
                <span>Apparel / Performance Sportswear</span>
                <span className="font-mono font-bold">× 1</span>
              </div>
            )}
          </div>

          {/* Footer Notice & Routing Manifest Date */}
          <div className="pt-2 flex items-center justify-between text-[9px] text-zinc-600 font-mono">
            <span>Dimensions: {label.dimensions || '20x15x8 cm'}</span>
            <span>Manifest: {new Date(label.createdAt || Date.now()).toLocaleDateString('en-IN')}</span>
          </div>
          <div className="text-[8px] text-center text-zinc-500 pt-1">
            * Statutory e-Waybill compliant thermal parcel label. Pre-sorted for carrier scan.
          </div>
        </div>
      </div>
    </div>
  );
}
