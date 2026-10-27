// server.js - Production & Standalone Express server for Shopify Engine & Vercel React / dist.zip Hosting
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';
import fs from 'fs';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.raw({ type: 'application/zip', limit: '50mb' }));

// In-memory / persisted deployment cache
const cachePath = path.join(__dirname, '.deployments-cache.json');
let deploymentsCache = [];
if (fs.existsSync(cachePath)) {
  try {
    deploymentsCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  } catch (e) {
    console.warn('Failed to parse deployments cache:', e);
  }
}

function saveCache() {
  try {
    fs.writeFileSync(cachePath, JSON.stringify(deploymentsCache, null, 2));
  } catch (e) {
    console.error('Failed to save deployments cache:', e);
  }
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

// 1. Fast JSX/TSX Compilation via esbuild
app.post('/api/deployments/compile', (req, res) => {
  const { code, loader = 'jsx' } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  const startTime = Date.now();
  try {
    const result = esbuild.transformSync(code, {
      loader: loader === 'tsx' ? 'tsx' : 'jsx',
      target: 'es2020',
      jsx: 'transform'
    });
    res.json({
      code: result.code,
      warnings: result.warnings,
      durationMs: Date.now() - startTime
    });
  } catch (err) {
    res.status(422).json({
      error: err.message,
      errors: err.errors
    });
  }
});

// 2. Sync Deployments from Client
app.post('/api/deployments/sync', (req, res) => {
  try {
    const { deployments } = req.body;
    if (Array.isArray(deployments)) {
      deploymentsCache = deployments;
      saveCache();
    }
    res.json({ success: true, count: deploymentsCache.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 2b. Upsert Single Deployment from Client
app.post('/api/deployments/save', (req, res) => {
  try {
    const { deployment } = req.body;
    if (deployment && deployment.id) {
      deploymentsCache = deploymentsCache.filter(d => d.id !== deployment.id);
      deploymentsCache.unshift(deployment);
      saveCache();
    }
    res.json({ success: true, id: deployment?.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Direct dist.zip Upload & Extraction Endpoint
app.post('/api/deployments/upload-zip', async (req, res) => {
  try {
    const zipBuffer = req.body;
    if (!zipBuffer || !Buffer.isBuffer(zipBuffer)) {
      return res.status(400).json({ error: 'Binary zip buffer expected (Content-Type: application/zip)' });
    }

    const zip = await JSZip.loadAsync(zipBuffer);
    const files = {};
    const rawPaths = Object.keys(zip.files).filter(p => !zip.files[p].dir);

    // Normalize common prefix
    let commonPrefix = '';
    const firstPath = rawPaths[0] || '';
    if (firstPath.startsWith('dist/') || firstPath.startsWith('build/')) {
      const pfx = firstPath.split('/')[0] + '/';
      if (rawPaths.every(p => p.startsWith(pfx))) commonPrefix = pfx;
    }

    for (const rawPath of rawPaths) {
      const normPath = commonPrefix ? rawPath.slice(commonPrefix.length) : rawPath;
      const ext = normPath.split('.').pop().toLowerCase();
      const isText = ['html', 'htm', 'js', 'mjs', 'css', 'json', 'svg', 'txt', 'map'].includes(ext);

      if (isText) {
        files[normPath] = await zip.files[rawPath].async('text');
      } else {
        const b64 = await zip.files[rawPath].async('base64');
        const mime = MIME_TYPES[ext] || 'application/octet-stream';
        files[normPath] = `data:${mime};base64,${b64}`;
      }
    }

    const name = (req.query.name || 'dist-app-' + Math.floor(Math.random() * 899 + 100)).toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const id = `dep_zip_${Date.now()}`;

    const newDep = {
      id,
      name,
      subdomain: `${name}.vercel.app`,
      liveUrl: `http://localhost:${PORT}/hosted/${id}`,
      status: 'READY',
      environment: 'production',
      isDistZip: true,
      framework: 'React 19 (Extracted dist.zip)',
      createdAt: new Date().toISOString(),
      files,
      logs: [
        { timestamp: '00:00.010', level: 'info', message: 'Received dist.zip archive via HTTP' },
        { timestamp: '00:00.150', level: 'info', message: `Extracted ${Object.keys(files).length} files from zip` },
        { timestamp: '00:00.410', level: 'success', message: `Live at http://localhost:${PORT}/hosted/${id}` }
      ]
    };

    deploymentsCache.unshift(newDep);
    saveCache();
    res.status(201).json(newDep);
  } catch (err) {
    res.status(500).json({ error: 'Failed to extract dist.zip: ' + err.message });
  }
});

// 4. Deployments REST API
app.get('/api/deployments', (req, res) => {
  res.json({ deployments: deploymentsCache });
});

// 5. Direct React & dist.zip HTML / Asset Server
app.get('/hosted/:id', serveHostedApp);
app.get('/hosted/:id/{*path}', serveHostedApp);

function serveHostedApp(req, res) {
  const { id } = req.params;
  const rawPath = req.params.path;
  const assetPath = Array.isArray(rawPath) 
    ? rawPath.join('/') 
    : (typeof rawPath === 'string' ? rawPath : req.url.split('?')[0].replace(new RegExp('^/hosted/' + id + '/?'), ''));

  const deployment = deploymentsCache.find((d) => d.id === id);
  const files = deployment?.files || {};

  // Asset sub-request (e.g. assets/index-xxx.js)
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
          return res.send(buf);
        }
      }

      if (ext === 'js' || ext === 'mjs' || (mime && mime.includes('javascript'))) {
        if (typeof content === 'string') {
          content = content.replace(/window\.location\.pathname/g, '(window.__getHostedPath?window.__getHostedPath():window.location.pathname)');
        }
      }

      res.setHeader('Content-Type', mime + (mime.includes('javascript') || mime.includes('css') ? '; charset=utf-8' : ''));
      return res.send(content);
    }
  }

  // Root or SPA rewrite fallback: index.html
  let html = files['index.html'] || files['dist/index.html'];

  if (html) {
    // Rewrite root-relative URLs
    html = html.replace(/\b(src|href)=["']\/(?!hosted\/|\/)([^"']*)["']/gi, `$1="/hosted/${id}/$2"`);

    const routerBridge = `
    <base href="/hosted/${id}/">
    <script>
      window.__HOSTED_BASE_PATH__ = "/hosted/${id}";
      window.__getHostedPath = function() {
        var p = window.location.pathname || "/";
        if (window.__HOSTED_BASE_PATH__ && p.startsWith(window.__HOSTED_BASE_PATH__)) {
          var stripped = p.slice(window.__HOSTED_BASE_PATH__.length);
          return (stripped && stripped !== "") ? (stripped.startsWith('/') ? stripped : ('/' + stripped)) : '/';
        }
        return p;
      };
      (function() {
        var pfx = "/hosted/${id}";
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

    if (html.includes('<base ')) {
      html = html.replace(/<base[^>]*>/, '');
    }

    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${routerBridge}`);
    } else {
      html = routerBridge + '\n' + html;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }

  // Fallback JSX App
  const mainCode = files['App.jsx'] || files['App.js'] || `
    function App() {
      return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-4">
            <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest font-mono">▲ VERCEL DIRECT HOSTING</span>
            <h1 className="text-2xl font-black text-white">${deployment?.name || id}</h1>
            <p className="text-xs text-zinc-400 font-mono">Deployment ID: ${id}</p>
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
  <title>${deployment?.name || id} - Vercel Edge Hosting</title>
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
    } catch (err) {
      document.body.innerHTML = '<div style="padding: 24px; color: #f43f5e; font-family: monospace;"><b>Vercel Runtime Error:</b><pre>' + err.stack + '</pre></div>';
    }
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(fallbackHtml);
}

// 6. Serve built frontend dist if available
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`▲ Vercel React & dist.zip Hosting Server listening on http://localhost:${PORT}`);
});
