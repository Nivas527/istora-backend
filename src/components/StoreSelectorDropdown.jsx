import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ChevronDown, Plus, Check, Store, ExternalLink } from 'lucide-react';

export default function StoreSelectorDropdown({ isCompact = false }) {
  const {
    stores,
    activeStore,
    switchStore,
    setIsCreateStoreModalOpen,
    isDedicatedStore
  } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // In dedicated store mode, render as a clean static badge (never allow switching to other stores)
  if (isDedicatedStore) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-900 max-w-[200px]">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: activeStore?.accentColor || '#008060' }}
        />
        <span className="truncate">{activeStore?.name || 'Store'}</span>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-100/90 hover:bg-zinc-200/80 border border-zinc-200 text-xs font-semibold text-zinc-900 transition-all cursor-pointer max-w-[200px]"
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: activeStore.accentColor || '#008060' }}
        />
        <span className="truncate">{activeStore.name}</span>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-64 rounded-xl bg-white shadow-xl border border-zinc-200 py-1.5 z-50 animate-fadeIn">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 flex justify-between items-center">
            <span>Your Stores ({stores.length})</span>
            <span className="font-mono text-zinc-400">Multi-tenant</span>
          </div>

          <div className="max-h-56 overflow-y-auto py-1 divide-y divide-zinc-50">
            {stores.map((st) => {
              const isSelected = st.id === activeStore.id;
              return (
                <button
                  key={st.id}
                  onClick={() => {
                    switchStore(st.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-zinc-50 transition-colors cursor-pointer ${
                    isSelected ? 'bg-zinc-50 font-bold' : 'text-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: st.accentColor || '#008060' }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-zinc-900 leading-tight">{st.name}</p>
                      <p className="text-[10px] text-zinc-400 font-mono truncate">{st.subdomain}</p>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-[#008060] shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Create New Store Action */}
          <div className="p-1.5 border-t border-zinc-100">
            <button
              onClick={() => {
                setIsOpen(false);
                setIsCreateStoreModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#008060] text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Store</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
