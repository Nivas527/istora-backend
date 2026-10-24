// initialDeployments.js - Pre-configured hosted React applications and templates
// Modeled after Vercel's deployment schema

export const initialDeployments = [
  {
    id: 'dep_dist_zip_production',
    name: 'apex-velocity-dist-build',
    project: 'apex-storefront',
    subdomain: 'apex-dist-build.vercel.app',
    liveUrl: 'https://apex-dist-build.vercel.app',
    status: 'READY',
    environment: 'production',
    isDistZip: true,
    commit: {
      hash: 'e92bc01',
      message: 'release: extracted production dist.zip bundle (Vite + React 19)',
      author: 'release-manager',
      branch: 'release/v3.0'
    },
    framework: 'React 19 (Extracted dist.zip)',
    nodeVersion: '20.x',
    region: 'iad1 (Washington, D.C.)',
    createdAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    buildDurationMs: 840,
    bundleSizeKb: 590.2,
    envVars: {
      NODE_ENV: 'production',
      DIST_BUNDLE: 'true'
    },
    files: {
      'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Apex Velocity | dist.zip Production</title>
    <link rel="stylesheet" crossorigin href="./assets/index.css">
  </head>
  <body class="bg-zinc-950 text-white font-sans antialiased">
    <div id="root"></div>
    <script type="module" crossorigin src="./assets/index.js"></script>
  </body>
</html>`,
      'assets/index.css': `* { box-sizing: border-box; }
body { margin: 0; background: #09090b; color: #f4f4f5; font-family: ui-sans-serif, system-ui, sans-serif; }
.hero-glow { background: radial-gradient(circle at 50% 20%, rgba(16, 185, 129, 0.15) 0%, transparent 60%); }
.card { background: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 24px; transition: all 0.2s; }
.card:hover { border-color: #10b981; transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
.badge-pill { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; font-family: monospace; }
.btn-primary { background: #10b981; color: #000; font-weight: 800; border-radius: 12px; padding: 12px 24px; border: none; cursor: pointer; transition: background 0.2s; }
.btn-primary:hover { background: #34d399; }
.btn-secondary { background: #27272a; color: #fff; font-weight: 700; border-radius: 12px; padding: 12px 20px; border: 1px solid #3f3f46; cursor: pointer; }
.btn-secondary:hover { background: #3f3f46; }`,
      'assets/index.js': `import React from 'https://esm.sh/react@19';
import ReactDOM from 'https://esm.sh/react-dom@19/client';

function App() {
  const [activeTab, setActiveTab] = React.useState('all');
  const [cartCount, setCartCount] = React.useState(0);
  const [toast, setToast] = React.useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const products = [
    { id: 1, title: 'Velocity Pro Carbon Racer', price: 189.99, cat: 'footwear', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80' },
    { id: 2, title: 'Thermal Seamless Compression Tee', price: 54.00, cat: 'apparel', img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80' },
    { id: 3, title: 'Titanium Smart Hydration Cell', price: 68.00, cat: 'gear', img: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80' }
  ];

  const filtered = activeTab === 'all' ? products : products.filter(p => p.cat === activeTab);

  return React.createElement('div', { className: 'min-h-screen bg-zinc-950 text-white font-sans' },
    toast ? React.createElement('div', { style: { position: 'fixed', top: '16px', right: '16px', background: '#10b981', color: '#000', padding: '10px 18px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', zIndex: 9999 } }, '✓ ' + toast) : null,
    
    // Top Bar
    React.createElement('div', { style: { background: '#000', borderBottom: '1px solid #27272a', padding: '8px 24px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#a1a1aa', fontFamily: 'monospace' } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
        React.createElement('span', { style: { width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' } }),
        'VERCEL EDGE HOSTING • DIST.ZIP EXTRACTED RUNTIME'
      ),
      React.createElement('span', { style: { color: '#10b981' } }, 'HTTP 200 OK • 0ms TTFB')
    ),

    // Header
    React.createElement('header', { style: { padding: '18px 32px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(24,24,27,0.8)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 40 } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
        React.createElement('div', { style: { width: '36px', height: '36px', background: '#fff', color: '#000', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '18px' } }, '▲'),
        React.createElement('div', null,
          React.createElement('h1', { style: { fontSize: '16px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' } }, 'APEX VELOCITY (DIST.ZIP)'),
          React.createElement('p', { style: { fontSize: '11px', color: '#71717a', margin: 0, fontFamily: 'monospace' } }, 'Production Build Bundle')
        )
      ),
      React.createElement('button', { className: 'btn-secondary', style: { padding: '8px 16px', fontSize: '12px' }, onClick: () => showToast('Cart has ' + cartCount + ' items') },
        '🛒 Cart (' + cartCount + ')'
      )
    ),

    // Hero Section
    React.createElement('section', { className: 'hero-glow', style: { padding: '64px 24px', textAlign: 'center', borderBottom: '1px solid #18181b' } },
      React.createElement('span', { className: 'badge-pill' }, '📦 Direct dist.zip Extraction'),
      React.createElement('h2', { style: { fontSize: '42px', fontWeight: '900', margin: '16px 0 8px', letterSpacing: '-1px' } },
        'Zero-Config ',
        React.createElement('span', { style: { color: '#10b981' } }, 'dist.zip Hosting')
      ),
      React.createElement('p', { style: { color: '#a1a1aa', fontSize: '15px', maxWidth: '600px', margin: '0 auto 24px', lineHeight: 1.6 } },
        'Just drop your dist.zip file. The engine unpacks index.html, scripts, and CSS assets directly, serving them instantaneously with edge rewrites.'
      ),
      React.createElement('div', { style: { display: 'flex', gap: '12px', justifyContent: 'center' } },
        React.createElement('button', { className: 'btn-primary', onClick: () => { setCartCount(c => c + 1); showToast('Quick item added to cart!'); } }, '⚡ Test Quick Buy'),
        React.createElement('button', { className: 'btn-secondary', onClick: () => alert('This React application was loaded from dist.zip!') }, 'View Bundle Info')
      )
    ),

    // Products Grid
    React.createElement('main', { style: { maxWidth: '1080px', margin: '0 auto', padding: '48px 24px' } },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' } },
        React.createElement('h3', { style: { fontSize: '18px', fontWeight: '800', margin: 0 } }, 'Extracted Catalog Items'),
        React.createElement('div', { style: { display: 'flex', gap: '8px' } },
          ['all', 'footwear', 'apparel', 'gear'].map(tab =>
            React.createElement('button', {
              key: tab,
              onClick: () => setActiveTab(tab),
              style: {
                background: activeTab === tab ? '#10b981' : '#18181b',
                color: activeTab === tab ? '#000' : '#a1a1aa',
                border: '1px solid ' + (activeTab === tab ? '#10b981' : '#27272a'),
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }
            }, tab)
          )
        )
      ),

      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' } },
        filtered.map(p =>
          React.createElement('div', { key: p.id, className: 'card' },
            React.createElement('img', { src: p.img, alt: p.title, style: { width: '100%', height: '220px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px' } }),
            React.createElement('h4', { style: { fontSize: '15px', fontWeight: '800', margin: '0 0 6px' } }, p.title),
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #27272a' } },
              React.createElement('span', { style: { fontSize: '18px', fontWeight: '900', color: '#10b981' } }, '$' + p.price.toFixed(2)),
              React.createElement('button', {
                className: 'btn-primary',
                style: { padding: '8px 16px', fontSize: '12px' },
                onClick: () => { setCartCount(c => c + 1); showToast('Added ' + p.title + ' to cart!'); }
              }, '+ Add to Cart')
            )
          )
        )
      )
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));`
    },
    logs: [
      { timestamp: '00:00.010', level: 'info', message: 'Ingesting user uploaded dist.zip archive' },
      { timestamp: '00:00.040', level: 'info', message: 'Extracted index.html, assets/index.js, assets/index.css' },
      { timestamp: '00:00.180', level: 'info', message: 'Injected SPA fallback routing and Edge base path' },
      { timestamp: '00:00.420', level: 'success', message: 'Static site generated. Deployed to edge network.' }
    ]
  },
  {
    id: 'dep_apex_headless_01',
    name: 'apex-hydrogen-storefront',
    project: 'apex-storefront',
    subdomain: 'apex-storefront.vercel.app',
    liveUrl: 'https://apex-storefront.vercel.app',
    status: 'READY', // 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR'
    environment: 'production',
    commit: {
      hash: '7a91fc4',
      message: 'feat: implement headless cart & live variant matrix',
      author: 'vercel-bot[bot]',
      branch: 'main'
    },
    framework: 'React 19 (Hydrogen Headless)',
    nodeVersion: '20.x',
    region: 'iad1 (Washington, D.C.)',
    createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    buildDurationMs: 1420,
    bundleSizeKb: 68.4,
    envVars: {
      NEXT_PUBLIC_STORE_NAME: 'Apex Athletics',
      NEXT_PUBLIC_CURRENCY: 'USD',
      SHOPIFY_API_VERSION: '2024-01',
      ENABLE_INSTANT_CHECKOUT: 'true'
    },
    files: {
      'App.jsx': `function App() {
  const [cart, setCart] = React.useState([]);
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [promoCode, setPromoCode] = React.useState('');
  const [discount, setDiscount] = React.useState(0);
  const [notification, setNotification] = React.useState('');

  const storefront = window.ShopifyStorefront || {
    store: { name: 'Apex Athletics', currency: 'USD', currencySymbol: '$' },
    products: []
  };

  // Sample or bridge products
  const products = storefront.products?.length > 0 ? storefront.products : [
    {
      id: 'prod_1',
      title: 'AeroGlide Elite Carbon Runner',
      category: 'Footwear',
      price: 189.99,
      badge: 'Bestseller',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
      description: 'Ultralight carbon-plated running shoe with energy-return foam.'
    },
    {
      id: 'prod_2',
      title: 'VaporDry Seamless Performance Tee',
      category: 'Apparel',
      price: 54.00,
      badge: 'New Release',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
      description: 'Zero-chafing micro-vented fabric for marathon endurance.'
    },
    {
      id: 'prod_3',
      title: 'HydroPulse Titanium Smart Bottle',
      category: 'Accessories',
      price: 68.00,
      badge: 'Trending',
      image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
      description: 'Vacuum insulated titanium bottle with LED hydration tracker.'
    },
    {
      id: 'prod_4',
      title: 'Apex All-Weather Kinetic Hoodie',
      category: 'Apparel',
      price: 112.00,
      badge: 'Limited',
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80',
      description: 'Wind-resistant 4-way stretch fabric tailored for training.'
    }
  ];

  const categories = ['All', 'Footwear', 'Apparel', 'Accessories'];
  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setNotification(\`Added "\${product.title}" to cart!\`);
    setTimeout(() => setNotification(''), 2500);

    // Sync with host platform if bridge exists
    if (window.ShopifyStorefront?.cart?.addItem) {
      window.ShopifyStorefront.cart.addItem(product, 1);
    }
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = Math.max(0, subtotal * (1 - discount));
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const applyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'VERCEL25') {
      setDiscount(0.25);
      setNotification('Promo code applied: 25% OFF!');
    } else {
      setNotification('Invalid promo code. Try "VERCEL25"');
    }
    setTimeout(() => setNotification(''), 3000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-black">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-zinc-950 px-4 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 animate-bounce">
          <span>✓</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Top Vercel Deployment Bar */}
      <div className="bg-black/90 border-b border-zinc-800 text-[11px] text-zinc-400 py-1 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-mono text-zinc-200">VERCEL EDGE HOSTING</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">Deployed React 19 Headless Store</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-emerald-400">HTTP 200 OK</span>
          <span className="font-mono text-zinc-500">12ms TTFB</span>
        </div>
      </div>

      {/* Store Header */}
      <header className="sticky top-0 z-30 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-black">
            ▲
          </div>
          <div>
            <h1 className="font-black text-base text-white tracking-tight">APEX HYDROGEN</h1>
            <p className="text-[10px] text-zinc-400 font-mono">React Headless Storefront</p>
          </div>
        </div>

        {/* Categories */}
        <div className="hidden md:flex items-center gap-2 bg-zinc-800/80 p-1 rounded-xl border border-zinc-700/60">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={\`px-3 py-1 rounded-lg text-xs font-medium transition-all \${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }\`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Cart Button */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold border border-zinc-700 flex items-center gap-2 transition-all cursor-pointer"
        >
          <span>🛒 Cart</span>
          {cartCount > 0 && (
            <span className="bg-emerald-500 text-zinc-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {cartCount}
            </span>
          )}
        </button>
      </header>

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 py-16 px-6 border-b border-zinc-800/80">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <span>⚡ Ultra-Fast Headless Commerce</span>
            <span>•</span>
            <span>Direct Vercel Deployment</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            High Velocity Gear. <span className="text-emerald-400">Zero Latency.</span>
          </h2>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto">
            Experience the apex of performance athletic engineering, rendered directly via modern React single-page architecture.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <span className="text-xs text-zinc-400 font-mono">Use code <b className="text-emerald-400">VERCEL25</b> for 25% discount at checkout</span>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-white">Active Catalog ({filteredProducts.length})</h3>
            <p className="text-xs text-zinc-400">Live products synced from ShopifyCore DB</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all flex flex-col justify-between"
            >
              <div className="relative aspect-square overflow-hidden bg-zinc-800">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.badge && (
                  <span className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {product.badge}
                  </span>
                )}
              </div>

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{product.category}</span>
                  <h4 className="text-sm font-bold text-white mt-0.5 line-clamp-1">{product.title}</h4>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{product.description}</p>
                </div>

                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-base font-black text-emerald-400">\${Number(product.price).toFixed(2)}</span>
                  <button
                    onClick={() => addToCart(product)}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
                  >
                    + Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Cart Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-zinc-900 border-l border-zinc-800 h-full flex flex-col p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-lg">🛒</span>
                <h3 className="text-base font-bold text-white">Your Cart ({cartCount})</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-zinc-500 text-sm">
                  <p className="text-3xl mb-2">🛍️</p>
                  <p>Your cart is empty.</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="mt-4 px-4 py-2 bg-emerald-500 text-zinc-950 text-xs font-bold rounded-xl"
                  >
                    Explore Catalog
                  </button>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 bg-zinc-800/60 p-3 rounded-xl border border-zinc-750">
                    <img src={item.image} alt={item.title} className="w-14 h-14 object-cover rounded-lg shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-white truncate">{item.title}</h5>
                      <span className="text-xs text-emerald-400 font-bold">\${Number(item.price).toFixed(2)}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <button onClick={() => updateQty(item.id, -1)} className="w-5 h-5 bg-zinc-700 hover:bg-zinc-600 rounded text-xs">-</button>
                        <span className="text-xs font-bold px-1">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-5 h-5 bg-zinc-700 hover:bg-zinc-600 rounded text-xs">+</button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-zinc-500 hover:text-rose-400 text-xs p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-4 border-t border-zinc-800 space-y-3">
                {/* Promo Code Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Promo code (e.g. VERCEL25)"
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    onClick={applyPromo}
                    className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold rounded-xl"
                  >
                    Apply
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal</span>
                    <span>\${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Promo Discount ({(discount * 100).toFixed(0)}%)</span>
                      <span>-\${(subtotal * discount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-zinc-800">
                    <span>Total Due</span>
                    <span className="text-emerald-400">\${total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    alert(\`Order Placed for \$\${total.toFixed(2)}! Confetti triggered.\`);
                    setCart([]);
                    setIsCartOpen(false);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-black text-sm rounded-xl shadow-lg transition-all"
                >
                  ⚡ Instant Checkout (\${total.toFixed(2)})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
`
    },
    logs: [
      { timestamp: '00:00.012', level: 'info', message: 'Vercel CLI v34.2.0 initialized build container' },
      { timestamp: '00:00.084', level: 'info', message: 'Cloning repository apex-athletics/storefront-headless (branch: main)' },
      { timestamp: '00:00.210', level: 'info', message: 'Detected framework: React 19 Single Page Application' },
      { timestamp: '00:00.340', level: 'info', message: 'Ingesting 1 source module: App.jsx' },
      { timestamp: '00:00.512', level: 'info', message: 'Transforming React JSX AST via esbuild v0.25 (elapsed: 1.8ms)' },
      { timestamp: '00:00.720', level: 'info', message: 'Injected Shopify Storefront Context SDK bridge into runtime' },
      { timestamp: '00:00.910', level: 'info', message: 'Generated static asset chunks: index.html, main.js (68.4 kB)' },
      { timestamp: '00:01.120', level: 'info', message: 'Injected SPA fallback routing: /* -> /index.html' },
      { timestamp: '00:01.320', level: 'info', message: 'Propagating edge deployment to 32 regions worldwide...' },
      { timestamp: '00:01.420', level: 'success', message: 'Deployment ready! Available at https://apex-storefront.vercel.app' }
    ]
  },
  {
    id: 'dep_customizer_02',
    name: '3d-apparel-configurator',
    project: 'apex-storefront',
    subdomain: 'apex-customizer.vercel.app',
    liveUrl: 'https://apex-customizer.vercel.app',
    status: 'READY',
    environment: 'production',
    commit: {
      hash: 'b3104e1',
      message: 'feat: add live color customizer & dynamic SVG renderer',
      author: 'nivas',
      branch: 'main'
    },
    framework: 'React 19 (Interactive Canvas)',
    nodeVersion: '20.x',
    region: 'fra1 (Frankfurt)',
    createdAt: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
    buildDurationMs: 1180,
    bundleSizeKb: 42.1,
    envVars: {
      APP_MODE: 'configurator',
      DEFAULT_COLOR: '#008060'
    },
    files: {
      'App.jsx': `function App() {
  const [primaryColor, setPrimaryColor] = React.useState('#008060');
  const [accentColor, setAccentColor] = React.useState('#f59e0b');
  const [soleColor, setSoleColor] = React.useState('#18181b');
  const [customText, setCustomText] = React.useState('APEX 26');
  const [size, setSize] = React.useState('US 10.5');
  const [isOrdered, setIsOrdered] = React.useState(false);

  const colors = [
    { label: 'Emerald', hex: '#008060' },
    { label: 'Cyber Yellow', hex: '#f59e0b' },
    { label: 'Crimson', hex: '#ef4444' },
    { label: 'Royal Blue', hex: '#3b82f6' },
    { label: 'Obsidian', hex: '#18181b' },
    { label: 'Ghost White', hex: '#f4f4f5' }
  ];

  const basePrice = 199.00;
  const customFee = customText.trim().length > 0 ? 15.00 : 0.00;
  const totalPrice = basePrice + customFee;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col">
      {/* Top Bar */}
      <div className="bg-black/80 border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold">▲ VERCEL REACT ENGINE</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-300 font-mono text-xs">Interactive 3D Sneaker Visualizer</span>
        </div>
        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
          ● Live Production
        </span>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12">
        {/* Canvas / 3D Sneaker Render Viewport */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black relative">
          <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
            {/* SVG Sneaker Graphic with dynamic color fills */}
            <svg viewBox="0 0 500 350" className="w-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
              {/* Sole */}
              <path
                d="M 50 250 C 90 280, 420 280, 450 240 C 460 225, 440 210, 410 215 C 320 225, 100 230, 50 250 Z"
                fill={soleColor}
                stroke="#3f3f46"
                strokeWidth="2"
              />
              {/* Upper Main Body */}
              <path
                d="M 90 230 C 130 140, 220 90, 310 110 C 370 120, 410 160, 420 215 C 350 220, 150 225, 90 230 Z"
                fill={primaryColor}
                className="transition-colors duration-300"
              />
              {/* Overlay / Accent Swoop */}
              <path
                d="M 160 170 C 230 130, 320 150, 380 200 C 310 205, 220 195, 160 170 Z"
                fill={accentColor}
                className="transition-colors duration-300"
              />
              {/* Heel Counter */}
              <path
                d="M 90 230 C 80 180, 110 140, 150 130 C 130 170, 120 210, 90 230 Z"
                fill="#27272a"
              />
              {/* Custom Monogram Text */}
              {customText && (
                <text
                  x="260"
                  y="180"
                  fill="#ffffff"
                  fontSize="14"
                  fontWeight="900"
                  fontFamily="monospace"
                  letterSpacing="2"
                  textAnchor="middle"
                  transform="rotate(-5, 260, 180)"
                  className="select-none"
                >
                  {customText.toUpperCase()}
                </text>
              )}
            </svg>
          </div>

          <div className="absolute bottom-6 flex gap-4 text-xs text-zinc-400 font-mono">
            <span>Primary: <b style={{ color: primaryColor }}>{primaryColor}</b></span>
            <span>Accent: <b style={{ color: accentColor }}>{accentColor}</b></span>
            <span>Sole: <b style={{ color: soleColor }}>{soleColor}</b></span>
          </div>
        </div>

        {/* Controls Sidebar */}
        <div className="lg:col-span-4 bg-zinc-900 border-l border-zinc-800 p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-white">Apex Custom Velocity Lab</h2>
              <p className="text-xs text-zinc-400 mt-1">Configure your personalized bespoke racing chassis.</p>
            </div>

            {/* Primary Upper Color */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Upper Chassis Color</label>
              <div className="flex gap-2">
                {colors.map(c => (
                  <button
                    key={c.hex}
                    onClick={() => setPrimaryColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={\`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer \${
                      primaryColor === c.hex ? 'scale-115 border-white shadow-lg' : 'border-zinc-700 hover:scale-105'
                    }\`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Aerodynamic Trim Color</label>
              <div className="flex gap-2">
                {colors.map(c => (
                  <button
                    key={c.hex}
                    onClick={() => setAccentColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={\`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer \${
                      accentColor === c.hex ? 'scale-115 border-white shadow-lg' : 'border-zinc-700 hover:scale-105'
                    }\`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Custom Monogram */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-zinc-300 uppercase tracking-wider">Laser Engraved Monogram (+\$15)</label>
                <span className="text-zinc-500 font-mono">{customText.length}/10</span>
              </div>
              <input
                type="text"
                maxLength={10}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="e.g. APEX 26"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono uppercase text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Size Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Select Size</label>
              <div className="grid grid-cols-4 gap-2">
                {['US 9.0', 'US 9.5', 'US 10.0', 'US 10.5', 'US 11.0', 'US 11.5', 'US 12.0', 'US 13.0'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={\`py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer \${
                      size === s ? 'bg-white text-black border-white' : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                    }\`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing & Checkout */}
          <div className="pt-6 border-t border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400">Total Custom Build</p>
                <p className="text-2xl font-black text-amber-400">\${totalPrice.toFixed(2)}</p>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">Size {size}</span>
            </div>

            <button
              onClick={() => {
                setIsOrdered(true);
                setTimeout(() => setIsOrdered(false), 3000);
              }}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black text-sm rounded-xl shadow-lg transition-transform active:scale-98 cursor-pointer"
            >
              {isOrdered ? '✓ Custom Order Dispatched to Factory!' : 'Order Bespoke Pair →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
`
    },
    logs: [
      { timestamp: '00:00.010', level: 'info', message: 'Vercel Deployment Worker started for 3d-apparel-configurator' },
      { timestamp: '00:00.090', level: 'info', message: 'Loaded AST for interactive SVG customizer canvas' },
      { timestamp: '00:00.280', level: 'info', message: 'Bundle compilation completed in 1.18s' },
      { timestamp: '00:00.600', level: 'success', message: 'Static site generated. Deployed to edge network.' }
    ]
  },
  {
    id: 'dep_flash_drop_03',
    name: 'flash-deal-drop',
    project: 'apex-storefront',
    subdomain: 'flash-drop-v2.vercel.app',
    liveUrl: 'https://flash-drop-v2.vercel.app',
    status: 'READY',
    environment: 'preview',
    commit: {
      hash: 'c88109d',
      message: 'feat: add countdown timer & flash discount engine',
      author: 'marketing-lead',
      branch: 'campaign/midnight-drop'
    },
    framework: 'React 19 (Landing Page)',
    nodeVersion: '20.x',
    region: 'hkg1 (Hong Kong)',
    createdAt: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
    buildDurationMs: 980,
    bundleSizeKb: 34.2,
    envVars: {
      DISCOUNT_RATE: '0.40',
      TARGET_EVENT: 'Midnight Launch'
    },
    files: {
      'App.jsx': `function App() {
  const [timeLeft, setTimeLeft] = React.useState({ hours: 4, minutes: 28, seconds: 45 });
  const [stockLeft, setStockLeft] = React.useState(7);
  const [claimed, setClaimed] = React.useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center p-6 selection:bg-rose-500 selection:text-white">
      <div className="max-w-xl w-full bg-zinc-900 border border-rose-500/30 rounded-3xl p-8 space-y-6 shadow-[0_0_50px_rgba(244,63,94,0.15)] relative overflow-hidden text-center">
        {/* Glow pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-bold uppercase tracking-wider animate-pulse">
          <span>🔥 Limited Flash Drop</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white">Apex Midnight Carbon Edition</h1>
        <p className="text-zinc-400 text-xs sm:text-sm">
          Exclusive release for VIP members. Only 50 units manufactured globally.
        </p>

        {/* Countdown */}
        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
          <div className="bg-zinc-800 p-3 rounded-2xl border border-zinc-700">
            <span className="text-2xl font-black text-rose-400 font-mono">{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="block text-[10px] text-zinc-400 uppercase mt-0.5">Hours</span>
          </div>
          <div className="bg-zinc-800 p-3 rounded-2xl border border-zinc-700">
            <span className="text-2xl font-black text-rose-400 font-mono">{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className="block text-[10px] text-zinc-400 uppercase mt-0.5">Mins</span>
          </div>
          <div className="bg-zinc-800 p-3 rounded-2xl border border-zinc-700">
            <span className="text-2xl font-black text-rose-400 font-mono">{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span className="block text-[10px] text-zinc-400 uppercase mt-0.5">Secs</span>
          </div>
        </div>

        {/* Stock Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-rose-400">⚡ HURRY! ONLY {stockLeft} UNITS LEFT</span>
            <span className="text-zinc-500">86% CLAIMED</span>
          </div>
          <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-rose-500 to-amber-500 h-full w-[86%] rounded-full"></div>
          </div>
        </div>

        {/* Offer Box */}
        <div className="p-4 bg-zinc-800/80 rounded-2xl border border-zinc-700 flex items-center justify-between">
          <div className="text-left">
            <span className="text-xs text-zinc-400 line-through">Regular Price: $299.00</span>
            <p className="text-xl font-black text-emerald-400">Flash Price: $179.40 <span className="text-xs font-bold bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">-40%</span></p>
          </div>
          <span className="text-xs text-zinc-400 font-mono">Code: FLASH40</span>
        </div>

        <button
          onClick={() => {
            setClaimed(true);
            setStockLeft(prev => Math.max(1, prev - 1));
          }}
          className="w-full py-4 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-sm rounded-2xl shadow-xl shadow-rose-600/30 transition-all cursor-pointer"
        >
          {claimed ? '✓ Voucher Claimed & Saved to Cart!' : 'Claim Flash Deal ($179.40) →'}
        </button>

        <p className="text-[11px] text-zinc-500 font-mono">
          Hosted on Vercel Serverless Edge • SSL Encrypted Checkout
        </p>
      </div>
    </div>
  );
}
`
    },
    logs: [
      { timestamp: '00:00.010', level: 'info', message: 'Vercel Preview Deployment initiated for campaign/midnight-drop' },
      { timestamp: '00:00.220', level: 'info', message: 'Building production bundle...' },
      { timestamp: '00:00.980', level: 'success', message: 'Preview URL generated: https://flash-drop-v2.vercel.app' }
    ]
  }
];

export const deploymentTemplates = [
  {
    id: 'tpl_hydrogen_storefront',
    title: 'Hydrogen Headless Storefront',
    description: 'Modern ultra-fast React 19 storefront with dynamic catalog grid, category filtering, slide-out cart, and instant checkout.',
    icon: 'Store',
    tag: 'E-Commerce',
    defaultFiles: {
      'App.jsx': `function App() {
  const [items, setItems] = React.useState([]);
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex justify-between items-center pb-4 border-b border-zinc-800">
          <h1 className="text-2xl font-black">My Headless Storefront</h1>
          <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-bold">● Vercel Hosted</span>
        </header>
        <p className="text-zinc-400 text-sm">Welcome to your headless React app directly hosted like Vercel.</p>
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <h3 className="font-bold text-white mb-2">Ready to Customize</h3>
          <p className="text-xs text-zinc-400">Edit this App.jsx file in the live editor to see changes instantly hot reloaded.</p>
        </div>
      </div>
    </div>
  );
}`
    }
  },
  {
    id: 'tpl_configurator',
    title: 'Interactive 3D / SVG Visualizer',
    description: 'Dynamic React configurator with color pickers, real-time SVG rendering, custom monogramming, and live price recalculation.',
    icon: 'Cpu',
    tag: 'Customizer',
    defaultFiles: {
      'App.jsx': `function App() {
  const [color, setColor] = React.useState('#3b82f6');
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center space-y-4">
        <h2 className="text-xl font-bold">Interactive Color Lab</h2>
        <div className="w-32 h-32 rounded-2xl mx-auto transition-colors shadow-2xl" style={{ backgroundColor: color }} />
        <div className="flex justify-center gap-3 pt-2">
          {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className="w-8 h-8 rounded-full border-2 border-white/20 hover:scale-110 transition-transform"
            />
          ))}
        </div>
        <p className="text-xs font-mono text-zinc-400">Selected: {color}</p>
      </div>
    </div>
  );
}`
    }
  },
  {
    id: 'tpl_landing_page',
    title: 'Flash Drop / Campaign Funnel',
    description: 'High-conversion campaign landing page featuring countdown timers, limited stock progress bars, and promo code claimers.',
    icon: 'Sparkles',
    tag: 'Marketing',
    defaultFiles: {
      'App.jsx': `function App() {
  const [count, setCount] = React.useState(10);
  return (
    <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-4">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Flash Release</span>
        <h1 className="text-3xl font-black">Drop #04 Live</h1>
        <p className="text-xs text-zinc-400">Limited edition inventory available now.</p>
        <button
          onClick={() => setCount(c => Math.max(0, c - 1))}
          className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-black font-black rounded-xl text-sm transition-all"
        >
          Claim Deal ({count} remaining)
        </button>
      </div>
    </div>
  );
}`
    }
  },
  {
    id: 'tpl_blank_react19',
    title: 'Clean React 19 Starter',
    description: 'Minimalist starter template with React 19 state hooks, Tailwind CSS, and zero clutter.',
    icon: 'Layers',
    tag: 'Starter',
    defaultFiles: {
      'App.jsx': `function App() {
  const [counter, setCounter] = React.useState(0);
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl text-center space-y-4 max-w-sm w-full">
        <h1 className="text-xl font-bold">Hosted React 19 App</h1>
        <p className="text-xs text-zinc-400">Zero-config Vercel hosting simulation</p>
        <div className="text-4xl font-mono font-bold text-emerald-400 py-2">{counter}</div>
        <div className="flex gap-2">
          <button onClick={() => setCounter(c => c - 1)} className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold">- Decrement</button>
          <button onClick={() => setCounter(c => c + 1)} className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg text-xs font-bold">+ Increment</button>
        </div>
      </div>
    </div>
  );
}`
    }
  }
];
