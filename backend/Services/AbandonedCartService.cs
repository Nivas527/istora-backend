using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ShopifyEngine.Api.Data;
using ShopifyEngine.Api.Models;

namespace ShopifyEngine.Api.Services;

public class AbandonedCartService
{
    private readonly ShopifyDbContext _db;
    private readonly ILogger<AbandonedCartService> _logger;

    public AbandonedCartService(ShopifyDbContext db, ILogger<AbandonedCartService> logger)
    {
        _db = db;
        _logger = logger;
    }

    private static List<CartItem> DeserializeCartItems(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new();
        try
        {
            return JsonSerializer.Deserialize<List<CartItem>>(json) ?? new();
        }
        catch
        {
            return new();
        }
    }

    public async Task<CaptureCartResponse> CaptureCartAsync(CaptureCartRequest req)
    {
        var storeId = HttpTenantProvider.NormalizeStoreId(req.StoreId ?? "store_apex");
        var email = (req.CustomerEmail ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email))
        {
            return new CaptureCartResponse { Success = false };
        }

        var token = !string.IsNullOrWhiteSpace(req.ExistingToken)
            ? req.ExistingToken.Trim()
            : null;

        var query = _db.AbandonedCarts
            .IgnoreQueryFilters()
            .Where(c => c.StoreId == storeId);

        DbAbandonedCart? existing = null;
        if (!string.IsNullOrWhiteSpace(token))
        {
            existing = await query.FirstOrDefaultAsync(c => c.RecoveryToken == token);
        }

        if (existing == null && !string.IsNullOrWhiteSpace(email))
        {
            existing = await query
                .Where(c => c.CustomerEmail.ToLower() == email && c.RecoveryStatus != "recovered")
                .OrderByDescending(c => c.UpdatedAt)
                .FirstOrDefaultAsync();
        }

        var itemsJson = JsonSerializer.Serialize(req.CartItems ?? new List<CartItem>());
        var now = DateTime.UtcNow.ToString("o");

        if (existing != null)
        {
            existing.CustomerEmail = email;
            if (!string.IsNullOrWhiteSpace(req.CustomerPhone)) existing.CustomerPhone = req.CustomerPhone;
            if (!string.IsNullOrWhiteSpace(req.CustomerName)) existing.CustomerName = req.CustomerName;
            existing.CartJson = itemsJson;
            existing.TotalValue = req.TotalValue;
            existing.CheckoutStep = req.CheckoutStep ?? existing.CheckoutStep;
            existing.UpdatedAt = now;
            await _db.SaveChangesAsync();

            return new CaptureCartResponse
            {
                Success = true,
                CartId = existing.Id,
                RecoveryToken = existing.RecoveryToken,
                RecoveryUrl = $"https://istora.online/checkout?recover_cart={existing.RecoveryToken}"
            };
        }

        var newToken = Guid.NewGuid().ToString("N")[..12];
        var newCart = new DbAbandonedCart
        {
            Id = $"cart_rec_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{Random.Shared.Next(100, 999)}",
            StoreId = storeId,
            CustomerEmail = email,
            CustomerPhone = req.CustomerPhone ?? string.Empty,
            CustomerName = req.CustomerName ?? string.Empty,
            CartJson = itemsJson,
            TotalValue = req.TotalValue,
            CheckoutStep = req.CheckoutStep ?? "customer_info",
            RecoveryToken = newToken,
            RecoveryStatus = "abandoned",
            EmailSequenceStep = 0,
            DiscountCode = "SAVE5",
            DiscountPercent = 5m,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.AbandonedCarts.Add(newCart);
        await _db.SaveChangesAsync();

        _logger.LogInformation("[AbandonedCart] Captured drop-off for {Email} ({ItemsCount} items, ₹{Total:N2}) at step {Step}",
            email, req.CartItems?.Count ?? 0, req.TotalValue, newCart.CheckoutStep);

        return new CaptureCartResponse
        {
            Success = true,
            CartId = newCart.Id,
            RecoveryToken = newCart.RecoveryToken,
            RecoveryUrl = $"https://istora.online/checkout?recover_cart={newCart.RecoveryToken}"
        };
    }

