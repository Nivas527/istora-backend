using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ShopifyEngine.Api.Data;
using ShopifyEngine.Api.Models;

namespace ShopifyEngine.Api.Services;

public class StoreService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly object _lock = new();

    public StoreService(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
        InitializeDatabase();
    }

    private void InitializeDatabase()
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();

            // 1. Ensure Stores table is seeded
            if (!db.Stores.Any())
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

                db.Stores.AddRange(apexStore, auraStore);
                db.SaveChanges();
            }

            // 2. Ensure Categories seeded
            if (!db.Categories.Any())
            {
                db.Categories.AddRange(
                    new DbCategory { Id = "cat_1", StoreId = "store_apex", Name = "Apparel", Slug = "apparel" },
                    new DbCategory { Id = "cat_2", StoreId = "store_apex", Name = "Footwear", Slug = "footwear" },
                    new DbCategory { Id = "cat_3", StoreId = "store_apex", Name = "Gear", Slug = "gear" },
                    new DbCategory { Id = "cat_4", StoreId = "store_aura", Name = "Headphones", Slug = "headphones" },
                    new DbCategory { Id = "cat_5", StoreId = "store_aura", Name = "Speakers", Slug = "speakers" }
                );
                db.SaveChanges();
            }

            // 3. Ensure Products seeded with StoreId
            if (!db.Products.Any())
            {
                db.Products.AddRange(
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
                db.SaveChanges();
            }

            // 4. Ensure Discounts seeded
            if (!db.Discounts.Any())
            {
                db.Discounts.AddRange(
                    new DbDiscount { Id = "disc_1", StoreId = "store_apex", Code = "WELCOME20", Type = "percentage", Value = 20, Description = "20% off all orders" },
                    new DbDiscount { Id = "disc_2", StoreId = "store_apex", Code = "FREESHIP", Type = "shipping", Value = 100, Description = "Free Express Shipping" },
                    new DbDiscount { Id = "disc_3", StoreId = "store_aura", Code = "AURA10", Type = "percentage", Value = 10, Description = "10% off Audio Gear" }
                );
                db.SaveChanges();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[PostgreSQL] InitializeDatabase notice: {ex.Message}");
        }
    }

    // =========================================================================
    // 1. MULTI-TENANT STORES APIS
    // =========================================================================
    public List<TenantStore> GetStores()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();
        return db.Stores.AsNoTracking().Select(s => new TenantStore
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
            CreatedAt = s.CreatedAt
        }).ToList();
    }

    public TenantStore? GetStoreById(string storeId)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();
        var s = db.Stores.AsNoTracking().FirstOrDefault(x => x.Id == storeId || x.Slug == storeId);
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
            CreatedAt = s.CreatedAt
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

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();

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
            CreatedAt = DateTime.UtcNow.ToString("o")
        };

        db.Stores.Add(dbStore);

        // Seed default categories for the new store
        db.Categories.AddRange(
            new DbCategory { Id = $"cat_{store.Slug}_1", StoreId = store.Id, Name = "Featured", Slug = "featured" },
            new DbCategory { Id = $"cat_{store.Slug}_2", StoreId = store.Id, Name = "New Arrivals", Slug = "new-arrivals" }
        );

        db.SaveChanges();
        return store;
    }

    public TenantStore? UpdateStore(string storeId, TenantStore store)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();
        var existing = db.Stores.FirstOrDefault(s => s.Id == storeId);
        if (existing == null) return null;

        existing.Name = store.Name;
        existing.Category = store.Category;
        existing.ThemeId = store.ThemeId;
        existing.AccentColor = store.AccentColor;
        existing.CustomDomain = store.CustomDomain;
        existing.Currency = store.Currency;
        existing.CurrencySymbol = store.CurrencySymbol;
        existing.TaxRate = store.TaxRate;
        existing.FreeShippingThreshold = store.FreeShippingThreshold;
        existing.ContactEmail = store.ContactEmail;
        existing.Status = store.Status;

        db.SaveChanges();
        return store;
    }

    public bool DeleteStore(string storeId)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();
        var existing = db.Stores.FirstOrDefault(s => s.Id == storeId);
        if (existing == null) return false;

        // Cascade delete store's products, orders, categories, discounts
        db.Products.RemoveRange(db.Products.Where(p => p.StoreId == storeId));
        db.Orders.RemoveRange(db.Orders.Where(o => o.StoreId == storeId));
        db.Categories.RemoveRange(db.Categories.Where(c => c.StoreId == storeId));
        db.Discounts.RemoveRange(db.Discounts.Where(d => d.StoreId == storeId));
        db.Customers.RemoveRange(db.Customers.Where(cu => cu.StoreId == storeId));
        db.Stores.Remove(existing);

        db.SaveChanges();
        return true;
    }

    // =========================================================================
    // 2. ISOLATED PRODUCTS APIS (Filtered by storeId)
    // =========================================================================
    public List<Product> GetProducts(string? storeId = null, string? category = null)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();

        var query = db.Products.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(storeId))
        {
            query = query.Where(p => p.StoreId == storeId);
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
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();

        var query = db.Products.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(storeId)) query = query.Where(p => p.StoreId == storeId);

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
            product.StoreId = "store_apex";
        }

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();

        var dbProd = new DbProduct
        {
            Id = product.Id,
            StoreId = product.StoreId,
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

        db.Products.Add(dbProd);
        db.SaveChanges();
        return product;
    }

    public Product? UpdateProduct(string id, Product product)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();

        var existing = db.Products.FirstOrDefault(p => p.Id == id);
        if (existing == null) return null;

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

        db.SaveChanges();
        return product;
    }

    public bool DeleteProduct(string id)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();
        var existing = db.Products.FirstOrDefault(p => p.Id == id);
        if (existing == null) return false;

        db.Products.Remove(existing);
        db.SaveChanges();
        return true;
    }

    // =========================================================================
    // 3. ISOLATED ORDERS APIS (Filtered by storeId)
    // =========================================================================
    public List<Order> GetOrders(string? storeId = null)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();

        var query = db.Orders.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(storeId))
        {
            query = query.Where(o => o.StoreId == storeId);
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
            order.StoreId = "store_apex";
        }
        if (string.IsNullOrWhiteSpace(order.CreatedAt))
        {
            order.CreatedAt = DateTime.UtcNow.ToString("o");
        }

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();

        var dbOrder = new DbOrder
        {
            Id = order.Id,
            StoreId = order.StoreId,
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

        db.Orders.Add(dbOrder);

        // Update or add customer record automatically
        var existingCust = db.Customers.FirstOrDefault(c => c.StoreId == order.StoreId && c.Email.ToLower() == order.CustomerEmail.ToLower());
        if (existingCust != null)
        {
            existingCust.OrdersCount += 1;
            existingCust.TotalSpent += order.Total;
        }
        else
        {
            db.Customers.Add(new DbCustomer
            {
                Id = "cust_" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                StoreId = order.StoreId,
                Name = order.CustomerName,
                Email = order.CustomerEmail,
                OrdersCount = 1,
                TotalSpent = order.Total,
                CreatedAt = DateTime.UtcNow.ToString("o")
            });
        }

        db.SaveChanges();
        return order;
    }

    // =========================================================================
    // 4. CATEGORIES, CUSTOMERS, DISCOUNTS & REVIEWS APIS
    // =========================================================================
    public List<CategoryItem> GetCategories(string? storeId = null)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();

        var query = db.Categories.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(storeId)) query = query.Where(c => c.StoreId == storeId);

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
        if (string.IsNullOrWhiteSpace(category.StoreId)) category.StoreId = "store_apex";

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();
        db.Categories.Add(new DbCategory { Id = category.Id, StoreId = category.StoreId, Name = category.Name, Slug = category.Slug });
        db.SaveChanges();
        return category;
    }

    public List<Customer> GetCustomers(string? storeId = null)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();
        var query = db.Customers.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(storeId)) query = query.Where(c => c.StoreId == storeId);

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
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();
        var query = db.Discounts.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(storeId)) query = query.Where(d => d.StoreId == storeId);

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
        if (string.IsNullOrWhiteSpace(discount.StoreId)) discount.StoreId = "store_apex";

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();
        db.Discounts.Add(new DbDiscount
        {
            Id = discount.Id,
            StoreId = discount.StoreId,
            Code = discount.Code,
            Type = discount.Type,
            Value = discount.Value,
            MinSubtotal = discount.MinSubtotal,
            Description = discount.Description
        });
        db.SaveChanges();
        return discount;
    }

    public List<ProductReview> GetReviews(string? storeId = null, string? productId = null)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();
        var query = db.Reviews.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(storeId)) query = query.Where(r => r.StoreId == storeId);
        if (!string.IsNullOrWhiteSpace(productId)) query = query.Where(r => r.ProductId == productId);

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
        if (string.IsNullOrWhiteSpace(review.StoreId)) review.StoreId = "store_apex";

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();
        db.Reviews.Add(new DbReview
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
        db.SaveChanges();
        return review;
    }

    public StoreSettings GetSettings()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();
        var s = db.StoreSettings.AsNoTracking().FirstOrDefault(x => x.Id == "default");
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
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();
        var existing = db.StoreSettings.FirstOrDefault(s => s.Id == "default");
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
            db.StoreSettings.Add(new DbStoreSetting
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
        db.SaveChanges();
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
