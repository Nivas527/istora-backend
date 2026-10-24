import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Terminal, Play, Copy, CheckCircle, Database, Code, Globe, Shield, ExternalLink } from 'lucide-react';

export default function ApiExplorer() {
  const { products, orders, customers, settings, cart } = useStore();

  const endpoints = [
    {
      id: 'get-products',
      method: 'GET',
      path: '/admin/api/2024-01/products.json',
      title: 'Shopify Admin API: List Products',
      description: 'Returns products formatted with standard Shopify Option-Variant REST JSON payload.',
      getData: () => ({
        products: products.map((p) => ({
          id: p.id,
          title: p.title,
          handle: p.handle,
          vendor: p.vendor,
          product_type: p.productType,
          created_at: p.createdAt,
          tags: p.tags ? p.tags.join(', ') : '',
          variants: p.variants.map((v) => ({
            id: v.id,
            product_id: p.id,
            title: v.title,
            price: v.price.toFixed(2),
            sku: v.sku,
            inventory_quantity: v.inventoryQuantity,
            option1: v.option1 || null,
            option2: v.option2 || null,
            option3: v.option3 || null
          })),
          options: p.options.map((opt, i) => ({
            id: `opt_${i + 1}`,
            product_id: p.id,
            name: opt.name,
            position: i + 1,
            values: opt.values
          })),
          images: p.images.map((img, i) => ({
            id: `img_${i + 1}`,
            product_id: p.id,
            position: i + 1,
            src: img
          }))
        }))
      })
    },
    {
      id: 'get-orders',
      method: 'GET',
      path: '/admin/api/2024-01/orders.json',
      title: 'Shopify Admin API: List Orders',
      description: 'Returns orders with financial and fulfillment statuses matching Shopify schema.',
      getData: () => ({
        orders: orders.map((o) => ({
          id: o.id,
          order_number: o.orderNumber,
          financial_status: o.financialStatus,
          fulfillment_status: o.fulfillmentStatus,
          total_price: o.total.toFixed(2),
          subtotal_price: o.subtotal.toFixed(2),
          total_tax: (o.tax || 0).toFixed(2),
          currency: settings.currency,
          customer: {
            first_name: o.customer.firstName,
            last_name: o.customer.lastName,
            email: o.customer.email
          },
          line_items: o.items.map((item) => ({
            id: item.variantId,
            title: item.title,
            variant_title: item.variantTitle,
            quantity: item.quantity,
            price: item.price.toFixed(2)
          })),
          created_at: o.createdAt
        }))
      })
    },
    {
      id: 'get-shop',
      method: 'GET',
      path: '/admin/api/2024-01/shop.json',
      title: 'Shopify Admin API: Shop Configuration',
      description: 'Returns shop metadata, currency, and multi-tenant domain configuration.',
      getData: () => ({
        shop: {
          id: 84920184,
          name: settings.storeName,
          email: settings.contactEmail,
          domain: settings.storeDomain,
          currency: settings.currency,
          money_format: `${settings.currencySymbol}{{amount}}`,
          plan_name: 'Shopify Plus (Reverse-Engineered)',
          taxes_included: false,
          tax_rate: settings.taxRate
        }
      })
    },
    {
      id: 'get-cart',
      method: 'GET',
      path: '/api/storefront/cart.json',
      title: 'Shopify Storefront API: Active Cart State',
      description: 'Current client-side cart session state and discount calculations.',
      getData: () => ({
        cart: {
          id: 'cart_session_local',
          lines: cart.items.map((i) => ({
            id: i.variantId,
            quantity: i.quantity,
            merchandise: {
              id: i.variantId,
              title: i.variantTitle,
              price: { amount: i.price.toFixed(2), currencyCode: settings.currency }
            }
          })),
          applied_discount_code: cart.discountCode
        }
      })
    }
  ];

  const [selectedEndpoint, setSelectedEndpoint] = useState(endpoints[0]);
  const [responseJson, setResponseJson] = useState(JSON.stringify(endpoints[0].getData(), null, 2));
  const [responseHeaders, setResponseHeaders] = useState({
    'status': '200 OK',
    'x-shopify-shop-api-call-limit': '2/40',
    'x-request-id': 'req_' + Math.random().toString(36).substring(2, 9),
    'content-type': 'application/json; charset=utf-8'
  });
  const [copied, setCopied] = useState(false);

  const handleRun = (ep) => {
    setSelectedEndpoint(ep);
    const data = ep.getData();
    setResponseJson(JSON.stringify(data, null, 2));
    setResponseHeaders({
      'status': '200 OK',
      'x-shopify-shop-api-call-limit': `${Math.floor(Math.random() * 5) + 1}/40`,
      'x-request-id': 'req_' + Math.random().toString(36).substring(2, 9),
      'content-type': 'application/json; charset=utf-8'
    });
  };

  const copyResponse = () => {
    navigator.clipboard?.writeText(responseJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Intro banner */}
      <div className="bg-zinc-950 text-white p-6 rounded-2xl border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Terminal className="w-4 h-4" />
            <span>Shopify REST & Storefront API Simulation</span>
          </div>
          <h2 className="text-xl font-black text-white">Reverse-Engineered API Explorer</h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            This explorer demonstrates exact schema parity with Shopify's public Admin REST API (`/admin/api/2024-01/...`). Endpoints execute directly against your live store state.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="http://localhost:5200/swagger"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors shadow-md cursor-pointer"
            title="Launch interactive Swagger UI"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Launch Swagger UI (Port 5200)</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>

          <div className="flex items-center gap-2 bg-zinc-900 px-3.5 py-2 rounded-xl border border-zinc-800 text-xs font-mono text-emerald-400">
            <Globe className="w-3.5 h-3.5" />
            <span>https://{settings.storeDomain}</span>
          </div>
        </div>
      </div>

      {/* Main Split View: Endpoints Selector & Live Response Payload */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Endpoints Menu (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1 mb-2">
            Available Endpoints
          </h3>
          {endpoints.map((ep) => {
            const isSelected = selectedEndpoint.id === ep.id;
            return (
              <div
                key={ep.id}
                onClick={() => handleRun(ep)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-[#008060] shadow-md ring-1 ring-[#008060]'
                    : 'bg-white/80 border-zinc-200 hover:border-zinc-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {ep.method}
                  </span>
                  <Play className={`w-3 h-3 ${isSelected ? 'text-[#008060]' : 'text-zinc-400'}`} />
                </div>
                <p className="font-mono text-xs text-zinc-800 font-semibold truncate mt-1">
                  {ep.path}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">{ep.title}</p>
              </div>
            );
          })}
        </div>

        {/* Right Column: Code & JSON Viewer (8 cols) */}
        <div className="lg:col-span-8 bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
          {/* Header Bar */}
          <div className="bg-zinc-900/90 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
              <span className="font-mono text-xs text-zinc-300 ml-2 font-semibold">
                {selectedEndpoint.method} {selectedEndpoint.path}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                200 OK • 12ms
              </span>
              <button
                onClick={copyResponse}
                className="p-1.5 text-zinc-400 hover:text-white rounded bg-zinc-800 transition-colors"
                title="Copy JSON response"
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Response Headers */}
          <div className="bg-zinc-900/40 px-4 py-2 border-b border-zinc-800/60 text-[10px] font-mono text-zinc-400 flex flex-wrap gap-4">
            {Object.entries(responseHeaders).map(([k, v]) => (
              <span key={k}>
                <strong className="text-zinc-500">{k}:</strong> {v}
              </span>
            ))}
          </div>

          {/* Code Body */}
          <div className="p-4 overflow-x-auto flex-1 max-h-[500px]">
            <pre className="font-mono text-xs text-emerald-300 leading-relaxed">
              <code>{responseJson}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