    public async Task<AbandonedCart?> GetCartByTokenAsync(string token, string? storeId = null)
    {
        var cleanToken = (token ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(cleanToken)) return null;

        var query = _db.AbandonedCarts.AsNoTracking().IgnoreQueryFilters();
        if (!string.IsNullOrWhiteSpace(storeId))
        {
            var target = HttpTenantProvider.NormalizeStoreId(storeId);
            query = query.Where(c => c.StoreId == target);
        }

        var cart = await query.FirstOrDefaultAsync(c => c.RecoveryToken == cleanToken);
        if (cart == null) return null;

        return ToModel(cart);
    }

    public async Task<List<AbandonedCart>> GetAbandonedCartsAsync(string storeId, string? status = null, int limit = 50)
    {
        var targetStore = HttpTenantProvider.NormalizeStoreId(storeId);
        
        // Ensure some rich demo abandoned carts exist if database has 0
        await EnsureDemoAbandonedCartsAsync(targetStore);

        var query = _db.AbandonedCarts
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(c => c.StoreId == targetStore);

        if (!string.IsNullOrWhiteSpace(status) && status.ToLower() != "all")
        {
            query = query.Where(c => c.RecoveryStatus.ToLower() == status.ToLower());
        }

        var list = await query
            .OrderByDescending(c => c.CreatedAt)
            .Take(limit)
            .ToListAsync();

        return list.Select(ToModel).ToList();
    }

    public async Task<AbandonedCartAnalytics> GetAnalyticsAsync(string storeId)
    {
        var targetStore = HttpTenantProvider.NormalizeStoreId(storeId);
        await EnsureDemoAbandonedCartsAsync(targetStore);

        var carts = await _db.AbandonedCarts
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(c => c.StoreId == targetStore)
            .ToListAsync();

        var totalCount = carts.Count;
        var recovered = carts.Where(c => c.RecoveryStatus == "recovered").ToList();
        var activeAbandoned = carts.Where(c => c.RecoveryStatus != "recovered").ToList();

        var totalLostRevenue = activeAbandoned.Sum(c => c.TotalValue);
        var totalRecoveredRevenue = recovered.Sum(c => c.TotalValue);
        var recoveryRate = totalCount > 0 ? Math.Round(((decimal)recovered.Count / totalCount) * 100m, 1) : 0m;
        var avgValue = activeAbandoned.Count > 0 ? Math.Round(totalLostRevenue / activeAbandoned.Count, 2) : 0m;

        return new AbandonedCartAnalytics
        {
            TotalLostRevenue = totalLostRevenue,
            TotalRecoveredRevenue = totalRecoveredRevenue,
            TotalAbandonedCarts = totalCount,
            TotalRecoveredCarts = recovered.Count,
            ActiveAbandonedCount = activeAbandoned.Count,
            RecoveryRatePercent = recoveryRate,
            AverageAbandonedValue = avgValue,
            Sequence1HourSent = carts.Count(c => c.EmailSequenceStep >= 1),
            Sequence24HourSent = carts.Count(c => c.EmailSequenceStep >= 2)
        };
    }

    public async Task<bool> SendRecoveryNotificationAsync(SendRecoveryNotificationRequest req)
    {
        var storeId = HttpTenantProvider.NormalizeStoreId(req.StoreId ?? "store_apex");
        var cart = await _db.AbandonedCarts
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.StoreId == storeId && c.Id == req.CartId);

        if (cart == null) return false;

        var store = await _db.Stores.AsNoTracking().FirstOrDefaultAsync(s => s.Id == storeId);
        var storeName = store?.Name ?? "Apex Athletics & Co.";
        var discountCode = !string.IsNullOrWhiteSpace(req.CustomDiscountCode) ? req.CustomDiscountCode : (cart.DiscountCode ?? "SAVE5");
        var discountPercent = req.CustomDiscountPercent ?? cart.DiscountPercent;

        var recoveryUrl = $"https://istora.online/checkout?recover_cart={cart.RecoveryToken}&discount={discountCode}";
        var channel = req.Channel?.ToLower() == "whatsapp" ? "whatsapp" : "email";
        var now = DateTime.UtcNow.ToString("o");

