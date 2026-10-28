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
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[PostgreSQL] InitializeDatabase notice: {ex.Message}");
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
            Status = s.Status,
            CreatedAt = s.CreatedAt,
            RazorpayEnabled = s.RazorpayEnabled,
            RazorpayKeyId = s.RazorpayKeyId,
            RazorpayKeySecret = s.RazorpayKeySecret,
            StripeEnabled = s.StripeEnabled,
            StripePublishableKey = s.StripePublishableKey,
            StripeSecretKey = s.StripeSecretKey,
            CodEnabled = s.CodEnabled
        }).ToList();
    }

    public TenantStore? GetStoreById(string storeId)
    {
        var target = HttpTenantProvider.NormalizeStoreId(storeId);
        var s = _db.Stores.AsNoTracking().FirstOrDefault(x => x.Id == target || x.Id == storeId || x.Slug == storeId);
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
            Status = s.Status,
            CreatedAt = s.CreatedAt,
            RazorpayEnabled = s.RazorpayEnabled,
            RazorpayKeyId = s.RazorpayKeyId,
            RazorpayKeySecret = s.RazorpayKeySecret,
            StripeEnabled = s.StripeEnabled,
            StripePublishableKey = s.StripePublishableKey,
            StripeSecretKey = s.StripeSecretKey,
            CodEnabled = s.CodEnabled
        };
    }

    public TenantStore CreateStore(TenantStore store)
    {
        if (string.IsNullOrWhiteSpace(store.Id))
        {
            var slug = string.IsNullOrWhiteSpace(store.Slug)
                ? store.Name.ToLower().Replace(" ", "-").Replace("&", "and")
                : store.Slug.ToLower();
            store.Id = "store_" + slug;
            store.Slug = slug;
        }

        if (string.IsNullOrWhiteSpace(store.Subdomain))
        {
            store.Subdomain = $"{store.Slug}.istora.online";
        }

        var dbStore = new DbStore
        {
            Id = store.Id,
            Name = store.Name,
            Slug = store.Slug,
            Subdomain = store.Subdomain,
            CustomDomain = store.CustomDomain,
            Category = store.Category,
            ThemeId = store.ThemeId,
            AccentColor = store.AccentColor,
            Currency = store.Currency,
            CurrencySymbol = store.CurrencySymbol,
            TaxRate = store.TaxRate,
            FreeShippingThreshold = store.FreeShippingThreshold,
            StandardShippingRate = store.StandardShippingRate,
            ExpressShippingRate = store.ExpressShippingRate,
            ContactEmail = store.ContactEmail,
            Status = store.Status,
            CreatedAt = DateTime.UtcNow.ToString("o"),
            RazorpayEnabled = store.RazorpayEnabled,
            RazorpayKeyId = store.RazorpayKeyId,
            RazorpayKeySecret = store.RazorpayKeySecret,
            StripeEnabled = store.StripeEnabled,
            StripePublishableKey = store.StripePublishableKey,
            StripeSecretKey = store.StripeSecretKey,
            CodEnabled = store.CodEnabled
        };

        _db.Stores.Add(dbStore);
        _db.SaveChanges();
        return store;
    }

    public TenantStore? UpdateStore(string storeId, TenantStore store)
    {
        var target = HttpTenantProvider.NormalizeStoreId(storeId);
        var existing = _db.Stores.FirstOrDefault(s => s.Id == target || s.Id == storeId);
        if (existing == null) return null;

        existing.Name = store.Name;
        existing.Slug = store.Slug;
        existing.Subdomain = store.Subdomain;
        existing.CustomDomain = store.CustomDomain;
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
        existing.Status = store.Status;
        existing.RazorpayEnabled = store.RazorpayEnabled;
        existing.RazorpayKeyId = store.RazorpayKeyId;
        existing.RazorpayKeySecret = store.RazorpayKeySecret;
        existing.StripeEnabled = store.StripeEnabled;
        existing.StripePublishableKey = store.StripePublishableKey;
        existing.StripeSecretKey = store.StripeSecretKey;
        existing.CodEnabled = store.CodEnabled;

        _db.SaveChanges();
        return store;
    }

    public bool DeleteStore(string storeId)
    {
        var target = HttpTenantProvider.NormalizeStoreId(storeId);
        var existing = _db.Stores.FirstOrDefault(s => s.Id == target || s.Id == storeId);
        if (existing == null) return false;

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
            Variants = DeserializeVariants(p.VariantsJson)
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
            Variants = DeserializeVariants(p.VariantsJson)
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
            VariantsJson = JsonSerializer.Serialize(product.Variants ?? new List<ProductVariant>())
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
        var tenantId = HttpTenantProvider.NormalizeStoreId(!string.IsNullOrWhiteSpace(storeId) ? storeId : (_tenantProvider.CurrentStoreId ?? "store_apex"));
        var store = _db.Stores.FirstOrDefault(s => s.Id == tenantId) ?? _db.Stores.FirstOrDefault(s => s.Id == "store_apex");

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
            Variants = DeserializeVariants(p.VariantsJson)
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
                ContactEmail = store?.ContactEmail ?? "support@istora.online"
            },
            Theme = new ThemeTokensDto
            {
                ThemeId = store?.ThemeId ?? "theme_modern",
                AccentColor = store?.AccentColor ?? "#008060",
                FontFamily = "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
                LogoUrl = null,
                BannerUrl = null
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
}
