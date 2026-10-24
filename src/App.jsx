import React, { useState, useRef } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import LauncherHub from './components/hub/LauncherHub';
import GlobalHeader from './components/common/GlobalHeader';
import Navigation from './components/Navigation';
import HeroBanner from './components/storefront/HeroBanner';
import ProductGrid from './components/storefront/ProductGrid';
import ProductDetailModal from './components/storefront/ProductDetailModal';
import CartDrawer from './components/storefront/CartDrawer';
import CheckoutPage from './components/storefront/CheckoutPage';
import OrderConfirmationModal from './components/storefront/OrderConfirmationModal';
import OrderTrackingModal from './components/storefront/OrderTrackingModal';
import CreateStoreModal from './components/CreateStoreModal';
import ThemeMarketplaceModal from './components/ThemeMarketplaceModal';
import AdminLayout from './components/admin/AdminLayout';
import MasterAdminLayout from './components/master/MasterAdminLayout';
import ApiExplorer from './components/api/ApiExplorer';
import HostingDashboard from './components/hosting/HostingDashboard';
import HostedAppRunner from './components/hosting/HostedAppRunner';

function MainApp() {
  const {
    activeMode,
    setActiveMode,
    settings,
    activeTheme,
    deployments,
    selectedProductForQuickView,
    setSelectedProductForQuickView,
    isCreateStoreModalOpen,
    setIsCreateStoreModalOpen,
    isThemeMarketplaceOpen,
    setIsThemeMarketplaceOpen,
    isDedicatedStore,
    isImpersonating
  } = useStore();

  // If visiting a dedicated store domain without master impersonation, restrict views to storefront or admin only
  const effectiveMode = (isDedicatedStore && !isImpersonating && !['storefront', 'admin'].includes(activeMode))
    ? (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') ? 'admin' : 'storefront')
    : activeMode;

  const [isCheckoutActive, setIsCheckoutActive] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [distZipViewMode, setDistZipViewMode] = useState('app'); // 'app' | 'catalog'

  const catalogRef = useRef(null);

  const scrollToCatalog = () => {
    const el = document.getElementById('catalog-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOrderPlaced = (newOrder) => {
    setIsCheckoutActive(false);
    setCompletedOrder(newOrder);
  };

  return (
    <>
      {/* View by Active Mode */}
      {effectiveMode === 'hub' ? (
        <LauncherHub />
      ) : effectiveMode === 'hosting' ? (
        <HostingDashboard />
      ) : effectiveMode === 'master' ? (
        <MasterAdminLayout />
      ) : effectiveMode === 'admin' ? (
        <AdminLayout />
      ) : effectiveMode === 'api' ? (
        <div className="min-h-screen bg-[#0d0f12] text-zinc-100 flex flex-col">
          <GlobalHeader currentSection="api" />
          <div className="flex-1 bg-[#090a0f]">
            <ApiExplorer />
          </div>
        </div>
      ) : (
        <div className={`min-h-screen flex flex-col ${(activeTheme?.styles?.pageBg) || 'bg-[#f6f6f7] text-zinc-900'} ${(activeTheme?.styles?.fontHeading) || 'font-sans'}`}>
          {/* Checkout Screen or Storefront View */}
          {isCheckoutActive ? (
            <CheckoutPage
              onBackToStore={() => setIsCheckoutActive(false)}
              onOrderPlaced={handleOrderPlaced}
            />
          ) : (
            <>
              {/* If store design is a custom dist.zip theme */}
              {activeTheme?.isCustomDistZip ? (
                <div className="flex-1 flex flex-col">
                  {/* Top Switcher Banner */}
                  <div className="bg-zinc-950 text-white px-4 py-2 border-b border-zinc-800 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 shadow-md sticky top-0 z-50">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-zinc-300">
                        Custom dist.zip Storefront: <strong className="text-white">{activeTheme.name}</strong>
                      </span>
                      <span className="bg-purple-900/60 text-purple-300 border border-purple-700/60 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Live React Web App
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                        <button
                          onClick={() => setDistZipViewMode('app')}
                          className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                            distZipViewMode === 'app'
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          ⚡ Live Web App
                        </button>
                        <button
                          onClick={() => setDistZipViewMode('catalog')}
                          className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                            distZipViewMode === 'catalog'
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          🛍️ Store Catalog
                        </button>
                      </div>

                      <button
                        onClick={() => setActiveMode('admin')}
                        className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-semibold border border-zinc-700 cursor-pointer"
                      >
                        Change Design
                      </button>
                    </div>
                  </div>

                  {distZipViewMode === 'app' ? (
                    <div className="flex-1 w-full bg-black">
                      <HostedAppRunner
                        deployment={
                          (deployments || []).find((d) => d.id === activeTheme.deploymentId) || {
                            id: activeTheme.deploymentId || 'theme_dist',
                            name: activeTheme.name,
                            isDistZip: true,
                            files: activeTheme.files || {}
                          }
                        }
                        isStandalone={true}
                        isStorefrontRunner={true}
                      />
                    </div>
                  ) : (
                    <main className="flex-1 pb-16">
                      <Navigation
                        onSearchClick={() => {
                          const input = document.querySelector('input[placeholder*="Filter by keyword"]');
                          if (input) input.focus();
                          scrollToCatalog();
                        }}
                        onTrackClick={() => {
                          setTrackingOrderNumber('');
                          setIsTrackingModalOpen(true);
                        }}
                      />
                      <HeroBanner onExploreClick={scrollToCatalog} />
                      <ProductGrid
                        onSelectProduct={(p) => setSelectedProductForQuickView(p)}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                      />
                    </main>
                  )}
                </div>
              ) : (
                <main className="flex-1 pb-16">
                  <Navigation
                    onSearchClick={() => {
                      const input = document.querySelector('input[placeholder*="Filter by keyword"]');
                      if (input) input.focus();
                      scrollToCatalog();
                    }}
                    onTrackClick={() => {
                      setTrackingOrderNumber('');
                      setIsTrackingModalOpen(true);
                    }}
                  />
                  <HeroBanner onExploreClick={scrollToCatalog} />
                  <ProductGrid
                    onSelectProduct={(p) => setSelectedProductForQuickView(p)}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                  />
                </main>
              )}

              {/* Clean Customer-Facing Storefront Footer */}
              <footer className="bg-zinc-950 text-zinc-400 py-12 border-t border-zinc-800 text-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-zinc-200 font-bold">{settings.storeName}</span>
                    <span>• {settings.customDomain || settings.storeDomain}</span>
                  </div>

                  {isDedicatedStore ? (
                    <div className="flex items-center space-x-6 text-[11px]">
                      <button
                        onClick={() => {
                          setTrackingOrderNumber('');
                          setIsTrackingModalOpen(true);
                        }}
                        className="hover:text-emerald-400 underline cursor-pointer"
                      >
                        Track Order
                      </button>
                      <span className="text-zinc-600">•</span>
                      <span>Support: {settings.contactEmail}</span>
                      <span className="text-zinc-600">•</span>
                      <button
                        onClick={() => setActiveMode('admin')}
                        className="hover:text-zinc-200 text-zinc-600 cursor-pointer text-[10px]"
                        title="Merchant Portal Login"
                      >
                        Merchant Login
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setActiveMode('hub')}
                        className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 cursor-pointer bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-emerald-500/50 transition-all"
                      >
                        <span>⊞ Launchpad</span>
                      </button>
                      <button
                        onClick={() => setActiveMode('admin')}
                        className="hover:text-white underline cursor-pointer"
                      >
                        Store Admin
                      </button>
                      <button
                        onClick={() => setActiveMode('master')}
                        className="hover:text-white underline cursor-pointer"
                      >
                        Master Admin
                      </button>
                      <button
                        onClick={() => setActiveMode('hosting')}
                        className="hover:text-white underline cursor-pointer"
                      >
                        Deployments
                      </button>
                      <button
                        onClick={() => setActiveMode('api')}
                        className="hover:text-white underline cursor-pointer"
                      >
                        API Explorer
                      </button>
                    </div>
                  )}
                </div>
              </footer>
            </>
          )}

          {/* Storefront-specific Modals */}
          {selectedProductForQuickView && (
            <ProductDetailModal
              product={selectedProductForQuickView}
              onClose={() => setSelectedProductForQuickView(null)}
            />
          )}

          <CartDrawer
            onProceedToCheckout={() => {
              setIsCheckoutActive(true);
            }}
          />

          {completedOrder && (
            <OrderConfirmationModal
              order={completedOrder}
              onClose={() => setCompletedOrder(null)}
              onGoToAdmin={() => {
                setCompletedOrder(null);
                setActiveMode('admin');
              }}
              onTrackOrder={(orderNumber) => {
                setCompletedOrder(null);
                setTrackingOrderNumber(orderNumber);
                setIsTrackingModalOpen(true);
              }}
            />
          )}

          {/* Customer Order Tracking Modal */}
          {isTrackingModalOpen && (
            <OrderTrackingModal
              initialOrderNumber={trackingOrderNumber}
              onClose={() => setIsTrackingModalOpen(false)}
            />
          )}
        </div>
      )}

      {/* Global Multi-Tenant Store Creation Modal */}
      {isCreateStoreModalOpen && (
        <CreateStoreModal onClose={() => setIsCreateStoreModalOpen(false)} />
      )}

      {/* Global Developer Theme Marketplace Modal */}
      {isThemeMarketplaceOpen && (
        <ThemeMarketplaceModal onClose={() => setIsThemeMarketplaceOpen(false)} />
      )}
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <MainApp />
    </StoreProvider>
  );
}
