import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Tag, Plus, Check } from 'lucide-react';

export default function DiscountsView() {
  const { discounts } = useStore();

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs">
        <h3 className="text-sm font-bold text-zinc-900">Active Discount & Promotion Rules</h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          Coupons processed by the Shopify cart calculation engine during storefront checkout.
        </p>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {discounts.map((d) => (
            <div key={d.code} className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-[#008060] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  {d.code}
                </span>
                <span className="text-[10px] uppercase font-bold text-zinc-400">
                  {d.type}
                </span>
              </div>
              <p className="text-xs font-semibold text-zinc-800">{d.description}</p>
              <p className="text-[11px] text-zinc-500">
                Min. subtotal: ${d.minSubtotal.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
