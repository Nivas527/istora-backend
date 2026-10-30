import React, { useRef } from 'react';
import { 
  X, Printer, Download, Building2, CheckCircle2, ShieldCheck, 
  MapPin, Phone, Mail, FileText, QrCode 
} from 'lucide-react';
import { 
  calculateGstTax, 
  numberToIndianWords, 
  resolveStateCode, 
  INDIAN_GST_STATES 
} from '../../utils/gstUtils';

export default function GstInvoiceModal({ order, store, settings, onClose }) {
  const invoiceRef = useRef(null);

  if (!order) return null;

  // Resolve store & merchant configuration
  const merchantGstin = store?.gstin || settings?.gstin || '29AABCU9603R1ZM';
  const legalName = store?.legalBusinessName || settings?.legalBusinessName || store?.name || settings?.storeName || 'Apex Commerce India Pvt. Ltd.';
  const tradeName = store?.name || settings?.storeName || 'Apex Athletics & Co.';
  const merchantStateCode = store?.stateCode || settings?.stateCode || merchantGstin.substring(0, 2) || '29';
  const defaultHsn = store?.defaultHsnCode || settings?.defaultHsnCode || '6109';
  const defaultGstRate = typeof store?.gstRatePercent === 'number' ? store.gstRatePercent : (typeof settings?.gstRatePercent === 'number' ? settings.gstRatePercent : 18);
  const pricesIncludeGst = store?.pricesIncludeGst ?? settings?.pricesIncludeGst ?? false;

  // Resolve customer & order details
  const customerName = order.customer?.firstName 
    ? `${order.customer.firstName} ${order.customer.lastName || ''}`.trim() 
    : (order.customerName || 'Customer');
  const customerEmail = order.customer?.email || order.customerEmail || 'support@apexcommerce.com';
  const customerPhone = order.customer?.phone || '+91 98765 43210';
  const customerAddress = order.customer?.address || '124, 4th Main, Indiranagar';
  const customerCity = order.customer?.city || 'Bengaluru';
  const customerZip = order.customer?.zip || '560038';
  const customerState = order.customer?.state || 'Karnataka';

  const buyerStateCode = order.buyerStateCode || resolveStateCode(customerState);
  const isB2B = Boolean(order.isB2B || order.customerGstin);
  const customerGstin = order.customerGstin || (isB2B ? '29BBBCU8472P1ZK' : null);
  const customerCompanyName = order.customerCompanyName || (isB2B ? `${customerName} Enterprises` : null);

  const invoiceNumber = order.invoiceNumber || `INV-${new Date(order.createdAt || Date.now()).getFullYear()}-${order.orderNumber?.replace(/[^0-9]/g, '') || '1001'}`;
  const invoiceDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // Calculate GST Breakdown
  const gstData = calculateGstTax({
    items: order.items || [],
    merchantStateCode,
    buyerStateCode,
    defaultGstRate,
    pricesIncludeGst,
    shippingFee: order.shippingCost || 0,
    discountAmount: order.discountAmount || 0
  });

  const totalAmount = order.total || gstData.netPayable;
  const amountInWords = numberToIndianWords(totalAmount);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white animate-fadeIn">
      <div className="relative bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-zinc-200 overflow-hidden my-6 print:m-0 print:border-none print:shadow-none">
        
        {/* Action Header (Hidden in Print) */}
        <div className="bg-zinc-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">GST Tax Invoice</h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                  isB2B ? 'bg-purple-900/40 text-purple-300 border-purple-700/50' : 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50'
                }`}>
                  {isB2B ? 'B2B (ITC Claimable)' : 'B2C Supply'}
                </span>
                <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
                  {gstData.supplyType}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Rule 46 Tax Invoice compliant • Invoice No: {invoiceNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#008060] hover:bg-[#006e52] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Tax Invoice</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* Printable Tax Invoice Sheet (A4 Compliant Layout)               */}
        {/* ============================================================== */}
        <div ref={invoiceRef} className="p-6 sm:p-8 bg-white text-zinc-900 text-xs font-sans space-y-5 print:p-4">
          
          {/* Header Title & Tax Invoice Declaration */}
          <div className="border-b-2 border-zinc-900 pb-3 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950 uppercase flex items-center gap-2">
                <span>TAX INVOICE</span>
              </h1>
              <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                (Issued under Section 31 of the CGST Act, 2017 read with Rule 46 of CGST Rules, 2017)
              </p>
              <p className="text-[11px] font-semibold text-emerald-800 mt-1">
                Original for Recipient • Reverse Charge: <strong>NO</strong>
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <div className="inline-block bg-zinc-100 border border-zinc-300 rounded px-2.5 py-1">
                <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Invoice Number</span>
                <span className="text-xs font-black font-mono text-zinc-900">{invoiceNumber}</span>
              </div>
              <p className="text-[11px] text-zinc-600">
                Invoice Date: <strong className="text-zinc-900">{invoiceDate}</strong>
              </p>
              <p className="text-[11px] text-zinc-600">
                Place of Supply: <strong className="text-zinc-900">{gstData.buyerState.name} ({gstData.buyerState.code})</strong>
              </p>
            </div>
          </div>

          {/* Supplier & Recipient 2-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-zinc-300 rounded-lg p-3 bg-zinc-50/50">
            {/* Supplier / Seller Details */}
            <div className="space-y-1 sm:border-r sm:border-zinc-200 sm:pr-4">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Details of Supplier (Billed From)
              </span>
              <p className="text-sm font-black text-zinc-900">{legalName}</p>
              {tradeName !== legalName && (
                <p className="text-xs text-zinc-600 font-semibold">Trade Name: {tradeName}</p>
              )}
              <p className="text-[11px] text-zinc-600 leading-tight">
                Registered Office: Tech Park, Indiranagar, Bengaluru, {gstData.merchantState.name} - 560038
              </p>
              <div className="pt-1 space-y-0.5">
                <p className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                  GSTIN: {merchantGstin}
                </p>
                <p className="text-[11px] text-zinc-600">
                  State: <strong>{gstData.merchantState.name}</strong> • State Code: <strong>{gstData.merchantState.code}</strong>
                </p>
                <p className="text-[11px] text-zinc-600">
                  Email: {settings?.contactEmail || 'accounts@istora.online'} • PAN: <strong>{merchantGstin.substring(2, 12)}</strong>
                </p>
              </div>
            </div>

            {/* Recipient / Customer Details */}
            <div className="space-y-1 sm:pl-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Details of Recipient (Billed & Shipped To)
                </span>
                {isB2B && (
                  <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200">
                    B2B Registered
                  </span>
                )}
              </div>
              <p className="text-sm font-black text-zinc-900">
                {isB2B && customerCompanyName ? customerCompanyName : customerName}
              </p>
              {isB2B && (
                <p className="text-[11px] text-zinc-600 font-semibold">Contact: {customerName}</p>
              )}
              <p className="text-[11px] text-zinc-600 leading-tight">
                {customerAddress}, {customerCity}, {customerState} - {customerZip}
              </p>
              <div className="pt-1 space-y-0.5">
                {customerGstin ? (
                  <p className="text-xs font-mono font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-block">
                    Customer GSTIN: {customerGstin}
                  </p>
                ) : (
                  <p className="text-[11px] text-zinc-500 italic">
                    Consumer / Unregistered Person (B2C)
                  </p>
                )}
                <p className="text-[11px] text-zinc-600">
                  State of Supply: <strong>{customerState}</strong> • State Code: <strong>{gstData.buyerState.code}</strong>
                </p>
                <p className="text-[11px] text-zinc-600">
                  Email: {customerEmail} • Phone: {customerPhone}
                </p>
              </div>
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <div className="border border-zinc-300 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-900 text-white font-bold text-[10px] uppercase">
                  <th className="py-2.5 px-2 border-r border-zinc-700 w-8 text-center">#</th>
                  <th className="py-2.5 px-3 border-r border-zinc-700">Description of Goods</th>
                  <th className="py-2.5 px-2 border-r border-zinc-700 text-center w-16">HSN/SAC</th>
                  <th className="py-2.5 px-2 border-r border-zinc-700 text-center w-10">Qty</th>
                  <th className="py-2.5 px-2 border-r border-zinc-700 text-right w-16">Rate (₹)</th>
                  <th className="py-2.5 px-2 border-r border-zinc-700 text-right w-20">Taxable Value</th>
                  {gstData.isIntraState ? (
                    <>
                      <th className="py-2.5 px-2 border-r border-zinc-700 text-right w-16">CGST (₹)</th>
                      <th className="py-2.5 px-2 border-r border-zinc-700 text-right w-16">SGST (₹)</th>
                    </>
                  ) : (
                    <th className="py-2.5 px-2 border-r border-zinc-700 text-right w-20">IGST (₹)</th>
                  )}
                  <th className="py-2.5 px-3 text-right w-20">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-[11px]">
                {gstData.items.map((item) => (
                  <tr key={item.sNo} className="hover:bg-zinc-50/50">
                    <td className="py-2 px-2 text-center text-zinc-500 border-r border-zinc-200">{item.sNo}</td>
                    <td className="py-2 px-3 border-r border-zinc-200">
                      <p className="font-bold text-zinc-900">{item.title}</p>
                      {item.variantTitle && (
                        <p className="text-[10px] text-zinc-500">{item.variantTitle} • SKU: {item.sku}</p>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center font-mono font-semibold border-r border-zinc-200">{item.hsn}</td>
                    <td className="py-2 px-2 text-center font-bold border-r border-zinc-200">{item.quantity}</td>
                    <td className="py-2 px-2 text-right font-mono border-r border-zinc-200">₹{item.unitPrice.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right font-mono font-bold border-r border-zinc-200">₹{item.taxableValue.toFixed(2)}</td>
                    {gstData.isIntraState ? (
                      <>
                        <td className="py-2 px-2 text-right font-mono border-r border-zinc-200">
                          <span>₹{item.cgstAmt.toFixed(2)}</span>
                          <span className="text-[9px] text-zinc-400 block">({item.cgstRate}%)</span>
                        </td>
                        <td className="py-2 px-2 text-right font-mono border-r border-zinc-200">
                          <span>₹{item.sgstAmt.toFixed(2)}</span>
                          <span className="text-[9px] text-zinc-400 block">({item.sgstRate}%)</span>
                        </td>
                      </>
                    ) : (
                      <td className="py-2 px-2 text-right font-mono border-r border-zinc-200">
                        <span>₹{item.igstAmt.toFixed(2)}</span>
                        <span className="text-[9px] text-zinc-400 block">({item.igstRate}%)</span>
                      </td>
                    )}
                    <td className="py-2 px-3 text-right font-mono font-black text-zinc-900">₹{item.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}

                {/* Shipping Line Item if present */}
                {gstData.shippingFee > 0 && (
                  <tr className="bg-zinc-50/50">
                    <td className="py-2 px-2 text-center text-zinc-500 border-r border-zinc-200">•</td>
                    <td className="py-2 px-3 border-r border-zinc-200 font-semibold text-zinc-700">
                      Standard Express Shipping & Handling
                    </td>
                    <td className="py-2 px-2 text-center font-mono border-r border-zinc-200">9968</td>
                    <td className="py-2 px-2 text-center font-bold border-r border-zinc-200">1</td>
                    <td className="py-2 px-2 text-right font-mono border-r border-zinc-200">₹{gstData.shippingFee.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right font-mono font-bold border-r border-zinc-200">₹{gstData.shippingFee.toFixed(2)}</td>
                    {gstData.isIntraState ? (
                      <>
                        <td className="py-2 px-2 text-right font-mono border-r border-zinc-200">Included</td>
                        <td className="py-2 px-2 text-right font-mono border-r border-zinc-200">Included</td>
                      </>
                    ) : (
                      <td className="py-2 px-2 text-right font-mono border-r border-zinc-200">Included</td>
                    )}
                    <td className="py-2 px-3 text-right font-mono font-bold">₹{gstData.shippingFee.toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* HSN Tax Summary Table + Net Financial Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            
            {/* HSN-Wise Summary Box (Left) */}
            <div className="sm:col-span-7 space-y-3">
              <div className="border border-zinc-300 rounded-lg overflow-hidden">
                <div className="bg-zinc-100 px-3 py-1.5 border-b border-zinc-300 font-bold text-[10px] text-zinc-700 uppercase">
                  HSN / SAC Tax Liability Summary
                </div>
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 text-zinc-500 font-semibold border-b border-zinc-200">
                      <th className="py-1 px-2 border-r border-zinc-200">HSN</th>
                      <th className="py-1 px-2 border-r border-zinc-200 text-right">Taxable (₹)</th>
                      {gstData.isIntraState ? (
                        <>
                          <th className="py-1 px-2 border-r border-zinc-200 text-right">CGST (₹)</th>
                          <th className="py-1 px-2 border-r border-zinc-200 text-right">SGST (₹)</th>
                        </>
                      ) : (
                        <th className="py-1 px-2 border-r border-zinc-200 text-right">IGST (₹)</th>
                      )}
                      <th className="py-1 px-2 text-right font-bold">Tax Amt (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {gstData.hsnSummary.map((hsn) => (
                      <tr key={hsn.hsn}>
                        <td className="py-1.5 px-2 font-mono font-bold border-r border-zinc-200">{hsn.hsn}</td>
                        <td className="py-1.5 px-2 text-right font-mono border-r border-zinc-200">₹{hsn.taxableValue.toFixed(2)}</td>
                        {gstData.isIntraState ? (
                          <>
                            <td className="py-1.5 px-2 text-right font-mono border-r border-zinc-200">₹{hsn.cgstAmt.toFixed(2)}</td>
                            <td className="py-1.5 px-2 text-right font-mono border-r border-zinc-200">₹{hsn.sgstAmt.toFixed(2)}</td>
                          </>
                        ) : (
                          <td className="py-1.5 px-2 text-right font-mono border-r border-zinc-200">₹{hsn.igstAmt.toFixed(2)}</td>
                        )}
                        <td className="py-1.5 px-2 text-right font-mono font-bold text-zinc-900">₹{hsn.totalTax.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Amount in words */}
              <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Total Amount in Words:</span>
                <p className="text-xs font-bold text-zinc-900 mt-0.5">{amountInWords}</p>
              </div>

              {/* Bank Details */}
              <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200 text-[10px] space-y-0.5 text-zinc-600">
                <span className="font-bold text-zinc-800 uppercase block">Bank Details for Electronic Remittance:</span>
                <p>Bank Name: <strong>HDFC Bank Ltd.</strong> • Account Name: <strong>{legalName}</strong></p>
                <p>Account Number: <strong className="font-mono">50200084729104</strong> • IFSC Code: <strong className="font-mono">HDFC0001248</strong></p>
                <p>UPI ID: <strong className="font-mono">apexcommerce@hdfcbank</strong></p>
              </div>
            </div>

            {/* Calculations Box (Right) */}
            <div className="sm:col-span-5 bg-zinc-50/80 border border-zinc-300 rounded-lg p-3.5 flex flex-col justify-between">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Gross Taxable Amount</span>
                  <span className="font-mono font-bold text-zinc-900">₹{gstData.taxableValue.toFixed(2)}</span>
                </div>

                {gstData.isIntraState ? (
                  <>
                    <div className="flex justify-between text-zinc-600">
                      <span>Central Tax (CGST)</span>
                      <span className="font-mono text-zinc-900">₹{gstData.totalCgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>State Tax (SGST)</span>
                      <span className="font-mono text-zinc-900">₹{gstData.totalSgst.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-zinc-600">
                    <span>Integrated Tax (IGST)</span>
                    <span className="font-mono text-zinc-900">₹{gstData.totalIgst.toFixed(2)}</span>
                  </div>
                )}

                {gstData.shippingFee > 0 && (
                  <div className="flex justify-between text-zinc-600">
                    <span>Shipping Charges</span>
                    <span className="font-mono text-zinc-900">₹{gstData.shippingFee.toFixed(2)}</span>
                  </div>
                )}

                {gstData.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount Coupon</span>
                    <span className="font-mono">-₹{gstData.discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-300 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-black text-zinc-950 block">Grand Total</span>
                    <span className="text-[10px] text-zinc-400">Inclusive of all taxes</span>
                  </div>
                  <span className="text-lg font-black font-mono text-emerald-800">
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Authorized Signatory Box */}
              <div className="pt-4 mt-4 border-t border-dashed border-zinc-300 text-center space-y-1">
                <div className="h-10 flex items-center justify-center">
                  <span className="font-serif italic text-base text-zinc-800 font-bold tracking-wide">
                    {store?.authorizedSignatory || 'Apex Commerce Authority'}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 uppercase font-semibold">Authorized Signatory</p>
                <p className="text-[9px] text-zinc-400">Electronically generated tax invoice under IT Act, 2000</p>
              </div>
            </div>
          </div>

          {/* Legal Terms & Conditions Footer */}
          <div className="pt-3 border-t border-zinc-200 text-[9px] text-zinc-400 leading-normal space-y-0.5">
            <p className="font-bold text-zinc-600 uppercase">Terms & Conditions:</p>
            <p>1. Goods once sold can be exchanged within 7 days in accordance with the store returns policy.</p>
            <p>2. In case of registered B2B transactions, Input Tax Credit (ITC) can be availed against valid GSTIN matching with GSTR-2B.</p>
            <p>3. Any dispute arising out of this invoice shall be subject to the exclusive jurisdiction of the courts in {gstData.merchantState.name}.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
