import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Play, Volume2, VolumeX, X, Sparkles, Video, ArrowUpRight, ShoppingBag } from 'lucide-react';

export default function PreviewVideosSection() {
  const { activeStore, products, addToCart, setIsCartOpen } = useStore();
  const [activeModalVideo, setActiveModalVideo] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  const previewVideos = activeStore?.previewVideos || [];

  if (!previewVideos || previewVideos.length === 0) {
    return null;
  }

  return (
    <section className="mx-4 sm:mx-6 lg:mx-8 my-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 gap-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#008060] uppercase tracking-wider mb-1">
            <Video className="w-4 h-4" />
            <span>Store Reels & Video Previews</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
            Watch Before You Buy
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Short interactive unboxings, live sound demonstrations, and design walk-throughs
          </p>
        </div>
        <div className="text-[11px] font-mono text-zinc-400">
          {previewVideos.length} / 5 Clips Available
        </div>
      </div>

      {/* Video Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {previewVideos.map((video) => {
          const linkedProduct = video.productId ? products.find((p) => p.id === video.productId) : null;

          return (
            <div
              key={video.id}
              onClick={() => setActiveModalVideo(video)}
              className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-200/80 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
            >
              {/* Background Video Looper (Muted preview) */}
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                src={video.videoUrl}
              />

              {/* Top Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 pointer-events-none" />

              {/* Play Badge */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] font-semibold border border-white/10">
                <Play className="w-2.5 h-2.5 fill-white" />
                <span>{video.durationSeconds ? `${video.durationSeconds}s` : 'Reel'}</span>
              </div>

              {/* Center Floating Play Icon on Hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-white/90 text-zinc-900 flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-transform">
                  <Play className="w-5 h-5 fill-zinc-900 ml-0.5" />
                </div>
              </div>

              {/* Bottom Details */}
              <div className="absolute bottom-0 inset-x-0 p-3 text-white flex flex-col justify-end">
                <p className="text-xs font-bold leading-tight line-clamp-2 drop-shadow-sm mb-1.5">
                  {video.title}
                </p>

                {linkedProduct && (
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 text-[11px]">
                    <span className="truncate font-medium">{linkedProduct.title}</span>
                    <span className="font-extrabold ml-1.5 text-emerald-400">
                      {activeStore?.currencySymbol || '$'}{linkedProduct.price}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Reel / Video Modal Player */}
      {activeModalVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn font-sans">
          <div className="relative bg-zinc-950 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-zinc-800 flex flex-col">
            {/* Top Bar with Close & Sound controls */}
            <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between text-white">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md transition-colors cursor-pointer border border-white/10"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveModalVideo(null)}
                className="p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md transition-colors cursor-pointer border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-[9/16] w-full bg-black flex items-center justify-center">
              <video
                autoPlay
                loop
                muted={isMuted}
                playsInline
                controls
                className="w-full h-full object-cover"
                src={activeModalVideo.videoUrl}
              />
            </div>

            {/* Bottom Linked Product Drawer */}
            <div className="p-4 bg-zinc-900 border-t border-zinc-800">
              <h3 className="text-sm font-bold text-white mb-2">{activeModalVideo.title}</h3>

              {(() => {
                const linked = activeModalVideo.productId
                  ? products.find((p) => p.id === activeModalVideo.productId)
                  : products[0];

                if (!linked) return null;

                return (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={linked.image}
                        alt={linked.title}
                        className="w-10 h-10 rounded-lg object-cover bg-zinc-950 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{linked.title}</p>
                        <p className="text-xs font-bold text-emerald-400 font-mono">
                          {activeStore?.currencySymbol || '$'}{linked.price}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        addToCart(linked);
                        setIsCartOpen(true);
                        setActiveModalVideo(null);
                      }}
                      className="px-3 py-1.5 bg-[#008060] hover:bg-[#006e52] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Buy Now</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
