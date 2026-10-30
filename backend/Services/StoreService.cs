using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ShopifyEngine.Api.Data;
using ShopifyEngine.Api.Models;

namespace ShopifyEngine.Api.Services;

public class StoreService
{
    private readonly ShopifyDbContext _db;
    private readonly ITenantProvider _tenantProvider;
    private readonly R2StorageService _r2Storage;
    private readonly object _lock = new();

    public StoreService(ShopifyDbContext db, ITenantProvider tenantProvider, R2StorageService r2Storage)
    {
        _db = db;
        _tenantProvider = tenantProvider;
        _r2Storage = r2Storage;
    }

    public void InitializeDatabase()
    {
        try
        {
            // 1. Ensure Stores table is seeded
            if (!_db.Stores.Any())
            {
                var apexStore = new DbStore
                {
                    Id = "store_apex",
                    Name = "Apex Athletics & Co.",
                    Slug = "apex",
                    Subdomain = "apex.istora.online",
                    CustomDomain = "apexstore.fashion.com",
                    Category = "Sportswear & Performance",
                    ThemeId = "theme_apex_velocity",
                    AccentColor = "#008060",
                    Currency = "USD",
                    CurrencySymbol = "$",
                    TaxRate = 0.08m,
                    FreeShippingThreshold = 75.00m,
                    StandardShippingRate = 6.99m,
                    ExpressShippingRate = 14.99m,
                    ContactEmail = "support@apexathletics.com",
                    Status = "active"
                };

                var auraStore = new DbStore
                {
                    Id = "store_aura",
                    Name = "Aura Studio Acoustics",
                    Slug = "aura",
                    Subdomain = "aura.istora.online",
                    CustomDomain = "aurasound.audio.com",
                    Category = "Consumer Electronics & Audio",
                    ThemeId = "theme_nordic_sound",
                    AccentColor = "#4f46e5",
                    Currency = "USD",
                    CurrencySymbol = "$",
                    TaxRate = 0.07m,
                    FreeShippingThreshold = 100.00m,
                    StandardShippingRate = 9.99m,
                    ExpressShippingRate = 19.99m,
                    ContactEmail = "contact@aurasound.io",
                    Status = "active"
                };

                _db.Stores.AddRange(apexStore, auraStore);
                _db.SaveChanges();
            }

            // 2. Ensure Categories seeded (bypassing query filter for seed verification)
            if (!_db.Categories.IgnoreQueryFilters().Any())
            {
                _db.Categories.AddRange(
                    new DbCategory { Id = "cat_1", StoreId = "store_apex", Name = "Apparel", Slug = "apparel" },
                    new DbCategory { Id = "cat_2", StoreId = "store_apex", Name = "Footwear", Slug = "footwear" },
                    new DbCategory { Id = "cat_3", StoreId = "store_apex", Name = "Gear", Slug = "gear" },
                    new DbCategory { Id = "cat_4", StoreId = "store_aura", Name = "Headphones", Slug = "headphones" },
                    new DbCategory { Id = "cat_5", StoreId = "store_aura", Name = "Speakers", Slug = "speakers" }
                );
                _db.SaveChanges();
            }

            // 3. Ensure Products seeded with StoreId (bypassing query filter for seed verification)
            if (!_db.Products.IgnoreQueryFilters().Any())
            {
                _db.Products.AddRange(
                    new DbProduct
                    {
                        Id = "prod_1",
                        StoreId = "store_apex",
                        Title = "AeroGlide Elite Carbon Runner",
                        Category = "Footwear",
                        Price = 189.99m,
                        CompareAtPrice = 220.00m,
                        Badge = "Bestseller",
                        Image = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
                        Description = "Precision engineered dual-density carbon plate runner for elite road racing.",
                        Inventory = 45,
                        VariantsJson = JsonSerializer.Serialize(new[]
                        {
                            new { id = "var_1_9", name = "US 9 / Stealth Black", price = 189.99m, sku = "AG-BLK-9" },
                            new { id = "var_1_10", name = "US 10 / Stealth Black", price = 189.99m, sku = "AG-BLK-10" }
                        })
                    },
                    new DbProduct
                    {
                        Id = "prod_2",
                        StoreId = "store_apex",
                        Title = "Vortex Seamless Compression Layer",
                        Category = "Apparel",
                        Price = 54.00m,
                        Badge = "New",
                        Image = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
                        Description = "Micro-rib thermal regulating base layer with zero-friction bonded flatlock seams.",
                        Inventory = 80,
                        VariantsJson = JsonSerializer.Serialize(new[]
                        {
                            new { id = "var_2_s", name = "Small / Matte Obsidian", price = 54.00m, sku = "VX-S" },
                            new { id = "var_2_m", name = "Medium / Matte Obsidian", price = 54.00m, sku = "VX-M" }
                        })
                    },
                    new DbProduct
                    {
                        Id = "prod_aura_1",
                        StoreId = "store_aura",
                        Title = "Aura Studio ANC Wireless Headphones",
                        Category = "Headphones",
                        Price = 199.00m,
                        CompareAtPrice = 249.00m,
                        Badge = "Flagship",
                        Image = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
                        Description = "Custom 40mm bio-cellulose drivers with hybrid active noise cancellation up to -38dB.",
                        Inventory = 35,
                        VariantsJson = JsonSerializer.Serialize(new[]
                        {
                            new { id = "var_aura_blk", name = "Midnight Black", price = 199.00m, sku = "AURA-ANC-BLK" },
                            new { id = "var_aura_slv", name = "Silver Birch", price = 199.00m, sku = "AURA-ANC-SLV" }
                        })
                    }
                );
                _db.SaveChanges();
            }

            // 4. Ensure Discounts seeded (bypassing query filter for seed verification)
            if (!_db.Discounts.IgnoreQueryFilters().Any())
            {
                _db.Discounts.AddRange(
                    new DbDiscount { Id = "disc_1", StoreId = "store_apex", Code = "WELCOME20", Type = "percentage", Value = 20, Description = "20% off all orders" },
                    new DbDiscount { Id = "disc_2", StoreId = "store_apex", Code = "FREESHIP", Type = "shipping", Value = 100, Description = "Free Express Shipping" },
                    new DbDiscount { Id = "disc_3", StoreId = "store_aura", Code = "AURA10", Type = "percentage", Value = 10, Description = "10% off Audio Gear" }
                );
                _db.SaveChanges();
            }

            // 5. Populate TenantDomainRegistry with all known subdomains and custom domains
            foreach (var st in _db.Stores.AsNoTracking().ToList())
            {
                if (!string.IsNullOrWhiteSpace(st.Subdomain))
                    TenantDomainRegistry.Register(st.Subdomain, st.Id);
                if (!string.IsNullOrWhiteSpace(st.Slug))
                    TenantDomainRegistry.Register(st.Slug, st.Id);
                if (!string.IsNullOrWhiteSpace(st.CustomDomain))
                    TenantDomainRegistry.Register(st.CustomDomain, st.Id);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[PostgreSQL] InitializeDatabase notice: {ex.Message}");
        }
    }

    public string GenerateNextStoreSlug()
    {
        lock (_lock)
        {
            var existingSlugs = _db.Stores.AsNoTracking().Select(s => s.Slug).ToList();
            var maxNum = 1000;
            var regex = new System.Text.RegularExpressions.Regex(@"^apexcommerce(\d+)$", System.Text.RegularExpressions.RegexOptions.IgnoreCase);

            foreach (var slug in existingSlugs)
            {
                if (string.IsNullOrWhiteSpace(slug)) continue;
                var match = regex.Match(slug);
                if (match.Success && int.TryParse(match.Groups[1].Value, out var num))
                {
                    if (num > maxNum) maxNum = num;
                }
            }

            return $"apexcommerce{maxNum + 1}";
        }
    }

    // =========================================================================
    // 1. MULTI-TENANT STORES APIS (Registry)
    // =========================================================================
    public List<TenantStore> GetStores()
    {
        return _db.Stores.AsNoTracking().Select(s => new TenantStore
        {
            Id = s.Id,
            Name = s.Name,
            Slug = s.Slug,
            Subdomain = s.Subdomain,
            CustomDomain = s.CustomDomain,
            Category = s.Category,
            ThemeId = s.ThemeId,
            AccentColor = s.AccentColor,
            Currency = s.Currency,
            CurrencySymbol = s.CurrencySymbol,
            TaxRate = s.TaxRate,
            FreeShippingThreshold = s.FreeShippingThreshold,
            StandardShippingRate = s.StandardShippingRate,
            ExpressShippingRate = s.ExpressShippingRate,
            ContactEmail = s.ContactEmail,
            Location = s.Location,
            Plan = s.Plan,
            Environment = s.Environment,
            Status = s.Status,
            CreatedAt = s.CreatedAt,
            RazorpayEnabled = s.RazorpayEnabled,
            RazorpayKeyId = s.RazorpayKeyId,
            RazorpayKeySecret = s.RazorpayKeySecret,
            StripeEnabled = s.StripeEnabled,
            StripePublishableKey = s.StripePublishableKey,
            StripeSecretKey = s.StripeSecretKey,
            CodEnabled = s.CodEnabled,
            BannerVideoUrl = s.BannerVideoUrl,
            PreviewVideos = DeserializePreviewVideos(s.PreviewVideosJson),
            GstEnabled = s.GstEnabled,
            Gstin = s.Gstin,
            LegalBusinessName = s.LegalBusinessName,
            StateCode = s.StateCode,
            StateName = s.StateName,
            DefaultHsnCode = s.DefaultHsnCode,
            GstRatePercent = s.GstRatePercent,
            PricesIncludeGst = s.PricesIncludeGst,
            InvoicePrefix = s.InvoicePrefix
        }).ToList();
    }

    public TenantStore? GetStoreById(string storeId)
    {
        if (string.IsNullOrWhiteSpace(storeId)) return null;
        var clean = storeId.Trim();
        var cleanLower = clean.ToLowerInvariant();
        var target = HttpTenantProvider.NormalizeStoreId(cleanLower);
        var cleanedDomain = TenantDomainRegistry.CleanDomain(clean);

        var s = _db.Stores.AsNoTracking().FirstOrDefault(x =>
            x.Id == target ||
            x.Id == cleanLower ||
            x.Slug.ToLower() == cleanLower ||
            x.Subdomain.ToLower() == cleanLower ||
            x.Subdomain.ToLower() == cleanedDomain ||
            (x.CustomDomain != null && x.CustomDomain.ToLower() == cleanLower) ||
            (x.CustomDomain != null && x.CustomDomain.ToLower() == cleanedDomain)
        );

        if (s == null) return null;
        return new TenantStore
        {
            Id = s.Id,
            Name = s.Name,
            Slug = s.Slug,
            Subdomain = s.Subdomain,
            CustomDomain = s.CustomDomain,
            Category = s.Category,
            ThemeId = s.ThemeId,
            AccentColor = s.AccentColor,
            Currency = s.Currency,
            CurrencySymbol = s.CurrencySymbol,
            TaxRate = s.TaxRate,
            FreeShippingThreshold = s.FreeShippingThreshold,
            StandardShippingRate = s.StandardShippingRate,
            ExpressShippingRate = s.ExpressShippingRate,
            ContactEmail = s.ContactEmail,
            Location = s.Location,
            Plan = s.Plan,
            Environment = s.Environment,
            Status = s.Status,
            CreatedAt = s.CreatedAt,
            RazorpayEnabled = s.RazorpayEnabled,
            RazorpayKeyId = s.RazorpayKeyId,
            RazorpayKeySecret = s.RazorpayKeySecret,
            StripeEnabled = s.StripeEnabled,
            StripePublishableKey = s.StripePublishableKey,
            StripeSecretKey = s.StripeSecretKey,
            CodEnabled = s.CodEnabled,
            BannerVideoUrl = s.BannerVideoUrl,
            PreviewVideos = DeserializePreviewVideos(s.PreviewVideosJson),
            GstEnabled = s.GstEnabled,
            Gstin = s.Gstin,
            LegalBusinessName = s.LegalBusinessName,
            StateCode = s.StateCode,
            StateName = s.StateName,
            DefaultHsnCode = s.DefaultHsnCode,
            GstRatePercent = s.GstRatePercent,
            PricesIncludeGst = s.PricesIncludeGst,
            InvoicePrefix = s.InvoicePrefix
        };
    }

    public const int MaxPreviewVideosPerStore = 5;

    public static List<PreviewVideoItem> DeserializePreviewVideos(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new List<PreviewVideoItem>();
        try
        {
            return JsonSerializer.Deserialize<List<PreviewVideoItem>>(json) ?? new List<PreviewVideoItem>();
        }
        catch
        {
            return new List<PreviewVideoItem>();
        }
    }

    public List<PreviewVideoItem> GetPreviewVideos(string storeId)
    {
        var target = HttpTenantProvider.NormalizeStoreId(storeId);
        var store = _db.Stores.AsNoTracking().FirstOrDefault(s => s.Id == target || s.Id == storeId || s.Slug == storeId);
        if (store == null) return new List<PreviewVideoItem>();
        return DeserializePreviewVideos(store.PreviewVideosJson);
    }

    public (bool success, string message, PreviewVideoItem? item) AddPreviewVideo(string storeId, PreviewVideoItem item)
    {
        var target = HttpTenantProvider.NormalizeStoreId(storeId);
        var store = _db.Stores.FirstOrDefault(s => s.Id == target || s.Id == storeId || s.Slug == storeId);
        if (store == null) return (false, "Store not found", null);

        var existing = DeserializePreviewVideos(store.PreviewVideosJson);
        if (existing.Count >= MaxPreviewVideosPerStore)
        {
            return (false, $"Preview video quota reached. Maximum allowed is {MaxPreviewVideosPerStore} preview videos per store.", null);
        }

        if (string.IsNullOrWhiteSpace(item.Id))
        {
            item.Id = $"vid_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{Random.Shared.Next(100, 999)}";
        }
        if (string.IsNullOrWhiteSpace(item.CreatedAt))
        {
            item.CreatedAt = DateTime.UtcNow.ToString("o");
        }

        existing.Add(item);
        store.PreviewVideosJson = JsonSerializer.Serialize(existing);
        _db.SaveChanges();

        return (true, "Preview video added successfully", item);
    }

    public bool DeletePreviewVideo(string storeId, string videoId)
    {
        var target = HttpTenantProvider.NormalizeStoreId(storeId);
        var store = _db.Stores.FirstOrDefault(s => s.Id == target || s.Id == storeId || s.Slug == storeId);
        if (store == null) return false;

        var existing = DeserializePreviewVideos(store.PreviewVideosJson);
        var removed = existing.RemoveAll(v => v.Id == videoId);
        if (removed > 0)
        {
            store.PreviewVideosJson = JsonSerializer.Serialize(existing);
            _db.SaveChanges();
            return true;
        }

        return false;
    }

    public bool SetBannerVideo(string storeId, string? videoUrl)
    {
        var target = HttpTenantProvider.NormalizeStoreId(storeId);
        var store = _db.Stores.FirstOrDefault(s => s.Id == target || s.Id == storeId || s.Slug == storeId);
        if (store == null) return false;

        store.BannerVideoUrl = string.IsNullOrWhiteSpace(videoUrl) ? null : videoUrl.Trim();
        _db.SaveChanges();
        return true;
    }

    public TenantStore CreateStore(TenantStore store)
    {
        // 1. Custom Platform StoreID generation (e.g. apexcommerce1001, apexcommerce1002)
        // Store name is kept for merchant branding, but platform handle is clean & sequential.
        if (string.IsNullOrWhiteSpace(store.Slug) ||
            store.Slug.StartsWith("store-") ||
            store.Slug.Equals(store.Name, StringComparison.OrdinalIgnoreCase))
        {
            var nextSlug = GenerateNextStoreSlug();
            store.Slug = nextSlug;
            store.Id = $"store_{nextSlug}";
        }
        else if (string.IsNullOrWhiteSpace(store.Id))
        {
            store.Id = HttpTenantProvider.NormalizeStoreId(store.Slug);
        }

        if (string.IsNullOrWhiteSpace(store.Subdomain))
        {
            store.Subdomain = $"{store.Slug}.istora.online";
        }

        if (!string.IsNullOrWhiteSpace(store.CustomDomain))
        {
            store.CustomDomain = TenantDomainRegistry.CleanDomain(store.CustomDomain);
        }
        else
        {
            store.CustomDomain = null;
        }

        // 2. Intelligent Location-based Defaults (Currency, Symbol, Tax, Shipping, Gateways)
        var loc = (store.Location ?? "").Trim().ToLowerInvariant();
        if (loc.Contains("india") || loc == "in")
        {
            store.Location = "India";
            if (store.Currency == "USD" || string.IsNullOrWhiteSpace(store.Currency))
            {
                store.Currency = "INR";
                store.CurrencySymbol = "₹";
                store.TaxRate = 0.18m; // 18% GST
                store.FreeShippingThreshold = 999.00m;
                store.StandardShippingRate = 49.00m;
                store.ExpressShippingRate = 149.00m;
                store.RazorpayEnabled = true;
                store.CodEnabled = true;
            }
        }
        else if (loc.Contains("united kingdom") || loc.Contains("uk") || loc == "gb")
        {
            store.Location = "United Kingdom";
            if (store.Currency == "USD" || string.IsNullOrWhiteSpace(store.Currency))
            {
                store.Currency = "GBP";
                store.CurrencySymbol = "£";
                store.TaxRate = 0.20m;
                store.FreeShippingThreshold = 50.00m;
                store.StandardShippingRate = 3.99m;
                store.ExpressShippingRate = 8.99m;
                store.StripeEnabled = true;
                store.CodEnabled = true;
            }
        }
        else if (loc.Contains("uae") || loc.Contains("dubai") || loc.Contains("emirates") || loc == "ae")
        {
            store.Location = "United Arab Emirates";
            if (store.Currency == "USD" || string.IsNullOrWhiteSpace(store.Currency))
            {
                store.Currency = "AED";
                store.CurrencySymbol = "د.إ";
                store.TaxRate = 0.05m;
                store.FreeShippingThreshold = 250.00m;
                store.StandardShippingRate = 20.00m;
                store.ExpressShippingRate = 45.00m;
                store.StripeEnabled = true;
                store.CodEnabled = true;
            }
        }
        else if (loc.Contains("europe") || loc.Contains("germany") || loc.Contains("france") || loc == "eu")
        {
            store.Location = "European Union";
            if (store.Currency == "USD" || string.IsNullOrWhiteSpace(store.Currency))
            {
                store.Currency = "EUR";
                store.CurrencySymbol = "€";
                store.TaxRate = 0.19m;
                store.FreeShippingThreshold = 60.00m;
                store.StandardShippingRate = 4.99m;
                store.ExpressShippingRate = 11.99m;
                store.StripeEnabled = true;
                store.CodEnabled = true;
            }
        }
        else if (loc.Contains("canada") || loc == "ca")
        {
            store.Location = "Canada";
            if (store.Currency == "USD" || string.IsNullOrWhiteSpace(store.Currency))
            {
                store.Currency = "CAD";
                store.CurrencySymbol = "C$";
                store.TaxRate = 0.13m;
                store.FreeShippingThreshold = 85.00m;
                store.StandardShippingRate = 8.99m;
                store.ExpressShippingRate = 16.99m;
                store.StripeEnabled = true;
            }
        }
        else if (loc.Contains("australia") || loc == "au")
        {
            store.Location = "Australia";
            if (store.Currency == "USD" || string.IsNullOrWhiteSpace(store.Currency))
            {
                store.Currency = "AUD";
                store.CurrencySymbol = "A$";
                store.TaxRate = 0.10m;
                store.FreeShippingThreshold = 100.00m;
                store.StandardShippingRate = 9.99m;
                store.ExpressShippingRate = 19.99m;
                store.StripeEnabled = true;
            }
        }
        else
        {
            store.Location = string.IsNullOrWhiteSpace(store.Location) ? "India" : store.Location;
            if (store.Location.Equals("India", StringComparison.OrdinalIgnoreCase))
            {
                store.Location = "India";
                store.Currency = "INR";
                store.CurrencySymbol = "₹";
                store.TaxRate = 0.18m;
                store.FreeShippingThreshold = 999.00m;
                store.StandardShippingRate = 49.00m;
                store.ExpressShippingRate = 149.00m;
                store.RazorpayEnabled = true;
                store.CodEnabled = true;
            }
            else
            {
                if (string.IsNullOrWhiteSpace(store.Currency)) store.Currency = "USD";
                if (string.IsNullOrWhiteSpace(store.CurrencySymbol)) store.CurrencySymbol = "$";
            }
        }

        if (string.IsNullOrWhiteSpace(store.Category))
        {
            store.Category = "General Merchandise";
        }

        store.Plan = string.IsNullOrWhiteSpace(store.Plan) ? "monthly" : store.Plan.ToLowerInvariant();
        store.Environment = string.IsNullOrWhiteSpace(store.Environment) ? "production" : store.Environment.ToLowerInvariant();

        var hash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes($"{store.Id}_secret_istora")))[..8].ToLowerInvariant();
        store.AdminToken = $"shppa_sec_{store.Slug}_{hash}";
        store.PublicToken = $"shpat_pub_{store.Slug}_{hash}";

