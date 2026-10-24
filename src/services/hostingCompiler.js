// hostingCompiler.js
// Client-side and server-side compilation & bundling pipeline for hosted React apps and dist.zip bundles

/**
 * Compiles a multi-file React project OR inlines an extracted dist.zip bundle into
 * a standalone, production-ready HTML document that can be hosted in an iframe or served over HTTP.
 *
 * @param {Object} deployment - Deployment object containing files, name, envVars, isDistZip, etc.
 * @param {Object} storefrontBridge - Optional live store context to bridge into the hosted app
 * @returns {string} Fully self-contained HTML document
 */
export function buildHostedHtmlBundle(deployment, storefrontBridge = null) {
  const files = deployment?.files || {};
  const envVars = deployment?.envVars || {};
  const storeContextData = storefrontBridge || {
    store: {
      name: 'Shopify Apex Engine',
      domain: 'store.myshopify.local',
      currency: 'USD',
      currencySymbol: '$'
    },
    products: []
  };

  const serializedStoreContext = JSON.stringify(storeContextData).replace(/<\/script>/gi, '<\\/script>');
  const serializedEnv = JSON.stringify(envVars).replace(/<\/script>/gi, '<\\/script>');

  // CASE 1: Pre-built production bundle extracted from dist.zip (has index.html)
  if (files['index.html'] || deployment?.isDistZip) {
    let html = files['index.html'] || '<!DOCTYPE html><html><head></head><body><div id="root"></div></body></html>';

    // Inject Bridge & Environment variables right after <head> or at start
    const bridgeScript = `
  <base href="/hosted/${deployment.id}/">
  <script>
    window.process = { env: ${serializedEnv} };
    window.ShopifyStorefront = ${serializedStoreContext};
    window.__VERCEL_HOSTED__ = { id: "${deployment.id}", name: "${deployment.name}" };
  </script>
`;

    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${bridgeScript}`);
    } else {
      html = bridgeScript + html;
    }

    // Helper for resilient file matching across dist/ and relative prefixes
    const lookupFileContent = (rawPath) => {
      if (!files || !rawPath) return null;
      const clean = rawPath.replace(/^(\.\/|\/)/, '').split('?')[0].split('#')[0];
      const candidates = [
        clean,
        clean.toLowerCase(),
        '/' + clean,
        'dist/' + clean,
        clean.replace(/^dist\//i, ''),
        clean.replace(/^assets\//i, ''),
        'assets/' + clean,
        clean.split('/').pop()
      ];
      for (const c of candidates) {
        if (files[c] !== undefined) return files[c];
      }
      return null;
    };

    // Inlining / Asset Resolution for Sandbox Iframe
    // 1. Inline CSS stylesheets
    html = html.replace(/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi, (match, href) => {
      const content = lookupFileContent(href);
      if (content) {
        return `<style data-vercel-inlined="${href}">\n${content}\n</style>`;
      }
      return match;
    });

    // 2. Inline Javascript script tags (modules and standard scripts)
    html = html.replace(/<script\s+([^>]*?)src=["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (match, before, src, after) => {
      const content = lookupFileContent(src);
      if (content) {
        const isModule = (before + after).includes('type="module"');
        const moduleAttr = isModule ? ' type="module"' : '';
        return `<script${moduleAttr} data-vercel-inlined="${src}">\n${content}\n</script>`;
      }
      return match;
    });

    // 3. Replace image and font asset references with Data URIs
    Object.keys(files).forEach((filePath) => {
      if (filePath.startsWith('data:') || files[filePath].startsWith('data:')) {
        const regex = new RegExp(`(["'])(\\/|\\.\\/)?${escapeRegExp(filePath)}(["'])`, 'g');
        html = html.replace(regex, `$1${files[filePath]}$3`);
      }
    });

    return html;
  }

  // CASE 2: Raw React JSX Component (App.jsx)
  const mainCode = files['App.jsx'] || files['App.js'] || files['index.jsx'] || files['index.js'] || `
    function App() {
      return React.createElement('div', { className: 'p-8 text-white' }, 'Hello World');
    }
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${deployment?.name || 'Hosted React App'} - Vercel Edge</title>
  
  <!-- Tailwind CSS Play CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: '#008060'
          }
        }
      }
    }
  </script>

  <!-- React 18 / 19 UMD -->
  <script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js" crossorigin></script>
  
  <!-- Babel Standalone for real-time JSX transpilation -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js"></script>

  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background-color: #09090b; color: #f4f4f5; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #18181b; }
    ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 9999px; }

    #vercel-error-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.9);
      color: #f43f5e;
      padding: 2rem;
      z-index: 99999;
      font-family: monospace;
      overflow: auto;
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <div id="vercel-error-overlay">
    <div style="max-width: 800px; margin: 0 auto; background: #18181b; border: 1px solid #e11d48; border-radius: 12px; padding: 24px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <span style="background: #e11d48; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">VERCEL RUNTIME ERROR</span>
        <span id="vercel-error-title" style="color: white; font-weight: bold; font-size: 14px;"></span>
      </div>
      <pre id="vercel-error-stack" style="background: #09090b; padding: 16px; border-radius: 8px; color: #fda4af; font-size: 12px; overflow-x: auto; white-space: pre-wrap;"></pre>
      <div style="margin-top: 16px; font-size: 12px; color: #a1a1aa;">
        Check your React code syntax in the Vercel Studio editor.
      </div>
    </div>
  </div>

  <script>
    window.process = { env: ${serializedEnv} };
    window.ShopifyStorefront = ${serializedStoreContext};

    window.onerror = function(msg, url, lineNo, columnNo, error) {
      var overlay = document.getElementById('vercel-error-overlay');
      var title = document.getElementById('vercel-error-title');
      var stack = document.getElementById('vercel-error-stack');
      if (overlay && title && stack) {
        overlay.style.display = 'block';
        title.innerText = msg;
        stack.innerText = (error && error.stack) ? error.stack : ('Line: ' + lineNo + ', Column: ' + columnNo);
      }
      return false;
    };
  </script>

  <script type="text/babel">
    try {
      ${mainCode}

      const targetComponent = typeof App !== 'undefined' ? App : (typeof window.App !== 'undefined' ? window.App : null);
      if (targetComponent) {
        const rootElement = document.getElementById('root');
        const root = ReactDOM.createRoot(rootElement);
        root.render(React.createElement(targetComponent));
      } else {
        throw new Error("Could not find 'App' component. Make sure your React code declares 'function App() { ... }'.");
      }
    } catch (err) {
      window.onerror(err.message, 'App.jsx', 1, 1, err);
    }
  </script>
</body>
</html>`;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
