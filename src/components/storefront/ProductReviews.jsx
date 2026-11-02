import React, { useState, useEffect, useRef } from 'react';
import {
  Star,
  CheckCircle,
  ThumbsUp,
  MessageSquare,
  Plus,
  Image as ImageIcon,
  Video,
  Upload,
  X,
  Play,
  Filter,
  Sparkles,
  ShieldCheck,
  CornerDownRight,
  Send,
  Loader2,
  Check
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useStore } from '../../context/StoreContext';

export default function ProductReviews({ productId, productTitle }) {
  const { customer, isAuthenticated } = useCustomerAuth();
  const { activeStore, activeMode } = useStore();
  const isMerchant = activeMode === 'admin' || activeMode === 'master';

  const [reviewsData, setReviewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStarFilter, setActiveStarFilter] = useState(null); // null | 5 | 4 | 3 | 2 | 1
  const [withMediaOnly, setWithMediaOnly] = useState(false);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAuthor, setNewAuthor] = useState(customer?.name || '');
  const [newEmail, setNewEmail] = useState(customer?.email || '');
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newFitFeedback, setNewFitFeedback] = useState('true_to_size');
  const [hoverRating, setHoverRating] = useState(0);
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState(null);

  // Media Lightbox Modal
  const [activeLightboxMedia, setActiveLightboxMedia] = useState(null);

  // Merchant Reply State (for in-place reply by store owners)
  const [replyingReviewId, setReplyingReviewId] = useState(null);
  const [merchantReplyText, setMerchantReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Voted helpful set to prevent double voting in session
  const [votedHelpful, setVotedHelpful] = useState(new Set());

  const fileInputRef = useRef(null);

  // Sync customer details when auth changes
  useEffect(() => {
    if (customer) {
      if (!newAuthor) setNewAuthor(customer.name || '');
      if (!newEmail) setNewEmail(customer.email || '');
    }
  }, [customer]);

  // Load reviews from backend
  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getReviews(productId, activeStore?.id, activeStarFilter, withMediaOnly);
      if (data) {
        setReviewsData(data);
      }
    } catch (err) {
      console.warn('Failed to load reviews from API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [productId, activeStore?.id, activeStarFilter, withMediaOnly]);

  // Handle UGC File Upload
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingMedia(true);
    try {
      for (const file of files) {
        const uploaded = await apiClient.uploadReviewMedia(file);
        if (uploaded && uploaded.url) {
          setUploadedMedia((prev) => [...prev, uploaded]);
        }
      }
    } catch (err) {
      console.error('Failed to upload review media:', err);
    } finally {
      setIsUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveMedia = (index) => {
    setUploadedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Review Form
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    try {
      const reviewPayload = {
        productId,
        customerName: newAuthor.trim(),
        customerEmail: newEmail.trim(),
        rating: newRating,
        title: newTitle.trim() || 'Verified Customer Review',
        comment: newContent.trim(),
        customerFitRating: newFitFeedback,
        mediaUrls: uploadedMedia,
        verifiedBuyer: isAuthenticated || Boolean(newEmail.trim())
      };

      await apiClient.submitReview(reviewPayload, activeStore?.id);

      setSubmitSuccessMsg('Thank you! Your verified review and media have been posted.');
      setShowAddForm(false);
      setNewTitle('');
      setNewContent('');
      setUploadedMedia([]);
      setNewRating(5);

      // Reload updated reviews and histogram
      await loadReviews();
      setTimeout(() => setSubmitSuccessMsg(null), 5000);
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upvote Helpful
  const handleVoteHelpful = async (reviewId) => {
    if (votedHelpful.has(reviewId)) return;

    setVotedHelpful((prev) => new Set(prev).add(reviewId));
    try {
      await apiClient.voteReviewHelpful(reviewId);
      // Optimistic local update
      setReviewsData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          reviews: prev.reviews.map((r) =>
            r.id === reviewId ? { ...r, helpfulVotes: (r.helpfulVotes || 0) + 1 } : r
          )
        };
      });
    } catch (err) {
      console.error('Failed to vote helpful:', err);
    }
  };

  // Submit Merchant Response
  const handleSendMerchantReply = async (reviewId) => {
    if (!merchantReplyText.trim()) return;

    setIsSendingReply(true);
    try {
      const updated = await apiClient.addMerchantReply(reviewId, merchantReplyText.trim(), activeStore?.id);
      if (updated) {
        setReviewsData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            reviews: prev.reviews.map((r) =>
              r.id === reviewId
                ? {
                    ...r,
                    merchantReply: updated.merchantReply,
                    merchantReplyAt: updated.merchantReplyAt
                  }
                : r
            )
          };
        });
      }
      setReplyingReviewId(null);
      setMerchantReplyText('');
    } catch (err) {
      console.error('Failed to send merchant reply:', err);
    } finally {
      setIsSendingReply(false);
    }
  };

  // Rating Stars label helper
  const getRatingLabel = (r) => {
    switch (r) {
      case 5:
        return '5 Stars • Excellent, exceeded expectations!';
      case 4:
        return '4 Stars • Very good, happy with quality';
      case 3:
        return '3 Stars • Average, fits okay';
      case 2:
        return '2 Stars • Below expectations';
      case 1:
        return '1 Star • Poor, would not recommend';
      default:
        return '';
    }
  };

  const reviewsList = reviewsData?.reviews || [];
  const averageRating = reviewsData?.averageRating?.toFixed(1) || '5.0';
  const totalReviews = reviewsData?.totalReviews || reviewsList.length || 0;
  const ratingCounts = reviewsData?.ratingCounts || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const ratingPercentages = reviewsData?.ratingPercentages || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const fitFeedback = reviewsData?.fitFeedback || { trueToSizePercent: 88, runsSmallPercent: 8, runsLargePercent: 4 };

  // Collect all UGC media across reviews for the top gallery strip
  const allUgcMedia = reviewsList.flatMap((r) =>
    (r.mediaUrls || []).map((m) => ({ ...m, author: r.customerName, rating: r.rating }))
  );

  return (
    <div className="border-t border-zinc-200 pt-8 mt-8 space-y-6">
      {/* Success Notification */}
      {submitSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-fadeIn shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{submitSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSubmitSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Review Breakdown Header & Histogram */}
      <div className="bg-zinc-50 dark:bg-zinc-850/60 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Overall Score & Fit Gauge */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-zinc-900 dark:text-white">{averageRating}</span>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(Number(averageRating))
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-300 dark:text-zinc-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Based on {totalReviews} {totalReviews === 1 ? 'verified review' : 'verified reviews'}
                </span>
              </div>
            </div>

            {/* Size & Fit Meter Summary */}
            <div className="flex items-center gap-2 pt-1 text-xs">
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{fitFeedback.trueToSizePercent}% True to Size</span>
              </span>
              <span className="text-zinc-400 text-[11px]">
                ({fitFeedback.runsSmallPercent}% runs small • {fitFeedback.runsLargePercent}% runs large)
              </span>
            </div>
          </div>

          {/* Center: 5★ to 1★ Interactive Histogram */}
          <div className="flex-1 max-w-xs space-y-1.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratingCounts[stars] || 0;
              const pct = ratingPercentages[stars] || 0;
              const isSelected = activeStarFilter === stars;

              return (
                <button
                  key={stars}
                  type="button"
                  onClick={() => setActiveStarFilter(isSelected ? null : stars)}
                  className={`w-full flex items-center gap-2 text-xs group cursor-pointer transition-all ${
                    isSelected ? 'font-bold text-emerald-600' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                  }`}
                  title={`Filter by ${stars} Stars (${count})`}
                >
                  <span className="w-12 text-left font-mono text-[11px] flex items-center gap-1">
                    <span>{stars}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                  </span>
                  <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isSelected ? 'bg-emerald-600' : 'bg-amber-400 group-hover:bg-amber-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono text-[10px] text-zinc-400">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Write Review Trigger */}
          <div className="flex flex-col sm:items-end justify-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Write a Review</span>
            </button>
            <p className="text-[10px] text-zinc-400 text-center sm:text-right">
              Earn 50 Reward Points on photo reviews
            </p>
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs">
          <span className="text-zinc-400 text-[11px] font-semibold flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" />
            <span>Filter:</span>
          </span>

          <button
            onClick={() => setActiveStarFilter(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeStarFilter === null && !withMediaOnly
                ? 'bg-zinc-900 text-white'
                : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
            }`}
          >
            All ({totalReviews})
          </button>

          <button
            onClick={() => setWithMediaOnly(!withMediaOnly)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              withMediaOnly
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
            <span>With Photos & Videos ({allUgcMedia.length})</span>
          </button>

          {activeStarFilter && (
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-lg font-bold text-[11px]">
              <span>Filtered: {activeStarFilter} Stars</span>
              <button
                onClick={() => setActiveStarFilter(null)}
                className="hover:text-red-600 font-bold ml-1 cursor-pointer"
              >
                ×
              </button>
            </span>
          )}
        </div>
      </div>

      {/* UGC Customer Photos & Videos Horizontal Gallery Strip */}
      {allUgcMedia.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Customer Photos & Videos ({allUgcMedia.length})</span>
            </h4>
            <span className="text-[10px] text-zinc-400">Click to enlarge</span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {allUgcMedia.map((media, idx) => (
              <div
                key={idx}
                onClick={() => setActiveLightboxMedia(media)}
                className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 group shrink-0 cursor-pointer shadow-xs hover:shadow-md transition-all hover:scale-105"
              >
                {media.type === 'video' ? (
                  <>
                    <video
                      src={media.url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-white/90 text-zinc-900 flex items-center justify-center shadow-xs">
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      </div>
                    </div>
                  </>
                ) : (
                  <img
                    src={media.url}
                    alt={media.caption || 'Customer review photo'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1 text-[9px] text-white truncate">
                  {media.author}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write a Verified Review Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmitReview}
          className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-300 dark:border-zinc-700 shadow-xl space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Write a Verified Customer Review</h4>
              <p className="text-[11px] text-zinc-500">Share your genuine fit and fabric experience with the community</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Star Rating Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Overall Rating *
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setNewRating(s)}
                  className="cursor-pointer p-1 transition-transform hover:scale-125"
                >
                  <Star
                    className={`w-6 h-6 ${
                      s <= (hoverRating || newRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-zinc-300 dark:text-zinc-600'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 ml-2">
                {getRatingLabel(hoverRating || newRating)}
              </span>
            </div>
          </div>

          {/* 2. Size & Fit Feedback Option */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              How did this garment fit you?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'runs_small', label: 'Runs Small', desc: 'Tight in shoulders/chest' },
                { id: 'true_to_size', label: 'True to Size', desc: 'Fits exactly as expected' },
                { id: 'runs_large', label: 'Runs Large', desc: 'Roomy / relaxed ease' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setNewFitFeedback(opt.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    newFitFeedback === opt.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300 bg-zinc-50/50 dark:bg-zinc-800/40'
                  }`}
                >
                  <p className="text-xs font-bold">{opt.label}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Name & Email Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Your Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Arjun Mehta"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                required
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#008060]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Email Address (For Verified Purchase Badge) *
              </label>
              <input
                type="email"
                placeholder="e.g. arjun@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#008060]"
              />
            </div>
          </div>

          {/* 4. Review Headline & Details */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Review Title / Headline (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Best everyday tee I have owned!"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#008060]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Detailed Written Review *
            </label>
            <textarea
              rows={3}
              placeholder="How was the fabric quality, drape, wash durability, and delivery experience?"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              required
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#008060]"
            />
          </div>

          {/* 5. UGC Photo & Video Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Attach Fit Photos & Unboxing Videos (UGC)
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
                id="ugc-media-upload"
              />
              <label
                htmlFor="ugc-media-upload"
                className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
              >
                {isUploadingMedia ? (
                  <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 text-emerald-600" />
                )}
                <span>{isUploadingMedia ? 'Uploading media...' : 'Upload Photos or Videos'}</span>
              </label>
              <span className="text-[11px] text-zinc-400">
                Supports JPG, PNG, WebP (≤10MB) & MP4/MOV videos (≤25MB)
              </span>
            </div>

            {/* Preview of Uploaded Media */}
            {uploadedMedia.length > 0 && (
              <div className="flex flex-wrap gap-2.5 pt-2">
                {uploadedMedia.map((media, idx) => (
                  <div
                    key={idx}
                    className="relative w-16 h-16 rounded-xl overflow-hidden border border-zinc-300 dark:border-zinc-700 group"
                  >
                    {media.type === 'video' ? (
                      <video src={media.url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={media.url} alt="Uploaded review" className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(idx)}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end items-center gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingMedia}
              className="px-5 py-2 bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Posting Review...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Submit Verified Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Customer Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Loading authentic customer reviews...</span>
          </div>
        ) : reviewsList.length === 0 ? (
          <div className="py-8 text-center bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 space-y-2">
            <MessageSquare className="w-6 h-6 text-zinc-300 dark:text-zinc-600 mx-auto" />
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">No reviews found matching this filter</p>
            <p className="text-[11px] text-zinc-400">Be the first verified customer to share photos and review this garment!</p>
          </div>
        ) : (
          reviewsList.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs space-y-3 transition-all hover:border-zinc-300"
            >
              {/* Review Header: Author, Verified Badge, Date, Fit tag */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {rev.customerName?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">
                        {rev.customerName}
                      </span>
                      {rev.verifiedBuyer && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-800 px-2 py-0.2 rounded-full font-bold">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Verified Buyer</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                  {rev.customerFitRating && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-sans font-semibold">
                      Fit:{' '}
                      {rev.customerFitRating === 'runs_small'
                        ? 'Runs Small'
                        : rev.customerFitRating === 'runs_large'
                        ? 'Runs Large'
                        : 'True to Size'}
                    </span>
                  )}
                  <span>
                    {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                  </span>
                </div>
              </div>

              {/* Stars & Title */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-200 dark:text-zinc-700'
                      }`}
                    />
                  ))}
                </div>
                {rev.title && (
                  <span className="text-xs font-extrabold text-zinc-900 dark:text-white">
                    {rev.title}
                  </span>
                )}
              </div>

              {/* Written Review Text */}
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {rev.comment}
              </p>

              {/* UGC Attached Photos & Videos */}
              {rev.mediaUrls && rev.mediaUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {rev.mediaUrls.map((media, mIdx) => (
                    <div
                      key={mIdx}
                      onClick={() => setActiveLightboxMedia({ ...media, author: rev.customerName, rating: rev.rating })}
                      className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 cursor-pointer shadow-2xs hover:scale-105 transition-transform group"
                    >
                      {media.type === 'video' ? (
                        <>
                          <video src={media.url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <Play className="w-4 h-4 fill-white text-white" />
                          </div>
                        </>
                      ) : (
                        <img
                          src={media.url}
                          alt="Customer review photo"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Official Merchant Response Box */}
              {rev.merchantReply && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-750 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-white">
                      <CornerDownRight className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Store Owner Response</span>
                    </div>
                    {rev.merchantReplyAt && (
                      <span className="text-zinc-400 text-[10px]">
                        {new Date(rev.merchantReplyAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-300 pl-5 text-[11px] leading-relaxed">
                    {rev.merchantReply}
                  </p>
                </div>
              )}

              {/* Bottom Actions: Helpful Upvote & Merchant Reply trigger */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleVoteHelpful(rev.id)}
                  className={`flex items-center gap-1.5 font-medium transition-colors cursor-pointer px-2 py-1 rounded-lg ${
                    votedHelpful.has(rev.id)
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 font-bold'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                  title="Upvote as helpful review"
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${votedHelpful.has(rev.id) ? 'fill-emerald-600' : ''}`} />
                  <span>Helpful ({rev.helpfulVotes || 0})</span>
                </button>

                {/* In-Place Merchant Reply Trigger (for Store Admin) */}
                {isMerchant && (
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingReviewId(replyingReviewId === rev.id ? null : rev.id);
                      setMerchantReplyText(rev.merchantReply || '');
                    }}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{rev.merchantReply ? 'Edit Store Reply' : 'Reply as Store Owner'}</span>
                  </button>
                )}
              </div>

              {/* Inline Merchant Reply Input Form */}
              {replyingReviewId === rev.id && (
                <div className="mt-2 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 animate-fadeIn text-xs">
                  <p className="font-bold text-emerald-950">Reply to {rev.customerName}'s review:</p>
                  <textarea
                    rows={2}
                    value={merchantReplyText}
                    onChange={(e) => setMerchantReplyText(e.target.value)}
                    placeholder="Write an official merchant reply..."
                    className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReplyingReviewId(null)}
                      className="px-2.5 py-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSendingReply}
                      onClick={() => handleSendMerchantReply(rev.id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      {isSendingReply ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      <span>Post Store Reply</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* UGC Media Fullscreen Lightbox Modal */}
      {activeLightboxMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActiveLightboxMedia(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="p-3 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold">{activeLightboxMedia.author}</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3 h-3 ${
                        s <= (activeLightboxMedia.rating || 5)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-600'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveLightboxMedia(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Media Body */}
            <div className="max-h-[75vh] flex items-center justify-center bg-black">
              {activeLightboxMedia.type === 'video' ? (
                <video
                  src={activeLightboxMedia.url}
                  controls
                  autoPlay
                  className="max-h-[75vh] w-full object-contain"
                />
              ) : (
                <img
                  src={activeLightboxMedia.url}
                  alt={activeLightboxMedia.caption || 'Review media'}
                  className="max-h-[75vh] w-full object-contain"
                />
              )}
            </div>

            {activeLightboxMedia.caption && (
              <div className="p-3 bg-zinc-950 text-xs text-zinc-300 border-t border-zinc-800">
                {activeLightboxMedia.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