        var dbStore = new DbStore
        {
            Id = store.Id,
            Name = store.Name,
            Slug = store.Slug,
            Subdomain = store.Subdomain,
            CustomDomain = store.CustomDomain,
            Category = store.Category,
            ThemeId = string.IsNullOrWhiteSpace(store.ThemeId) ? "theme_modern_clean" : store.ThemeId,
            AccentColor = string.IsNullOrWhiteSpace(store.AccentColor) ? "#008060" : store.AccentColor,
            Currency = store.Currency,
            CurrencySymbol = store.CurrencySymbol,
            TaxRate = store.TaxRate,
            FreeShippingThreshold = store.FreeShippingThreshold,
            StandardShippingRate = store.StandardShippingRate,
            ExpressShippingRate = store.ExpressShippingRate,
            ContactEmail = string.IsNullOrWhiteSpace(store.ContactEmail) ? "support@istora.online" : store.ContactEmail,
            Location = store.Location,
            Plan = store.Plan,
            Environment = store.Environment,
            Status = string.IsNullOrWhiteSpace(store.Status) ? "active" : store.Status,
            CreatedAt = DateTime.UtcNow.ToString("o"),
            RazorpayEnabled = store.RazorpayEnabled,
            RazorpayKeyId = store.RazorpayKeyId ?? "",
            RazorpayKeySecret = store.RazorpayKeySecret ?? "",
            StripeEnabled = store.StripeEnabled,
            StripePublishableKey = store.StripePublishableKey ?? "",
            StripeSecretKey = store.StripeSecretKey ?? "",
            CodEnabled = store.CodEnabled,
            BannerVideoUrl = store.BannerVideoUrl,
            PreviewVideosJson = JsonSerializer.Serialize(store.PreviewVideos ?? new()),
            GstEnabled = store.GstEnabled,
            Gstin = string.IsNullOrWhiteSpace(store.Gstin) ? "29AABCU9603R1ZM" : store.Gstin,
            LegalBusinessName = string.IsNullOrWhiteSpace(store.LegalBusinessName) ? store.Name : store.LegalBusinessName,
            StateCode = string.IsNullOrWhiteSpace(store.StateCode) ? "29" : store.StateCode,
            StateName = string.IsNullOrWhiteSpace(store.StateName) ? "Karnataka" : store.StateName,
            DefaultHsnCode = string.IsNullOrWhiteSpace(store.DefaultHsnCode) ? "6109" : store.DefaultHsnCode,
            GstRatePercent = store.GstRatePercent > 0 ? store.GstRatePercent : 18m,
            PricesIncludeGst = store.PricesIncludeGst,
            InvoicePrefix = string.IsNullOrWhiteSpace(store.InvoicePrefix) ? "INV-2026/" : store.InvoicePrefix
        };

