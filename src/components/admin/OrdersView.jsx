import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  Search,
  Eye,
  FileText,
  Download,
  Loader2,
  Bell,
  CheckCircle2,
  Printer,
  Zap,
  Radio,
  RotateCw,
  MapPin,
  ExternalLink,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import GstInvoiceModal from './GstInvoiceModal';
import NotificationSettingsModal from './NotificationSettingsModal';
import ShippingLabelModal from './ShippingLabelModal';
import Gstr1ExportModal from './Gstr1ExportModal';
import { downloadInvoicePdf } from '../../utils/invoicePdfUtils';
import { apiClient } from '../../services/apiClient';

export default function OrdersView() {
  const { orders, fulfillOrder, activeStore, settings } = useStore();
  const [filter, setFilter] = useState('all'); // 'all' | 'unfulfilled' | 'fulfilled'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [customTracking, setCustomTracking] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState('Delhivery Surface Express');
  const [downloadingOrderId, setDownloadingOrderId] = useState(null);
  const [fulfilling, setFulfilling] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [fulfillmentAlert, setFulfillmentAlert] = useState(null);

  // Shipping Aggregator (Shiprocket / Delhivery) State
  const [shippingLabelData, setShippingLabelData] = useState(null);
  const [aggregatorType, setAggregatorType] = useState('delhivery'); // 'delhivery' | 'shiprocket'
  const [packageWeight, setPackageWeight] = useState(0.5);
  const [webhookSimulating, setWebhookSimulating] = useState(false);
  const [webhookSuccessMsg, setWebhookSuccessMsg] = useState(null);

  // GSTR-1 & Accounting Export Modal State
  const [isGstr1ModalOpen, setIsGstr1ModalOpen] = useState(false);

  const filteredOrders = orders.filter((ord) => {
    if (filter === 'unfulfilled') return ord.fulfillmentStatus === 'unfulfilled';
    if (filter === 'fulfilled') return ord.fulfillmentStatus === 'fulfilled';
    return true;
  });

  const handleFulfill = async (orderId) => {
    setFulfilling(true);
    const trackingCode = customTracking?.trim() || `APX-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const carrier = selectedCarrier || 'Blue Dart Express';

    try {
      await apiClient.fulfillOrderWithTracking(orderId, {
        trackingNumber: trackingCode,
        carrier
      }, activeStore?.id);

      fulfillOrder(orderId, trackingCode, carrier);
      setFulfillmentAlert({
        orderNumber: selectedOrder?.orderNumber,
        carrier,
        tracking: trackingCode
      });
      setTimeout(() => setFulfillmentAlert(null), 6000);
    } catch (err) {
      console.warn('Fulfillment dispatch error:', err);
      fulfillOrder(orderId, trackingCode, carrier);
    } finally {
      setFulfilling(false);
      setCustomTracking('');
      setSelectedOrder(null);
    }
  };

  // 1-Click Automated AWB Generation (Shiprocket / Delhivery)
  const handleGenerateAwb = async (order, customAggregator = null) => {
    setFulfilling(true);
    const agg = customAggregator || aggregatorType || 'delhivery';
    const carrierName = agg === 'shiprocket'
      ? 'Blue Dart Air (via Shiprocket)'
      : 'Delhivery Surface Express';

    try {
      const res = await apiClient.generateAwb(order.id, {
        aggregator: agg,
        carrierName,
        weightKg: packageWeight
      }, activeStore?.id);

      fulfillOrder(order.id, res.awbNumber, res.carrier);

      setFulfillmentAlert({
        orderNumber: order.orderNumber,
        carrier: res.carrier,
        tracking: res.awbNumber,
        aggregator: res.aggregator
      });

      if (res.label) {
        setShippingLabelData(res.label);
      }
      setTimeout(() => setFulfillmentAlert(null), 6000);
    } catch (err) {
      console.error('Failed to generate AWB:', err);
      alert('Could not push to shipping aggregator: ' + err.message);
    } finally {
      setFulfilling(false);
      setSelectedOrder(null);
    }
  };

  // View & Print 4x6 Thermal Shipping Label
  const handleOpenLabel = async (order) => {
    try {
      const label = await apiClient.getShippingLabel(order.id, activeStore?.id);
      if (label) {
        setShippingLabelData(label);
      } else {
        alert('Shipping label not found for this order. Generate AWB first.');
      }
    } catch (err) {
      console.error('Error fetching label:', err);
    }
  };

  // Live Courier Scan Webhook Simulator
  const handleSimulateWebhook = async (order, status) => {
    setWebhookSimulating(true);
    try {
      const payload = {
        awb: order.trackingNumber || order.awbNumber || `DLV-${order.id.slice(-6)}`,
        orderNumber: order.orderNumber,
        currentStatus: status,
        location: status === 'in_transit' ? 'Bangalore Sorting Hub' : status === 'out_for_delivery' ? 'Koramangala Delivery Hub' : 'Customer Address Handover',
        carrier: order.carrier || 'Delhivery',
        remarks: status === 'delivered' ? 'Delivered with OTP signature verification' : status === 'out_for_delivery' ? 'Package loaded in delivery van' : 'Package sorted at regional hub'
      };

      await apiClient.sendCarrierWebhook(payload, activeStore?.id);

      // Local update
      fulfillOrder(order.id, payload.awb, payload.carrier);
      setWebhookSuccessMsg(`Webhook received: Order updated to "${status.replace('_', ' ').toUpperCase()}"!`);
      setTimeout(() => setWebhookSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Webhook simulation failed:', err);
    } finally {
      setWebhookSimulating(false);
    }
  };

  const handleDirectDownload = async (order) => {
    setDownloadingOrderId(order.id);
    try {
      await downloadInvoicePdf({
        order,
        store: activeStore,
        settings
      });
    } catch (err) {
      console.error('Failed to download invoice PDF:', err);
    } finally {
      setDownloadingOrderId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Real-Time Dispatch Alert Toast */}
      {fulfillmentAlert && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-emerald-950">
                Order #{fulfillmentAlert.orderNumber} Fulfilled & Dispatched!
              </p>
              <p className="text-emerald-700 text-[11px]">
                Dispatched via <strong>{fulfillmentAlert.carrier}</strong> (AWB: <span className="font-mono">{fulfillmentAlert.tracking}</span>). Automated Dispatch Email & WhatsApp tracking alerts dispatched to customer.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsNotifModalOpen(true)}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] transition-colors"
          >
            View Audit Log
          </button>
        </div>
      )}

      {/* Filter Tabs & Notification Engine Shortcut */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-zinc-200">
        <div className="flex items-center space-x-2">
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsGstr1ModalOpen(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            title="Export government-compliant GSTR-1 tables (B2B, B2CS, HSN) and Tally/Zoho import files"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
            <span>GSTR-1 Monthly Return & Accounting Export</span>
          </button>

          <button
            onClick={() => setIsNotifModalOpen(true)}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 text-emerald-400" />
            <span>Notification Engine & Audit Log</span>
          </button>
        </div>
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
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {ord.fulfillmentStatus === 'unfulfilled' ? (
                        <button
                          onClick={() => handleGenerateAwb(ord, 'delhivery')}
                          disabled={fulfilling}
                          className="px-2.5 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs disabled:opacity-50"
                          title="1-Click Automated AWB Generation with Delhivery"
                        >
                          <Zap className="w-3 h-3 fill-current" />
                          <span>1-Click AWB</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenLabel(ord)}
                          className="px-2.5 py-1 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                          title="Print 4x6 Thermal Shipping Label"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Label</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDirectDownload(ord)}
                        disabled={downloadingOrderId === ord.id}
                        className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Direct Download GST Tax Invoice PDF"
                      >
                        {downloadingOrderId === ord.id ? (
                          <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />
                        ) : (
                          <Download className="w-3 h-3 text-indigo-600" />
                        )}
                        <span>{downloadingOrderId === ord.id ? 'PDF...' : 'Invoice'}</span>
                      </button>

                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="px-2.5 py-1 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </div>
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

            {/* GST Tax Invoice Actions (Download PDF + View / Print) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDirectDownload(selectedOrder)}
                disabled={downloadingOrderId === selectedOrder.id}
                className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-200 disabled:opacity-50"
              >
                {downloadingOrderId === selectedOrder.id ? (
                  <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                )}
                <span>{downloadingOrderId === selectedOrder.id ? 'Downloading...' : 'Download PDF'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInvoiceOrder(selectedOrder);
                }}
                className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-200"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>View & Print</span>
              </button>
            </div>

            {/* Fulfillment Action & Shipping Aggregator */}
            {selectedOrder.fulfillmentStatus === 'unfulfilled' ? (
              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                    <span>Shipping Aggregator (1-Click AWB & Label)</span>
                  </p>
                  <span className="text-[10px] font-extrabold uppercase text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full border border-amber-300">
                    Auto-Push
                  </span>
                </div>

                {/* Aggregator Selector Tabs */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAggregatorType('delhivery')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      aggregatorType === 'delhivery'
                        ? 'border-red-500 bg-red-50/80 shadow-xs ring-2 ring-red-500/20'
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-red-700">DELHIVERY</span>
                      <span className="text-[9px] font-bold uppercase bg-red-100 text-red-800 px-1.5 py-0.2 rounded">Surface</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Automated AWB + 4x6 Label</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAggregatorType('shiprocket')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      aggregatorType === 'shiprocket'
                        ? 'border-blue-500 bg-blue-50/80 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-700">SHIPROCKET</span>
                      <span className="text-[9px] font-bold uppercase bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">Blue Dart Air</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Air Cargo Priority Hub</p>
                  </button>
                </div>

                {/* Dead Weight & Box Dimensions */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Package Weight</label>
                    <div className="flex items-center gap-1 bg-white border border-amber-300 rounded-lg px-2.5 py-1.5">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={packageWeight}
                        onChange={(e) => setPackageWeight(parseFloat(e.target.value) || 0.5)}
                        className="w-full text-xs font-mono font-bold focus:outline-none"
                      />
                      <span className="text-[10px] text-zinc-400 font-bold">KG</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Dimensions (LxWxH)</label>
                    <div className="bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-zinc-700">
                      20 × 15 × 8 cm
                    </div>
                  </div>
                </div>

                {/* 1-Click Push to Aggregator Button */}
                <button
                  disabled={fulfilling}
                  onClick={() => handleGenerateAwb(selectedOrder, aggregatorType)}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-98"
                >
                  {fulfilling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 fill-white" />
                  )}
                  <span>
                    {fulfilling
                      ? 'Contacting Aggregator API...'
                      : `⚡ 1-Click Push to ${aggregatorType === 'shiprocket' ? 'Shiprocket' : 'Delhivery'} (Generate AWB & Label)`}
                  </span>
                </button>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-950">Fulfilled & Dispatched via {selectedOrder.carrier || 'Delhivery Express'}</span>
                      <p className="text-[11px] text-emerald-700 font-mono">
                        AWB: <strong>{selectedOrder.trackingNumber || selectedOrder.awbNumber}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Print 4x6 Label Button */}
                  <button
                    onClick={() => handleOpenLabel(selectedOrder)}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print 4×6 Label</span>
                  </button>
                </div>

                {/* Live Courier Tracking Webhook Simulator */}
                <div className="pt-3 border-t border-emerald-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                      <span>Live Courier Tracking Webhooks Simulator</span>
                    </span>
                    {webhookSimulating && <Loader2 className="w-3 h-3 text-emerald-700 animate-spin" />}
                  </div>

                  {webhookSuccessMsg && (
                    <div className="p-2 bg-emerald-100 border border-emerald-300 rounded-lg text-[11px] font-bold text-emerald-900 animate-fadeIn">
                      {webhookSuccessMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                    <button
                      type="button"
                      disabled={webhookSimulating}
                      onClick={() => handleSimulateWebhook(selectedOrder, 'in_transit')}
                      className="px-2 py-1.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-900 font-bold transition-colors cursor-pointer text-center"
                    >
                      📦 In-Transit
                    </button>
                    <button
                      type="button"
                      disabled={webhookSimulating}
                      onClick={() => handleSimulateWebhook(selectedOrder, 'out_for_delivery')}
                      className="px-2 py-1.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-amber-900 font-bold transition-colors cursor-pointer text-center"
                    >
                      🚚 Out for Delivery
                    </button>
                    <button
                      type="button"
                      disabled={webhookSimulating}
                      onClick={() => handleSimulateWebhook(selectedOrder, 'delivered')}
                      className="px-2 py-1.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-900 font-bold transition-colors cursor-pointer text-center"
                    >
                      ✅ Delivered
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4x6 Thermal Shipping Label Modal */}
      {shippingLabelData && (
        <ShippingLabelModal
          label={shippingLabelData}
          onClose={() => setShippingLabelData(null)}
        />
      )}

      {/* GST Tax Invoice Viewer & Print Modal */}
      {invoiceOrder && (
        <GstInvoiceModal
          order={invoiceOrder}
          store={activeStore}
          settings={settings}
          onClose={() => setInvoiceOrder(null)}
        />
      )}

      {/* Automated Notifications Modal */}
      <NotificationSettingsModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        storeId={activeStore?.id || 'store_apex'}
      />

      {/* GSTR-1 Monthly Return & Accounting Export Modal */}
      <Gstr1ExportModal
        isOpen={isGstr1ModalOpen}
        onClose={() => setIsGstr1ModalOpen(false)}
        orders={orders}
        store={activeStore}
      />
    </div>
  );
}
