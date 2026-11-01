import React, { useState, useEffect } from 'react';
import { 
  Mail, MessageSquare, Bell, ShieldCheck, CheckCircle2, AlertTriangle, 
  Send, RefreshCcw, FileText, Download, ExternalLink, Smartphone, 
  Check, Eye, EyeOff, Save, Loader2, Package, Truck, Sparkles, Filter
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export default function NotificationSettingsModal({ isOpen, onClose, storeId = 'store_apex' }) {
  const [activeTab, setActiveTab] = useState('previews'); // 'previews' | 'providers' | 'logs'
  const [previewChannel, setPreviewChannel] = useState('order_email'); // 'order_email' | 'order_wa' | 'dispatch_email' | 'dispatch_wa' | 'merchant_order' | 'merchant_stock'
  const [logFilter, setLogFilter] = useState('all'); // 'all' | 'email' | 'whatsapp'
  
  // Settings State
  const [settings, setSettings] = useState({
    storeId: storeId || 'store_apex',
    emailProvider: 'resend',
    emailApiKey: 're_live_sec_istora_2026',
    senderEmail: 'orders@istora.online',
    senderName: 'Apex Athletics & Co.',
    whatsAppProvider: 'twilio',
    whatsAppApiKey: 'tw_sec_istora_wa_2026',
    whatsAppSenderNumber: '+14155238886',
    merchantAlertEmail: 'owner@istora.online',
    lowStockThreshold: 5,
    orderConfirmationEmail: true,
    orderConfirmationWhatsApp: true,
    dispatchEmail: true,
    dispatchWhatsApp: true,
    merchantNewOrderAlert: true,
    merchantLowStockAlert: true,
    attachGstInvoicePdf: true
  });

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showEmailKey, setShowEmailKey] = useState(false);
  const [showWaKey, setShowWaKey] = useState(false);

  // Test Dispatch State
  const [testChannel, setTestChannel] = useState('email');
  const [testType, setTestType] = useState('order_confirmation');
  const [testRecipient, setTestRecipient] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testFeedback, setTestFeedback] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, storeId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [conf, logList] = await Promise.all([
        apiClient.getNotificationSettings(storeId),
        apiClient.getNotificationLogs(storeId, 'all', 50)
      ]);
      if (conf) setSettings(conf);
      if (logList) setLogs(logList);
    } catch (err) {
      console.warn('Failed to load notifications data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await apiClient.saveNotificationSettings(settings, storeId);
      if (updated) setSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving notification settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    setSendingTest(true);
    setTestFeedback(null);
    try {
      const res = await apiClient.testNotification({
        channel: testChannel,
        type: testType,
        recipient: testRecipient?.trim() || undefined
      }, storeId);

      setTestFeedback({
        type: 'success',
        message: res.message || 'Notification dispatched successfully!'
      });

      // Refresh logs
      const updatedLogs = await apiClient.getNotificationLogs(storeId, 'all', 50);
      if (updatedLogs) setLogs(updatedLogs);
    } catch (err) {
      setTestFeedback({
        type: 'error',
        message: 'Failed to dispatch test notification.'
      });
    } finally {
      setSendingTest(false);
      setTimeout(() => setTestFeedback(null), 5000);
    }
  };

  if (!isOpen) return null;

  const filteredLogs = logs.filter(log => {
    if (logFilter === 'all') return true;
    return log.channel?.toLowerCase() === logFilter.toLowerCase();
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden">
        
        {/* Top Header */}
        <div className="px-6 py-4 bg-zinc-900 text-white flex items-center justify-between border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-zinc-950 font-bold shadow-md shadow-emerald-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Automated Notifications & Dispatch Engine
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Live Active
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Automated Transactional Emails (Resend/SendGrid) with GST PDF attachments & WhatsApp alerts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              title="Refresh Logs & Settings"
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-colors"
            >
              Close ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between shrink-0">
          <div className="flex gap-2 py-2.5">
            <button
              onClick={() => setActiveTab('previews')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'previews'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-200/70'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Visual Previews</span>
            </button>

            <button
              onClick={() => setActiveTab('providers')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'providers'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-200/70'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Provider Credentials & Triggers</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'logs'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-200/70'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Real-Time Audit Log ({logs.length})</span>
            </button>
          </div>

          {/* Quick Status Badges */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-zinc-500 font-medium">
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Email: <strong>{settings.emailProvider.toUpperCase()}</strong>
            </span>
            <span className="flex items-center gap-1 text-teal-700">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              WhatsApp: <strong>{settings.whatsAppProvider.toUpperCase()}</strong>
            </span>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-100/50">
          
          {/* TAB 1: VISUAL PREVIEWS */}
          {activeTab === 'previews' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              {/* Preview Type Switcher */}
              <div className="flex flex-wrap gap-2 p-1.5 bg-white rounded-xl border border-zinc-200 shadow-2xs">
                <button
                  onClick={() => setPreviewChannel('order_email')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    previewChannel === 'order_email'
                      ? 'bg-indigo-600 text-white'
                      : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Customer Order Confirmation Email (w/ GST PDF)</span>
                </button>

                <button
                  onClick={() => setPreviewChannel('order_wa')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    previewChannel === 'order_wa'
                      ? 'bg-emerald-600 text-white'
                      : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Customer WhatsApp Confirmation</span>
                </button>

                <button
                  onClick={() => setPreviewChannel('dispatch_email')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    previewChannel === 'dispatch_email'
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Dispatch & Live Tracking Email</span>
                </button>

                <button
                  onClick={() => setPreviewChannel('dispatch_wa')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    previewChannel === 'dispatch_wa'
                      ? 'bg-teal-600 text-white'
                      : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Dispatch WhatsApp Milestone</span>
                </button>

                <button
                  onClick={() => setPreviewChannel('merchant_order')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    previewChannel === 'merchant_order'
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Merchant: New Order Alert</span>
                </button>

                <button
                  onClick={() => setPreviewChannel('merchant_stock')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    previewChannel === 'merchant_stock'
                      ? 'bg-amber-600 text-white'
                      : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Merchant: Low Inventory Alert</span>
                </button>
              </div>

              {/* 1. Customer Order Confirmation Email Preview */}
              {previewChannel === 'order_email' && (
                <div className="bg-white rounded-2xl border border-zinc-200 shadow-md overflow-hidden animate-fadeIn">
                  {/* Fake Email Client Chrome */}
                  <div className="bg-zinc-100 px-4 py-2.5 border-b border-zinc-200 flex items-center justify-between text-xs text-zinc-600">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-400"></span>
                      <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                      <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                      <span className="ml-2 font-semibold text-zinc-700">Preview: Transactional Order Confirmation Email</span>
                    </div>
                    <span className="text-zinc-400">Sent via {settings.emailProvider.toUpperCase()}</span>
                  </div>

                  <div className="p-4 bg-zinc-50/70 border-b border-zinc-200 text-xs space-y-1">
                    <p><strong className="text-zinc-700">From:</strong> {settings.senderName} &lt;{settings.senderEmail}&gt;</p>
                    <p><strong className="text-zinc-700">To:</strong> Alex Rivera &lt;alex.rivera@example.com&gt;</p>
                    <p><strong className="text-zinc-700">Subject:</strong> Order Confirmed #ORD-84920 - {settings.senderName} (GST Tax Invoice Attached)</p>
                  </div>

                  {/* Rendered HTML Email Body */}
                  <div className="p-6 md:p-8 space-y-6 max-w-xl mx-auto bg-white font-sans">
                    {/* Brand Header */}
                    <div className="text-center pb-4 border-b border-zinc-200">
                      <h2 className="text-xl font-black tracking-tight text-zinc-900">{settings.senderName}</h2>
                      <p className="text-xs text-zinc-500 mt-1">Official Purchase Confirmation & Tax Receipt</p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-zinc-900">Thank you for your order, Alex!</h3>
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        We have received your order <strong>#ORD-84920</strong> and our warehouse is preparing it for expedited dispatch.
                      </p>
                    </div>

                    {/* Order Summary Box */}
                    <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3 text-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                        <span className="text-zinc-500">Order Number:</span>
                        <span className="font-mono font-bold text-zinc-900">#ORD-84920</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                        <span className="text-zinc-500">Tax Invoice Number:</span>
                        <span className="font-mono font-bold text-indigo-700">INV-2026/84920</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                        <span className="text-zinc-500">Payment Method:</span>
                        <span className="font-bold text-emerald-700">UPI Instant Pay (Verified)</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 font-bold text-sm text-zinc-900">
                        <span>Total Paid (incl. GST):</span>
                        <span>₹3,450.00</span>
                      </div>
                    </div>

                    {/* Items table */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-zinc-700">Items Ordered:</p>
                      <div className="p-3 bg-white rounded-xl border border-zinc-200 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-zinc-900">Cyberpunk Articulated Shell Jacket</p>
                          <p className="text-[11px] text-zinc-500">Size: M | Color: Matte Obsidian × 1</p>
                        </div>
                        <span className="font-bold text-zinc-900">₹3,450.00</span>
                      </div>
                    </div>

                    {/* OFFICIAL GST INVOICE ATTACHMENT CARD */}
                    {settings.attachGstInvoicePdf && (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-indigo-950">Official GST Tax Invoice (PDF)</p>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-200 text-indigo-900">
                                Attached
                              </span>
                            </div>
                            <p className="text-[11px] text-indigo-700">
                              INV-2026-84920.pdf (Compliant with GSTIN 29AABCU9603R1ZM)
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1">
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </span>
                      </div>
                    )}

                    <div className="text-center pt-4 border-t border-zinc-200 text-[11px] text-zinc-400">
                      <p>Questions? Reply directly to this email or visit our help center at istora.online</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Customer WhatsApp Message Preview */}
              {previewChannel === 'order_wa' && (
                <div className="max-w-md mx-auto bg-[#0b141a] p-4 rounded-3xl border-4 border-zinc-800 shadow-2xl animate-fadeIn">
                  {/* WhatsApp Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-sm">
                        A
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-bold">{settings.senderName}</p>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                        </div>
                        <p className="text-[10px] text-zinc-400">Official Business Account</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-400">TODAY</span>
                  </div>

                  {/* Chat Bubbles */}
                  <div className="py-6 space-y-3 font-sans">
                    <div className="bg-[#005c4b] text-[#e9edef] p-3.5 rounded-2xl rounded-tl-xs text-xs space-y-2 max-w-[90%] shadow-md">
                      <p className="font-bold text-emerald-200">
                        🎉 Hi Alex! Thank you for shopping with {settings.senderName}.
                      </p>
                      <p className="text-[11px] leading-relaxed text-zinc-100">
                        Your order <strong className="text-white">#ORD-84920</strong> for <strong className="text-white">₹3,450.00</strong> is confirmed!
                      </p>
                      
                      <div className="p-2.5 rounded-xl bg-black/20 border border-emerald-400/20 text-[11px] space-y-1">
                        <p>📄 <strong>Invoice:</strong> INV-2026/84920 (GST PDF)</p>
                        <p>📦 <strong>Items:</strong> Cyberpunk Shell Jacket (M)</p>
                        <p>💳 <strong>Payment:</strong> UPI Paid</p>
                      </div>

                      <p className="text-[11px] text-zinc-200">
                        We'll alert you the moment your package is dispatched. Track anytime:
                      </p>

                      <a 
                        href="https://istora.online/track/ORD-84920" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="block text-emerald-300 underline font-semibold text-[11px]"
                      >
                        https://istora.online/track/ORD-84920
                      </a>

                      <div className="flex justify-end items-center gap-1 text-[9px] text-emerald-300/80 pt-1">
                        <span>Just now</span>
                        <span>✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Customer Dispatch & Tracking Email Preview */}
              {previewChannel === 'dispatch_email' && (
                <div className="bg-white rounded-2xl border border-zinc-200 shadow-md overflow-hidden animate-fadeIn">
                  <div className="bg-zinc-100 px-4 py-2.5 border-b border-zinc-200 flex items-center justify-between text-xs text-zinc-600">
                    <span className="font-semibold text-zinc-700">Preview: Dispatch & Live Tracking Email</span>
                    <span className="text-zinc-400">Carrier: Blue Dart Express</span>
                  </div>

                  <div className="p-4 bg-zinc-50/70 border-b border-zinc-200 text-xs space-y-1">
                    <p><strong className="text-zinc-700">Subject:</strong> Shipped: Your order #ORD-84920 is on the way! (Blue Dart Express)</p>
                    <p><strong className="text-zinc-700">To:</strong> alex.rivera@example.com</p>
                  </div>

                  <div className="p-6 md:p-8 space-y-6 max-w-xl mx-auto bg-white font-sans">
                    <div className="text-center pb-4 border-b border-zinc-200">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
                        <Truck className="w-6 h-6" />
                      </div>
                      <h2 className="text-xl font-black text-zinc-900">Your Package is On The Way!</h2>
                      <p className="text-xs text-zinc-500 mt-1">Dispatched via Blue Dart Air Express</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-900 font-medium">Carrier:</span>
                        <span className="font-bold text-blue-950">Blue Dart Air Express</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-900 font-medium">Tracking Number:</span>
                        <span className="font-mono font-bold text-blue-950">APX-982736184</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-900 font-medium">Estimated Delivery:</span>
                        <span className="font-bold text-emerald-700">Within 48 Hours</span>
                      </div>
                    </div>

                    <div className="text-center pt-2">
                      <a
                        href="https://istora.online/track/ORD-84920"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Track Live Delivery Status</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Customer Dispatch WhatsApp Preview */}
              {previewChannel === 'dispatch_wa' && (
                <div className="max-w-md mx-auto bg-[#0b141a] p-4 rounded-3xl border-4 border-zinc-800 shadow-2xl animate-fadeIn">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center font-bold text-sm">
                        🚚
                      </div>
                      <div>
                        <p className="text-xs font-bold">{settings.senderName} Delivery Bot</p>
                        <p className="text-[10px] text-zinc-400">Live Logistics Gateway</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-400">DISPATCHED</span>
                  </div>

                  <div className="py-6 space-y-3 font-sans">
                    <div className="bg-[#005c4b] text-[#e9edef] p-3.5 rounded-2xl rounded-tl-xs text-xs space-y-2 max-w-[90%] shadow-md">
                      <p className="font-bold text-teal-200">
                        🚚 Great news Alex! Your order #ORD-84920 has been dispatched!
                      </p>
                      <p className="text-[11px] text-zinc-100">
                        Courier: <strong>Blue Dart Express</strong><br />
                        AWB / Tracking: <strong className="font-mono">APX-982736184</strong>
                      </p>
                      
                      <p className="text-[11px] text-zinc-200">
                        Track live location & delivery driver on the timeline map:
                      </p>

                      <a 
                        href="https://istora.online/track/ORD-84920" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="block text-teal-300 underline font-semibold text-[11px]"
                      >
                        https://istora.online/track/ORD-84920
                      </a>

                      <div className="flex justify-end items-center gap-1 text-[9px] text-emerald-300/80 pt-1">
                        <span>Delivered to WhatsApp</span>
                        <span>✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Merchant New Order Alert Preview */}
              {previewChannel === 'merchant_order' && (
                <div className="bg-white rounded-2xl border border-zinc-200 shadow-md p-6 max-w-xl mx-auto space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                        <Package className="w-4 h-4" />
                      </span>
                      <h4 className="text-sm font-bold text-zinc-900">Store Owner Notification</h4>
                    </div>
                    <span className="text-[11px] text-zinc-400">Sent to: {settings.merchantAlertEmail}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
                    <p className="font-bold text-zinc-900 text-sm">💰 New Order #ORD-84920 Received!</p>
                    <p className="text-zinc-600">Customer <strong>Alex Rivera</strong> just completed a purchase of <strong>₹3,450.00</strong> via UPI Instant Pay.</p>
                    <div className="pt-2 text-zinc-500 space-y-1">
                      <p>• Items: Cyberpunk Articulated Shell Jacket (M) × 1</p>
                      <p>• Buyer State: Karnataka (CGST 9% + SGST 9%)</p>
                      <p>• Customer Email: alex.rivera@example.com</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Merchant Low Inventory Warning Preview */}
              {previewChannel === 'merchant_stock' && (
                <div className="bg-white rounded-2xl border border-amber-200 shadow-md p-6 max-w-xl mx-auto space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-lg bg-amber-100 text-amber-800">
                        <AlertTriangle className="w-4 h-4" />
                      </span>
                      <h4 className="text-sm font-bold text-amber-900">Urgent Inventory Warning</h4>
                    </div>
                    <span className="text-[11px] text-amber-700 font-semibold">Threshold: &lt; {settings.lowStockThreshold} units</span>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2 text-xs">
                    <p className="font-bold text-amber-950 text-sm">⚠️ Low Inventory Alert Triggered</p>
                    <p className="text-amber-800">
                      The following item fell below your inventory threshold ({settings.lowStockThreshold} units) following order #ORD-84920:
                    </p>
                    <div className="p-3 bg-white rounded-lg border border-amber-200 text-amber-900 font-semibold">
                      Cyberpunk Articulated Shell Jacket (Only 2 units remaining in warehouse)
                    </div>
                    <p className="text-[11px] text-amber-700">Immediate reordering or supplier purchase order recommended.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROVIDERS & TRIGGERS CONFIGURATION */}
          {activeTab === 'providers' && (
            <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl mx-auto bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs">
              
              {/* Section 1: Email Configuration */}
              <div className="space-y-4 pb-6 border-b border-zinc-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                      <Mail className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">Transactional Email Engine</h4>
                      <p className="text-xs text-zinc-500">Official order confirmations with GST Tax Invoice attachments</p>
                    </div>
                  </div>
                  
                  <select
                    value={settings.emailProvider}
                    onChange={(e) => setSettings({ ...settings, emailProvider: e.target.value })}
                    className="px-3 py-1.5 rounded-lg border border-zinc-300 text-xs font-bold text-zinc-800 bg-white"
                  >
                    <option value="resend">Resend (Recommended)</option>
                    <option value="sendgrid">Twilio SendGrid</option>
                    <option value="ses">Amazon SES</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">Sender Email Address</label>
                    <input
                      type="email"
                      value={settings.senderEmail}
                      onChange={(e) => setSettings({ ...settings, senderEmail: e.target.value })}
                      placeholder="orders@yourdomain.com"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">Sender Display Name</label>
                    <input
                      type="text"
                      value={settings.senderName}
                      onChange={(e) => setSettings({ ...settings, senderName: e.target.value })}
                      placeholder="Apex Athletics & Co."
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-zinc-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-zinc-700 mb-1">API Key / Auth Secret ({settings.emailProvider.toUpperCase()})</label>
                    <div className="relative">
                      <input
                        type={showEmailKey ? 'text' : 'password'}
                        value={settings.emailApiKey}
                        onChange={(e) => setSettings({ ...settings, emailApiKey: e.target.value })}
                        className="w-full px-3 py-2 pr-10 rounded-lg border border-zinc-300 font-mono text-zinc-900 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmailKey(!showEmailKey)}
                        className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600"
                      >
                        {showEmailKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: WhatsApp & SMS Updates */}
              <div className="space-y-4 pb-6 border-b border-zinc-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                      <Smartphone className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">WhatsApp Business Messaging</h4>
                      <p className="text-xs text-zinc-500">Instant order alerts & live shipment milestone messages</p>
                    </div>
                  </div>

                  <select
                    value={settings.whatsAppProvider}
                    onChange={(e) => setSettings({ ...settings, whatsAppProvider: e.target.value })}
                    className="px-3 py-1.5 rounded-lg border border-zinc-300 text-xs font-bold text-zinc-800 bg-white"
                  >
                    <option value="twilio">Twilio WhatsApp API</option>
                    <option value="gupshup">Gupshup Enterprise</option>
                    <option value="cloud">Meta WhatsApp Cloud API</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">WhatsApp Sender Number / ID</label>
                    <input
                      type="text"
                      value={settings.whatsAppSenderNumber}
                      onChange={(e) => setSettings({ ...settings, whatsAppSenderNumber: e.target.value })}
                      placeholder="+14155238886"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">API Key / Auth Token ({settings.whatsAppProvider.toUpperCase()})</label>
                    <div className="relative">
                      <input
                        type={showWaKey ? 'text' : 'password'}
                        value={settings.whatsAppApiKey}
                        onChange={(e) => setSettings({ ...settings, whatsAppApiKey: e.target.value })}
                        className="w-full px-3 py-2 pr-10 rounded-lg border border-zinc-300 font-mono text-zinc-900 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowWaKey(!showWaKey)}
                        className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600"
                      >
                        {showWaKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Merchant Alerts & Thresholds */}
              <div className="space-y-4 pb-6 border-b border-zinc-200">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-lg bg-amber-100 text-amber-700">
                    <Bell className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">Merchant Store Alerts</h4>
                    <p className="text-xs text-zinc-500">Receive store manager alerts for purchases and dwindling stock</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">Store Owner Alert Email</label>
                    <input
                      type="email"
                      value={settings.merchantAlertEmail}
                      onChange={(e) => setSettings({ ...settings, merchantAlertEmail: e.target.value })}
                      placeholder="owner@istora.online"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">Low Inventory Alert Threshold (units)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={settings.lowStockThreshold}
                      onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) || 5 })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-zinc-900"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">Triggers alert when product stock drops below this number.</p>
                  </div>
                </div>
              </div>

              {/* Section 4: Automated Trigger Switches */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Automated Dispatch Triggers</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-zinc-200 hover:bg-zinc-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.orderConfirmationEmail}
                      onChange={(e) => setSettings({ ...settings, orderConfirmationEmail: e.target.checked })}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <div>
                      <p className="font-bold text-zinc-900">Order Confirmation Email</p>
                      <p className="text-[11px] text-zinc-500">Send customer order confirmation email</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.attachGstInvoicePdf}
                      onChange={(e) => setSettings({ ...settings, attachGstInvoicePdf: e.target.checked })}
                      className="w-4 h-4 accent-indigo-600 rounded"
                    />
                    <div>
                      <p className="font-bold text-indigo-950">Attach GST Invoice PDF</p>
                      <p className="text-[11px] text-indigo-700">Attach compliant GST PDF to order confirmation</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl border border-zinc-200 hover:bg-zinc-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.orderConfirmationWhatsApp}
                      onChange={(e) => setSettings({ ...settings, orderConfirmationWhatsApp: e.target.checked })}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <div>
                      <p className="font-bold text-zinc-900">WhatsApp Confirmation Alert</p>
                      <p className="text-[11px] text-zinc-500">Instant WhatsApp order confirmation</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl border border-zinc-200 hover:bg-zinc-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.dispatchEmail}
                      onChange={(e) => setSettings({ ...settings, dispatchEmail: e.target.checked })}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <div>
                      <p className="font-bold text-zinc-900">Dispatch & Tracking Email</p>
                      <p className="text-[11px] text-zinc-500">Email tracking code when marked fulfilled</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl border border-zinc-200 hover:bg-zinc-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.dispatchWhatsApp}
                      onChange={(e) => setSettings({ ...settings, dispatchWhatsApp: e.target.checked })}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <div>
                      <p className="font-bold text-zinc-900">Dispatch WhatsApp Milestone</p>
                      <p className="text-[11px] text-zinc-500">WhatsApp tracking link when dispatched</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl border border-zinc-200 hover:bg-zinc-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.merchantNewOrderAlert}
                      onChange={(e) => setSettings({ ...settings, merchantNewOrderAlert: e.target.checked })}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <div>
                      <p className="font-bold text-zinc-900">Merchant New Order Email</p>
                      <p className="text-[11px] text-zinc-500">Notify store owner of each purchase</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 cursor-pointer sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={settings.merchantLowStockAlert}
                      onChange={(e) => setSettings({ ...settings, merchantLowStockAlert: e.target.checked })}
                      className="w-4 h-4 accent-amber-600 rounded"
                    />
                    <div>
                      <p className="font-bold text-amber-950">Merchant Low Inventory Alert</p>
                      <p className="text-[11px] text-amber-800">Email alert when inventory dips below {settings.lowStockThreshold} units</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 flex items-center justify-between">
                {saveSuccess ? (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Notification settings saved to PostgreSQL!
                  </span>
                ) : <span />}

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: REAL-TIME AUDIT LOG */}
          {activeTab === 'logs' && (
            <div className="space-y-4 max-w-4xl mx-auto animate-fadeIn">
              {/* Channel Filter */}
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-zinc-200">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-xs font-bold text-zinc-700">Filter By Channel:</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setLogFilter('all')}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                        logFilter === 'all' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      All ({logs.length})
                    </button>
                    <button
                      onClick={() => setLogFilter('email')}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                        logFilter === 'email' ? 'bg-indigo-600 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      Email ({logs.filter(l => l.channel === 'email').length})
                    </button>
                    <button
                      onClick={() => setLogFilter('whatsapp')}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                        logFilter === 'whatsapp' ? 'bg-emerald-600 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      WhatsApp ({logs.filter(l => l.channel === 'whatsapp').length})
                    </button>
                  </div>
                </div>

                <button
                  onClick={loadData}
                  className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Logs Table */}
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
                {filteredLogs.length === 0 ? (
                  <div className="p-12 text-center text-zinc-400 space-y-2">
                    <Bell className="w-8 h-8 mx-auto text-zinc-300" />
                    <p className="text-xs font-bold text-zinc-700">No dispatched notification logs found</p>
                    <p className="text-[11px] text-zinc-500">Dispatches triggered via orders or test sends will appear here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold">
                          <th className="py-3 px-4">Channel</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Recipient</th>
                          <th className="py-3 px-4">Subject & Content Snippet</th>
                          <th className="py-3 px-4">Attachment</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200/60 font-sans">
                        {filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="py-3 px-4 font-bold">
                              {log.channel === 'email' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px]">
                                  <Mail className="w-3 h-3" /> Email
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                                  <Smartphone className="w-3 h-3" /> WhatsApp
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-[11px] text-zinc-600 font-mono">
                              {log.type}
                            </td>

                            <td className="py-3 px-4 font-semibold text-zinc-900">
                              {log.recipient}
                            </td>

                            <td className="py-3 px-4 max-w-xs">
                              <p className="font-bold text-zinc-900 truncate">{log.subject}</p>
                              <p className="text-[11px] text-zinc-500 truncate">{log.snippet}</p>
                            </td>

                            <td className="py-3 px-4">
                              {log.hasAttachment ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                                  <FileText className="w-3 h-3" /> GST PDF
                                </span>
                              ) : (
                                <span className="text-zinc-400 text-[10px]">—</span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                <Check className="w-3 h-3" /> Delivered
                              </span>
                            </td>

                            <td className="py-3 px-4 text-right text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                              {log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Bottom Interactive Quick-Test Bar */}
        <div className="p-4 bg-white border-t border-zinc-200 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-zinc-800 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Live Dispatch Test:
            </span>

            {/* Test Channel */}
            <select
              value={testChannel}
              onChange={(e) => setTestChannel(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-300 text-xs font-bold bg-zinc-50 text-zinc-800"
            >
              <option value="email">Email Alert</option>
              <option value="whatsapp">WhatsApp Alert</option>
            </select>

            {/* Test Type */}
            <select
              value={testType}
              onChange={(e) => setTestType(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-300 text-xs font-medium bg-zinc-50 text-zinc-800"
            >
              <option value="order_confirmation">Order Confirmed (w/ GST PDF)</option>
              <option value="order_dispatched">Dispatched & Live Tracking</option>
              <option value="merchant_new_order">Merchant: New Order Alert</option>
              <option value="merchant_low_stock">Merchant: Low Inventory Alert</option>
            </select>

            {/* Test Recipient */}
            <input
              type="text"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              placeholder={testChannel === 'email' ? 'test@customer.com' : '+91 98765 43210'}
              className="px-3 py-1.5 rounded-lg border border-zinc-300 text-xs text-zinc-900 w-44"
            />

            <button
              type="button"
              onClick={handleSendTest}
              disabled={sendingTest}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {sendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{sendingTest ? 'Sending...' : 'Send Test Alert'}</span>
            </button>
          </div>

          {testFeedback && (
            <div className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1 rounded-lg ${
              testFeedback.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
            }`}>
              <Check className="w-3.5 h-3.5" />
              <span>{testFeedback.message}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
