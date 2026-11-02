import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Building,
  CheckCircle,
  AlertCircle,
  X,
  Layers,
  Database,
  Table,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Code2,
  ExternalLink
} from 'lucide-react';
import {
  filterOrdersByPeriod,
  computeGstr1Data,
  exportGstr1B2bCsv,
  exportGstr1B2csCsv,
  exportGstr1HsnCsv,
  exportCompleteGstr1Package,
  exportTallyPrimeXml,
  exportZohoBooksCsv
} from '../../utils/gstr1ExportEngine';

export default function Gstr1ExportModal({ isOpen, onClose, orders = [], store = {} }) {
  const [period, setPeriod] = useState('current_month'); // 'current_month' | 'last_month' | 'quarter' | 'all'
  const [activeTab, setActiveTab] = useState('b2b'); // 'b2b' | 'b2cl' | 'b2cs' | 'hsn' | 'accounting'
  const [exportSuccessMsg, setExportSuccessMsg] = useState(null);

  // Compute GSTR-1 and filtered dataset
  const filteredOrders = useMemo(() => {
    return filterOrdersByPeriod(orders, period);
  }, [orders, period]);

  const gstr1Data = useMemo(() => {
    return computeGstr1Data(filteredOrders, store);
  }, [filteredOrders, store]);

  if (!isOpen) return null;

  const periodLabel = period === 'current_month' ? '2026-11' : period === 'last_month' ? '2026-10' : 'Q4-2026';

  const triggerExport = (actionName, exportFn) => {
    try {
      exportFn();
      setExportSuccessMsg(`${actionName} exported successfully!`);
      setTimeout(() => setExportSuccessMsg(null), 4000);
    } catch (e) {
      console.error(e);
      alert('Export failed: ' + e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-zinc-200 space-y-5 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900">
                  GSTR-1 Monthly Return & Accounting Export
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                  GST Rule 59
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Official government-compliant tables for GST portal upload and 1-click Tally Prime / Zoho Books import.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Period Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-zinc-100 border border-zinc-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-zinc-700">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-transparent focus:outline-none font-bold text-zinc-900 cursor-pointer"
              >
                <option value="current_month">November 2026 (Current)</option>
                <option value="last_month">October 2026 (Previous)</option>
                <option value="quarter">Q4 2026 (Quarterly Filing)</option>
                <option value="all">All Available Orders</option>
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {exportSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs text-emerald-900 font-bold animate-fadeIn shrink-0">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportSuccessMsg}</span>
          </div>
        )}

        {/* Statutory Metric Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Total Outward Supplies</span>
            <div className="text-lg font-black font-mono text-zinc-900 mt-0.5">
              ₹{gstr1Data.totalGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-zinc-400 mt-0.5 block">{gstr1Data.periodOrdersCount} Orders in period</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Total Taxable Value</span>
            <div className="text-lg font-black font-mono text-zinc-900 mt-0.5">
              ₹{gstr1Data.totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-zinc-400 mt-0.5 block">Net base before GST</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Total GST Collected</span>
            <div className="text-lg font-black font-mono text-emerald-900 mt-0.5">
              ₹{gstr1Data.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] font-mono font-semibold text-emerald-700 mt-0.5">
              CGST: ₹{gstr1Data.totalCgst.toFixed(0)} | SGST: ₹{gstr1Data.totalSgst.toFixed(0)} | IGST: ₹{gstr1Data.totalIgst.toFixed(0)}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Supplier GSTIN</span>
            <div className="text-sm font-black font-mono text-zinc-900 mt-1 truncate" title={gstr1Data.sellerGstin}>
              {gstr1Data.sellerGstin}
            </div>
            <span className="text-[10px] text-zinc-400 mt-0.5 block">State: {store?.stateName || 'Karnataka (29)'}</span>
          </div>
        </div>

        {/* 1-Click Fast Action Export Buttons Bar */}
        <div className="p-3.5 rounded-2xl bg-zinc-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold">1-Click Downloads for Government Portal & Accountants:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => triggerExport('Complete GSTR-1 Master Filing', () => exportCompleteGstr1Package(gstr1Data, periodLabel))}
              className="px-3 py-1.5 bg-[#008060] hover:bg-[#006e52] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              title="Download Master CSV containing B2B, B2CS, and HSN Summary"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Full GSTR-1 (All Tables)</span>
            </button>

            <button
              onClick={() => triggerExport('Tally Prime Sales XML', () => exportTallyPrimeXml(filteredOrders, store, periodLabel))}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              title="Direct import XML voucher for Tally Prime"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Tally Prime XML</span>
            </button>

            <button
              onClick={() => triggerExport('Zoho Books Invoices CSV', () => exportZohoBooksCsv(filteredOrders, store, periodLabel))}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              title="Import CSV format for Zoho Books"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Zoho Books CSV</span>
            </button>
          </div>
        </div>

        {/* Table Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs border-b border-zinc-200 pb-1 shrink-0">
          {[
            { id: 'b2b', label: 'Table 4: B2B Invoices', count: gstr1Data.b2bList.length },
            { id: 'b2cs', label: 'Table 7: B2C Small Supplies', count: gstr1Data.b2csList.length },
            { id: 'hsn', label: 'Table 12: HSN Summary', count: gstr1Data.hsnList.length },
            { id: 'accounting', label: '📊 Tally & Zoho Preview', count: null }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === tab.id ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-200 text-zinc-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table Data Preview Container */}
        <div className="flex-1 overflow-y-auto border border-zinc-200 rounded-2xl bg-zinc-50/50">
          {/* TAB 1: B2B INVOICES */}
          {activeTab === 'b2b' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-zinc-900">Table 4: Registered B2B Invoices</h4>
                  <p className="text-[11px] text-zinc-500">Sales made to customers who provided their GSTIN for Input Tax Credit (ITC).</p>
                </div>
                <button
                  onClick={() => triggerExport('B2B Table 4 CSV', () => exportGstr1B2bCsv(gstr1Data, periodLabel))}
                  className="px-3 py-1 bg-white hover:bg-zinc-100 border border-zinc-300 rounded-lg text-xs font-bold text-zinc-800 shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Table 4 CSV</span>
                </button>
              </div>

              {gstr1Data.b2bList.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400">
                  No B2B orders with GSTIN recorded in this period.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-500 uppercase border-b border-zinc-200">
                      <tr>
                        <th className="py-2.5 px-3">Buyer GSTIN</th>
                        <th className="py-2.5 px-3">Trade Name</th>
                        <th className="py-2.5 px-3">Invoice No</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Place of Supply</th>
                        <th className="py-2.5 px-3 text-right">Taxable</th>
                        <th className="py-2.5 px-3 text-right">CGST</th>
                        <th className="py-2.5 px-3 text-right">SGST</th>
                        <th className="py-2.5 px-3 text-right">IGST</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-mono text-[11px]">
                      {gstr1Data.b2bList.map((row, i) => (
                        <tr key={i} className="hover:bg-zinc-50/60">
                          <td className="py-2 px-3 font-bold text-emerald-800">{row.gstinRecipient}</td>
                          <td className="py-2 px-3 font-sans text-zinc-800 font-semibold">{row.receiverName}</td>
                          <td className="py-2 px-3 text-zinc-700">{row.invoiceNumber}</td>
                          <td className="py-2 px-3 text-zinc-500">{row.invoiceDate}</td>
                          <td className="py-2 px-3 text-zinc-600 font-sans">{row.placeOfSupply}</td>
                          <td className="py-2 px-3 text-right">₹{row.taxableValue.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right text-indigo-700">₹{row.cgst.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right text-indigo-700">₹{row.sgst.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right text-indigo-700">₹{row.igst.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-bold text-zinc-900">₹{row.invoiceValue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: B2C SMALL */}
          {activeTab === 'b2cs' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-zinc-900">Table 7: B2C Small Supplies</h4>
                  <p className="text-[11px] text-zinc-500">Retail consumer orders aggregated by Place of Supply (POS) and Tax Rate slab.</p>
                </div>
                <button
                  onClick={() => triggerExport('B2CS Table 7 CSV', () => exportGstr1B2csCsv(gstr1Data, periodLabel))}
                  className="px-3 py-1 bg-white hover:bg-zinc-100 border border-zinc-300 rounded-lg text-xs font-bold text-zinc-800 shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Table 7 CSV</span>
                </button>
              </div>

              {gstr1Data.b2csList.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400">
                  No B2C small orders in this period.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-500 uppercase border-b border-zinc-200">
                      <tr>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Place of Supply</th>
                        <th className="py-2.5 px-3 text-right">Rate Slab</th>
                        <th className="py-2.5 px-3 text-right">Taxable Value</th>
                        <th className="py-2.5 px-3">E-Commerce GSTIN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-mono text-[11px]">
                      {gstr1Data.b2csList.map((row, i) => (
                        <tr key={i} className="hover:bg-zinc-50/60">
                          <td className="py-2 px-3 font-bold text-blue-700">{row.type === 'E' ? 'E-Commerce' : 'Direct'}</td>
                          <td className="py-2 px-3 font-sans font-bold text-zinc-800">{row.placeOfSupply}</td>
                          <td className="py-2 px-3 text-right">{row.rate}%</td>
                          <td className="py-2 px-3 text-right font-bold text-zinc-900">₹{row.taxableValue.toFixed(2)}</td>
                          <td className="py-2 px-3 text-zinc-600 font-sans">{row.ecommerceGstin || gstr1Data.sellerGstin}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HSN SUMMARY */}
          {activeTab === 'hsn' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-zinc-900">Table 12: HSN Summary of Outward Supplies</h4>
                  <p className="text-[11px] text-zinc-500">Commodity code classification with units and taxable tax breakdowns.</p>
                </div>
                <button
                  onClick={() => triggerExport('HSN Table 12 CSV', () => exportGstr1HsnCsv(gstr1Data, periodLabel))}
                  className="px-3 py-1 bg-white hover:bg-zinc-100 border border-zinc-300 rounded-lg text-xs font-bold text-zinc-800 shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Table 12 CSV</span>
                </button>
              </div>

              {gstr1Data.hsnList.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400">
                  No product line items in this period.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-500 uppercase border-b border-zinc-200">
                      <tr>
                        <th className="py-2.5 px-3">HSN Code</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-right">UQC</th>
                        <th className="py-2.5 px-3 text-right">Total Qty</th>
                        <th className="py-2.5 px-3 text-right">Total Value</th>
                        <th className="py-2.5 px-3 text-right">Taxable Value</th>
                        <th className="py-2.5 px-3 text-right">IGST</th>
                        <th className="py-2.5 px-3 text-right">CGST</th>
                        <th className="py-2.5 px-3 text-right">SGST</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-mono text-[11px]">
                      {gstr1Data.hsnList.map((row, i) => (
                        <tr key={i} className="hover:bg-zinc-50/60">
                          <td className="py-2 px-3 font-bold text-emerald-800">{row.hsn}</td>
                          <td className="py-2 px-3 font-sans text-zinc-800 font-semibold">{row.description}</td>
                          <td className="py-2 px-3 text-right">{row.uqc}</td>
                          <td className="py-2 px-3 text-right font-bold">{row.totalQty}</td>
                          <td className="py-2 px-3 text-right">₹{row.totalValue.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-bold text-zinc-900">₹{row.taxableValue.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right text-indigo-700">₹{row.igst.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right text-indigo-700">₹{row.cgst.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right text-indigo-700">₹{row.sgst.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TALLY & ZOHO PREVIEW */}
          {activeTab === 'accounting' && (
            <div className="p-4 space-y-4">
              <div>
                <h4 className="font-bold text-zinc-900 text-xs">Automated ERP / Accounting Ledgers Mapping</h4>
                <p className="text-[11px] text-zinc-500">Automated double-entry voucher generation for Tally Prime and Zoho Books.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tally Card */}
                <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-blue-950 flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-blue-600" />
                      Tally Prime Sales Voucher (XML)
                    </span>
                    <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      Tally XML Format
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600">
                    Imports directly via <strong>Tally Prime &gt; Import Data &gt; Vouchers</strong>. Automatically maps Party Ledger, Sales 18% Account, Output CGST, and Output SGST/IGST.
                  </p>
                  <button
                    onClick={() => triggerExport('Tally XML', () => exportTallyPrimeXml(filteredOrders, store, periodLabel))}
                    className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Tally Prime XML</span>
                  </button>
                </div>

                {/* Zoho Card */}
                <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-600" />
                      Zoho Books Invoices (CSV)
                    </span>
                    <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Zoho Schema
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600">
                    Imports directly via <strong>Zoho Books &gt; Sales &gt; Invoices &gt; Import Invoices</strong>. Includes SKU, HSN/SAC, Place of Supply, and GSTIN.
                  </p>
                  <button
                    onClick={() => triggerExport('Zoho Books CSV', () => exportZohoBooksCsv(filteredOrders, store, periodLabel))}
                    className="w-full py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Zoho Books CSV</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

