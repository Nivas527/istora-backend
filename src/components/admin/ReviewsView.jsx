import React, { useState, useEffect } from 'react';
import {
  Star,
  CheckCircle,
  ThumbsUp,
  MessageSquare,
  Search,
  Filter,
  Image as ImageIcon,
  Video,
  Send,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Loader2,
  RefreshCw,
  CornerDownRight,
  Download,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useStore } from '../../context/StoreContext';

export default function ReviewsView() {
  const { activeStore, products } = useStore();
  const [reviewsData, setReviewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStar, setSelectedStar] = useState('all');
  const [filterWithMedia, setFilterWithMedia] = useState(false);
  const [filterNeedsReply, setFilterNeedsReply] = useState(false);

  // Merchant Reply State
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getReviews(null, activeStore?.id);
      if (data) {
        setReviewsData(data);
      }
    } catch (err) {
      console.error('Failed to load reviews in admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [activeStore?.id]);

  const handleSendReply = async (reviewId) => {
    if (!replyText.trim()) return;

    setIsSubmittingReply(true);
    try {
      const updated = await apiClient.addMerchantReply(reviewId, replyText.trim(), activeStore?.id);
      if (updated) {
        setReviewsData((prev) => ({
          ...prev,
          reviews: prev.reviews.map((r) =>
            r.id === reviewId ? { ...r, merchantReply: updated.merchantReply, merchantReplyAt: updated.merchantReplyAt } : r
          )
        }));
        setActionSuccess('Merchant reply published successfully!');
        setReplyingId(null);
        setReplyText('');
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Failed to post reply:', err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const allReviews = reviewsData?.reviews || [];
  const totalReviews = reviewsData?.totalReviews || allReviews.length || 0;
  const averageRating = reviewsData?.averageRating?.toFixed(1) || '5.0';
  const totalMedia = reviewsData?.mediaCount || 0;

  // Filter reviews
  const filteredReviews = allReviews.filter((r) => {
    if (selectedStar !== 'all' && r.rating !== Number(selectedStar)) return false;
    if (filterWithMedia && (!r.mediaUrls || r.mediaUrls.length === 0)) return false;
    if (filterNeedsReply && Boolean(r.merchantReply)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.customerName?.toLowerCase().includes(q);
      const matchComment = r.comment?.toLowerCase().includes(q);
      const matchTitle = r.title?.toLowerCase().includes(q);
      if (!matchName && !matchComment && !matchTitle) return false;
    }

    return true;
  });

  const verifiedPercent = totalReviews > 0
    ? Math.round((allReviews.filter((r) => r.verifiedBuyer).length / totalReviews) * 100)
    : 100;

  // Export reviews to CSV
  const handleExportCsv = () => {
    if (allReviews.length === 0) return;
    const headers = ['Review ID', 'Product ID', 'Customer Name', 'Email', 'Rating', 'Title', 'Comment', 'Verified', 'Fit Rating', 'Helpful Votes', 'Merchant Reply', 'Created At'];
    const rows = allReviews.map((r) => [
      `"${r.id}"`,
      `"${r.productId}"`,
      `"${r.customerName.replace(/"/g, '""')}"`,
      `"${r.customerEmail || ''}"`,
      r.rating,
      `"${(r.title || '').replace(/"/g, '""')}"`,
      `"${(r.comment || '').replace(/"/g, '""')}"`,
      r.verifiedBuyer ? 'YES' : 'NO',
      `"${r.customerFitRating || 'true_to_size'}"`,
      r.helpfulVotes || 0,
      `"${(r.merchantReply || '').replace(/"/g, '""')}"`,
      `"${r.createdAt}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Customer_Reviews_${activeStore?.slug || 'store'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Action Notification */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 text-xs font-semibold">Average Rating</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900">{averageRating}</span>
            <span className="text-xs text-amber-600 font-bold">/ 5.0</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Across all catalog products</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 text-xs font-semibold">Total Reviews</span>
            <MessageSquare className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900">{totalReviews}</span>
            <span className="text-xs text-emerald-600 font-bold">Live</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">{allReviews.filter((r) => !r.merchantReply).length} awaiting reply</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 text-xs font-semibold">Verified Buyers</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900">{verifiedPercent}%</span>
            <span className="text-xs text-blue-600 font-bold">Verified</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Matched against real orders</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 text-xs font-semibold">UGC Photos & Videos</span>
            <ImageIcon className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900">{totalMedia}</span>
            <span className="text-xs text-purple-600 font-bold">Assets</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Real-life shopper try-on media</p>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer, text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#008060] w-48"
            />
          </div>

          {/* Star Filter Dropdown */}
          <select
            value={selectedStar}
            onChange={(e) => setSelectedStar(e.target.value)}
            className="px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#008060]"
          >
            <option value="all">All Star Ratings</option>
            <option value="5">5 Stars only</option>
            <option value="4">4 Stars only</option>
            <option value="3">3 Stars only</option>
            <option value="2">2 Stars only</option>
            <option value="1">1 Star only</option>
          </select>

          {/* UGC Media Pill */}
          <button
            onClick={() => setFilterWithMedia(!filterWithMedia)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              filterWithMedia
                ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Has UGC Media</span>
          </button>

          {/* Awaiting Reply Pill */}
          <button
            onClick={() => setFilterNeedsReply(!filterNeedsReply)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              filterNeedsReply
                ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            <CornerDownRight className="w-3.5 h-3.5" />
            <span>Needs Store Reply</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadReviews}
            className="p-1.5 rounded-lg border border-zinc-300 hover:bg-zinc-50 text-zinc-600 transition-colors cursor-pointer"
            title="Refresh reviews"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCsv}
            disabled={allReviews.length === 0}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Reviews Moderation Table & List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 bg-white rounded-xl border border-zinc-200 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Loading reviews from database...</span>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-12 bg-white rounded-xl border border-dashed border-zinc-200 text-center text-xs text-zinc-500 space-y-2">
            <MessageSquare className="w-8 h-8 text-zinc-300 mx-auto" />
            <p className="font-bold text-zinc-800">No reviews found matching the active criteria</p>
            <p className="text-zinc-400">Try clearing filters or search query</p>
          </div>
        ) : (
          filteredReviews.map((rev) => {
            const product = products.find((p) => p.id === rev.productId);

            return (
              <div
                key={rev.id}
                className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs space-y-3 transition-all hover:border-zinc-300"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                      {rev.customerName?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900">{rev.customerName}</span>
                        {rev.verifiedBuyer && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full font-bold border border-emerald-200">
                            <CheckCircle className="w-3 h-3" />
                            <span>Verified Buyer</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        {rev.customerEmail ? rev.customerEmail : 'Guest customer'} • Product:{' '}
                        <strong>{product?.title || rev.productId}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                    <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-zinc-100 font-semibold text-zinc-700">
                      Fit: {rev.customerFitRating === 'runs_small' ? 'Runs Small' : rev.customerFitRating === 'runs_large' ? 'Runs Large' : 'True to Size'}
                    </span>
                    <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Stars and Content */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'
                        }`}
                      />
                    ))}
                    {rev.title && (
                      <span className="text-xs font-bold text-zinc-900 ml-1.5">{rev.title}</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed">{rev.comment}</p>
                </div>

                {/* UGC Media Attachments */}
                {rev.mediaUrls && rev.mediaUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {rev.mediaUrls.map((m, idx) => (
                      <a
                        key={idx}
                        href={m.url}
                        target="_blank"
                        rel="noreferrer"
                        className="relative w-14 h-14 rounded-lg overflow-hidden border border-zinc-200 group block shadow-2xs hover:scale-105 transition-transform"
                      >
                        {m.type === 'video' ? (
                          <video src={m.url} className="w-full h-full object-cover" />
                        ) : (
                          <img src={m.url} alt="Review attachment" className="w-full h-full object-cover" />
                        )}
                      </a>
                    ))}
                  </div>
                )}

                {/* Merchant Reply Section */}
                {rev.merchantReply ? (
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-zinc-900 flex items-center gap-1">
                        <CornerDownRight className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Store Owner Official Reply</span>
                      </span>
                      <button
                        onClick={() => {
                          setReplyingId(rev.id);
                          setReplyText(rev.merchantReply);
                        }}
                        className="text-[11px] text-emerald-700 font-bold hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-zinc-600 pl-4 text-[11px]">{rev.merchantReply}</p>
                  </div>
                ) : null}

                {/* Inline Reply Form */}
                {replyingId === rev.id ? (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 animate-fadeIn text-xs">
                    <p className="font-bold text-emerald-950">Write store reply to {rev.customerName}:</p>
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="e.g. Thank you so much for the feedback! Delighted the sizing fit you well..."
                      className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setReplyingId(null)}
                        className="px-3 py-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={isSubmittingReply}
                        onClick={() => handleSendReply(rev.id)}
                        className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingReply ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        <span>Publish Reply</span>
                      </button>
                    </div>
                  </div>
                ) : !rev.merchantReply ? (
                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-zinc-400">
                      👍 {rev.helpfulVotes || 0} customer helpful votes
                    </span>
                    <button
                      onClick={() => {
                        setReplyingId(rev.id);
                        setReplyText('');
                      }}
                      className="px-3 py-1 bg-zinc-900 hover:bg-black text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3 text-emerald-400" />
                      <span>Reply to Customer</span>
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
