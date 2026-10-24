// zipExtractor.js
// Robust extraction, normalization, and packaging for dist.zip files

import JSZip from 'jszip';

/**
 * Extract a dist.zip File, Blob, or Buffer into a structured dictionary of files.
 * Automatically strips macOS metadata (__MACOSX, .DS_Store) and normalizes
 * nested folder wrappers (e.g. dist/, build/, out/, release/).
 *
 * @param {File|Blob|ArrayBuffer|Buffer} zipInput
 * @returns {Promise<{
 *   files: Record<string, string>,
 *   fileTypes: Record<string, string>,
 *   fileSizes: Record<string, number>,
 *   entryPoint: string,
 *   totalSizeBytes: number,
 *   fileCount: number,
 *   manifest: Array<{ path: string, size: number, type: string }>
 * }>}
 */
export async function extractDistZip(zipInput) {
  const zip = await JSZip.loadAsync(zipInput);

  // Filter out directories, macOS metadata, and .DS_Store files
  const rawFilePaths = Object.keys(zip.files).filter(
    (p) => !zip.files[p].dir && !p.startsWith('__MACOSX') && !p.includes('.DS_Store')
  );

  if (rawFilePaths.length === 0) {
    throw new Error('The zip file is empty or contains no readable files. Please ensure it contains built assets (index.html, JS, CSS).');
  }

  // Find index.html location to determine the root build directory prefix
  let commonPrefix = '';
  const indexHtmlPath = rawFilePaths.find((p) => p.toLowerCase().endsWith('index.html'));

  if (indexHtmlPath) {
    const lastSlash = indexHtmlPath.lastIndexOf('/');
    if (lastSlash !== -1) {
      commonPrefix = indexHtmlPath.substring(0, lastSlash + 1);
    }
  } else {
    // If no index.html, check for common first directory
    const firstPath = rawFilePaths[0];
    const slashIndex = firstPath.indexOf('/');
    if (slashIndex !== -1) {
      const candidatePrefix = firstPath.substring(0, slashIndex + 1);
      const candidateName = candidatePrefix.replace('/', '').toLowerCase();
      if (['dist', 'build', 'out', 'public'].includes(candidateName)) {
        if (rawFilePaths.every((p) => p.startsWith(candidatePrefix))) {
          commonPrefix = candidatePrefix;
        }
      }
    }
  }

  const files = {};
  const fileTypes = {};
  const fileSizes = {};
  const manifest = [];
  let totalSizeBytes = 0;

  for (const rawPath of rawFilePaths) {
    const normalizedPath = commonPrefix && rawPath.startsWith(commonPrefix)
      ? rawPath.slice(commonPrefix.length)
      : rawPath.replace(/^(dist|build|out|public)\//i, '');

    if (!normalizedPath) continue;

    const zipEntry = zip.files[rawPath];
    const ext = normalizedPath.split('.').pop().toLowerCase();
    const isText = [
      'html', 'htm', 'js', 'mjs', 'jsx', 'ts', 'tsx', 'css', 'json', 'svg', 'txt', 'map', 'xml'
    ].includes(ext);

    let content = '';
    let size = 0;

    if (isText) {
      content = await zipEntry.async('text');
      size = new Blob([content]).size;
    } else {
      // Binary files (png, jpg, woff, etc.): read as Base64 Data URL
      const base64 = await zipEntry.async('base64');
      const mime = getMimeType(ext);
      content = `data:${mime};base64,${base64}`;
      size = Math.round((base64.length * 3) / 4);
    }

    // Store by normalized path
    files[normalizedPath] = content;
    fileSizes[normalizedPath] = size;
    fileTypes[normalizedPath] = ext;
    totalSizeBytes += size;

    // Also alias by rawPath if different, to ensure zero-miss lookups
    if (rawPath !== normalizedPath) {
      files[rawPath] = content;
    }

    manifest.push({
      path: normalizedPath,
      size,
      type: ext
    });
  }

  // Ensure index.html exists
  let entryPoint = 'index.html';
  if (!files['index.html']) {
    const candidateHtml = Object.keys(files).find((p) => p.endsWith('.html'));
    if (candidateHtml) {
      files['index.html'] = files[candidateHtml];
      entryPoint = 'index.html';
    } else {
      // Synthetic fallback index.html if only JS/CSS were in dist
      files['index.html'] = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hosted App</title>
  ${Object.keys(files).filter(f => f.endsWith('.css')).map(f => `<link rel="stylesheet" href="./${f}">`).join('\n  ')}
</head>
<body>
  <div id="root"></div>
  ${Object.keys(files).filter(f => f.endsWith('.js')).map(f => `<script type="module" src="./${f}"></script>`).join('\n  ')}
</body>
</html>`;
    }
  }

  return {
    files,
    fileTypes,
    fileSizes,
    entryPoint,
    totalSizeBytes,
    fileCount: manifest.length,
    manifest: manifest.sort((a, b) => b.size - a.size)
  };
}

/**
 * Creates a pre-packaged sample dist.zip containing a production-compiled React app.
 * Perfect for 1-click testing of dist.zip deployment.
 */
export async function createSampleDistZip() {
  const zip = new JSZip();

  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Apex Velocity Storefront | Dist Build</title>
    <link rel="stylesheet" crossorigin href="./assets/index.css">
  </head>
  <body class="bg-zinc-950 text-white font-sans antialiased">
    <div id="root"></div>
    <script type="module" crossorigin src="./assets/index.js"></script>
  </body>
</html>`;

  const indexCss = `
* { box-sizing: border-box; }
body { margin: 0; background: #09090b; color: #f4f4f5; font-family: ui-sans-serif, system-ui, sans-serif; }
.card { background: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 24px; transition: transform 0.2s; }
.card:hover { transform: translateY(-2px); border-color: #10b981; }
.btn { background: #10b981; color: #000; font-weight: 800; border-radius: 10px; padding: 10px 18px; border: none; cursor: pointer; }
.btn:hover { background: #34d399; }
.badge { background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; }
`;

  const indexJs = `
import React from 'https://esm.sh/react@19';
import ReactDOM from 'https://esm.sh/react-dom@19/client';

function App() {
  const [likes, setLikes] = React.useState(42);
  const [itemsInCart, setItemsInCart] = React.useState(0);

  return React.createElement('div', { className: 'min-h-screen p-8 max-w-4xl mx-auto space-y-6' },
    React.createElement('header', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #27272a', paddingBottom: '16px' } },
      React.createElement('div', null,
        React.createElement('span', { className: 'badge' }, '📦 EXTRACTED FROM DIST.ZIP'),
        React.createElement('h1', { style: { fontSize: '24px', fontWeight: '900', margin: '8px 0 0' } }, 'Apex Performance Runner V3')
      ),
      React.createElement('button', { className: 'btn', onClick: () => setItemsInCart(c => c + 1) },
        '🛒 Cart (' + itemsInCart + ')'
      )
    ),
    React.createElement('div', { className: 'card', style: { display: 'flex', gap: '24px', alignItems: 'center' } },
      React.createElement('div', { style: { width: '120px', height: '120px', background: 'linear-gradient(135deg, #10b981, #065f46)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' } }, '⚡'),
      React.createElement('div', { style: { flex: 1 } },
        React.createElement('h2', { style: { fontSize: '18px', fontWeight: '800', margin: '0 0 6px' } }, 'Vite Production Bundle Loaded'),
        React.createElement('p', { style: { color: '#a1a1aa', fontSize: '13px', margin: '0 0 12px' } },
          'This entire React application was extracted from a single dist.zip file, automatically routing scripts and styles without external dependencies.'
        ),
        React.createElement('div', { style: { display: 'flex', gap: '8px' } },
          React.createElement('button', { className: 'btn', onClick: () => setLikes(l => l + 1) }, '👍 Upvote (' + likes + ')'),
          React.createElement('button', { className: 'btn', style: { background: '#27272a', color: '#fff' }, onClick: () => alert('Order dispatched for Apex Runner V3!') }, 'Buy Now - $189.99')
        )
      )
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
`;

  // Put in dist/ folder inside the zip
  zip.file('dist/index.html', indexHtml);
  zip.file('dist/assets/index.css', indexCss);
  zip.file('dist/assets/index.js', indexJs);

  return await zip.generateAsync({ type: 'blob' });
}

function getMimeType(ext) {
  const map = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    svg: 'image/svg+xml',
    gif: 'image/gif',
    webp: 'image/webp',
    ico: 'image/x-icon',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    otf: 'font/otf',
    json: 'application/json',
    wasm: 'application/wasm'
  };
  return map[ext] || 'application/octet-stream';
}
