import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import StoreSelectorDropdown from '../StoreSelectorDropdown';
import {
  LayoutGrid,
  ShoppingBag,
  Sliders,
  ShieldCheck,
  Rocket,
  Terminal,
  ChevronDown,
  ExternalLink,
  Plus,
  ArrowLeft
} from 'lucide-react';

export default function GlobalHeader({ currentSection, rightContent }) {
  const {
    activeMode,
    setActiveMode,
    settings,
    stores,
    unfulfilledOrdersCount,
    deployments,
    setIsCreateStoreModalOpen,
    isImpersonating,
    exitImpersonation,
    isDedicatedStore
  } = useStore();

  // In dedicated store mode (storefront or admin), hide the platform command bar completely unless Master Admin is impersonating
  if (isDedicatedStore && !isImpersonating) {
    return null;
  }

  // If Master Admin is impersonating a dedicated store, show ONLY the return banner
  if (isDedicatedStore && isImpersonating) {
    return (
      <div className="bg-amber-500 text-zinc-950 px-4 py-1.5 text-xs font-bold flex items-center justify-between shadow-xs sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-zinc-950" />
          <span>Master Admin Impersonation: Currently managing <u>{settings.storeName}</u></span>
        </div>
        <button
          onClick={exitImpersonation}
          className="bg-zinc-950 hover:bg-black text-white px-2.5 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Return to Master Console</span>
        </button>
      </div>
    );
  }

  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const sections = [
    {
      id: 'storefront',
      label: 'User Store',
      icon: ShoppingBag,
      color: 'text-emerald-400',
      activeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      id: 'admin',
      label: 'Store Admin',
      icon: Sliders,
      color: 'text-blue-400',
      activeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      badge: unfulfilledOrdersCount > 0 ? unfulfilledOrdersCount : null
    },
    {
      id: 'master',
      label: 'Master Admin',
      icon: ShieldCheck,
      color: 'text-amber-400',
      activeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    {
      id: 'hosting',
      label: 'Deployment Section',
      icon: Rocket,
      color: 'text-purple-400',
      activeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      badge: (deployments || []).length
    },
    {
      id: 'api',
      label: 'API Section',
      icon: Terminal,
      color: 'text-cyan-400',
      activeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
    }
  ];

  const current = sections.find((s) => s.id === (currentSection || activeMode)) || sections[0];
  const CurrentIcon = current.icon;

  return (
    <div className="w-full bg-[#0d0f12] text-zinc-200 border-b border-zinc-800/80 sticky top-0 z-50 backdrop-blur-md">
      {/* Impersonation Banner if Master Admin entered a store */}
      {isImpersonating && (
        <div className="bg-amber-500 text-zinc-950 px-4 py-1.5 text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-zinc-950" />
            <span>Master Admin Impersonation: Currently managing <u>{settings.storeName}</u></span>
          </div>
          <button
            onClick={exitImpersonation}
            className="bg-zinc-950 hover:bg-black text-white px-2.5 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Return to Master Console</span>
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between text-xs">
        {/* Left: Back to Launchpad + Destination Switcher */}
        <div className="flex items-center space-x-3">
          {/* Main Launch Hub Button */}
          <button
            onClick={() => setActiveMode('hub')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-bold transition-all border border-zinc-700/80 hover:border-emerald-500/50 cursor-pointer shadow-xs group"
            title="Return to Launch Hub"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="font-extrabold tracking-tight">Launchpad</span>
          </button>

          <span className="text-zinc-600 font-mono">/</span>

          {/* Current Section Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-semibold cursor-pointer transition-colors"
            >
              <CurrentIcon className={`w-3.5 h-3.5 ${current.color}`} />
              <span className="font-bold text-white">{current.label}</span>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>

            {isSwitcherOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsSwitcherOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-56 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl py-1.5 z-50 backdrop-blur-xl">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                    Navigate Module
                  </div>
                  {sections.map((sec) => {
                    const Icon = sec.icon;
                    const isActive = sec.id === (currentSection || activeMode);

                    return (
                      <button
                        key={sec.id}
                        onClick={() => {
                          setActiveMode(sec.id);
                          setIsSwitcherOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-zinc-800 text-white font-bold'
                            : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-3.5 h-3.5 ${sec.color}`} />
                          <span>{sec.label}</span>
                        </div>
                        {sec.badge && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {sec.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  <div className="border-t border-zinc-800 my-1 pt-1">
                    <button
                      onClick={() => {
                        setActiveMode('hub');
                        setIsSwitcherOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/10 font-bold transition-colors cursor-pointer"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Back to All Launch Options</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick inline pills on medium+ screens */}
          <div className="hidden lg:flex items-center space-x-1 pl-2 border-l border-zinc-800">
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isActive = sec.id === (currentSection || activeMode);
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveMode(sec.id)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    isActive
                      ? `${sec.activeBg} font-bold shadow-xs border`
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon className={`w-3 h-3 ${sec.color}`} />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content / Store Info */}
        <div className="flex items-center space-x-2">
          {rightContent}

          <div className="hidden sm:block">
            <StoreSelectorDropdown />
          </div>

          <a
            href="http://localhost:5200/swagger"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border border-cyan-500/30 text-[11px] font-bold transition-colors cursor-pointer"
            title="Swagger UI API Docs"
          >
            <Terminal className="w-3 h-3" />
            <span>Swagger</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
          </a>
        </div>
      </div>
    </div>
  );
}
