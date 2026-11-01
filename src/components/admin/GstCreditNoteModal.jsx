import React, { useRef, useState } from 'react';
import { 
  X, Printer, Download, Building2, CheckCircle2, ShieldCheck, 
  MapPin, Phone, Mail, FileText, QrCode, Loader2, ArrowLeft, Truck
} from 'lucide-react';
import { numberToIndianWords } from '../../utils/gstUtils';

export default function GstCreditNoteModal({ creditNote, returnRequest, onClose }) {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!creditNote && !returnRequest?.creditNote) return null;

  const cn = creditNote || returnRequest?.creditNote;
  const gross = cn.totalCreditAmount || returnRequest?.totalRefundAmount || 3450;
  const taxable = cn.taxableAmountReversed || Math.round(gross / 1.18 * 100) / 100;
  const totalTax = cn.totalGstReversed || (gross - taxable);
  const words = numberToIndianWords(gross);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 150);
  };

  const handleDownload = () => {
    const el = document.getElementById('gst-credit-note-content');
    if (!el) return;
    const printWindow = window.open('', '', 'width=900,height=800');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${cn.creditNoteNumber} - GST Tax Credit Note</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #111; font-size: 12px; }
              table { width: 100%; border-collapse: collapse; margin-top: 12px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background: #f4f4f5; font-weight: bold; }
              .header { text-align: center; border-bottom: 2px solid #222; padding-bottom: 12px; }
              .flex { display: flex; justify-content: space-between; }
              .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: bold; background: #e0e7ff; color: #3730a3; }
              .total-box { margin-top: 16px; border: 1px solid #222; padding: 12px; }
            </style>
          </head>
          <body>
            ${el.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col my-auto max-h-[94vh]">
        
        {/* Top Control Bar */}
        <div className="px-6 py-3.5 bg-zinc-900 text-white flex items-center justify-between border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-mono">
                  {cn.creditNoteNumber}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  GST Rule 54 Compliant
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Official Indian Goods & Services Tax Credit Note & Reversal Memo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-zinc-50 font-sans">
          <div 
            id="gst-credit-note-content"
            className="bg-white p-6 sm:p-10 rounded-xl border border-zinc-200 shadow-sm space-y-6 max-w-3xl mx-auto text-xs text-zinc-800"
          >
            {/* Header */}
            <div className="border-b-2 border-zinc-900 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  FORM GST DRC-07 / RULE 54 CREDIT MEMO
                </span>
                <h1 className="text-xl font-black text-zinc-950 mt-1.5 uppercase tracking-tight">
                  TAX CREDIT NOTE
                </h1>
                <p className="text-[11px] text-zinc-500 font-semibold mt-0.5">
                  Original Invoice Reference: <strong className="font-mono text-zinc-900">{cn.originalInvoiceNumber}</strong> (Order: #{cn.originalOrderNumber})
                </p>
              </div>

              <div className="sm:text-right space-y-1">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Credit Note Details</p>
                <p className="text-sm font-black font-mono text-indigo-950">{cn.creditNoteNumber}</p>
                <p className="text-[11px] text-zinc-600 font-medium">Date: <strong>{cn.creditNoteDate}</strong></p>
                <p className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block border border-emerald-200">
                  ✓ Reversal Verified & Logged
                </p>
              </div>
            </div>

            {/* Seller & Buyer 2-Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-zinc-50/70 border border-zinc-200/80">
              {/* Seller */}
              <div className="space-y-1">
                <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">ISSUED BY (SUPPLIER)</p>
                <p className="font-bold text-sm text-zinc-950">{cn.sellerLegalName}</p>
                <p className="text-[11px] text-zinc-600">GSTIN: <strong className="font-mono text-zinc-900">{cn.sellerGstin}</strong></p>
                <p className="text-[11px] text-zinc-600">State / Code: <strong>{cn.sellerStateName} ({cn.sellerStateCode})</strong></p>
                <p className="text-[11px] text-zinc-600">India Registered E-Commerce Operator</p>
              </div>

              {/* Buyer */}
              <div className="space-y-1 sm:border-l sm:border-zinc-200/80 sm:pl-6">
                <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">CREDITED TO (BUYER)</p>
                <p className="font-bold text-sm text-zinc-950">{cn.buyerName}</p>
                <p className="text-[11px] text-zinc-600 font-mono">{cn.buyerEmail}</p>
                {cn.buyerGstin ? (
                  <p className="text-[11px] text-zinc-600">Buyer GSTIN: <strong className="font-mono text-indigo-700">{cn.buyerGstin}</strong></p>
                ) : (
                  <p className="text-[11px] text-zinc-500">Consumer (B2C Reverse Memo)</p>
                )}
                <p className="text-[11px] text-zinc-600">Buyer State Code: <strong>State {cn.buyerStateCode}</strong></p>
              </div>
            </div>

            {/* Reason for Reversal */}
            <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200/80 text-amber-950">
              <span className="font-bold">Reason for Issuance:</span> {cn.reason}
              {returnRequest?.fitInsight && (
                <p className="text-[11px] text-amber-800 mt-0.5">
                  <strong>Fit Diagnostics:</strong> {returnRequest.fitInsight}
                </p>
              )}
            </div>

            {/* Credited Items Table */}
            <div className="overflow-x-auto rounded-xl border border-zinc-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-zinc-100/80 text-zinc-600 font-bold border-b border-zinc-200">
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3">HSN</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Credit Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-sans">
                  {(cn.items || []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50">
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-zinc-900">{item.title}</p>
                        <p className="text-[10px] text-zinc-500">{item.variantTitle} {item.exchangeVariant ? `→ Exchange to ${item.exchangeVariant}` : ''}</p>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-600">6109</td>
                      <td className="py-2.5 px-3 text-center font-mono">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono">₹{item.price?.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Reversal Tax Summary Breakdown */}
            <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
              <div className="space-y-3 sm:max-w-xs">
                <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-[11px] space-y-1">
                  <p className="font-bold text-zinc-900">Reverse Logistics Details:</p>
                  <p className="text-zinc-600">Courier: <strong>{returnRequest?.pickupCourier || 'Delhivery Reverse Logistics'}</strong></p>
                  <p className="text-zinc-600">Reverse AWB: <strong className="font-mono">{returnRequest?.pickupTrackingNumber || 'DEL-REV-98273614'}</strong></p>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                  Pursuant to Section 34 of the CGST Act 2017, this Credit Note confirms input tax adjustment and reduction of supplier tax liability.
                </p>
              </div>

              {/* Tax Calculations Column */}
              <div className="w-full sm:w-72 space-y-2 font-mono text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Gross Refund Reversal:</span>
                  <span className="font-bold">₹{gross.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Taxable Value (Reversed):</span>
                  <span>₹{taxable.toFixed(2)}</span>
                </div>

                {cn.sellerStateCode === cn.buyerStateCode ? (
                  <>
                    <div className="flex justify-between text-zinc-600">
                      <span>CGST (9% Reversed):</span>
                      <span>₹{(cn.cgstReversed || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>SGST (9% Reversed):</span>
                      <span>₹{(cn.sgstReversed || 0).toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-zinc-600">
                    <span>IGST (18% Reversed):</span>
                    <span>₹{(cn.igstReversed || totalTax).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-zinc-600 border-t border-zinc-200 pt-1">
                  <span>Total Tax Reversal:</span>
                  <span className="font-bold">₹{totalTax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm font-black text-indigo-950 border-t-2 border-zinc-900 pt-2 bg-indigo-50/60 p-2 rounded-lg">
                  <span>NET CREDIT AMOUNT:</span>
                  <span>₹{gross.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Amount In Words */}
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs">
              <span className="text-zinc-500 font-semibold">Total Credit Amount in Words:</span>
              <p className="font-bold text-zinc-900 capitalize mt-0.5">{words}</p>
            </div>

            {/* Footer Signature Block */}
            <div className="pt-6 border-t border-zinc-200 flex justify-between items-end text-[11px] text-zinc-500">
              <div>
                <p className="font-bold text-zinc-800">Apex Commerce Digital Invoicing System</p>
                <p>Rule 54 CGST Rules, 2017 compliant electronic memo</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-zinc-900">For {cn.sellerLegalName}</p>
                <p className="mt-8 font-mono text-[10px] text-zinc-400">Authorized Digital Signatory</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

