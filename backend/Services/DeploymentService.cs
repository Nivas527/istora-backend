using System.IO.Compression;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using ShopifyEngine.Api.Models;

namespace ShopifyEngine.Api.Services;

public class DeploymentService
{
    private readonly string _cacheFilePath;
    private readonly object _lock = new();
    private List<Deployment> _deployments = new();

    public static readonly Dictionary<string, string> MimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        { "js", "application/javascript; charset=utf-8" },
        { "mjs", "application/javascript; charset=utf-8" },
        { "css", "text/css; charset=utf-8" },
        { "html", "text/html; charset=utf-8" },
        { "htm", "text/html; charset=utf-8" },
        { "json", "application/json; charset=utf-8" },
        { "svg", "image/svg+xml" },
        { "png", "image/png" },
        { "jpg", "image/jpeg" },
        { "jpeg", "image/jpeg" },
        { "gif", "image/gif" },
        { "webp", "image/webp" },
        { "ico", "image/x-icon" },
        { "woff", "font/woff" },
        { "woff2", "font/woff2" },
        { "ttf", "font/ttf" }
    };

    public DeploymentService(IWebHostEnvironment env)
    {
        // Try local or root directory cache file
        var localPath = Path.Combine(env.ContentRootPath, ".deployments-cache.json");
        var rootPath = Path.Combine(Directory.GetParent(env.ContentRootPath)?.FullName ?? env.ContentRootPath, ".deployments-cache.json");
        
        _cacheFilePath = File.Exists(rootPath) ? rootPath : localPath;
        LoadCache();
    }

    private void LoadCache()
    {
        lock (_lock)
        {
            if (File.Exists(_cacheFilePath))
            {
                try
                {
                    var json = File.ReadAllText(_cacheFilePath);
                    var list = JsonSerializer.Deserialize<List<Deployment>>(json);
                    if (list != null && list.Count > 0)
                    {
                        _deployments = list;
                        return;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[C# Engine] Warning: Failed to parse cache: {ex.Message}");
                }
            }

            // Seed sample deployments if cache is empty
            _deployments = SeedDefaultDeployments();
            SaveCacheInternal();
        }
    }

    public void SaveCache()
    {
        lock (_lock)
        {
            SaveCacheInternal();
        }
    }

    private void SaveCacheInternal()
    {
        try
        {
            var json = JsonSerializer.Serialize(_deployments, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(_cacheFilePath, json);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[C# Engine] Error: Failed to save cache: {ex.Message}");
        }
    }

    public List<Deployment> GetAll()
    {
        lock (_lock)
        {
            return new List<Deployment>(_deployments);
        }
    }

    public Deployment? GetById(string id)
    {
        lock (_lock)
        {
            return _deployments.FirstOrDefault(d => d.Id == id);
        }
    }

    public void Upsert(Deployment deployment)
    {
        lock (_lock)
        {
            _deployments.RemoveAll(d => d.Id == deployment.Id);
            _deployments.Insert(0, deployment);
            SaveCacheInternal();
        }
    }

    public void Sync(List<Deployment> deployments)
    {
        lock (_lock)
        {
            _deployments = deployments;
            SaveCacheInternal();
        }
    }

    public bool Delete(string id)
    {
        lock (_lock)
        {
            var removed = _deployments.RemoveAll(d => d.Id == id) > 0;
            if (removed) SaveCacheInternal();
            return removed;
        }
    }

    // High-performance zip extraction using System.IO.Compression.ZipArchive
    public async Task<Deployment> ExtractZipToDeploymentAsync(Stream zipStream, string appName = "dist-app", string environment = "production")
    {
        using var archive = new ZipArchive(zipStream, ZipArchiveMode.Read);
        var files = new Dictionary<string, string>();
        var totalBytes = 0L;

        // Filter valid entries, skipping macOS __MACOSX / .DS_Store
        var entries = archive.Entries
            .Where(e => !e.FullName.EndsWith('/') &&
                        !e.FullName.Contains("__MACOSX") &&
                        !Path.GetFileName(e.FullName).StartsWith('.'))
            .ToList();

        // Detect common prefix (e.g. "dist/" or "build/")
        string commonPrefix = "";
        var firstEntry = entries.FirstOrDefault()?.FullName ?? "";
        if (firstEntry.StartsWith("dist/", StringComparison.OrdinalIgnoreCase) ||
            firstEntry.StartsWith("build/", StringComparison.OrdinalIgnoreCase))
        {
            var slashIdx = firstEntry.IndexOf('/');
            var pfx = firstEntry.Substring(0, slashIdx + 1);
            if (entries.All(e => e.FullName.StartsWith(pfx, StringComparison.OrdinalIgnoreCase)))
            {
                commonPrefix = pfx;
            }
        }

        foreach (var entry in entries)
        {
            var normPath = !string.IsNullOrEmpty(commonPrefix) && entry.FullName.StartsWith(commonPrefix, StringComparison.OrdinalIgnoreCase)
                ? entry.FullName.Substring(commonPrefix.Length)
                : Regex.Replace(entry.FullName, @"^(dist|build|out|public)/", "", RegexOptions.IgnoreCase);

            if (string.IsNullOrWhiteSpace(normPath)) continue;

            var ext = Path.GetExtension(normPath).TrimStart('.').ToLowerInvariant();
            var isText = new[] { "html", "htm", "js", "mjs", "jsx", "ts", "tsx", "css", "json", "svg", "txt", "map", "xml" }.Contains(ext);

            await using var entryStream = entry.Open();

            if (isText)
            {
                using var reader = new StreamReader(entryStream, Encoding.UTF8);
                var textContent = await reader.ReadToEndAsync();
                files[normPath] = textContent;
                if (entry.FullName != normPath) files[entry.FullName] = textContent;
                totalBytes += Encoding.UTF8.GetByteCount(textContent);
            }
            else
            {
                // Binary assets: encode as data URI
                using var ms = new MemoryStream();
                await entryStream.CopyToAsync(ms);
                var bytes = ms.ToArray();
                var mime = MimeTypes.GetValueOrDefault(ext, "application/octet-stream");
                var dataUri = $"data:{mime};base64,{Convert.ToBase64String(bytes)}";
                files[normPath] = dataUri;
                if (entry.FullName != normPath) files[entry.FullName] = dataUri;
                totalBytes += bytes.Length;
            }
        }

        // Ensure index.html exists
        if (!files.ContainsKey("index.html"))
        {
            var candidate = files.Keys.FirstOrDefault(k => k.EndsWith(".html", StringComparison.OrdinalIgnoreCase));
            if (candidate != null) files["index.html"] = files[candidate];
        }

        var slug = Regex.Replace(appName.ToLowerInvariant(), @"[^a-z0-9-]", "-").Trim('-');
        if (string.IsNullOrEmpty(slug)) slug = "app-" + Random.Shared.Next(100, 999);

        var deployment = new Deployment
        {
            Id = $"dep_dist_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
            Name = slug,
            Project = slug,
            Subdomain = $"{slug}.vercel.app",
            LiveUrl = $"https://{slug}.vercel.app",
            Status = "READY",
            Environment = environment,
            IsDistZip = true,
            Framework = "React 19 (Extracted dist.zip - ASP.NET Core)",
            NodeVersion = ".NET 10 Kestrel",
            Region = "iad1 (Washington, D.C.)",
            CreatedAt = DateTime.UtcNow.ToString("o"),
            BuildDurationMs = Random.Shared.Next(400, 900),
            BundleSizeKb = Math.Round(totalBytes / 1024.0, 1),
            Commit = new DeploymentCommit
            {
                Hash = Guid.NewGuid().ToString("N")[..7],
                Message = $"deploy: dist.zip bundle ({files.Count} files, {Math.Round(totalBytes / 1024.0)} kB)",
                Author = "developer",
                Branch = environment == "production" ? "main" : "release"
            },
            Files = files,
            Logs = new List<DeploymentLog>
            {
                new() { Timestamp = "00:00.010", Level = "info", Message = $"[C# ASP.NET Core] Unpacking zip bundle for {slug}" },
                new() { Timestamp = "00:00.120", Level = "info", Message = $"Extracted {files.Count} static assets via System.IO.Compression" },
                new() { Timestamp = "00:00.320", Level = "info", Message = "Virtual Edge Router Bridge injected" },
                new() { Timestamp = "00:00.540", Level = "success", Message = $"Deployment live on edge: https://{slug}.vercel.app" }
            }
        };

        Upsert(deployment);
        return deployment;
    }

    public (string Content, string ContentType)? ResolveAsset(Deployment deployment, string assetPath)
    {
        var cleanAsset = assetPath.TrimStart('/');
        var candidateKeys = new[]
        {
            cleanAsset,
            "dist/" + cleanAsset,
            "assets/" + cleanAsset,
            "dist/assets/" + cleanAsset,
            cleanAsset.StartsWith("assets/") ? cleanAsset[7..] : cleanAsset
        };

        string? matchedKey = null;
        string? content = null;

        foreach (var key in candidateKeys)
        {
            if (deployment.Files.TryGetValue(key, out var val))
            {
                matchedKey = key;
                content = val;
                break;
            }
        }

        if (content == null) return null;

        var ext = Path.GetExtension(matchedKey!).TrimStart('.').ToLowerInvariant();
        var mime = MimeTypes.GetValueOrDefault(ext, "application/octet-stream");

        // React Router Edge Path virtualization for JS modules
        if ((ext is "js" or "mjs" || mime.Contains("javascript")) && !string.IsNullOrEmpty(content))
        {
            content = content.Replace("window.location.pathname", "(window.__getHostedPath?window.__getHostedPath():window.location.pathname)");
        }

        return (content, mime);
    }

    public string PrepareHtml(Deployment deployment)
    {
        var html = deployment.Files.GetValueOrDefault("index.html")
                   ?? deployment.Files.GetValueOrDefault("dist/index.html")
                   ?? "<!doctype html><html><head></head><body><div id=\"root\"></div></body></html>";

        var id = deployment.Id;

        // Rewrite root-relative URLs
        html = Regex.Replace(html, @"\b(src|href)=[""']/(?!hosted/|/)([^""']*)[""']",
            $"$1=\"/hosted/{id}/$2\"", RegexOptions.IgnoreCase);

        var routerBridge = $@"
    <base href=""/hosted/{id}/"">
    <script>
      window.__HOSTED_BASE_PATH__ = ""/hosted/{id}"";
      if (window.parent && window.parent.ShopifyStorefront) {{
        window.ShopifyStorefront = window.parent.ShopifyStorefront;
      }}
      window.__getHostedPath = function() {{
        var p = window.location.pathname || ""/"";
        if (window.__HOSTED_BASE_PATH__ && p.startsWith(window.__HOSTED_BASE_PATH__)) {{
          var stripped = p.slice(window.__HOSTED_BASE_PATH__.length);
          return (stripped && stripped !== """") ? (stripped.startsWith('/') ? stripped : ('/' + stripped)) : '/';
        }}
        return p;
      }};
      (function() {{
        var pfx = ""/hosted/{id}"";
        var origPush = window.history.pushState;
        window.history.pushState = function(state, title, url) {{
          if (url && typeof url === 'string' && !url.startsWith('/hosted/')) {{
            url = pfx + (url.startsWith('/') ? url : ('/' + url));
          }}
          return origPush.call(this, state, title, url);
        }};
        var origReplace = window.history.replaceState;
        window.history.replaceState = function(state, title, url) {{
          if (url && typeof url === 'string' && !url.startsWith('/hosted/')) {{
            url = pfx + (url.startsWith('/') ? url : ('/' + url));
          }}
          return origReplace.call(this, state, title, url);
        }};
      }})();
    </script>";

        if (html.Contains("<base ", StringComparison.OrdinalIgnoreCase))
        {
            html = Regex.Replace(html, @"<base[^>]*>", "", RegexOptions.IgnoreCase);
        }

        if (html.Contains("<head>", StringComparison.OrdinalIgnoreCase))
        {
            html = html.Replace("<head>", $"<head>{routerBridge}", StringComparison.OrdinalIgnoreCase);
        }
        else
        {
            html = routerBridge + "\n" + html;
        }

        return html;
    }

    private static List<Deployment> SeedDefaultDeployments()
    {
        return new List<Deployment>
        {
            new()
            {
                Id = "dep_dist_zip_production",
                Name = "apex-velocity-dist-build",
                Project = "apex-storefront",
                Subdomain = "apex-dist-build.vercel.app",
                LiveUrl = "https://apex-dist-build.vercel.app",
                Status = "READY",
                Environment = "production",
                IsDistZip = true,
                Framework = "React 19 (Extracted dist.zip - ASP.NET Core)",
                NodeVersion = ".NET 10",
                Region = "iad1 (Washington, D.C.)",
                BuildDurationMs = 740,
                BundleSizeKb = 590.2,
                Commit = new DeploymentCommit
                {
                    Hash = "e92bc01",
                    Message = "release: extracted production dist.zip bundle (ASP.NET Core Edge)",
                    Author = "release-manager",
                    Branch = "release/v3.0"
                },
                Files = new Dictionary<string, string>
                {
                    {
                        "index.html",
                        @"<!doctype html>
<html lang=""en"">
  <head>
    <meta charset=""UTF-8"" />
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
    <title>Apex Velocity | dist.zip Production</title>
    <link rel=""stylesheet"" crossorigin href=""./assets/index.css"">
  </head>
  <body class=""bg-zinc-950 text-white font-sans antialiased"">
    <div id=""root""></div>
    <script type=""module"" crossorigin src=""./assets/index.js""></script>
  </body>
</html>"
                    },
                    {
                        "assets/index.css",
                        @"* { box-sizing: border-box; }
body { margin: 0; background: #09090b; color: #f4f4f5; font-family: ui-sans-serif, system-ui, sans-serif; }
.hero-glow { background: radial-gradient(circle at 50% 20%, rgba(16, 185, 129, 0.15) 0%, transparent 60%); }
.card { background: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 24px; transition: all 0.2s; }
.card:hover { border-color: #10b981; transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
.badge-pill { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; font-family: monospace; }
.btn-primary { background: #10b981; color: #000; font-weight: 800; border-radius: 12px; padding: 12px 24px; border: none; cursor: pointer; transition: background 0.2s; }
.btn-primary:hover { background: #34d399; }
.btn-secondary { background: #27272a; color: #fff; font-weight: 700; border-radius: 12px; padding: 12px 20px; border: 1px solid #3f3f46; cursor: pointer; }"
                    },
                    {
                        "assets/index.js",
                        @"import React from 'https://esm.sh/react@19';
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
        'ASP.NET CORE 10 KESTREL • DIST.ZIP HOSTING ENGINE'
      ),
      React.createElement('span', { style: { color: '#10b981' } }, 'HTTP 200 OK • 0.2ms TTFB')
    ),

    // Header
    React.createElement('header', { style: { padding: '18px 32px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(24,24,27,0.8)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 40 } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
        React.createElement('div', { style: { width: '36px', height: '36px', background: '#fff', color: '#000', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '18px' } }, '▲'),
        React.createElement('div', null,
          React.createElement('h1', { style: { fontSize: '16px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' } }, 'APEX VELOCITY (DIST.ZIP)'),
          React.createElement('p', { style: { fontSize: '11px', color: '#71717a', margin: 0, fontFamily: 'monospace' } }, 'Powered by ASP.NET Core 10 Kestrel Engine')
        )
      ),
      React.createElement('button', { className: 'btn-secondary', style: { padding: '8px 16px', fontSize: '12px' }, onClick: () => showToast('Cart has ' + cartCount + ' items') },
        '🛒 Cart (' + cartCount + ')'
      )
    ),

    // Hero
    React.createElement('main', { style: { maxWidth: '1200px', margin: '0 auto', padding: '48px 24px' } },
      React.createElement('div', { className: 'hero-glow', style: { padding: '64px 24px', textAlign: 'center', borderRadius: '24px', border: '1px solid #27272a', marginBottom: '48px' } },
        React.createElement('span', { className: 'badge-pill' }, '⚡ HIGH PERFORMANCE C# EDGE RUNTIME'),
        React.createElement('h2', { style: { fontSize: '48px', fontWeight: '900', margin: '16px 0 8px', letterSpacing: '-1.5px' } },
          'Zero-Config ',
          React.createElement('span', { style: { color: '#10b981' } }, 'dist.zip Hosting')
        ),
        React.createElement('p', { style: { color: '#a1a1aa', maxWidth: '580px', margin: '0 auto 24px', fontSize: '15px', lineHeight: '1.6' } },
          'Served directly from ASP.NET Core Kestrel with automatic root asset rewriting and client router virtualization.'
        ),
        React.createElement('div', { style: { display: 'flex', gap: '12px', justifyContent: 'center' } },
          React.createElement('button', { className: 'btn-primary', onClick: () => { setCartCount(c => c + 1); showToast('Added Velocity Pro to Cart'); } }, '⚡ Test Quick Buy'),
          React.createElement('button', { className: 'btn-secondary', onClick: () => showToast('Bundle Size: 590 kB (3 assets)') }, 'View Bundle Info')
        )
      ),

      // Catalog Tabs
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' } },
        React.createElement('h3', { style: { fontSize: '20px', fontWeight: '800' } }, 'Extracted Catalog Items'),
        React.createElement('div', { style: { display: 'flex', gap: '8px' } },
          ['all', 'footwear', 'apparel', 'gear'].map(tab =>
            React.createElement('button', {
              key: tab,
              onClick: () => setActiveTab(tab),
              style: {
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === tab ? '#10b981' : '#27272a',
                color: activeTab === tab ? '#000' : '#a1a1aa'
              }
            }, tab.toUpperCase())
          )
        )
      ),

      // Product Grid
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' } },
        filtered.map(p =>
          React.createElement('div', { key: p.id, className: 'card' },
            React.createElement('img', { src: p.img, style: { width: '100%', height: '220px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px' } }),
            React.createElement('span', { style: { fontSize: '11px', color: '#10b981', textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: '700' } }, p.cat),
            React.createElement('h4', { style: { fontSize: '16px', fontWeight: '800', margin: '4px 0 12px' } }, p.title),
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
              React.createElement('span', { style: { fontSize: '20px', fontWeight: '900' } }, '$' + p.price.toFixed(2)),
              React.createElement('button', { className: 'btn-primary', style: { padding: '8px 16px', fontSize: '12px' }, onClick: () => { setCartCount(c => c + 1); showToast('Added ' + p.title + ' to cart!'); } }, 'Add to Cart')
            )
          )
        )
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));"
                    }
                }
            }
        };
    }
}
