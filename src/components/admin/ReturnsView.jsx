import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  RotateCcw, CheckCircle2, AlertOctagon, Clock, Truck, FileText, 
  Sparkles, RefreshCcw, Loader2, Check, X, Eye, ShieldCheck, 
  ArrowRight, Download, Printer, Filter, MessageSquare
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import GstCreditNoteModal from './GstCreditNoteModal';

export default function ReturnsView() {
  const { activeStore } = useStore();
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'replacement_issued' | 'rejected'
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [selectedCreditNote, setSelectedCreditNote] = useState(null);
  const [selectedRmaForCreditNote, setSelectedRmaForCreditNote] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeStore?.id, filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await apiClient.getAdminReturns(activeStore?.id, filter, 50);
      if (list) setReturns(list);
    } catch (err) {
      console.warn('Failed to load returns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (rmaId, newStatus, notes = '') => {
    setActionLoadingId(`${rmaId}_${newStatus}`);
    setActionFeedback(null);
    try {
      const updated = await apiClient.updateReturnStatus(rmaId, {
        status: newStatus,
        adminNotes: notes || (newStatus === 'approved' ? 'Approved after inspection. GST Credit Note generated.' : 'Status updated.')
      }, activeStore?.id);

      setActionFeedback({
        id: rmaId,
        message: newStatus === 'approved'
          ? `RMA ${rmaId} approved! Official GST Credit Note (${updated?.creditNoteNumber || 'Issued'}) generated & customer notified.`
          : `RMA ${rmaId} marked as ${newStatus.replace('_', ' ')}.`
      });

      await loadData();
    } catch (err) {
      console.error('Failed to update status:', err);
      setActionFeedback({
        id: rmaId,
        error: true,
        message: 'Failed to update return status.'
      });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setActionFeedback(null), 6000);
    }
  };

  const pendingCount = returns.filter(r => r.status === 'pending').length;
  const approvedCount = returns.filter(r => r.status === 'approved' || r.status === 'completed').length;
  const totalRefundAmount = returns.reduce((acc, r) => acc + (r.totalRefundAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-600 text-white shadow-xs">
              <RotateCcw className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black text-zinc-900 tracking-tight">
              Self-Service Returns & RMA Management
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              Rule 54 GST Ready
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Review customer returns, inspect biometric fit mismatch insights, issue replacements, and generate GST Credit Notes.
          </p>
        </div>

        <button
          onClick={loadData}
          title="Refresh Returns"
          className="p-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Inspection */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-amber-800 mb-1">
            <span>Pending Inspection</span>
            <span className="p-1 rounded-md bg-amber-100 text-amber-900">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-black text-amber-950 font-mono tracking-tight">
            {pendingCount}
          </p>
          <p className="text-[11px] text-amber-700/80 mt-1">
            Requests awaiting merchant review
          </p>
        </div>

        {/* Total Approved */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800 mb-1">
            <span>Approved RMAs</span>
            <span className="p-1 rounded-md bg-emerald-100 text-emerald-900">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-950 font-mono tracking-tight">
            {approvedCount}
          </p>
          <p className="text-[11px] text-emerald-700/80 mt-1">
            Reversals processed & credited
          </p>
        </div>

        {/* GST Credit Notes Issued */}
        <div className="bg-white p-5 rounded-2xl border border-indigo-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-800 mb-1">
            <span>GST Credit Notes</span>
            <span className="p-1 rounded-md bg-indigo-100 text-indigo-900">
              <FileText className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-black text-indigo-950 font-mono tracking-tight">
            {returns.filter(r => r.creditNoteNumber).length}
          </p>
          <p className="text-[11px] text-indigo-700/80 mt-1">
            Rule 54 electronic tax memos
          </p>
        </div>

        {/* Return Value */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-600 mb-1">
            <span>Total RMA Value</span>
            <span className="p-1 rounded-md bg-zinc-100 text-zinc-700">
              <RotateCcw className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-black text-zinc-950 font-mono tracking-tight">
            ₹{totalRefundAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">
            Combined refund & replacement total
          </p>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-bold animate-fadeIn ${
          actionFeedback.error 
            ? 'bg-rose-50 border-rose-200 text-rose-800' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionFeedback.message}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-zinc-400 hover:text-zinc-700">✕</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 bg-white p-3 rounded-xl border border-zinc-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          All RMAs ({returns.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === 'pending'
              ? 'bg-amber-600 text-white'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          Pending Inspection ({returns.filter(r => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === 'approved'
              ? 'bg-emerald-600 text-white'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          Approved ({returns.filter(r => r.status === 'approved' || r.status === 'completed').length})
        </button>
        <button
          onClick={() => setFilter('replacement_issued')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === 'replacement_issued'
              ? 'bg-indigo-600 text-white'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          Replacements Issued ({returns.filter(r => r.status === 'replacement_issued').length})
        </button>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        {returns.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 space-y-2">
            <RotateCcw className="w-8 h-8 mx-auto text-zinc-300" />
            <p className="text-xs font-bold text-zinc-700">No RMA return requests found</p>
            <p className="text-[11px] text-zinc-500">
              When shoppers initiate returns from the tracking modal or account portal, they appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold">
                  <th className="py-3.5 px-4">RMA / Order</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Type & Reason</th>
                  <th className="py-3.5 px-4">Fit Diagnostic / Notes</th>
                  <th className="py-3.5 px-4">Refund Value</th>
                  <th className="py-3.5 px-4">Reverse Courier</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 font-sans">
                {returns.map((rma) => (
                  <tr key={rma.id} className="hover:bg-zinc-50/70 transition-colors">
                    
                    {/* RMA & Order */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-zinc-900 font-mono">{rma.orderNumber}</p>
                      <span className="text-[10px] text-zinc-400 font-mono block">{rma.id}</span>
                      <span className="text-[10px] text-zinc-400">{rma.createdAt ? new Date(rma.createdAt).toLocaleDateString('en-IN') : 'Recent'}</span>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-zinc-900">{rma.customerName}</p>
                      <p className="text-[11px] text-zinc-500 font-mono">{rma.customerEmail}</p>
                      <p className="text-[10px] text-zinc-400">{rma.customerPhone}</p>
                    </td>

                    {/* Type & Reason */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rma.type === 'exchange' ? 'bg-indigo-100 text-indigo-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {rma.type === 'exchange' ? 'Exchange (Size Replacement)' : 'Return (Full Refund)'}
                      </span>
                      <p className="text-[11px] font-semibold text-zinc-700 mt-1 capitalize">
                        {rma.reason?.replace('_', ' ')}
                      </p>
                    </td>

                    {/* Fit Diagnostic / Notes */}
                    <td className="py-3.5 px-4 max-w-xs">
                      {rma.fitInsight ? (
                        <div className="p-2 rounded-lg bg-purple-50 border border-purple-200/80 text-[11px] text-purple-950 space-y-0.5">
                          <p className="font-bold flex items-center gap-1 text-purple-900">
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            Size Check Insight:
                          </p>
                          <p className="text-[10px] leading-tight text-purple-900/90">{rma.fitInsight}</p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-600 truncate">{rma.reasonDetails || 'Standard return request.'}</p>
                      )}
                    </td>

                    {/* Refund Value */}
                    <td className="py-3.5 px-4 font-bold font-mono text-zinc-900">
                      ₹{rma.totalRefundAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Reverse Courier */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-zinc-800">{rma.pickupCourier || 'Delhivery'}</p>
                      <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded font-bold">
                        {rma.pickupTrackingNumber || 'Pending AWB'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {rma.status === 'approved' || rma.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3" /> Approved
                        </span>
                      ) : rma.status === 'replacement_issued' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          <Truck className="w-3 h-3" /> Replaced
                        </span>
                      ) : rma.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <X className="w-3 h-3" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" /> Pending Review
                        </span>
                      )}
                    </td>

                    {/* Approval Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {rma.creditNoteNumber ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRmaForCreditNote(rma);
                              setSelectedCreditNote(rma.creditNote);
                            }}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[11px] border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-3 h-3 text-indigo-600" />
                            <span>Credit Note ({rma.creditNoteNumber.replace('CN-2026/', '#')})</span>
                          </button>
                        ) : null}

                        {rma.status === 'pending' ? (
                          <>
                            {/* Approve Button */}
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(rma.id, 'approved')}
                              disabled={actionLoadingId === `${rma.id}_approved`}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              {actionLoadingId === `${rma.id}_approved` ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              <span>Approve</span>
                            </button>

                            {/* Issue Replacement Button */}
                            {rma.type === 'exchange' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(rma.id, 'replacement_issued', 'Replacement size prepared and dispatched.')}
                                disabled={actionLoadingId === `${rma.id}_replacement_issued`}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {actionLoadingId === `${rma.id}_replacement_issued` ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Truck className="w-3 h-3" />
                                )}
                                <span>Replace</span>
                              </button>
                            )}

                            {/* Reject Button */}
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(rma.id, 'rejected', 'Does not meet return eligibility criteria.')}
                              disabled={actionLoadingId === `${rma.id}_rejected`}
                              className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* GST Credit Note Modal Viewer */}
      {selectedCreditNote && (
        <GstCreditNoteModal
          creditNote={selectedCreditNote}
          returnRequest={selectedRmaForCreditNote}
          onClose={() => {
            setSelectedCreditNote(null);
            setSelectedRmaForCreditNote(null);
          }}
        />
      )}
    </div>
  );
}

