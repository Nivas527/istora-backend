import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import GlobalHeader from '../common/GlobalHeader';
import StoreSelectorDropdown from '../StoreSelectorDropdown';
import ShopifyMigrationModal from './ShopifyMigrationModal';
import MerchantLoginView from './MerchantLoginView';
import DashboardView from './DashboardView';
import ProductsView from './ProductsView';
import OrdersView from './OrdersView';
import CustomersView from './CustomersView';
import DiscountsView from './DiscountsView';
import SettingsView from './SettingsView';
import ThemesView from './ThemesView';
import HostingDashboard from '../hosting/HostingDashboard';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  Settings,
  Palette,
  Layers,
  ExternalLink,
  Plus,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  LogOut,
  Key
} from 'lucide-react';

export default function AdminLayout() {
  const {
    adminTab,
    setAdminTab,
    setActiveMode,
    settings,
    products,
    unfulfilledOrdersCount,
    setIsCreateStoreModalOpen,
    deployments,
    isDedicatedStore,
    isImpersonating,
    isMerchantAuthenticated,
    merchantSession,
    logoutMerchant,
    privateMerchantToken
  } = useStore();

  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);

  // If not authenticated as merchant, display secure private merchant login gate
  if (!isMerchantAuthenticated) {
    return <MerchantLoginView />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Home / Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: unfulfilledOrdersCount > 0 ? unfulfilledOrdersCount : null, badgeColor: 'bg-amber-500' },
    { id: 'products', label: 'Products', icon: Package, badge: products.length, badgeColor: 'bg-zinc-200 text-zinc-700' },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'discounts', label: 'Discounts', icon: Tag },
    { id: 'import', label: 'Import from Shopify', icon: Sparkles, badge: 'Shopify', badgeColor: 'bg-emerald-100 text-emerald-800', isAction: true },
    { id: 'themes', label: 'Themes & Designs', icon: Palette },
    ...(!isDedicatedStore ? [{ id: 'hosting', label: 'React Hosting (Vercel)', icon: Layers, badge: (deployments || []).length, badgeColor: 'bg-zinc-900 text-emerald-400' }] : []),
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#f6f6f7] flex flex-col">
      {/* Top Global Command Hub / Module Switcher (Only shown if master admin or impersonating) */}
      <GlobalHeader currentSection="admin" />

      <div className="flex-1 flex">
        {/* Polaris Sidebar */}
        <aside className="w-64 bg-[#ebebeb]/90 border-r border-[#d2d5d8] flex flex-col justify-between shrink-0 hidden md:flex">
          <div>
            {/* Merchant Store Header & Switcher */}
            <div className="p-4 border-b border-[#d2d5d8]/70 space-y-2.5">
              {isDedicatedStore ? (
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white border border-zinc-200/90 shadow-xs">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-xs shrink-0"
                    style={{ backgroundColor: settings.accentColor || '#008060' }}
                  >
                    {(settings.storeName || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-900 truncate">
                      {settings.storeName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="text-[10px] font-mono text-zinc-500 truncate">
                        {settings.storeDomain}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Merchant Store
                    </span>
                    <button
                      onClick={() => setIsCreateStoreModalOpen(true)}
                      className="text-[10px] font-bold text-[#008060] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Store</span>
                    </button>
                  </div>
                  <StoreSelectorDropdown />
                </>
              )}
            </div>

            {/* Navigation Links */}
            <nav className="p-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = adminTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.isAction) {
                        setIsMigrationModalOpen(true);
                      } else {
                        setAdminTab(item.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/80'
                        : 'text-zinc-600 hover:bg-[#e4e5e7] hover:text-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#008060]' : 'text-zinc-500'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          item.badgeColor || 'bg-zinc-200 text-zinc-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Master Admin shortcut, Shopify Migrator card & Storefront Link */}
          <div className="p-3 border-t border-[#d2d5d8]/70 space-y-2">
            {/* Migrate from Shopify Card (Always accessible if merchant forgot during setup) */}
            <div className="p-3 bg-gradient-to-br from-emerald-950 via-emerald-900 to-zinc-900 rounded-xl text-white shadow-xs border border-emerald-700/50">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Migrate from Shopify</span>
              </div>
              <p className="text-[10px] text-zinc-300 leading-snug mb-2">
                Forgot to import during setup? Upload CSV or sync live store anytime.
              </p>
              <button
                type="button"
                onClick={() => setIsMigrationModalOpen(true)}
                className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
              >
                <span>Import Data Now</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {!isDedicatedStore && (
              <button
                onClick={() => setActiveMode('master')}
                className="w-full py-2 px-3 bg-gradient-to-r from-amber-500/10 to-rose-500/10 hover:from-amber-500/20 hover:to-rose-500/20 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Master Platform Admin</span>
              </button>
            )}

            <button
              onClick={() => setActiveMode('storefront')}
              className="w-full py-2 px-3 bg-white hover:bg-zinc-50 text-zinc-800 rounded-lg text-xs font-semibold border border-zinc-200 shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>View Online Store</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
            </button>

            {/* Merchant Session & Logout */}
            <div className="pt-2 border-t border-zinc-200/80 flex items-center justify-between text-[11px]">
              <div className="truncate max-w-[140px]">
                <p className="font-bold text-zinc-800 truncate">{merchantSession?.email || 'Store Owner'}</p>
                <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                  <Key className="w-2.5 h-2.5 text-violet-600" /> Private Session
                </p>
              </div>
              <button
                type="button"
                onClick={logoutMerchant}
                title="Log out of merchant admin"
                className="p-1.5 rounded-lg bg-zinc-100 hover:bg-rose-50 hover:text-rose-600 text-zinc-500 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Navbar */}
          <header className="h-14 bg-white border-b border-zinc-200 px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="md:hidden">
                <select
                  value={adminTab}
                  onChange={(e) => setAdminTab(e.target.value)}
                  className="bg-zinc-100 border border-zinc-200 text-xs font-semibold rounded px-2 py-1"
                >
                  {navItems.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <h1 className="text-sm font-bold text-zinc-800 capitalize hidden sm:block">
                  {navItems.find((n) => n.id === adminTab)?.label}
                </h1>
                <p className="text-[10px] text-zinc-400 font-mono hidden sm:block">
                  Tenant: {settings.storeDomain}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {!isDedicatedStore && (
                <>
                  <button
                    onClick={() => setActiveMode('master')}
                    className="text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1 border border-amber-200 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span className="hidden sm:inline">Master Ops</span>
                  </button>

                  <button
                    onClick={() => setActiveMode('hosting')}
                    className="text-xs font-bold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border border-zinc-300 transition-colors cursor-pointer"
                  >
                    <span>▲ React Hosting</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setActiveMode('storefront')}
                className="text-xs font-semibold text-[#008060] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>View Live Store</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              <div
                className="w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold shadow-xs"
                style={{ backgroundColor: settings.accentColor || '#18181b' }}
              >
                {(settings?.storeName || 'S').charAt(0)}
              </div>

              <button
                type="button"
                onClick={logoutMerchant}
                title="Log out of merchant admin"
                className="text-xs font-semibold text-zinc-600 hover:text-rose-600 hover:bg-rose-50 px-2 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </header>

          {/* Tab Body */}
          <main className="p-4 sm:p-8 flex-1 overflow-y-auto">
            {adminTab === 'dashboard' && (
              <DashboardView
                onNavigateTab={setAdminTab}
                onOpenImportModal={() => setIsMigrationModalOpen(true)}
              />
            )}
            {adminTab === 'products' && <ProductsView />}
            {adminTab === 'orders' && <OrdersView />}
            {adminTab === 'customers' && <CustomersView />}
            {adminTab === 'discounts' && <DiscountsView />}
            {adminTab === 'themes' && <ThemesView />}
            {adminTab === 'hosting' && <HostingDashboard />}
            {adminTab === 'settings' && <SettingsView />}
          </main>
        </div>
      </div>

      {/* Shopify Migration Modal */}
      <ShopifyMigrationModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
      />
    </div>
  );
}