        string subject;
        string snippet;

        if (channel == "email")
        {
            var isSecondSequence = cart.EmailSequenceStep >= 1;
            subject = isSecondSequence
                ? $"Still thinking it over? Enjoy {discountPercent:0}% OFF your cart at {storeName}!"
                : $"Did you forget something? Complete your order at {storeName} (5% OFF applied)";

            snippet = $"Hi {cart.CustomerName}! You left items worth ₹{cart.TotalValue:N2} in your bag. Use promo code {discountCode} for {discountPercent:0}% off: {recoveryUrl}";
        }
        else
        {
            subject = $"WhatsApp Cart Recovery: {storeName}";
            snippet = $"🛍️ Hi {cart.CustomerName}! You left items in your shopping bag at {storeName}. Complete your order today with code {discountCode} to get {discountPercent:0}% off: {recoveryUrl}";
        }

        // Record in notification logs
        var recipient = channel == "email" ? cart.CustomerEmail : (!string.IsNullOrWhiteSpace(cart.CustomerPhone) ? cart.CustomerPhone : "+91 98765 43210");
        var log = new DbNotificationLog
        {
            Id = $"notif_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{Random.Shared.Next(100, 999)}",
            StoreId = storeId,
            Channel = channel,
            Type = "abandoned_cart_recovery",
            Recipient = recipient,
            Subject = subject,
            Snippet = snippet,
            Status = "delivered",
            HasAttachment = false,
            CreatedAt = now
        };

        _db.NotificationLogs.Add(log);

        // Update cart sequence
        cart.EmailSequenceStep += 1;
        cart.RecoveryStatus = "recovering";
        cart.LastEmailSentAt = now;
        cart.UpdatedAt = now;
        if (!string.IsNullOrWhiteSpace(req.CustomDiscountCode)) cart.DiscountCode = req.CustomDiscountCode;
        if (req.CustomDiscountPercent.HasValue) cart.DiscountPercent = req.CustomDiscountPercent.Value;

        await _db.SaveChangesAsync();
        _logger.LogInformation("[AbandonedCart] Dispatched {Channel} recovery reminder to {Email} with link {Link}", channel.ToUpper(), cart.CustomerEmail, recoveryUrl);

