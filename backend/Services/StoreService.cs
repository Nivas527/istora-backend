using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ShopifyEngine.Api.Data;
using ShopifyEngine.Api.Models;

namespace ShopifyEngine.Api.Services;

public class StoreService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private StoreSettings _settings = new();
    private readonly List<Product> _products = new();
    private readonly List<Order> _orders = new();
    private readonly object _lock = new();

    public StoreService(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
        InitializeDatabase();
    }

    public StoreSettings GetSettings() => _settings;

    public void UpdateSettings(StoreSettings settings)
    {
        lock (_lock)
        {
            _settings = settings;
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();
                var dbSettings = db.StoreSettings.FirstOrDefault(s => s.Id == "default");
                if (dbSettings != null)
                {
                    dbSettings.StoreName = settings.StoreName;
                    dbSettings.StoreDomain = settings.StoreDomain;
                    dbSettings.Currency = settings.Currency;
                    dbSettings.CurrencySymbol = settings.CurrencySymbol;
                    dbSettings.ContactEmail = settings.ContactEmail;
                    dbSettings.Theme = settings.Theme;
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
            catch (Exception ex)
            {
                Console.WriteLine($"[PostgreSQL] UpdateSettings error: {ex.Message}");
            }
        }
    }

    public List<Product> GetProducts(string? category = null)
    {
        lock (_lock)
        {
            if (string.IsNullOrWhiteSpace(category) || category.Equals("all", StringComparison.OrdinalIgnoreCase))
                return new List<Product>(_products);

            return _products.Where(p => p.Category.Equals(category, StringComparison.OrdinalIgnoreCase)).ToList();
        }
    }

    public Product? GetProductById(string id)
    {
        lock (_lock)
        {
            return _products.FirstOrDefault(p => p.Id == id);
        }
    }

    public Product CreateProduct(Product product)
    {
        lock (_lock)
        {
            if (string.IsNullOrWhiteSpace(product.Id))
            {
                product.Id = "prod_" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            }
            _products.RemoveAll(p => p.Id == product.Id);
            _products.Insert(0, product);

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();
                var existing = db.Products.FirstOrDefault(p => p.Id == product.Id);
                if (existing != null)
                {
                    existing.Title = product.Title;
                    existing.Category = product.Category;
                    existing.Price = product.Price;
                    existing.CompareAtPrice = product.CompareAtPrice;
                    existing.Badge = product.Badge;
                    existing.Image = product.Image;
                    existing.Description = product.Description;
                    existing.Inventory = product.Inventory;
                    existing.VariantsJson = JsonSerializer.Serialize(product.Variants);
                }
                else
                {
                    db.Products.Add(new DbProduct
                    {
                        Id = product.Id,
                        Title = product.Title,
                        Category = product.Category,
                        Price = product.Price,
                        CompareAtPrice = product.CompareAtPrice,
                        Badge = product.Badge,
                        Image = product.Image,
                        Description = product.Description,
                        Inventory = product.Inventory,
                        VariantsJson = JsonSerializer.Serialize(product.Variants)
                    });
                }
                db.SaveChanges();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PostgreSQL] CreateProduct error: {ex.Message}");
            }

            return product;
        }
    }

    public Product? UpdateProduct(string id, Product updated)
    {
        lock (_lock)
        {
            var existing = _products.FirstOrDefault(p => p.Id == id);
            if (existing == null) return null;

            existing.Title = updated.Title;
            existing.Category = updated.Category;
            existing.Price = updated.Price;
            existing.CompareAtPrice = updated.CompareAtPrice;
            existing.Badge = updated.Badge;
            existing.Image = updated.Image;
            existing.Description = updated.Description;
            existing.Inventory = updated.Inventory;
            if (updated.Variants != null && updated.Variants.Count > 0)
            {
                existing.Variants = updated.Variants;
            }

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();
                var dbProd = db.Products.FirstOrDefault(p => p.Id == id);
                if (dbProd != null)
                {
                    dbProd.Title = existing.Title;
                    dbProd.Category = existing.Category;
                    dbProd.Price = existing.Price;
                    dbProd.CompareAtPrice = existing.CompareAtPrice;
                    dbProd.Badge = existing.Badge;
                    dbProd.Image = existing.Image;
                    dbProd.Description = existing.Description;
                    dbProd.Inventory = existing.Inventory;
                    dbProd.VariantsJson = JsonSerializer.Serialize(existing.Variants);
                    db.SaveChanges();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PostgreSQL] UpdateProduct error: {ex.Message}");
            }

            return existing;
        }
    }

    public bool DeleteProduct(string id)
    {
        lock (_lock)
        {
            var removed = _products.RemoveAll(p => p.Id == id) > 0;
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();
                var dbProd = db.Products.FirstOrDefault(p => p.Id == id);
                if (dbProd != null)
                {
                    db.Products.Remove(dbProd);
                    db.SaveChanges();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PostgreSQL] DeleteProduct error: {ex.Message}");
            }
            return removed;
        }
    }

    public List<Order> GetOrders()
    {
        lock (_lock)
        {
            return new List<Order>(_orders);
        }
    }

    public Order CreateOrder(string customerName, string customerEmail, List<CartItem> items)
    {
        lock (_lock)
        {
            var total = items.Sum(i => (i.Variant?.Price ?? i.Product?.Price ?? 0) * i.Quantity);
            var order = new Order
            {
                Id = "ord_" + Random.Shared.Next(10000, 99999),
                CustomerName = customerName,
                CustomerEmail = customerEmail,
                Items = items,
                Total = total,
                Status = "Paid",
                CreatedAt = DateTime.UtcNow.ToString("o")
            };
            _orders.Insert(0, order);

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();
                db.Orders.Add(new DbOrder
                {
                    Id = order.Id,
                    OrderNumber = order.Id,
                    CustomerName = order.CustomerName,
                    CustomerEmail = order.CustomerEmail,
                    ItemsJson = JsonSerializer.Serialize(order.Items),
                    Total = order.Total,
                    Status = order.Status,
                    CreatedAt = order.CreatedAt
                });
                db.SaveChanges();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PostgreSQL] CreateOrder error: {ex.Message}");
            }

            return order;
        }
    }

    private void InitializeDatabase()
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();
            db.Database.EnsureCreated();

            // 1. Settings
            var dbSettings = db.StoreSettings.FirstOrDefault(s => s.Id == "default");
            if (dbSettings != null)
            {
                _settings = new StoreSettings
                {
                    StoreName = dbSettings.StoreName,
                    StoreDomain = dbSettings.StoreDomain,
                    Currency = dbSettings.Currency,
                    CurrencySymbol = dbSettings.CurrencySymbol,
                    ContactEmail = dbSettings.ContactEmail,
                    Theme = dbSettings.Theme
                };
            }
            else
            {
                db.StoreSettings.Add(new DbStoreSetting
                {
                    Id = "default",
                    StoreName = _settings.StoreName,
                    StoreDomain = _settings.StoreDomain,
                    Currency = _settings.Currency,
                    CurrencySymbol = _settings.CurrencySymbol,
                    ContactEmail = _settings.ContactEmail,
                    Theme = _settings.Theme
                });
                db.SaveChanges();
            }

            // 2. Products
            var dbProducts = db.Products.ToList();
            if (dbProducts.Count > 0)
            {
                _products.Clear();
                foreach (var p in dbProducts)
                {
                    var variants = JsonSerializer.Deserialize<List<ProductVariant>>(p.VariantsJson) ?? new();
                    _products.Add(new Product
                    {
                        Id = p.Id,
                        Title = p.Title,
                        Category = p.Category,
                        Price = p.Price,
                        CompareAtPrice = p.CompareAtPrice,
                        Badge = p.Badge,
                        Image = p.Image,
                        Description = p.Description,
                        Inventory = p.Inventory,
                        Variants = variants
                    });
                }
            }
            else
            {
                SeedInitialProducts();
                foreach (var p in _products)
                {
                    db.Products.Add(new DbProduct
                    {
                        Id = p.Id,
                        Title = p.Title,
                        Category = p.Category,
                        Price = p.Price,
                        CompareAtPrice = p.CompareAtPrice,
                        Badge = p.Badge,
                        Image = p.Image,
                        Description = p.Description,
                        Inventory = p.Inventory,
                        VariantsJson = JsonSerializer.Serialize(p.Variants)
                    });
                }
                db.SaveChanges();
            }

            // 3. Orders
            var dbOrders = db.Orders.OrderByDescending(o => o.CreatedAt).ToList();
            _orders.Clear();
            foreach (var o in dbOrders)
            {
                var items = JsonSerializer.Deserialize<List<CartItem>>(o.ItemsJson) ?? new();
                _orders.Add(new Order
                {
                    Id = o.Id,
                    CustomerName = o.CustomerName,
                    CustomerEmail = o.CustomerEmail,
                    Items = items,
                    Total = o.Total,
                    Status = o.Status,
                    CreatedAt = o.CreatedAt
                });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[PostgreSQL] Initializing fallback in-memory cache: {ex.Message}");
            if (_products.Count == 0) SeedInitialProducts();
        }
    }

    private void SeedInitialProducts()
    {
        _products.AddRange(new[]
        {
            new Product
            {
                Id = "prod_1",
                Title = "AeroGlide Elite Carbon Runner",
                Category = "Footwear",
                Price = 189.99m,
                CompareAtPrice = 220.00m,
                Badge = "Bestseller",
                Image = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
                Description = "Precision engineered dual-density carbon plate runner for elite road racing.",
                Inventory = 45,
                Variants = new List<ProductVariant>
                {
                    new() { Id = "var_1_9", Name = "US 9 / Stealth Black", Price = 189.99m, Sku = "AG-BLK-9" },
                    new() { Id = "var_1_10", Name = "US 10 / Stealth Black", Price = 189.99m, Sku = "AG-BLK-10" },
                    new() { Id = "var_1_11", Name = "US 11 / Stealth Black", Price = 189.99m, Sku = "AG-BLK-11" }
                }
            },
            new Product
            {
                Id = "prod_2",
                Title = "Vortex Seamless Compression Layer",
                Category = "Apparel",
                Price = 54.00m,
                Badge = "New",
                Image = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
                Description = "Micro-rib thermal regulating base layer with zero-friction bonded flatlock seams.",
                Inventory = 80,
                Variants = new List<ProductVariant>
                {
                    new() { Id = "var_2_s", Name = "Small / Matte Obsidian", Price = 54.00m, Sku = "VX-S" },
                    new() { Id = "var_2_m", Name = "Medium / Matte Obsidian", Price = 54.00m, Sku = "VX-M" },
                    new() { Id = "var_2_l", Name = "Large / Matte Obsidian", Price = 54.00m, Sku = "VX-L" }
                }
            },
            new Product
            {
                Id = "prod_3",
                Title = "Titanium Rapid-Lock Hydration Vessel",
                Category = "Gear",
                Price = 68.00m,
                Badge = "Limited Edition",
                Image = "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80",
                Description = "Ultralight vacuum insulated grade-5 titanium flask with magnetic leak-proof cap.",
                Inventory = 28,
                Variants = new List<ProductVariant>
                {
                    new() { Id = "var_3_750", Name = "750ml / Raw Titanium", Price = 68.00m, Sku = "TI-750" }
                }
            },
            new Product
            {
                Id = "prod_4",
                Title = "Apex Carbon Velocity Singlet",
                Category = "Apparel",
                Price = 48.00m,
                Image = "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80",
                Description = "Laser-perforated competition racing singlet with bonded hem technology.",
                Inventory = 60,
                Variants = new List<ProductVariant>
                {
                    new() { Id = "var_4_s", Name = "Small / Acid Lime", Price = 48.00m, Sku = "AVS-S" },
                    new() { Id = "var_4_m", Name = "Medium / Acid Lime", Price = 48.00m, Sku = "AVS-M" }
                }
            }
        });
    }
}
