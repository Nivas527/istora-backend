import React, { useState } from 'react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useStore } from '../../context/StoreContext';
import { useFit } from '../../context/FitContext';
import { downloadInvoicePdf } from '../../utils/invoicePdfUtils';
import {
  X,
  Package,
  MapPin,
  Sparkles,
  User,
  LogOut,
  FileText,
  Truck,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  ShieldCheck,
  Check,
  ChevronRight,
  ExternalLink,
  Edit2,
  AlertTriangle,
  Building,
  Home,
  ShieldAlert
} from 'lucide-react';

export default function ShopperPortalModal({ onTrackOrder }) {
  const {
    customer,
    isAuthenticated,
    isPortalModalOpen,
    closePortal,
    portalActiveTab,
    setPortalActiveTab,
    customerOrders,
    savedAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    logout
  } = useCustomerAuth();

  const { activeStore, settings } = useStore();
  const { profile, consent, openScanModal, clearBiometricData } = useFit();

  // Invoice downloading state tracking per orderId
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
  const [invoiceSuccessId, setInvoiceSuccessId] = useState(null);

  // Address form modal/drawer state
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressFormData, setAddressFormData] = useState({
    label: 'Home',
    firstName: '',
    lastName: '',
    address: '',
    city: 'Bangalore',
    state: 'Karnataka',
    zip: '560001',
    phone: '',
    isDefault: false
  });

  if (!isPortalModalOpen || !isAuthenticated || !customer) return null;

  // Handle PDF Invoice Download
  const handleDownloadInvoice = async (order) => {
    try {
      setDownloadingInvoiceId(order.id);
      await downloadInvoicePdf({
        order,
        store: activeStore,
        settings
      });
      setInvoiceSuccessId(order.id);
      setTimeout(() => setInvoiceSuccessId(null), 3500);
    } catch (err) {
      console.error('[ShopperPortal] Invoice download failed:', err);
      alert('Could not generate PDF invoice. ' + (err.message || ''));
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  // Open Address Editor
  const openNewAddressForm = () => {
    setEditingAddressId(null);
    setAddressFormData({
      label: 'Home',
      firstName: customer.name.split(' ')[0] || '',
      lastName: customer.name.split(' ').slice(1).join(' ') || '',
      address: '',
      city: 'Bangalore',
      state: 'Karnataka',
      zip: '560001',
      phone: customer.phone || '',
      isDefault: savedAddresses.length === 0
    });
    setIsEditingAddress(true);
  };

  const openEditAddressForm = (addr) => {
    setEditingAddressId(addr.id);
    setAddressFormData({
      label: addr.label || 'Home',
      firstName: addr.firstName || '',
      lastName: addr.lastName || '',
      address: addr.address || '',
      city: addr.city || 'Bangalore',
      state: addr.state || 'Karnataka',
      zip: addr.zip || '',
      phone: addr.phone || '',
      isDefault: !!addr.isDefault
    });
    setIsEditingAddress(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (editingAddressId) {
      await updateAddress(editingAddressId, addressFormData);
    } else {
      await addAddress(addressFormData);
    }
    setIsEditingAddress(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all text-zinc-900 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-850">
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              {customer.avatar ? (
                <img
                  src={customer.avatar}
                  alt={customer.name}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500/30"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-base shadow-sm">
                  {customer.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                  {customer.name}
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {customer.authProvider === 'google' ? 'Google Connected' : customer.authProvider === 'otp' ? 'Mobile Verified' : 'Registered Shopper'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {customer.email} {customer.phone ? `• ${customer.phone}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={closePortal}
              className="p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 sm:space-x-2 px-6 pt-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setPortalActiveTab('orders')}
            className={`flex items-center gap-2 px-3 py-2.5 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              portalActiveTab === 'orders'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Orders</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {customerOrders.length}
            </span>
          </button>

          <button
            onClick={() => setPortalActiveTab('addresses')}
            className={`flex items-center gap-2 px-3 py-2.5 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              portalActiveTab === 'addresses'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Saved Addresses</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {savedAddresses.length}
            </span>
          </button>

          <button
            onClick={() => setPortalActiveTab('fit')}
            className={`flex items-center gap-2 px-3 py-2.5 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              portalActiveTab === 'fit'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>My Fit Profile</span>
          </button>

          <button
            onClick={() => setPortalActiveTab('profile')}
            className={`flex items-center gap-2 px-3 py-2.5 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              portalActiveTab === 'profile'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Account Overview</span>
          </button>
        </div>

        {/* Modal Main Content Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ======================================================== */}
          {/* TAB 1: MY ORDERS & 1-CLICK GST TAX INVOICES              */}
          {/* ======================================================== */}
          {portalActiveTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Order History & Invoices
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Track shipments in real-time or download official GST tax invoices (PDF).
                  </p>
                </div>
              </div>

              {customerOrders.length === 0 ? (
                <div className="py-12 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/30">
                  <Package className="w-10 h-10 text-zinc-400 mx-auto mb-2 opacity-50" />
                  <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    No orders placed yet
                  </h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                    When you purchase items with this account, your complete order timeline and downloadable GST invoices will show up here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customerOrders.map((order) => {
                    const status = order.status || 'Paid';
                    const items = order.items || [];
                    const isDelivered = status.toLowerCase() === 'delivered';
                    const isShipped = isDelivered || status.toLowerCase() === 'shipped';
                    const isConfirmed = isShipped || status.toLowerCase() === 'processing' || status.toLowerCase() === 'paid';

                    return (
                      <div
                        key={order.id}
                        className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850/50 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all space-y-4"
                      >
                        {/* Order Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm font-extrabold text-zinc-900 dark:text-white">
                              {order.orderNumber || `#${order.id.slice(-6)}`}
                            </span>
                            <span className="text-xs text-zinc-400">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              }) : 'Recent'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              {status}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-400">Total:</span>
                            <span className="font-mono text-sm font-extrabold text-zinc-900 dark:text-white">
                              ₹{(order.total || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        {/* Order Timeline Visual Stepper */}
                        <div className="px-2 py-1">
                          <div className="grid grid-cols-4 relative text-[11px] font-semibold text-center">
                            {/* Line connecting steps */}
                            <div className="absolute top-3 left-[12%] right-[12%] h-0.5 bg-zinc-200 dark:bg-zinc-700 -z-0" />
                            <div 
                              className="absolute top-3 left-[12%] h-0.5 bg-emerald-500 transition-all duration-500 -z-0"
                              style={{
                                width: isDelivered ? '76%' : isShipped ? '50%' : isConfirmed ? '25%' : '0%'
                              }}
                            />

                            {/* Step 1: Placed */}
                            <div className="flex flex-col items-center relative z-10">
                              <span className="w-6 h-6 rounded-full flex items-center justify-center bg-emerald-500 text-white shadow-xs">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                              <span className="mt-1.5 text-zinc-800 dark:text-zinc-200">Order Placed</span>
                            </div>

                            {/* Step 2: Confirmed */}
                            <div className="flex flex-col items-center relative z-10">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                isConfirmed
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400'
                              }`}>
                                <Check className="w-3.5 h-3.5" />
                              </span>
                              <span className="mt-1.5 text-zinc-700 dark:text-zinc-300">Confirmed</span>
                            </div>

                            {/* Step 3: Shipped */}
                            <div className="flex flex-col items-center relative z-10">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                isShipped
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400'
                              }`}>
                                <Truck className="w-3.5 h-3.5" />
                              </span>
                              <span className="mt-1.5 text-zinc-700 dark:text-zinc-300">
                                {order.carrier ? `${order.carrier}` : 'Dispatched'}
                              </span>
                            </div>

                            {/* Step 4: Delivered */}
                            <div className="flex flex-col items-center relative z-10">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                isDelivered
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400'
                              }`}>
                                <CheckCircle className="w-3.5 h-3.5" />
                              </span>
                              <span className="mt-1.5 text-zinc-700 dark:text-zinc-300">Delivered</span>
                            </div>
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        <div className="space-y-2 pt-2">
                          {items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs py-1">
                              <div className="flex items-center space-x-2.5">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-10 h-10 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700 shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                                    <Package className="w-4 h-4" />
                                  </div>
                                )}
                                <div>
                                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                                    {item.title}
                                  </span>
                                  <span className="text-zinc-400 text-[11px]">
                                    Qty: {item.quantity || 1} {item.selectedSize ? `• Size: ${item.selectedSize}` : ''} {item.selectedColor ? `• ${item.selectedColor}` : ''}
                                  </span>
                                </div>
                              </div>
                              <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                                ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Actions: Download GST Tax Invoice & Track Order */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center space-x-2 text-xs text-zinc-500">
                            <span>Invoice:</span>
                            <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                              {order.invoiceNumber || `INV-2026/${order.orderNumber?.replace(/[^0-9]/g, '') || '1001'}`}
                            </span>
                            {order.isB2B && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold">
                                B2B GSTIN: {order.customerGstin}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            {/* Track Delivery Button */}
                            {onTrackOrder && (
                              <button
                                onClick={() => {
                                  closePortal();
                                  onTrackOrder(order.orderNumber || order.id);
                                }}
                                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                              >
                                <Truck className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Track Delivery</span>
                              </button>
                            )}

                            {/* 1-Click Download GST Tax Invoice PDF */}
                            <button
                              onClick={() => handleDownloadInvoice(order)}
                              disabled={downloadingInvoiceId === order.id}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                                invoiceSuccessId === order.id
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                              }`}
                              title="Download official GST Rule 46 compliant Tax Invoice (PDF)"
                            >
                              {downloadingInvoiceId === order.id ? (
                                <>
                                  <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                  <span>Generating PDF...</span>
                                </>
                              ) : invoiceSuccessId === order.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Invoice Downloaded!</span>
                                </>
                              ) : (
                                <>
                                  <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>📄 Download GST Invoice (PDF)</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: SAVED ADDRESSES                                   */}
          {/* ======================================================== */}
          {portalActiveTab === 'addresses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Saved Delivery Addresses
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Pre-fills delivery information for sub-second 1-click checkout.
                  </p>
                </div>
                <button
                  onClick={openNewAddressForm}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Address</span>
                </button>
              </div>

              {/* Address Form Dialog / Drawer */}
              {isEditingAddress && (
                <form
                  onSubmit={handleSaveAddress}
                  className="p-5 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-3.5 animate-fade-in"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-emerald-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      {editingAddressId ? 'Edit Address' : 'New Delivery Address'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingAddress(false)}
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-zinc-600 dark:text-zinc-400">
                        Address Label
                      </label>
                      <select
                        value={addressFormData.label}
                        onChange={(e) => setAddressFormData({ ...addressFormData, label: e.target.value })}
                        className="w-full text-xs p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      >
                        <option value="Home">Home</option>
                        <option value="Office">Office</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-zinc-600 dark:text-zinc-400">
                        Recipient Phone
                      </label>
                      <input
                        type="tel"
                        value={addressFormData.phone}
                        onChange={(e) => setAddressFormData({ ...addressFormData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        required
                        className="w-full text-xs p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-zinc-600 dark:text-zinc-400">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={addressFormData.firstName}
                        onChange={(e) => setAddressFormData({ ...addressFormData, firstName: e.target.value })}
                        placeholder="Alex"
                        required
                        className="w-full text-xs p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-zinc-600 dark:text-zinc-400">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={addressFormData.lastName}
                        onChange={(e) => setAddressFormData({ ...addressFormData, lastName: e.target.value })}
                        placeholder="Rivera"
                        required
                        className="w-full text-xs p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold mb-1 text-zinc-600 dark:text-zinc-400">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={addressFormData.address}
                        onChange={(e) => setAddressFormData({ ...addressFormData, address: e.target.value })}
                        placeholder="500 Howard Street, Suite 300, Indiranagar"
                        required
                        className="w-full text-xs p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-zinc-600 dark:text-zinc-400">
                        City
                      </label>
                      <input
                        type="text"
                        value={addressFormData.city}
                        onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })}
                        placeholder="Bangalore"
                        required
                        className="w-full text-xs p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-zinc-600 dark:text-zinc-400">
                        State
                      </label>
                      <select
                        value={addressFormData.state}
                        onChange={(e) => setAddressFormData({ ...addressFormData, state: e.target.value })}
                        className="w-full text-xs p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      >
                        <option value="Karnataka">Karnataka (29)</option>
                        <option value="Maharashtra">Maharashtra (27)</option>
                        <option value="Delhi">Delhi (07)</option>
                        <option value="Tamil Nadu">Tamil Nadu (33)</option>
                        <option value="Telangana">Telangana (36)</option>
                        <option value="Gujarat">Gujarat (24)</option>
                        <option value="Uttar Pradesh">Uttar Pradesh (09)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-zinc-600 dark:text-zinc-400">
                        PIN Code
                      </label>
                      <input
                        type="text"
                        value={addressFormData.zip}
                        onChange={(e) => setAddressFormData({ ...addressFormData, zip: e.target.value })}
                        placeholder="560001"
                        required
                        className="w-full text-xs p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                    </div>

                    <div className="flex items-center mt-6">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                        <input
                          type="checkbox"
                          checked={addressFormData.isDefault}
                          onChange={(e) => setAddressFormData({ ...addressFormData, isDefault: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span>Set as Default Delivery Address</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingAddress(false)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Save Address
                    </button>
                  </div>
                </form>
              )}

              {/* Saved Address Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`p-4 rounded-2xl border transition-all relative ${
                      addr.isDefault
                        ? 'border-emerald-500/80 bg-emerald-50/10 dark:bg-emerald-950/20 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          {addr.label === 'Office' ? <Building className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}
                        </span>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          {addr.label}
                        </span>
                        {addr.isDefault && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => openEditAddressForm(addr)}
                          className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded"
                          title="Edit address"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteAddress(addr.id)}
                          className="p-1 text-zinc-400 hover:text-red-600 rounded"
                          title="Delete address"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {addr.firstName} {addr.lastName}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                      {addr.address}, {addr.city}, {addr.state} - <span className="font-mono">{addr.zip}</span>
                    </p>
                    <p className="text-xs text-zinc-500 mt-1 font-mono">
                      📞 {addr.phone}
                    </p>

                    {!addr.isDefault && (
                      <button
                        onClick={() => setDefaultAddress(addr.id)}
                        className="mt-3 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Make Default</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: MY FIT PROFILE & BIOMETRIC PRIVACY                */}
          {/* ======================================================== */}
          {portalActiveTab === 'fit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    My Biometric Fit Profile
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Calibrated body measurements for zero-return garment sizing verification.
                  </p>
                </div>
                <button
                  onClick={() => {
                    closePortal();
                    openScanModal();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Update Fit Scan</span>
                </button>
              </div>

              {/* Sensitive Biometric Shield Banner */}
              <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Privacy-Preserving Biometric Protection Active</span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                  Your body photos are processed solely in volatile memory (RAM) and destroyed within 60 seconds. Only numeric vector measurements are retained on your device for size recommendations.
                </p>
              </div>

              {/* Measurements Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850/50">
                  <span className="text-[11px] text-zinc-400 block font-semibold">Height</span>
                  <span className="text-lg font-extrabold font-mono text-zinc-900 dark:text-white">
                    {profile.heightCm} cm
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850/50">
                  <span className="text-[11px] text-zinc-400 block font-semibold">Weight</span>
                  <span className="text-lg font-extrabold font-mono text-zinc-900 dark:text-white">
                    {profile.weightKg} kg
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/20">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-semibold">Chest / Bust</span>
                  <span className="text-lg font-extrabold font-mono text-emerald-800 dark:text-emerald-200">
                    {profile.chestCm} cm
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/20">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-semibold">Waist</span>
                  <span className="text-lg font-extrabold font-mono text-emerald-800 dark:text-emerald-200">
                    {profile.waistCm} cm
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850/50">
                  <span className="text-[11px] text-zinc-400 block font-semibold">Low Hip</span>
                  <span className="text-lg font-extrabold font-mono text-zinc-900 dark:text-white">
                    {profile.lowHipCm} cm
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850/50">
                  <span className="text-[11px] text-zinc-400 block font-semibold">Shoulder Width</span>
                  <span className="text-lg font-extrabold font-mono text-zinc-900 dark:text-white">
                    {profile.acrossShoulderCm} cm
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850/50">
                  <span className="text-[11px] text-zinc-400 block font-semibold">Sleeve Length</span>
                  <span className="text-lg font-extrabold font-mono text-zinc-900 dark:text-white">
                    {profile.sleeveLengthCm} cm
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850/50">
                  <span className="text-[11px] text-zinc-400 block font-semibold">Inseam</span>
                  <span className="text-lg font-extrabold font-mono text-zinc-900 dark:text-white">
                    {profile.inseamCm} cm
                  </span>
                </div>
              </div>

              {/* Data Rights & Erasure */}
              <div className="pt-2 flex items-center justify-between text-xs text-zinc-500">
                <span>Last calibrated: {new Date(profile.lastScannedAt || Date.now()).toLocaleDateString('en-IN')}</span>
                <button
                  onClick={() => {
                    if (window.confirm('Erase all local biometric sizing measurements?')) {
                      clearBiometricData();
                    }
                  }}
                  className="text-red-500 hover:text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Right to Erasure (Delete Measurements)</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: PROFILE & SECURITY                                */}
          {/* ======================================================== */}
          {portalActiveTab === 'profile' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Shopper Profile & Security
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850/50 space-y-2">
                  <span className="text-xs text-zinc-400 block">Personal Details</span>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">
                    {customer.name}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    📧 {customer.email}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    📞 {customer.phone || 'No phone added'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850/50 space-y-2">
                  <span className="text-xs text-zinc-400 block">Lifetime Shopping Metrics</span>
                  <div className="flex items-center gap-4 pt-1">
                    <div>
                      <span className="text-[11px] text-zinc-400 block">Orders Placed</span>
                      <span className="text-base font-extrabold text-zinc-900 dark:text-white font-mono">
                        {customerOrders.length || customer.ordersCount || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-zinc-400 block">Total Spent</span>
                      <span className="text-base font-extrabold text-zinc-900 dark:text-white font-mono">
                        ₹{(customer.totalSpent || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Log Out Button */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out of Shopper Account</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

