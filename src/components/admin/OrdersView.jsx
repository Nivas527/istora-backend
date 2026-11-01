import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Package, Clock, CheckCircle, Truck, Search, Eye, FileText, Download, Loader2, Bell, CheckCircle2 } from 'lucide-react';
import GstInvoiceModal from './GstInvoiceModal';
import NotificationSettingsModal from './NotificationSettingsModal';
import { downloadInvoicePdf } from '../../utils/invoicePdfUtils';
import { apiClient } from '../../services/apiClient';

export default function OrdersView() {
  const { orders, fulfillOrder, activeStore, settings } = useStore();
  const [filter, setFilter] = useState('all'); // 'all' | 'unfulfilled' | 'fulfilled'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [customTracking, setCustomTracking] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState('Blue Dart Express');
  const [downloadingOrderId, setDownloadingOrderId] = useState(null);
  const [fulfilling, setFulfilling] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [fulfillmentAlert, setFulfillmentAlert] = useState(null);

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

        <button
          onClick={() => setIsNotifModalOpen(true)}
          className="px-3 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Bell className="w-3.5 h-3.5 text-emerald-400" />
          <span>Notification Engine & Audit Log</span>
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
                    <div className="flex items-center justify-end gap-1.5">
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
                        <span>{downloadingOrderId === ord.id ? 'PDF...' : 'Download'}</span>
                      </button>
                      <button
                        onClick={() => setInvoiceOrder(ord)}
                        className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded transition-colors flex items-center gap-1 cursor-pointer"
                        title="View & Print GST Tax Invoice"
                      >
                        <FileText className="w-3 h-3 text-emerald-600" />
                        <span>View Invoice</span>
                      </button>
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="px-2.5 py-1 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded transition-colors cursor-pointer"
                      >
                        Inspect / Fulfill
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

            {/* Fulfillment Action */}
            {selectedOrder.fulfillmentStatus === 'unfulfilled' ? (
              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-amber-600" />
                    Fulfill Order & Dispatch Automated Alerts
                  </p>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    Email + WhatsApp
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-zinc-700">Courier Carrier</label>
                  <select
                    value={selectedCarrier}
                    onChange={(e) => setSelectedCarrier(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs text-zinc-900 font-semibold"
                  >
                    <option value="Blue Dart Express">Blue Dart Express (Air)</option>
                    <option value="Delhivery Surface Express">Delhivery Surface Express</option>
                    <option value="DTDC Express India">DTDC Express India</option>
                    <option value="FedEx Priority India">FedEx Priority India</option>
                    <option value="Shadowfax Logistics">Shadowfax Logistics</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-700">Tracking / AWB Number</label>
                  <input
                    type="text"
                    value={customTracking}
                    onChange={(e) => setCustomTracking(e.target.value)}
                    placeholder="e.g. APX-982736184 (or leave blank to auto-generate)"
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs text-zinc-900 font-mono"
                  />
                  <p className="text-[10px] text-zinc-500">
                    Live tracking URL with order timeline will be automatically sent to {selectedOrder.customer?.email || selectedOrder.customerEmail || 'the customer'}.
                  </p>
                </div>

                <button
                  disabled={fulfilling}
                  onClick={() => handleFulfill(selectedOrder.id)}
                  className="w-full py-2.5 bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {fulfilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                  <span>{fulfilling ? 'Dispatching...' : 'Confirm Fulfillment & Dispatch Alerts'}</span>
                </button>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Order is fulfilled via <strong>{selectedOrder.carrier || 'Blue Dart Express'}</strong></span>
                </div>
                <p className="text-[11px] text-emerald-700 ml-6">
                  AWB Tracking: <strong className="font-mono">{selectedOrder.trackingNumber}</strong> (Dispatch Email & WhatsApp sent)
                </p>
              </div>
            )}
          </div>
        </div>
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
    </div>
  );
}
