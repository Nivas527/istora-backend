import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const cacheFile = path.resolve(process.cwd(), '.deployments-cache.json');

function getCache() {
  try {
    if (fs.existsSync(cacheFile)) {
      return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    }
  } catch (e) {}
  return [];
}

function saveCache(deployments) {
  try {
    fs.writeFileSync(cacheFile, JSON.stringify(deployments, null, 2), 'utf8');
  } catch (e) {}
}

const MIME_TYPES = {
  js: 'application/javascript; charset=utf-8',
  mjs: 'application/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  html: 'text/html; charset=utf-8',
  json: 'application/json; charset=utf-8',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  ico: 'image/x-icon',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf'
};

// Custom Vite plugin to handle Vercel Direct Hosting endpoints & dist.zip in dev mode
function vercelHostingPlugin() {
  return {
    name: 'vercel-hosting-engine',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const urlObj = new URL(req.url, 'http://localhost:3000');
        const pathname = urlObj.pathname;

        // 1. Sync Deployments from Client
        if (pathname === '/api/deployments/sync' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { deployments } = JSON.parse(body || '{}');
              if (Array.isArray(deployments)) {
                saveCache(deployments);
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: deployments?.length || 0 }));
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 1b. Upsert Single Deployment from Client
        if (pathname === '/api/deployments/save' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { deployment } = JSON.parse(body || '{}');
              if (deployment && deployment.id) {
                const current = getCache();
                const filtered = current.filter(d => d.id !== deployment.id);
                filtered.unshift(deployment);
                saveCache(filtered);
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, id: deployment?.id }));
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 2. Fast JSX Compilation API
        if (pathname === '/api/deployments/compile' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { code, loader = 'jsx' } = JSON.parse(body || '{}');
              const start = Date.now();
              const result = esbuild.transformSync(code, {
                loader: loader === 'tsx' ? 'tsx' : 'jsx',
                target: 'es2020',
                jsx: 'transform'
              });
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ code: result.code, durationMs: Date.now() - start }));
            } catch (err) {
              res.statusCode = 422;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 2b. Referer fallback for assets requested by hosted apps (e.g. /assets/* or images)
        const referer = req.headers['referer'] || '';
        const refererMatch = referer.match(/\/hosted\/([a-zA-Z0-9_-]+)/);
        if (refererMatch && !pathname.startsWith('/api/') && !pathname.startsWith('/@') && !pathname.startsWith('/src/')) {
          const depId = refererMatch[1];
          const cache = getCache();
          const dep = cache.find(d => d.id === depId);
          if (dep && dep.files) {
            const cleanPath = pathname.replace(/^\/+/, '');
            const candidateKeys = [
              cleanPath,
              'dist/' + cleanPath,
              'assets/' + cleanPath,
              'dist/assets/' + cleanPath,
              cleanPath.replace(/^assets\//, '')
            ];
            for (const key of candidateKeys) {
              const fileContent = dep.files[key];
              if (fileContent !== undefined) {
                const ext = key.split('.').pop().toLowerCase();
                const mime = MIME_TYPES[ext] || 'application/octet-stream';
                if (typeof fileContent === 'string' && fileContent.startsWith('data:')) {
                  const base64Index = fileContent.indexOf(';base64,');
                  if (base64Index !== -1) {
                    const b64Data = fileContent.substring(base64Index + 8);
                    const buf = Buffer.from(b64Data, 'base64');
                    res.setHeader('Content-Type', mime);
                    res.setHeader('Content-Length', buf.length);
                    res.end(buf);
                    return;
                  }
                }
                let finalBody = fileContent;
                if ((ext === 'js' || ext === 'mjs' || (mime && mime.includes('javascript'))) && typeof finalBody === 'string') {
                  finalBody = finalBody.replace(/window\.location\.pathname/g, '(window.__getHostedPath?window.__getHostedPath():window.location.pathname)');
                }
                res.setHeader('Content-Type', mime + (mime.includes('javascript') || mime.includes('css') ? '; charset=utf-8' : ''));
                res.end(finalBody);
                return;
              }
            }
          }
        }

        // 3. Standalone Hosted Route: /hosted/:id and /hosted/:id/assets/...
        if (pathname.startsWith('/hosted/')) {
          const subPath = pathname.replace(/^\/hosted\//, '');
          const slashPos = subPath.indexOf('/');
          const deploymentId = slashPos === -1 ? subPath : subPath.substring(0, slashPos);
          const assetPath = slashPos === -1 ? '' : subPath.substring(slashPos + 1);

          const cache = getCache();
          const deployment = cache.find(d => d.id === deploymentId);
          const files = deployment?.files || {};

          // Asset sub-request (e.g. assets/index-xxx.js or assets/index-xxx.css)
          if (assetPath) {
            const cleanAsset = assetPath.replace(/^\/+/, '');
            const candidateKeys = [
              cleanAsset,
              'dist/' + cleanAsset,
              'assets/' + cleanAsset,
              'dist/assets/' + cleanAsset,
              cleanAsset.replace(/^assets\//, '')
            ];

            let content = null;
            let matchedKey = '';
            for (const k of candidateKeys) {
              if (files[k] !== undefined) {
                content = files[k];
                matchedKey = k;
                break;
              }
            }

            if (content !== null) {
              const ext = matchedKey.split('.').pop().toLowerCase();
              const mime = MIME_TYPES[ext] || 'application/octet-stream';

              if (typeof content === 'string' && content.startsWith('data:')) {
                const base64Index = content.indexOf(';base64,');
                if (base64Index !== -1) {
                  const b64Data = content.substring(base64Index + 8);
                  const buf = Buffer.from(b64Data, 'base64');
                  res.setHeader('Content-Type', mime);
                  res.setHeader('Content-Length', buf.length);
                  res.end(buf);
                  return;
                }
              }

              if (ext === 'js' || ext === 'mjs' || (mime && mime.includes('javascript'))) {
                if (typeof content === 'string') {
                  content = content.replace(/window\.location\.pathname/g, '(window.__getHostedPath?window.__getHostedPath():window.location.pathname)');
                }
              }

              res.setHeader('Content-Type', mime + (mime.includes('javascript') || mime.includes('css') ? '; charset=utf-8' : ''));
              res.end(content);
              return;
            }
          }

          // Root request or SPA rewrite fallback: Return index.html
          let htmlContent = files['index.html'] || files['dist/index.html'];

          if (htmlContent) {
            // Rewrite root-relative URLs (e.g. src="/assets/...", href="/logo.svg")
            // to /hosted/:id/... so the browser hits the deployment endpoint
            htmlContent = htmlContent.replace(/\b(src|href)=["']\/(?!hosted\/|\/)([^"']*)["']/gi, `$1="/hosted/${deploymentId}/$2"`);

            const routerBridge = `
    <base href="/hosted/${deploymentId}/">
    <script>
      window.__HOSTED_BASE_PATH__ = "/hosted/${deploymentId}";
      if (window.parent && window.parent.ShopifyStorefront) {
        window.ShopifyStorefront = window.parent.ShopifyStorefront;
      }
      window.__getHostedPath = function() {
        var p = window.location.pathname || "/";
        if (window.__HOSTED_BASE_PATH__ && p.startsWith(window.__HOSTED_BASE_PATH__)) {
          var stripped = p.slice(window.__HOSTED_BASE_PATH__.length);
          return (stripped && stripped !== "") ? (stripped.startsWith('/') ? stripped : ('/' + stripped)) : '/';
        }
        return p;
      };
      (function() {
        var pfx = "/hosted/${deploymentId}";
        var origPush = window.history.pushState;
        window.history.pushState = function(state, title, url) {
          if (url && typeof url === 'string' && !url.startsWith('/hosted/')) {
            url = pfx + (url.startsWith('/') ? url : ('/' + url));
          }
          return origPush.call(this, state, title, url);
        };
        var origReplace = window.history.replaceState;
        window.history.replaceState = function(state, title, url) {
          if (url && typeof url === 'string' && !url.startsWith('/hosted/')) {
            url = pfx + (url.startsWith('/') ? url : ('/' + url));
          }
          return origReplace.call(this, state, title, url);
        };
      })();
    </script>`;

            if (htmlContent.includes('<base ')) {
              htmlContent = htmlContent.replace(/<base[^>]*>/, '');
            }

            if (htmlContent.includes('<head>')) {
              htmlContent = htmlContent.replace('<head>', `<head>${routerBridge}`);
            } else {
              htmlContent = routerBridge + '\n' + htmlContent;
            }

            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(htmlContent);
            return;
          }

          // Fallback: JSX App component bundle
          const mainCode = files['App.jsx'] || files['App.js'] || `
            function App() {
              return (
                <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 font-sans">
                  <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
                    <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest font-mono">▲ VERCEL DIRECT HOSTING</span>
                    <h1 className="text-2xl font-black text-white">${deployment?.name || deploymentId}</h1>
                    <p className="text-xs text-zinc-400 font-mono">Deployment ID: ${deploymentId}</p>
                    <div className="p-3 bg-zinc-950 rounded-xl text-xs text-emerald-400 font-mono border border-zinc-800">
                      HTTP 200 OK • Global Edge Node: iad1
                    </div>
                  </div>
                </div>
              );
            }
          `;

          const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${deployment?.name || deploymentId} - Vercel Live Edge</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js"></script>
  <style>
    body { margin: 0; background-color: #09090b; color: #f4f4f5; font-family: ui-sans-serif, system-ui, sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    try {
      ${mainCode}
      const targetComponent = typeof App !== 'undefined' ? App : null;
      if (targetComponent) {
        ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(targetComponent));
      }
    } catch(err) {
      document.body.innerHTML = '<div style="padding: 24px; color: #f43f5e; font-family: monospace;"><b>Vercel Runtime Error:</b><pre>' + err.stack + '</pre></div>';
    }
  </script>
</body>
</html>`;

          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(fallbackHtml);
          return;
        }

        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), vercelHostingPlugin()],
  server: {
    port: 3000,
    host: true,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5200',
        changeOrigin: true
      },
      '/admin/api': {
        target: 'http://localhost:5200',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5200',
        changeOrigin: true
      },
      '/hosted': {
        target: 'http://localhost:5200',
        changeOrigin: true
      }
    }
  }
});
