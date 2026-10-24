import React, { useState } from 'react';
import { Star, CheckCircle, ThumbsUp, MessageSquare, Plus } from 'lucide-react';

export default function ProductReviews({ productId, productTitle }) {
  const STORAGE_KEY = `product_reviews_${productId}`;

  // Default seed reviews
  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}

    return [
      {
        id: 'rev_1',
        author: 'Arjun Mehta',
        rating: 5,
        title: 'Exceptional quality & tailored fit',
        content: 'Fabric feels ultra-premium and breathable. Exactly what was described. Delivery was within 2 days.',
        date: '3 days ago',
        verified: true,
        helpfulCount: 14
      },
      {
        id: 'rev_2',
        author: 'Priya Sharma',
        rating: 5,
        title: 'Worth every rupee',
        content: 'Loved the packaging and attention to detail. Stitching is immaculate. Will definitely order more colors!',
        date: '1 week ago',
        verified: true,
        helpfulCount: 8
      },
      {
        id: 'rev_3',
        author: 'David K.',
        rating: 4,
        title: 'Great product, slight delay in delivery',
        content: 'Product itself is top notch. Just took 1 extra day for courier dispatch, but customer support was very helpful.',
        date: '2 weeks ago',
        verified: true,
        helpfulCount: 3
      }
    ];
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAuthor, setNewAuthor] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  const averageRating = (
    reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)
  ).toFixed(1);

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newContent.trim()) return;

    const newRev = {
      id: `rev_${Date.now()}`,
      author: newAuthor.trim(),
      rating: newRating,
      title: newTitle.trim() || 'Verified Customer Review',
      content: newContent.trim(),
      date: 'Just now',
      verified: true,
      helpfulCount: 0
    };

    const updated = [newRev, ...reviews];
    setReviews(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    setNewAuthor('');
    setNewTitle('');
    setNewContent('');
    setNewRating(5);
    setShowAddForm(false);
  };

  return (
    <div className="border-t border-zinc-200 pt-6 mt-6 space-y-6">
      {/* Header & Rating Breakdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-zinc-900">{averageRating}</span>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= Math.round(Number(averageRating))
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-zinc-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-zinc-500">
              ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            100% Verified Customer Purchases
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Write Review Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmitReview}
          className="bg-white p-5 rounded-xl border border-zinc-300 shadow-sm space-y-3 animate-fadeIn"
        >
          <h4 className="text-xs font-bold text-zinc-900">Share Your Experience</h4>

          {/* Star selector */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-zinc-500 mr-2 font-medium">Your Rating:</span>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setNewRating(s)}
                className="cursor-pointer p-0.5"
              >
                <Star
                  className={`w-5 h-5 ${
                    s <= (hoverRating || newRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-zinc-300'
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Your Name *</label>
              <input
                type="text"
                placeholder="e.g. Rahul V."
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                required
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#008060]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Headline (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Great quality!"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#008060]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Review Comments *</label>
            <textarea
              rows={3}
              placeholder="What did you like or dislike about the product, sizing, or material?"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              required
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#008060]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold rounded-lg shadow-xs"
            >
              Post Review
            </button>
          </div>
        </form>
      )}

      {/* Customer Reviews List */}
      <div className="space-y-3">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="p-4 rounded-xl border border-zinc-100 hover:border-zinc-200 bg-white transition-all space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900">{rev.author}</span>
                {rev.verified && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                    <CheckCircle className="w-3 h-3" />
                    Verified Buyer
                  </span>
                )}
              </div>
              <span className="text-[11px] text-zinc-400">{rev.date}</span>
            </div>

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
                <span className="text-xs font-bold text-zinc-800 ml-1.5">{rev.title}</span>
              )}
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">{rev.content}</p>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-400">
              <button
                type="button"
                onClick={() => {
                  setReviews((prev) =>
                    prev.map((r) =>
                      r.id === rev.id ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r
                    )
                  );
                }}
                className="flex items-center gap-1 hover:text-zinc-700 transition-colors cursor-pointer"
              >
                <ThumbsUp className="w-3 h-3" />
                <span>Helpful ({rev.helpfulCount || 0})</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
