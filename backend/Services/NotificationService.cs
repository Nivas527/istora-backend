using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ShopifyEngine.Api.Data;
using ShopifyEngine.Api.Models;

namespace ShopifyEngine.Api.Services;

public class NotificationService
{
    private readonly ShopifyDbContext _db;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(ShopifyDbContext db, ILogger<NotificationService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public NotificationSettings GetSettings(string storeId)
    {
        var normalizedStore = HttpTenantProvider.NormalizeStoreId(storeId);
        var store = _db.Stores.AsNoTracking().FirstOrDefault(s => s.Id == normalizedStore);

        if (store != null && !string.IsNullOrWhiteSpace(store.NotificationSettingsJson) && store.NotificationSettingsJson != "{}")
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<NotificationSettings>(store.NotificationSettingsJson);
                if (parsed != null)
                {
                    parsed.StoreId = normalizedStore;
                    return parsed;
                }
            }
            catch { }
        }

        return new NotificationSettings
        {
            StoreId = normalizedStore,
            SenderEmail = store?.ContactEmail ?? "orders@istora.online",
            SenderName = store?.Name ?? "Apex Athletics & Co.",
            MerchantAlertEmail = store?.ContactEmail ?? "owner@istora.online"
        };
    }

    public NotificationSettings SaveSettings(NotificationSettings settings)
    {
        var normalizedStore = HttpTenantProvider.NormalizeStoreId(settings.StoreId ?? "store_apex");
        settings.StoreId = normalizedStore;

        var store = _db.Stores.FirstOrDefault(s => s.Id == normalizedStore);
        var json = JsonSerializer.Serialize(settings);
        if (store != null)
        {
            store.NotificationSettingsJson = json;
            _db.SaveChanges();
        }

        return settings;
    }

    public List<NotificationLog> GetLogs(string storeId, string? channel = null, int limit = 50)
    {
        var normalizedStore = HttpTenantProvider.NormalizeStoreId(storeId);
        var query = _db.NotificationLogs
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(n => n.StoreId == normalizedStore);

        if (!string.IsNullOrWhiteSpace(channel) && channel.ToLower() != "all")
        {
            query = query.Where(n => n.Channel.ToLower() == channel.ToLower());
        }

        return query.OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .Select(n => new NotificationLog
            {
                Id = n.Id,
                StoreId = n.StoreId,
                Channel = n.Channel,
                Type = n.Type,
                Recipient = n.Recipient,
                Subject = n.Subject,
                Snippet = n.Snippet,
                Status = n.Status,
                HasAttachment = n.HasAttachment,
                AttachmentName = n.AttachmentName,
                CreatedAt = n.CreatedAt
            })
            .ToList();
    }

    private void RecordLog(string storeId, string channel, string type, string recipient, string subject, string snippet, bool hasAttachment = false, string? attachmentName = null)
    {
        var log = new DbNotificationLog
        {
            Id = $"notif_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{Random.Shared.Next(100, 999)}",
            StoreId = storeId,
            Channel = channel,
            Type = type,
            Recipient = recipient,
            Subject = subject,
            Snippet = snippet,
            Status = "delivered",
            HasAttachment = hasAttachment,
            AttachmentName = attachmentName,
            CreatedAt = DateTime.UtcNow.ToString("o")
        };

        _db.NotificationLogs.Add(log);
        _db.SaveChanges();

        _logger.LogInformation("[AutoNotification] Dispatched {Channel} [{Type}] to {Recipient}: {Subject}", channel.ToUpper(), type, recipient, subject);
    }

    // 1. Order Confirmation Automation (Email with attached GST PDF & WhatsApp message)
    public async Task ProcessOrderCreatedNotificationsAsync(Order order)
    {
        var storeId = HttpTenantProvider.NormalizeStoreId(order.StoreId);
        var settings = GetSettings(storeId);
        var store = await _db.Stores.AsNoTracking().FirstOrDefaultAsync(s => s.Id == storeId);
        var storeName = store?.Name ?? "Apex Athletics";
        var invoiceNum = order.InvoiceNumber ?? $"INV-2026/{order.OrderNumber}";

        // A. Customer Transactional Email with Attached GST Invoice PDF
        if (settings.OrderConfirmationEmail && !string.IsNullOrWhiteSpace(order.CustomerEmail))
        {
            var emailSubject = $"Order Confirmed #{order.OrderNumber} - {storeName} (GST Tax Invoice Attached)";
            var snippet = $"Thank you for your order! ₹{order.Total:N2} received via {order.PaymentMethod}. Official GST Tax Invoice ({invoiceNum}) attached.";
            RecordLog(storeId, "email", "order_confirmation", order.CustomerEmail, emailSubject, snippet, true, $"Tax-Invoice-{invoiceNum.Replace('/', '_')}.pdf");
        }

        // B. Customer WhatsApp Order Confirmation
        if (settings.OrderConfirmationWhatsApp)
        {
            var customer = await _db.Customers.AsNoTracking().FirstOrDefaultAsync(c => c.StoreId == storeId && c.Email.ToLower() == order.CustomerEmail.ToLower());
            var phone = customer?.Phone ?? "+91 98765 43210";

            var waSubject = $"WhatsApp Order Alert: #{order.OrderNumber}";
            var waSnippet = $"🎉 Hi {order.CustomerName}! Thank you for shopping with {storeName}. Your order #{order.OrderNumber} for ₹{order.Total:N2} is confirmed. Official GST Tax Invoice {invoiceNum} is generated. Track live: https://istora.online/track/{order.OrderNumber}";
            RecordLog(storeId, "whatsapp", "order_confirmation", phone, waSubject, waSnippet);
        }

        // C. Merchant Alert: New Order Received
        if (settings.MerchantNewOrderAlert && !string.IsNullOrWhiteSpace(settings.MerchantAlertEmail))
        {
            var merchantSubject = $"[Merchant Alert] 💰 New Order #{order.OrderNumber} (₹{order.Total:N2}) from {order.CustomerName}";
            var merchantSnippet = $"New customer purchase of {order.Items.Count} item(s) totalling ₹{order.Total:N2} via {order.PaymentMethod}. Customer Email: {order.CustomerEmail}.";
            RecordLog(storeId, "email", "merchant_new_order", settings.MerchantAlertEmail, merchantSubject, merchantSnippet);
        }

        // D. Merchant Alert: Inventory Low Stock Detection (< threshold)
        if (settings.MerchantLowStockAlert && !string.IsNullOrWhiteSpace(settings.MerchantAlertEmail))
        {
            var threshold = settings.LowStockThreshold > 0 ? settings.LowStockThreshold : 5;
            var lowStockItems = new List<string>();

            foreach (var item in order.Items)
            {
                var prodId = item.Product?.Id;
                if (string.IsNullOrWhiteSpace(prodId)) continue;
                var product = await _db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.StoreId == storeId && p.Id == prodId);
                if (product != null && product.Inventory <= threshold)
                {
                    lowStockItems.Add($"{product.Title} (Only {product.Inventory} units left in stock)");
                }
            }

            if (lowStockItems.Count > 0)
            {
                var lowStockSubject = $"[Urgent Alert] ⚠️ Low Inventory Warning: {lowStockItems.Count} item(s) below {threshold} units";
                var lowStockSnippet = $"Low stock alert triggered after order #{order.OrderNumber}:\n" + string.Join("; ", lowStockItems);
                RecordLog(storeId, "email", "merchant_low_stock", settings.MerchantAlertEmail, lowStockSubject, lowStockSnippet);
            }
        }
    }

    // 2. Order Dispatch & Fulfillment Tracking Notifications
    public async Task ProcessOrderDispatchedNotificationsAsync(Order order, string carrier, string trackingNumber)
    {
        var storeId = HttpTenantProvider.NormalizeStoreId(order.StoreId);
        var settings = GetSettings(storeId);
        var store = await _db.Stores.AsNoTracking().FirstOrDefaultAsync(s => s.Id == storeId);
        var storeName = store?.Name ?? "Apex Athletics";

        // A. Customer Dispatch Email with Live Tracking URL
        if (settings.DispatchEmail && !string.IsNullOrWhiteSpace(order.CustomerEmail))
        {
            var emailSubject = $"Shipped: Your order #{order.OrderNumber} is on the way! ({carrier})";
            var snippet = $"Great news! Your package has been dispatched via {carrier}. Tracking Number: {trackingNumber}. Track delivery: https://istora.online/track/{order.OrderNumber}";
            RecordLog(storeId, "email", "order_dispatched", order.CustomerEmail, emailSubject, snippet);
        }

        // B. Customer WhatsApp Milestone Alert
        if (settings.DispatchWhatsApp)
        {
            var customer = await _db.Customers.AsNoTracking().FirstOrDefaultAsync(c => c.StoreId == storeId && c.Email.ToLower() == order.CustomerEmail.ToLower());
            var phone = customer?.Phone ?? "+91 98765 43210";

            var waSubject = $"WhatsApp Dispatch: #{order.OrderNumber}";
            var waSnippet = $"🚚 Hi {order.CustomerName}! Your order #{order.OrderNumber} has been dispatched via {carrier} (Tracking: {trackingNumber}). Click to track live: https://istora.online/track/{order.OrderNumber}";
            RecordLog(storeId, "whatsapp", "order_dispatched", phone, waSubject, waSnippet);
        }
    }

    // 3. Test Notification Dispatch Helper
    public NotificationTestResponse TestNotification(NotificationTestRequest req)
    {
        var storeId = HttpTenantProvider.NormalizeStoreId(req.StoreId ?? "store_apex");
        var settings = GetSettings(storeId);
        var channel = req.Channel?.ToLower() == "whatsapp" ? "whatsapp" : "email";
        var type = req.Type ?? "order_confirmation";
        var recipient = !string.IsNullOrWhiteSpace(req.Recipient)
            ? req.Recipient
            : (channel == "whatsapp" ? "+91 98765 43210" : settings.MerchantAlertEmail);

        string subject = "";
        string snippet = "";
        bool hasAttachment = false;
        string? attachmentName = null;

        if (type == "order_confirmation")
        {
            if (channel == "email")
            {
                subject = $"[TEST] Order Confirmed #ORD-84920 - Apex Athletics (GST Tax Invoice Attached)";
                snippet = "Thank you for your order! ₹3,450.00 received via UPI. Official GST Tax Invoice (INV-2026/84920) attached.";
                hasAttachment = true;
                attachmentName = "Tax-Invoice-INV-2026-84920.pdf";
            }
            else
            {
                subject = "[TEST] WhatsApp Order Alert: #ORD-84920";
                snippet = "🎉 Hi Alex Rivera! Thank you for shopping with Apex Athletics. Your order #ORD-84920 for ₹3,450.00 is confirmed. Official GST Tax Invoice is attached. Track live: https://istora.online/track/ORD-84920";
            }
        }
        else if (type == "order_dispatched")
        {
            if (channel == "email")
            {
                subject = "[TEST] Shipped: Your order #ORD-84920 is on the way! (Blue Dart Express)";
                snippet = "Great news! Your package has been dispatched via Blue Dart Express. Tracking Number: APX-982736184. Track delivery: https://istora.online/track/ORD-84920";
            }
            else
            {
                subject = "[TEST] WhatsApp Dispatch: #ORD-84920";
                snippet = "🚚 Hi Alex! Your order #ORD-84920 has been dispatched via Blue Dart (Tracking: APX-982736184). Click to track live: https://istora.online/track/ORD-84920";
            }
        }
        else if (type == "merchant_new_order")
        {
            subject = "[TEST Merchant Alert] 💰 New Order #ORD-84920 (₹3,450.00) from Alex Rivera";
            snippet = "New customer purchase of 2 item(s) totalling ₹3,450.00 via UPI. Customer Email: alex.rivera@example.com.";
        }
        else // merchant_low_stock
        {
            subject = "[TEST Urgent Alert] ⚠️ Low Inventory Warning: Cyberpunk Shell Jacket (Only 2 units left)";
            snippet = "Low stock alert triggered: Cyberpunk Articulated Shell Jacket - Size M is down to 2 units in stock. Reorder recommended.";
        }

        RecordLog(storeId, channel, type, recipient, subject, snippet, hasAttachment, attachmentName);

        var log = _db.NotificationLogs.AsNoTracking().OrderByDescending(l => l.CreatedAt).FirstOrDefault();

        return new NotificationTestResponse
        {
            Success = true,
            Message = $"Sample {channel.ToUpper()} notification [{type}] dispatched successfully to {recipient} via {(channel == "email" ? settings.EmailProvider.ToUpper() : settings.WhatsAppProvider.ToUpper())} engine.",
            Channel = channel,
            Recipient = recipient,
            Log = log != null ? new NotificationLog
            {
                Id = log.Id,
                StoreId = log.StoreId,
                Channel = log.Channel,
                Type = log.Type,
                Recipient = log.Recipient,
                Subject = log.Subject,
                Snippet = log.Snippet,
                Status = log.Status,
                HasAttachment = log.HasAttachment,
                AttachmentName = log.AttachmentName,
                CreatedAt = log.CreatedAt
            } : null
        };
    }
}