        _db.Stores.Add(dbStore);

        // Ensure category table has initial starter category for this store
        if (!_db.Categories.Any(c => c.StoreId == store.Id))
        {
            _db.Categories.Add(new DbCategory
            {
                Id = $"cat_{store.Slug}_1",
                StoreId = store.Id,
                Name = store.Category,
                Slug = System.Text.RegularExpressions.Regex.Replace(store.Category.ToLowerInvariant(), @"[^a-z0-9]+", "-").Trim('-')
            });
        }

        _db.SaveChanges();

        // Register new domains in TenantDomainRegistry for routing
        TenantDomainRegistry.Register(store.Subdomain, store.Id);
        TenantDomainRegistry.Register(store.Slug, store.Id);
        if (!string.IsNullOrWhiteSpace(store.CustomDomain))
        {
            TenantDomainRegistry.Register(store.CustomDomain, store.Id);
        }

        return store;
    }

    public TenantStore? UpdateStore(string storeId, TenantStore store)
    {
        var target = HttpTenantProvider.NormalizeStoreId(storeId);
        var existing = _db.Stores.FirstOrDefault(s => s.Id == target || s.Id == storeId);
        if (existing == null) return null;

        var oldCustomDomain = existing.CustomDomain;

        existing.Name = store.Name;
        if (!string.IsNullOrWhiteSpace(store.Slug)) existing.Slug = store.Slug;
        if (!string.IsNullOrWhiteSpace(store.Subdomain)) existing.Subdomain = store.Subdomain;

        if (!string.IsNullOrWhiteSpace(store.CustomDomain))
        {
            existing.CustomDomain = TenantDomainRegistry.CleanDomain(store.CustomDomain);
        }
        else
        {
            existing.CustomDomain = null;
        }

        existing.Category = store.Category;
        existing.ThemeId = store.ThemeId;
        existing.AccentColor = store.AccentColor;
        existing.Currency = store.Currency;
        existing.CurrencySymbol = store.CurrencySymbol;
        existing.TaxRate = store.TaxRate;
        existing.FreeShippingThreshold = store.FreeShippingThreshold;
        existing.StandardShippingRate = store.StandardShippingRate;
        existing.ExpressShippingRate = store.ExpressShippingRate;
        existing.ContactEmail = store.ContactEmail;
        if (!string.IsNullOrWhiteSpace(store.Location)) existing.Location = store.Location;
        existing.Status = store.Status;
        existing.RazorpayEnabled = store.RazorpayEnabled;
        existing.RazorpayKeyId = store.RazorpayKeyId;
        existing.RazorpayKeySecret = store.RazorpayKeySecret;
        existing.StripeEnabled = store.StripeEnabled;
        existing.StripePublishableKey = store.StripePublishableKey;
        existing.StripeSecretKey = store.StripeSecretKey;
        existing.CodEnabled = store.CodEnabled;
        existing.GstEnabled = store.GstEnabled;
        if (!string.IsNullOrWhiteSpace(store.Gstin)) existing.Gstin = store.Gstin;
        if (!string.IsNullOrWhiteSpace(store.LegalBusinessName)) existing.LegalBusinessName = store.LegalBusinessName;
        if (!string.IsNullOrWhiteSpace(store.StateCode)) existing.StateCode = store.StateCode;
        if (!string.IsNullOrWhiteSpace(store.StateName)) existing.StateName = store.StateName;
        if (!string.IsNullOrWhiteSpace(store.DefaultHsnCode)) existing.DefaultHsnCode = store.DefaultHsnCode;
        if (store.GstRatePercent >= 0) existing.GstRatePercent = store.GstRatePercent;
        existing.PricesIncludeGst = store.PricesIncludeGst;
        if (!string.IsNullOrWhiteSpace(store.InvoicePrefix)) existing.InvoicePrefix = store.InvoicePrefix;

        if (store.BannerVideoUrl != null)
        {
            existing.BannerVideoUrl = string.IsNullOrWhiteSpace(store.BannerVideoUrl) ? null : store.BannerVideoUrl.Trim();
        }

        if (store.PreviewVideos != null && store.PreviewVideos.Count > 0)
        {
            existing.PreviewVideosJson = JsonSerializer.Serialize(store.PreviewVideos.Take(MaxPreviewVideosPerStore).ToList());
        }

        _db.SaveChanges();

        // Sync TenantDomainRegistry
        if (!string.IsNullOrWhiteSpace(oldCustomDomain) && oldCustomDomain != existing.CustomDomain)
        {
            TenantDomainRegistry.Unregister(oldCustomDomain);
        }
        if (!string.IsNullOrWhiteSpace(existing.CustomDomain))
        {
            TenantDomainRegistry.Register(existing.CustomDomain, existing.Id);
        }
        if (!string.IsNullOrWhiteSpace(existing.Subdomain))
        {
            TenantDomainRegistry.Register(existing.Subdomain, existing.Id);
        }

        store.CustomDomain = existing.CustomDomain;
        return store;
    }

    public bool DeleteStore(string storeId)
    {
        var target = HttpTenantProvider.NormalizeStoreId(storeId);
        var existing = _db.Stores.FirstOrDefault(s => s.Id == target || s.Id == storeId);
        if (existing == null) return false;

        TenantDomainRegistry.Unregister(existing.Subdomain);
        TenantDomainRegistry.Unregister(existing.Slug);
        if (!string.IsNullOrWhiteSpace(existing.CustomDomain))
        {
            TenantDomainRegistry.Unregister(existing.CustomDomain);
        }

        _db.Stores.Remove(existing);
        _db.Products.IgnoreQueryFilters().Where(p => p.StoreId == target).ExecuteDelete();
        _db.Orders.IgnoreQueryFilters().Where(o => o.StoreId == target).ExecuteDelete();
        _db.Categories.IgnoreQueryFilters().Where(c => c.StoreId == target).ExecuteDelete();
        _db.Discounts.IgnoreQueryFilters().Where(d => d.StoreId == target).ExecuteDelete();
        _db.Customers.IgnoreQueryFilters().Where(cu => cu.StoreId == target).ExecuteDelete();
        _db.SaveChanges();
        return true;
    }

    // =========================================================================
    // 2. ISOLATED PRODUCTS APIS
    // If storeId is passed explicitly: query that specific store.
    // If storeId is omitted: EF Core Global Query Filter enforces the tenant.
    // =========================================================================
    public List<Product> GetProducts(string? storeId = null, string? category = null)
    {
        var query = _db.Products.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(storeId))
        {
            var target = HttpTenantProvider.NormalizeStoreId(storeId);
            query = query.IgnoreQueryFilters().Where(p => p.StoreId == target);
        }

        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(p => p.Category.ToLower() == category.ToLower());
        }

        return query.Select(p => new Product
        {
            Id = p.Id,
            StoreId = p.StoreId,
            Title = p.Title,
            Category = p.Category,
            Price = p.Price,
            CompareAtPrice = p.CompareAtPrice,
            Badge = p.Badge,
            Image = p.Image,
            Description = p.Description,
            Inventory = p.Inventory,
            Variants = DeserializeVariants(p.VariantsJson),
            PreviewVideoUrl = p.PreviewVideoUrl,
            GarmentSpec = DeserializeGarmentSpec(p.GarmentSpecJson)
        }).ToList();
    }

    public Product? GetProductById(string id, string? storeId = null)
    {
        var query = _db.Products.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(storeId))
        {
            var target = HttpTenantProvider.NormalizeStoreId(storeId);
            query = query.IgnoreQueryFilters().Where(p => p.StoreId == target);
        }

        var p = query.FirstOrDefault(x => x.Id == id);
        if (p == null) return null;

        return new Product
        {
            Id = p.Id,
            StoreId = p.StoreId,
            Title = p.Title,
            Category = p.Category,
            Price = p.Price,
            CompareAtPrice = p.CompareAtPrice,
            Badge = p.Badge,
            Image = p.Image,
            Description = p.Description,
            Inventory = p.Inventory,
            Variants = DeserializeVariants(p.VariantsJson),
            PreviewVideoUrl = p.PreviewVideoUrl,
            GarmentSpec = DeserializeGarmentSpec(p.GarmentSpecJson)
        };
    }

    public Product CreateProduct(Product product)
    {
        if (string.IsNullOrWhiteSpace(product.Id))
        {
            product.Id = "prod_" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        }
        if (string.IsNullOrWhiteSpace(product.StoreId))
        {
            product.StoreId = !string.IsNullOrWhiteSpace(_tenantProvider.CurrentStoreId)
                ? _tenantProvider.CurrentStoreId
                : "store_apex";
        }

        var dbProd = new DbProduct
        {
            Id = product.Id,
            StoreId = HttpTenantProvider.NormalizeStoreId(product.StoreId),
            Title = product.Title,
            Category = product.Category,
            Price = product.Price,
            CompareAtPrice = product.CompareAtPrice,
            Badge = product.Badge,
            Image = product.Image,
            Description = product.Description,
            Inventory = product.Inventory,
            VariantsJson = JsonSerializer.Serialize(product.Variants ?? new List<ProductVariant>()),
            PreviewVideoUrl = product.PreviewVideoUrl,
            GarmentSpecJson = product.GarmentSpec != null ? JsonSerializer.Serialize(product.GarmentSpec) : null
        };

        _db.Products.Add(dbProd);
        _db.SaveChanges();
        return product;
    }

    public Product? UpdateProduct(string id, Product product)
    {
        var query = _db.Products.AsQueryable();
        if (!string.IsNullOrWhiteSpace(product.StoreId))
        {
            var target = HttpTenantProvider.NormalizeStoreId(product.StoreId);
            query = query.IgnoreQueryFilters().Where(p => p.StoreId == target);
        }

        var existing = query.FirstOrDefault(p => p.Id == id);
        if (existing == null) return null;

        var oldImage = existing.Image;
        existing.Title = product.Title;
        existing.Category = product.Category;
        existing.Price = product.Price;
        existing.CompareAtPrice = product.CompareAtPrice;
        existing.Badge = product.Badge;
        existing.Image = product.Image;
        existing.Description = product.Description;
        existing.Inventory = product.Inventory;
        existing.PreviewVideoUrl = product.PreviewVideoUrl;
        if (product.GarmentSpec != null)
        {
            existing.GarmentSpecJson = JsonSerializer.Serialize(product.GarmentSpec);
        }
        if (product.Variants != null)
        {
            existing.VariantsJson = JsonSerializer.Serialize(product.Variants);
        }

        // If product image was replaced, clean up old image from R2
        if (!string.IsNullOrWhiteSpace(oldImage) &&
            !string.IsNullOrWhiteSpace(product.Image) &&
            !string.Equals(oldImage, product.Image, StringComparison.OrdinalIgnoreCase))
        {
            _ = Task.Run(() => _r2Storage.DeleteFileAsync(oldImage));
        }

        _db.SaveChanges();
        return product;
    }

    public async Task<bool> DeleteProductAsync(string id)
    {
        var existing = await _db.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (existing == null) return false;

        if (!string.IsNullOrWhiteSpace(existing.Image))
        {
            await _r2Storage.DeleteFileAsync(existing.Image);
        }

        _db.Products.Remove(existing);
        await _db.SaveChangesAsync();
        return true;
    }

    public bool DeleteProduct(string id)
    {
        return DeleteProductAsync(id).GetAwaiter().GetResult();
    }

    // =========================================================================
    // 3. ISOLATED ORDERS APIS
    // If storeId is passed explicitly: query that specific store.
    // If storeId is omitted: EF Core Global Query Filter automatically scopes
    // to the active tenant. Impossible to leak other stores' orders.
    // =========================================================================
    public List<Order> GetOrders(string? storeId = null)
    {
        var query = _db.Orders.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(storeId))
        {
            var target = HttpTenantProvider.NormalizeStoreId(storeId);
            query = query.IgnoreQueryFilters().Where(o => o.StoreId == target);
        }

        return query.OrderByDescending(o => o.CreatedAt).Select(o => new Order
        {
            Id = o.Id,
            StoreId = o.StoreId,
            OrderNumber = o.OrderNumber,
            CustomerName = o.CustomerName,
            CustomerEmail = o.CustomerEmail,
            Total = o.Total,
            Status = o.Status,
            PaymentMethod = o.PaymentMethod,
            TrackingNumber = o.TrackingNumber,
            Carrier = o.Carrier,
            CreatedAt = o.CreatedAt,
            InvoiceNumber = o.InvoiceNumber,
            IsB2B = o.IsB2B,
            CustomerGstin = o.CustomerGstin,
            CustomerCompanyName = o.CustomerCompanyName,
            BuyerStateCode = o.BuyerStateCode,
            TaxableAmount = o.TaxableAmount,
            CgstAmount = o.CgstAmount,
            SgstAmount = o.SgstAmount,
            IgstAmount = o.IgstAmount,
            TotalGst = o.TotalGst,
            Items = DeserializeCartItems(o.ItemsJson)
        }).ToList();
    }

    public Order CreateOrder(Order order)
    {
        if (string.IsNullOrWhiteSpace(order.Id))
        {
            order.Id = "ord_" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        }
        if (string.IsNullOrWhiteSpace(order.OrderNumber))
        {
            order.OrderNumber = "ORD-" + Random.Shared.Next(10000, 99999);
        }
        if (string.IsNullOrWhiteSpace(order.StoreId))
        {
            order.StoreId = !string.IsNullOrWhiteSpace(_tenantProvider.CurrentStoreId)
                ? _tenantProvider.CurrentStoreId
                : "store_apex";
        }
        if (string.IsNullOrWhiteSpace(order.CreatedAt))
        {
            order.CreatedAt = DateTime.UtcNow.ToString("o");
        }

        var normalizedStore = HttpTenantProvider.NormalizeStoreId(order.StoreId);
        var storeObj = _db.Stores.FirstOrDefault(s => s.Id == normalizedStore);

        if (string.IsNullOrWhiteSpace(order.InvoiceNumber))
        {
            var prefix = !string.IsNullOrWhiteSpace(storeObj?.InvoicePrefix) ? storeObj.InvoicePrefix : "INV-2026/";
            var seq = Random.Shared.Next(10001, 99999);
            order.InvoiceNumber = $"{prefix}{seq}";
        }

        if (order.TotalGst == 0 && order.Total > 0)
        {
            decimal gstRate = storeObj?.GstRatePercent ?? 18m;
            string merchantStateCode = storeObj?.StateCode ?? "29";
            string buyerState = !string.IsNullOrWhiteSpace(order.BuyerStateCode) ? order.BuyerStateCode : merchantStateCode;

            decimal gross = order.Total;
            decimal taxable = Math.Round(gross / (1m + (gstRate / 100m)), 2);
            decimal tax = gross - taxable;

            order.TaxableAmount = taxable;
            order.TotalGst = tax;

            if (buyerState == merchantStateCode)
            {
                order.CgstAmount = Math.Round(tax / 2m, 2);
                order.SgstAmount = tax - order.CgstAmount;
                order.IgstAmount = 0m;
            }
            else
            {
                order.CgstAmount = 0m;
                order.SgstAmount = 0m;
                order.IgstAmount = tax;
            }
        }

        var dbOrder = new DbOrder
        {
            Id = order.Id,
            StoreId = normalizedStore,
            OrderNumber = order.OrderNumber,
            CustomerName = order.CustomerName,
            CustomerEmail = order.CustomerEmail,
            Total = order.Total,
            Status = order.Status,
            PaymentMethod = order.PaymentMethod,
            TrackingNumber = order.TrackingNumber,
            Carrier = order.Carrier,
            CreatedAt = order.CreatedAt,
            InvoiceNumber = order.InvoiceNumber,
            IsB2B = order.IsB2B,
            CustomerGstin = order.CustomerGstin,
            CustomerCompanyName = order.CustomerCompanyName,
            BuyerStateCode = order.BuyerStateCode,
            TaxableAmount = order.TaxableAmount,
            CgstAmount = order.CgstAmount,
            SgstAmount = order.SgstAmount,
            IgstAmount = order.IgstAmount,
            TotalGst = order.TotalGst,
            ItemsJson = JsonSerializer.Serialize(order.Items ?? new List<CartItem>())
        };

        _db.Orders.Add(dbOrder);

        // Update or add customer record automatically
        var existingCust = _db.Customers.FirstOrDefault(c => c.StoreId == normalizedStore && c.Email.ToLower() == order.CustomerEmail.ToLower());
        if (existingCust != null)
        {
            existingCust.OrdersCount += 1;
            existingCust.TotalSpent += order.Total;
        }
        else
        {
            _db.Customers.Add(new DbCustomer
            {
                Id = "cust_" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                StoreId = normalizedStore,
                Name = order.CustomerName,
                Email = order.CustomerEmail,
                OrdersCount = 1,
                TotalSpent = order.Total,
                CreatedAt = DateTime.UtcNow.ToString("o")
            });
        }

        _db.SaveChanges();
        return order;
    }

    // =========================================================================
    // 4. CATEGORIES, CUSTOMERS, DISCOUNTS & REVIEWS APIS
    // =========================================================================
    public List<CategoryItem> GetCategories(string? storeId = null)
    {
        var query = _db.Categories.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(storeId))
        {
            var target = HttpTenantProvider.NormalizeStoreId(storeId);
            query = query.IgnoreQueryFilters().Where(c => c.StoreId == target);
        }

        return query.Select(c => new CategoryItem
        {
            Id = c.Id,
            StoreId = c.StoreId,
            Name = c.Name,
            Slug = c.Slug
        }).ToList();
    }

    public CategoryItem CreateCategory(CategoryItem category)
    {
        if (string.IsNullOrWhiteSpace(category.Id)) category.Id = "cat_" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        if (string.IsNullOrWhiteSpace(category.Slug)) category.Slug = category.Name.ToLower().Replace(" ", "-");
        if (string.IsNullOrWhiteSpace(category.StoreId))
        {
            category.StoreId = !string.IsNullOrWhiteSpace(_tenantProvider.CurrentStoreId)
                ? _tenantProvider.CurrentStoreId
                : "store_apex";
        }

        category.StoreId = HttpTenantProvider.NormalizeStoreId(category.StoreId);
        _db.Categories.Add(new DbCategory { Id = category.Id, StoreId = category.StoreId, Name = category.Name, Slug = category.Slug });
        _db.SaveChanges();
        return category;
    }

    public List<Customer> GetCustomers(string? storeId = null)
    {
        var query = _db.Customers.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(storeId))
        {
            var target = HttpTenantProvider.NormalizeStoreId(storeId);
            query = query.IgnoreQueryFilters().Where(c => c.StoreId == target);
        }

        return query.OrderByDescending(c => c.TotalSpent).Select(c => new Customer
        {
            Id = c.Id,
            StoreId = c.StoreId,
            Name = c.Name,
            Email = c.Email,
            Phone = c.Phone,
            OrdersCount = c.OrdersCount,
            TotalSpent = c.TotalSpent,
            CreatedAt = c.CreatedAt
        }).ToList();
    }

    public List<Discount> GetDiscounts(string? storeId = null)
    {
        var query = _db.Discounts.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(storeId))
        {
            var target = HttpTenantProvider.NormalizeStoreId(storeId);
            query = query.IgnoreQueryFilters().Where(d => d.StoreId == target);
        }

        return query.Select(d => new Discount
        {
            Id = d.Id,
            StoreId = d.StoreId,
            Code = d.Code,
            Type = d.Type,
            Value = d.Value,
            MinSubtotal = d.MinSubtotal,
            Description = d.Description
        }).ToList();
    }

    public Discount CreateDiscount(Discount discount)
    {
        if (string.IsNullOrWhiteSpace(discount.Id)) discount.Id = "disc_" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        if (string.IsNullOrWhiteSpace(discount.StoreId))
        {
            discount.StoreId = !string.IsNullOrWhiteSpace(_tenantProvider.CurrentStoreId)
                ? _tenantProvider.CurrentStoreId
                : "store_apex";
        }

        discount.StoreId = HttpTenantProvider.NormalizeStoreId(discount.StoreId);
        _db.Discounts.Add(new DbDiscount
        {
            Id = discount.Id,
            StoreId = discount.StoreId,
            Code = discount.Code,
            Type = discount.Type,
            Value = discount.Value,
            MinSubtotal = discount.MinSubtotal,
            Description = discount.Description
        });
        _db.SaveChanges();
        return discount;
    }

    public List<ProductReview> GetReviews(string? storeId = null, string? productId = null)
    {
        var query = _db.Reviews.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(storeId))
        {
            var target = HttpTenantProvider.NormalizeStoreId(storeId);
            query = query.IgnoreQueryFilters().Where(r => r.StoreId == target);
        }
        if (!string.IsNullOrWhiteSpace(productId))
        {
            query = query.Where(r => r.ProductId == productId);
        }

        return query.OrderByDescending(r => r.CreatedAt).Select(r => new ProductReview
        {
            Id = r.Id,
            StoreId = r.StoreId,
            ProductId = r.ProductId,
            CustomerName = r.CustomerName,
            Rating = r.Rating,
            Title = r.Title,
            Comment = r.Comment,
            VerifiedBuyer = r.VerifiedBuyer,
            CreatedAt = r.CreatedAt
        }).ToList();
    }

    public ProductReview CreateReview(ProductReview review)
    {
        if (string.IsNullOrWhiteSpace(review.Id)) review.Id = "rev_" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        if (string.IsNullOrWhiteSpace(review.StoreId))
        {
            review.StoreId = !string.IsNullOrWhiteSpace(_tenantProvider.CurrentStoreId)
                ? _tenantProvider.CurrentStoreId
                : "store_apex";
        }

        review.StoreId = HttpTenantProvider.NormalizeStoreId(review.StoreId);
        _db.Reviews.Add(new DbReview
        {
            Id = review.Id,
            StoreId = review.StoreId,
            ProductId = review.ProductId,
            CustomerName = review.CustomerName,
            Rating = review.Rating,
            Title = review.Title,
            Comment = review.Comment,
            VerifiedBuyer = review.VerifiedBuyer,
            CreatedAt = DateTime.UtcNow.ToString("o")
        });
        _db.SaveChanges();
        return review;
    }

    public StoreSettings GetSettings()
    {
        var s = _db.StoreSettings.AsNoTracking().FirstOrDefault(x => x.Id == "default");
        if (s == null) return new StoreSettings();
        return new StoreSettings
        {
            StoreName = s.StoreName,
            StoreDomain = s.StoreDomain,
            Currency = s.Currency,
            CurrencySymbol = s.CurrencySymbol,
            ContactEmail = s.ContactEmail,
            Theme = s.Theme
        };
    }

    public void UpdateSettings(StoreSettings settings)
    {
        var existing = _db.StoreSettings.FirstOrDefault(s => s.Id == "default");
        if (existing != null)
        {
            existing.StoreName = settings.StoreName;
            existing.StoreDomain = settings.StoreDomain;
            existing.Currency = settings.Currency;
            existing.CurrencySymbol = settings.CurrencySymbol;
            existing.ContactEmail = settings.ContactEmail;
            existing.Theme = settings.Theme;
        }
        else
        {
            _db.StoreSettings.Add(new DbStoreSetting
            {
                Id = "default",
                StoreName = settings.StoreName,
                StoreDomain = settings.StoreDomain,
                Currency = settings.Currency,
                CurrencySymbol = settings.CurrencySymbol,
                ContactEmail = settings.ContactEmail,
                Theme = settings.Theme
            });
        }
        _db.SaveChanges();
    }

    // =========================================================================
    // 4B. ENTERPRISE STOREFRONT BOOTSTRAP, BATCH STOCK & ORDER VALIDATION
    // =========================================================================
    public StorefrontBootstrapResponse GetStorefrontBootstrap(string? storeId = null)
    {
        TenantStore? resolvedStore = null;
        if (!string.IsNullOrWhiteSpace(storeId))
        {
            resolvedStore = GetStoreById(storeId);
        }
        else if (!string.IsNullOrWhiteSpace(_tenantProvider.CurrentStoreId))
        {
            resolvedStore = GetStoreById(_tenantProvider.CurrentStoreId);
        }

        var store = resolvedStore ?? GetStoreById("store_apex") ?? GetStores().FirstOrDefault();
        var tenantId = store?.Id ?? "store_apex";

        var categories = _db.Categories.Where(c => c.StoreId == tenantId)
            .Select(c => new CategoryItem { Id = c.Id, Name = c.Name, Slug = c.Slug })
            .ToList();

        var featuredDbProducts = _db.Products.Where(p => p.StoreId == tenantId)
            .OrderByDescending(p => p.Id)
            .Take(12)
            .ToList();

        var featured = featuredDbProducts.Select(p => new Product
        {
            Id = p.Id,
            StoreId = p.StoreId,
            Title = p.Title,
            Category = p.Category,
            Price = p.Price,
            CompareAtPrice = p.CompareAtPrice,
            Badge = p.Badge,
            Image = p.Image,
            Description = p.Description,
            Inventory = p.Inventory,
            Variants = DeserializeVariants(p.VariantsJson),
            PreviewVideoUrl = p.PreviewVideoUrl,
            GarmentSpec = DeserializeGarmentSpec(p.GarmentSpecJson)
        }).ToList();

        return new StorefrontBootstrapResponse
        {
            Store = new StoreMetadataDto
            {
                Id = store?.Id ?? tenantId,
                Name = store?.Name ?? "Store",
                Slug = store?.Slug ?? "store",
                Subdomain = store?.Subdomain ?? $"{tenantId}.istora.online",
                CustomDomain = store?.CustomDomain,
                Category = store?.Category ?? "Retail",
                Currency = store?.Currency ?? "USD",
                CurrencySymbol = store?.CurrencySymbol ?? "$",
                TaxRate = store?.TaxRate ?? 0.08m,
                FreeShippingThreshold = store?.FreeShippingThreshold ?? 75.00m,
                StandardShippingRate = store?.StandardShippingRate ?? 6.99m,
                ExpressShippingRate = store?.ExpressShippingRate ?? 14.99m,
                ContactEmail = store?.ContactEmail ?? "support@istora.online",
                Location = store?.Location ?? "United States",
                BannerVideoUrl = store?.BannerVideoUrl,
                PreviewVideos = store?.PreviewVideos ?? new()
            },
            Theme = new ThemeTokensDto
            {
                ThemeId = store?.ThemeId ?? "theme_modern",
                AccentColor = store?.AccentColor ?? "#008060",
                FontFamily = "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
                LogoUrl = null,
                BannerUrl = null,
                BannerVideoUrl = store?.BannerVideoUrl
            },
            Categories = categories,
            FeaturedProducts = featured,
            ServerTime = DateTime.UtcNow
        };
    }

    public List<StockItemDto> GetBatchStock(List<string> productIds, string? storeId = null)
    {
        var tenantId = HttpTenantProvider.NormalizeStoreId(!string.IsNullOrWhiteSpace(storeId) ? storeId : (_tenantProvider.CurrentStoreId ?? "store_apex"));
        if (productIds == null || !productIds.Any()) return new();

        var products = _db.Products
            .Where(p => p.StoreId == tenantId && productIds.Contains(p.Id))
            .Select(p => new StockItemDto
            {
                ProductId = p.Id,
                InventoryQuantity = p.Inventory,
                InStock = p.Inventory > 0,
                IsLowStock = p.Inventory > 0 && p.Inventory <= 5
            })
            .ToList();

        return products;
    }

    public ValidatedOrderResponse ValidateAndCalculateOrder(ValidateOrderRequest req, string? storeId = null)
    {
        var tenantId = HttpTenantProvider.NormalizeStoreId(!string.IsNullOrWhiteSpace(storeId) ? storeId : (_tenantProvider.CurrentStoreId ?? "store_apex"));
        var store = _db.Stores.FirstOrDefault(s => s.Id == tenantId) ?? _db.Stores.FirstOrDefault(s => s.Id == "store_apex");

        var response = new ValidatedOrderResponse
        {
            Currency = store?.Currency ?? "USD",
            CurrencySymbol = store?.CurrencySymbol ?? "$",
            TaxRate = store?.TaxRate ?? 0.08m,
            ShippingMethod = req.ShippingMethod ?? "standard"
        };

        if (req.Items == null || !req.Items.Any())
        {
            response.IsValid = false;
            response.Errors.Add("Cart is empty. At least one line item is required.");
            return response;
        }

        var productIds = req.Items.Select(i => i.ProductId).Distinct().ToList();
        var dbProducts = _db.Products
            .Where(p => p.StoreId == tenantId && productIds.Contains(p.Id))
            .ToDictionary(p => p.Id);

        decimal subtotal = 0m;

        foreach (var item in req.Items)
        {
            if (!dbProducts.TryGetValue(item.ProductId, out var product))
            {
                response.IsValid = false;
                response.Errors.Add($"Product '{item.ProductId}' is no longer available in the store catalog.");
                continue;
            }

            if (item.Quantity <= 0)
            {
                response.IsValid = false;
                response.Errors.Add($"Invalid quantity ({item.Quantity}) requested for '{product.Title}'.");
                continue;
            }

            if (product.Inventory < item.Quantity)
            {
                response.IsValid = false;
                response.Errors.Add($"Insufficient inventory for '{product.Title}'. Requested: {item.Quantity}, In Stock: {product.Inventory}.");
            }

            decimal unitPrice = product.Price;
            string? variantName = null;

            if (!string.IsNullOrWhiteSpace(item.VariantId))
            {
                var variants = DeserializeVariants(product.VariantsJson);
                var variant = variants.FirstOrDefault(v => v.Id == item.VariantId);
                if (variant != null)
                {
                    unitPrice = variant.Price;
                    variantName = variant.Name;
                }
            }

            decimal lineTotal = unitPrice * item.Quantity;
            subtotal += lineTotal;

            response.Items.Add(new ValidatedLineItemDto
            {
                ProductId = product.Id,
                Title = product.Title,
                VariantId = item.VariantId,
                VariantName = variantName,
                Quantity = item.Quantity,
                UnitPrice = unitPrice,
                LineTotal = lineTotal,
                Image = product.Image,
                InStock = product.Inventory >= item.Quantity
            });
        }

        response.Subtotal = subtotal;

        // Server-Side Coupon / Discount Validation
        decimal discountAmount = 0m;
        bool isFreeShippingDiscount = false;

        if (!string.IsNullOrWhiteSpace(req.DiscountCode))
        {
            var cleanCode = req.DiscountCode.Trim().ToUpperInvariant();
            var discount = _db.Discounts.FirstOrDefault(d => d.StoreId == tenantId && d.Code.ToUpper() == cleanCode);

            if (discount == null)
            {
                response.Errors.Add($"Discount code '{req.DiscountCode}' is invalid or expired.");
            }
            else if (subtotal < discount.MinSubtotal)
            {
                response.Errors.Add($"Promo code '{discount.Code}' requires a minimum subtotal of {response.CurrencySymbol}{discount.MinSubtotal:N2}.");
            }
            else
            {
                response.DiscountCode = discount.Code;
                response.DiscountDescription = discount.Description;

                if (discount.Type.Equals("percentage", StringComparison.OrdinalIgnoreCase))
                {
                    discountAmount = Math.Round(subtotal * (discount.Value / 100m), 2);
                }
                else if (discount.Type.Equals("fixed", StringComparison.OrdinalIgnoreCase))
                {
                    discountAmount = Math.Min(discount.Value, subtotal);
                }
                else if (discount.Type.Equals("shipping", StringComparison.OrdinalIgnoreCase))
                {
                    isFreeShippingDiscount = true;
                }
            }
        }

        response.DiscountAmount = discountAmount;
        decimal taxableSubtotal = Math.Max(0m, subtotal - discountAmount);
        response.TaxAmount = Math.Round(taxableSubtotal * response.TaxRate, 2);

        // Shipping Rate Calculation
        decimal freeThreshold = store?.FreeShippingThreshold ?? 75.00m;
        decimal standardRate = store?.StandardShippingRate ?? 6.99m;
        decimal expressRate = store?.ExpressShippingRate ?? 14.99m;

        if (isFreeShippingDiscount || subtotal >= freeThreshold)
        {
            response.ShippingAmount = 0.00m;
        }
        else if (req.ShippingMethod?.Equals("express", StringComparison.OrdinalIgnoreCase) == true)
        {
            response.ShippingAmount = expressRate;
        }
        else
        {
            response.ShippingAmount = standardRate;
        }

        response.Total = taxableSubtotal + response.TaxAmount + response.ShippingAmount;
        response.IsValid = (response.Errors.Count == 0);

        return response;
    }

    // =========================================================================
    // 5. MULTI-TENANT CACHING HELPER
    // Guarantees all cache keys are strictly namespaced by StoreId.
    // Format: tenant:{storeId}:{resource}:{identifier}
    // =========================================================================
    public static string GetTenantCacheKey(string storeId, string resource, string? identifier = null)
    {
        var cleanStore = HttpTenantProvider.NormalizeStoreId(storeId);
        return string.IsNullOrWhiteSpace(identifier)
            ? $"tenant:{cleanStore}:{resource}"
            : $"tenant:{cleanStore}:{resource}:{identifier}";
    }

    private static List<ProductVariant> DeserializeVariants(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<List<ProductVariant>>(json) ?? new();
        }
        catch
        {
            return new();
        }
    }

    private static List<CartItem> DeserializeCartItems(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<List<CartItem>>(json) ?? new();
        }
        catch
        {
            return new();
        }
    }

    private static GarmentSpec? DeserializeGarmentSpec(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try
        {
            return JsonSerializer.Deserialize<GarmentSpec>(json);
        }
        catch
        {
            return null;
        }
    }
}
