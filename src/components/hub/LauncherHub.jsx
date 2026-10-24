import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import StoreSelectorDropdown from '../StoreSelectorDropdown';
import {
  ShoppingBag,
  Sliders,
  ShieldCheck,
  Rocket,
  Terminal,
  ExternalLink,
  Plus,
  ArrowRight,
  CheckCircle2,
  Layers,
  Sparkles,
  Server,
  Zap,
  Globe,
  Database
} from 'lucide-react';

export default function LauncherHub() {
  const {
    activeMode,
    setActiveMode,
    settings,
    stores,
    products,
    unfulfilledOrdersCount,
    deployments,
    setIsCreateStoreModalOpen
  } = useStore();

  const [hoveredCard, setHoveredCard] = useState(null);

  const destinations = [
    {
      id: 'storefront',
      badge: 'Customer Facing',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: ShoppingBag,
      iconBg: 'from-emerald-500 to-teal-600',
      iconShadow: 'shadow-emerald-500/20',
      accentColor: '#10b981',
      title: 'User Store',
      subtitle: 'Customer Storefront Experience',
      description:
        'Live multi-tenant shopping storefront. Browse dynamic catalog categories, quick view modal, cart drawer, and complete checkout.',
      tags: ['Catalog Grid', 'Cart Drawer', 'Instant Checkout', 'Theme Responsive'],
      statsLabel: 'Active Store',
      statsValue: `${settings.storeName || 'Store'} (${products.length} Products)`,
      actionText: 'Launch Storefront',
      onSelect: () => setActiveMode('storefront')
    },
    {
      id: 'admin',
      badge: 'Merchant Operations',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      icon: Sliders,
      iconBg: 'from-blue-500 to-indigo-600',
      iconShadow: 'shadow-blue-500/20',
      accentColor: '#3b82f6',
      title: 'Store Admin',
      subtitle: 'Merchant Control Console',
      description:
        'Manage inventory, fulfill orders with live status tracking, configure promo discounts, edit theme styles, and manage store settings.',
      tags: ['Order Fulfillment', 'Inventory Manager', 'Discounts', 'Theme Editor'],
      statsLabel: 'Pending Orders',
      statsValue: unfulfilledOrdersCount > 0 ? `${unfulfilledOrdersCount} unfulfilled` : 'All orders fulfilled',
      actionText: 'Open Store Admin',
      onSelect: () => setActiveMode('admin')
    },
    {
      id: 'master',
      badge: 'Super Admin',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: ShieldCheck,
      iconBg: 'from-amber-500 via-orange-500 to-rose-600',
      iconShadow: 'shadow-amber-500/20',
      accentColor: '#f59e0b',
      title: 'Master Admin',
      subtitle: 'Platform Fleet Operations',
      description:
        'Global multi-tenant control plane. Audit aggregate GMV, inspect platform health, create new stores, and impersonate any merchant store.',
      tags: ['Store Directory', 'Global Metrics', 'Tenant Impersonation', 'Fleet Health'],
      statsLabel: 'Total Stores',
      statsValue: `${stores.length} Active Merchants`,
      actionText: 'Enter Master Admin',
      onSelect: () => setActiveMode('master')
    },
    {
      id: 'hosting',
      badge: 'Vercel React Engine',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      icon: Rocket,
      iconBg: 'from-purple-500 via-fuchsia-500 to-pink-600',
      iconShadow: 'shadow-purple-500/20',
      accentColor: '#a855f7',
      title: 'Deployment Section',
      subtitle: 'React & dist.zip Edge Hosting',
      description:
        'Deploy React applications, unpack production dist.zip bundles, edit code live with runtime esbuild compiler, and preview apps on edge routes.',
      tags: ['dist.zip Unpack', 'Live Preview Runner', 'esbuild Compiler', 'Custom Domains'],
      statsLabel: 'Deployments',
      statsValue: `${(deployments || []).length} Hosted Apps Live`,
      actionText: 'Open Hosting Engine',
      onSelect: () => setActiveMode('hosting')
    },
    {
      id: 'api',
      badge: 'Developer & Swagger',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      icon: Terminal,
      iconBg: 'from-cyan-500 to-blue-600',
      iconShadow: 'shadow-cyan-500/20',
      accentColor: '#06b6d4',
      title: 'API Section',
      subtitle: 'Shopify REST & C# .NET 10 API',
      description:
        'Interactive REST testing harness for Shopify Option-Variant APIs and ASP.NET Core 10 backend endpoints. Direct access to Swagger UI.',
      tags: ['Option-Variant REST', 'C# ASP.NET Core', 'Live Swagger UI', 'JSON Schema'],
      statsLabel: 'Backend Engine',
      statsValue: 'Kestrel .NET 10 (Port 5200)',
      actionText: 'Explore REST API',
      onSelect: () => setActiveMode('api'),
      hasExternalSwagger: true
    }
  ];

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-emerald-500 selection:text-black">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-emerald-500/10 via-indigo-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/5 blur-3xl pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  Shopify REA Engine
                </span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  .NET 10 & React
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Multi-Tenant E-Commerce • Vercel React Hosting • Unified Command Hub
              </p>
            </div>
          </div>

          {/* Right Actions: Store Selector & Swagger quick button */}
          <div className="flex items-center space-x-3">
            <a
              href="http://localhost:5200/swagger"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-cyan-400 border border-cyan-500/30 transition-all hover:border-cyan-400 cursor-pointer shadow-sm"
              title="Open ASP.NET Core Swagger Documentation"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Swagger UI</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>

            <div className="hidden sm:block">
              <StoreSelectorDropdown />
            </div>

            <button
              onClick={() => setIsCreateStoreModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/30 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Store</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-10 sm:py-16 flex flex-col justify-center">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Unified Application Launcher</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
            Where would you like to go?
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Select a specialized module below to launch directly into the customer storefront, merchant store admin, master fleet control, React edge hosting, or the API test suite.
          </p>
        </div>

        {/* 5 Destination Cards Grid: 3 on top row, 2 wide on bottom row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {destinations.map((dest, idx) => {
            const Icon = dest.icon;
            const isHovered = hoveredCard === dest.id;
            const colSpanClass = idx < 3 ? 'lg:col-span-2' : 'lg:col-span-3 md:col-span-1';

            return (
              <div
                key={dest.id}
                onMouseEnter={() => setHoveredCard(dest.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={dest.onSelect}
                className={`group relative rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-6 flex flex-col justify-between transition-all duration-300 cursor-pointer backdrop-blur-xl hover:border-zinc-600 hover:-translate-y-1.5 hover:shadow-2xl ${colSpanClass}`}
                style={{
                  boxShadow: isHovered
                    ? `0 20px 40px -15px ${dest.accentColor}25, 0 0 0 1px ${dest.accentColor}40`
                    : undefined
                }}
              >
                {/* Top Badge & Icon */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${dest.iconBg} flex items-center justify-center text-white shadow-lg ${dest.iconShadow} group-hover:scale-105 transition-transform duration-300`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${dest.badgeColor}`}
                    >
                      {dest.badge}
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                    {dest.title}
                  </h3>
                  <p className="text-xs font-medium text-zinc-400 mb-3">
                    {dest.subtitle}
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-5">
                    {dest.description}
                  </p>

                  {/* Feature Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {dest.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer: Context Stat & Primary Action Button */}
                <div className="pt-4 border-t border-zinc-800/80 mt-auto">
                  <div className="flex items-center justify-between text-xs mb-4">
                    <span className="text-zinc-500 font-medium">{dest.statsLabel}:</span>
                    <span className="text-zinc-300 font-semibold truncate max-w-[170px]">
                      {dest.statsValue}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dest.onSelect();
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 group-hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-sm"
                    >
                      <span>{dest.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {dest.hasExternalSwagger && (
                      <a
                        href="http://localhost:5200/swagger"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2.5 rounded-xl bg-zinc-800 hover:bg-cyan-600/30 text-cyan-400 border border-zinc-700 hover:border-cyan-500 transition-colors cursor-pointer"
                        title="Open Swagger in new tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Platform Architecture Overview */}
        <div className="mt-14 p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              <strong className="text-white">Full Stack Architecture:</strong> ASP.NET Core 10 Kestrel Backend on port <code className="text-emerald-400 bg-zinc-800 px-1.5 py-0.5 rounded">5200</code> connected to React 19 Frontend
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Multi-Tenant DB Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-purple-400" />
              <span>Edge Hosting Online</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>esbuild JSX Runtime</span>
            </div>
          </div>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-zinc-800/60 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Shopify REA & React Edge Hosting Engine. Multi-tenant isolation & zero-config deployment.</p>
          <div className="flex items-center gap-4 text-zinc-400">
            <button
              onClick={() => setActiveMode('storefront')}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Storefront
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveMode('admin')}
              className="hover:text-blue-400 transition-colors cursor-pointer"
            >
              Store Admin
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveMode('master')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Master Admin
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveMode('hosting')}
              className="hover:text-purple-400 transition-colors cursor-pointer"
            >
              Deployments
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveMode('api')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              API Explorer
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