        return true;
    }

    public async Task MarkCartRecoveredAsync(string storeId, string customerEmail, string orderId)
    {
        if (string.IsNullOrWhiteSpace(customerEmail)) return;

        var targetStore = HttpTenantProvider.NormalizeStoreId(storeId);
        var email = customerEmail.Trim().ToLowerInvariant();

        var carts = await _db.AbandonedCarts
            .IgnoreQueryFilters()
            .Where(c => c.StoreId == targetStore && c.CustomerEmail.ToLower() == email && c.RecoveryStatus != "recovered")
            .ToListAsync();

        if (carts.Count == 0) return;

        var now = DateTime.UtcNow.ToString("o");
        foreach (var c in carts)
        {
            c.RecoveryStatus = "recovered";
            c.RecoveredAt = now;
            c.RecoveredOrderId = orderId;
            c.UpdatedAt = now;
        }

        await _db.SaveChangesAsync();
        _logger.LogInformation("[AbandonedCart] Marked cart(s) as RECOVERED for {Email} via order {OrderId}", email, orderId);
    }

    private AbandonedCart ToModel(DbAbandonedCart c)
    {
        return new AbandonedCart
        {
            Id = c.Id,
            StoreId = c.StoreId,
            CustomerEmail = c.CustomerEmail,
            CustomerPhone = c.CustomerPhone,
            CustomerName = c.CustomerName,
            CartItems = DeserializeCartItems(c.CartJson),
            TotalValue = c.TotalValue,
            CheckoutStep = c.CheckoutStep,
            RecoveryToken = c.RecoveryToken,
            RecoveryUrl = $"https://istora.online/checkout?recover_cart={c.RecoveryToken}",
            RecoveryStatus = c.RecoveryStatus,
            EmailSequenceStep = c.EmailSequenceStep,
            DiscountCode = c.DiscountCode,
            DiscountPercent = c.DiscountPercent,
            LastEmailSentAt = c.LastEmailSentAt,
            RecoveredAt = c.RecoveredAt,
            RecoveredOrderId = c.RecoveredOrderId,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt
        };
    }

    private async Task EnsureDemoAbandonedCartsAsync(string storeId)
    {
        var count = await _db.AbandonedCarts.IgnoreQueryFilters().CountAsync(c => c.StoreId == storeId);
        if (count > 0) return;

        var sampleItems1 = new List<CartItem>
        {
            new CartItem
            {
                Product = new Product
                {
                    Id = "prod_cyberpunk_shell",
                    Title = "Cyberpunk Articulated Shell Jacket",
                    Price = 3450m,
                    Image = "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80"
                },
                Quantity = 1
            }
        };

        var sampleItems2 = new List<CartItem>
        {
            new CartItem
            {
                Product = new Product
                {
                    Id = "prod_matrix_tee",
                    Title = "Matrix Techwear Heavyweight Tee",
                    Price = 1299m,
                    Image = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80"
                },
                Quantity = 2
            }
        };

        var sampleItems3 = new List<CartItem>
        {
            new CartItem
            {
                Product = new Product
                {
                    Id = "prod_stealth_joggers",
                    Title = "Stealth Cargo Tactical Joggers",
                    Price = 2490m,
                    Image = "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=800&q=80"
                },
                Quantity = 1
            }
        };

        var now = DateTime.UtcNow;

        var seedCarts = new List<DbAbandonedCart>
        {
            new DbAbandonedCart
            {
                Id = "cart_rec_seed_1",
                StoreId = storeId,
                CustomerEmail = "rohan.sharma@gmail.com",
                CustomerPhone = "+91 98201 54321",
                CustomerName = "Rohan Sharma",
                CartJson = JsonSerializer.Serialize(sampleItems1),
                TotalValue = 3450m,
                CheckoutStep = "shipping",
                RecoveryToken = "rec_a9f831bc",
                RecoveryStatus = "abandoned",
                EmailSequenceStep = 0,
                DiscountCode = "SAVE5",
                DiscountPercent = 5m,
                CreatedAt = now.AddHours(-1.5).ToString("o"),
                UpdatedAt = now.AddHours(-1.5).ToString("o")
            },
            new DbAbandonedCart
            {
                Id = "cart_rec_seed_2",
                StoreId = storeId,
                CustomerEmail = "priya.nair@outlook.com",
                CustomerPhone = "+91 97412 89012",
                CustomerName = "Priya Nair",
                CartJson = JsonSerializer.Serialize(sampleItems2),
                TotalValue = 2598m,
                CheckoutStep = "payment",
                RecoveryToken = "rec_7d2e441a",
                RecoveryStatus = "recovering",
                EmailSequenceStep = 1,
                DiscountCode = "COMEBACK5",
                DiscountPercent = 5m,
                LastEmailSentAt = now.AddHours(-2).ToString("o"),
                CreatedAt = now.AddHours(-3).ToString("o"),
                UpdatedAt = now.AddHours(-2).ToString("o")
            },
            new DbAbandonedCart
            {
                Id = "cart_rec_seed_3",
                StoreId = storeId,
                CustomerEmail = "vikram.mehta@yahoo.com",
                CustomerPhone = "+91 99887 65432",
                CustomerName = "Vikram Mehta",
                CartJson = JsonSerializer.Serialize(sampleItems3),
                TotalValue = 2490m,
                CheckoutStep = "payment",
                RecoveryToken = "rec_4f91002b",
                RecoveryStatus = "recovered",
                EmailSequenceStep = 1,
                DiscountCode = "SAVE5",
                DiscountPercent = 5m,
                LastEmailSentAt = now.AddDays(-1).AddHours(-4).ToString("o"),
                RecoveredAt = now.AddDays(-1).ToString("o"),
                RecoveredOrderId = "ORD-91823",
                CreatedAt = now.AddDays(-1).AddHours(-6).ToString("o"),
                UpdatedAt = now.AddDays(-1).ToString("o")
            }
        };

        _db.AbandonedCarts.AddRange(seedCarts);
        await _db.SaveChangesAsync();
    }
}

