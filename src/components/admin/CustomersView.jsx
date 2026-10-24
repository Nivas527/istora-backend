import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Users, Mail, MapPin, DollarSign, ShoppingBag } from 'lucide-react';

export default function CustomersView() {
  const { customers } = useStore();

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-xs">
      <div className="p-4 border-b border-zinc-200 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-zinc-900">Customer Directory (CRM)</h3>
          <p className="text-xs text-zinc-500">Track lifetime customer orders and average spend</p>
        </div>
        <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full">
          {customers.length} total customers
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold">
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Orders</th>
              <th className="py-3 px-4">Total Spent</th>
              <th className="py-3 px-4">Tags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/60">
            {customers.map((cust) => (
              <tr key={cust.id} className="hover:bg-zinc-50/70 transition-colors">
                <td className="py-3 px-4">
                  <p className="font-bold text-zinc-900">{cust.name}</p>
                  <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
                    <Mail className="w-3 h-3 text-zinc-400" />
                    {cust.email}
                  </p>
                </td>

                <td className="py-3 px-4 text-zinc-600 flex items-center gap-1.5 pt-4">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{cust.city || 'United States'}</span>
                </td>

                <td className="py-3 px-4 font-semibold text-zinc-800">
                  {cust.ordersCount} orders
                </td>

                <td className="py-3 px-4 font-bold text-emerald-700">
                  ${cust.totalSpent.toFixed(2)}
                </td>

                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {cust.tags.map((t) => (
                      <span key={t} className="text-[10px] bg-zinc-100 text-zinc-600 font-medium px-2 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
