using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ShopifyEngine.Api.Data;
using ShopifyEngine.Api.Models;

namespace ShopifyEngine.Api.Services;

public class ReturnService
{
    private readonly ShopifyDbContext _db;
    private readonly ILogger<ReturnService> _logger;

    public ReturnService(ShopifyDbContext db, ILogger<ReturnService> logger)
    {
        _db = db;
        _logger = logger;
    }

    private static List<ReturnItem> DeserializeReturnItems(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new();
        try
        {
            return JsonSerializer.Deserialize<List<ReturnItem>>(json) ?? new();
        }
        catch
        {
            return new();
        }
    }

    public async Task<ReturnRequest> CreateReturnAsync(CreateReturnRequest req)
    {
        var storeId = HttpTenantProvider.NormalizeStoreId(req.StoreId ?? "store_apex");
        var now = DateTime.UtcNow;

        var cleanOrder = req.OrderNumber?.Trim().ToLowerInvariant() ?? req.OrderId?.Trim().ToLowerInvariant();
        var order = await _db.Orders
            .AsNoTracking()
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(o => o.StoreId == storeId && (
                o.Id.ToLower() == cleanOrder ||
                (o.OrderNumber != null && o.OrderNumber.ToLower() == cleanOrder)
            ));

        var customerEmail = !string.IsNullOrWhiteSpace(req.CustomerEmail)
            ? req.CustomerEmail.Trim()
            : (order?.CustomerEmail ?? "customer@istora.online");

        var customerName = !string.IsNullOrWhiteSpace(req.CustomerName)
            ? req.CustomerName.Trim()
            : (order?.CustomerName ?? "Customer");

        var orderNumber = order?.OrderNumber ?? req.OrderNumber ?? "ORD-84920";
        var orderId = order?.Id ?? req.OrderId ?? "ord_default";

        decimal totalRefund = req.Items?.Count > 0
            ? req.Items.Sum(i => i.Price * i.Quantity)
            : (order?.Total ?? 3450m);

        var fitInsight = req.FitInsight;
        if (string.IsNullOrWhiteSpace(fitInsight) && req.Reason == "size_mismatch")
        {
            fitInsight = "Size Check: Customer torso/chest measurement (40 in) is 1 size above current garment tag (38 in). Recommended exchange to Size L.";
        }

        var rmaId = $"rma_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{Random.Shared.Next(100, 999)}";
        var dbReturn = new DbReturnRequest
        {
            Id = rmaId,
            StoreId = storeId,
            OrderId = orderId,
            OrderNumber = orderNumber,
            CustomerName = customerName,
            CustomerEmail = customerEmail,
            CustomerPhone = req.CustomerPhone ?? "+91 98765 43210",
            Type = req.Type ?? "return_refund",
            Reason = req.Reason ?? "size_mismatch",
            ReasonDetails = req.ReasonDetails ?? "Self-service return initiated by customer via tracking portal.",
            FitInsight = fitInsight,
            ItemsJson = JsonSerializer.Serialize(req.Items ?? new List<ReturnItem>()),
            TotalRefundAmount = totalRefund,
            Status = "pending",
            CreditNoteNumber = null,
            CreditNoteJson = null,
            AdminNotes = null,
            PickupCourier = "Delhivery Reverse Logistics",
            PickupTrackingNumber = $"DEL-REV-{Random.Shared.Next(10000000, 99999999)}",
            CreatedAt = now.ToString("o"),
            UpdatedAt = now.ToString("o")
        };

        _db.Returns.Add(dbReturn);

        // Audit Log in notification_logs
        var log = new DbNotificationLog
        {
            Id = $"notif_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{Random.Shared.Next(100, 999)}",
            StoreId = storeId,
            Channel = "email",
            Type = "return_initiated",
            Recipient = customerEmail,
            Subject = $"RMA Initiated: Return Request for #{orderNumber} Received",
            Snippet = $"Your return request for order #{orderNumber} has been submitted for review. Reverse pickup courier: {dbReturn.PickupCourier}. Total estimated refund: ₹{totalRefund:N2}.",
            Status = "delivered",
            HasAttachment = false,
            CreatedAt = now.ToString("o")
        };
        _db.NotificationLogs.Add(log);

        await _db.SaveChangesAsync();

        _logger.LogInformation("[RMA] Customer {Email} initiated {Type} for Order #{OrderNum} (Refund ₹{Amt:N2})",
            customerEmail, dbReturn.Type, orderNumber, totalRefund);

        return ToModel(dbReturn);
    }

    public async Task<List<ReturnRequest>> GetReturnsAsync(string storeId, string? status = null, int limit = 50)
    {
        var targetStore = HttpTenantProvider.NormalizeStoreId(storeId);
        await EnsureDemoReturnsAsync(targetStore);

        var query = _db.Returns
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(r => r.StoreId == targetStore);

        if (!string.IsNullOrWhiteSpace(status) && status.ToLower() != "all")
        {
            query = query.Where(r => r.Status.ToLower() == status.ToLower());
        }

        var list = await query
            .OrderByDescending(r => r.CreatedAt)
            .Take(limit)
            .ToListAsync();

        return list.Select(ToModel).ToList();
    }

    public async Task<ReturnRequest?> GetReturnByOrderAsync(string orderIdentifier, string? storeId = null)
    {
        var clean = orderIdentifier.Trim().ToLowerInvariant();
        var query = _db.Returns.AsNoTracking().IgnoreQueryFilters();
        if (!string.IsNullOrWhiteSpace(storeId))
        {
            var target = HttpTenantProvider.NormalizeStoreId(storeId);
            query = query.Where(r => r.StoreId == target);
        }

        var item = await query.FirstOrDefaultAsync(r =>
            r.OrderId.ToLower() == clean ||
            (r.OrderNumber != null && r.OrderNumber.ToLower() == clean) ||
            r.Id.ToLower() == clean
        );

        return item != null ? ToModel(item) : null;
    }

    public async Task<ReturnRequest?> UpdateReturnStatusAsync(string returnId, UpdateReturnStatusRequest req)
    {
        var storeId = HttpTenantProvider.NormalizeStoreId(req.StoreId ?? "store_apex");
        var rma = await _db.Returns
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(r => r.StoreId == storeId && (r.Id == returnId || r.OrderNumber == returnId));

        if (rma == null) return null;

        var now = DateTime.UtcNow;
        var store = await _db.Stores.AsNoTracking().FirstOrDefaultAsync(s => s.Id == storeId);
        var order = await _db.Orders.AsNoTracking().IgnoreQueryFilters().FirstOrDefaultAsync(o => o.StoreId == storeId && (o.Id == rma.OrderId || o.OrderNumber == rma.OrderNumber));

        rma.Status = req.Status.ToLowerInvariant();
        if (!string.IsNullOrWhiteSpace(req.AdminNotes)) rma.AdminNotes = req.AdminNotes;
        if (!string.IsNullOrWhiteSpace(req.PickupCourier)) rma.PickupCourier = req.PickupCourier;
        if (!string.IsNullOrWhiteSpace(req.PickupTrackingNumber)) rma.PickupTrackingNumber = req.PickupTrackingNumber;
        rma.UpdatedAt = now.ToString("o");

        // When approved, automatically generate Official GST Credit Note & Tax Reversal
        if ((rma.Status == "approved" || rma.Status == "completed") && string.IsNullOrWhiteSpace(rma.CreditNoteNumber))
        {
            var gstRate = store?.GstRatePercent ?? 18m;
            var sellerStateCode = store?.StateCode ?? "29";
            var buyerStateCode = order?.BuyerStateCode ?? sellerStateCode;

            decimal gross = rma.TotalRefundAmount;
            decimal taxableReversal = Math.Round(gross / (1m + (gstRate / 100m)), 2);
            decimal gstReversal = gross - taxableReversal;

            decimal cgstRev = 0m;
            decimal sgstRev = 0m;
            decimal igstRev = 0m;

            if (buyerStateCode == sellerStateCode)
            {
                cgstRev = Math.Round(gstReversal / 2m, 2);
                sgstRev = gstReversal - cgstRev;
            }
            else
            {
                igstRev = gstReversal;
            }

            var creditNoteNum = $"CN-2026/{Random.Shared.Next(10001, 99999)}";
            var creditNote = new GstCreditNote
            {
                CreditNoteNumber = creditNoteNum,
                OriginalInvoiceNumber = order?.InvoiceNumber ?? $"INV-2026/{rma.OrderNumber}",
                OriginalOrderNumber = rma.OrderNumber,
                CreditNoteDate = now.ToString("yyyy-MM-dd"),
                SellerLegalName = store?.LegalBusinessName ?? store?.Name ?? "Apex Commerce India Pvt. Ltd.",
                SellerGstin = store?.Gstin ?? "29AABCU9603R1ZM",
                SellerStateCode = sellerStateCode,
                SellerStateName = store?.StateName ?? "Karnataka",
                BuyerName = rma.CustomerName,
                BuyerEmail = rma.CustomerEmail,
                BuyerGstin = order?.CustomerGstin,
                BuyerStateCode = buyerStateCode,
                TaxableAmountReversed = taxableReversal,
                CgstReversed = cgstRev,
                SgstReversed = sgstRev,
                IgstReversed = igstRev,
                TotalGstReversed = gstReversal,
                TotalCreditAmount = gross,
                Reason = rma.Type == "exchange" ? "Exchange / Replacement of Goods" : "Sales Return (Defective/Mismatched Goods)",
                Items = DeserializeReturnItems(rma.ItemsJson)
            };

            rma.CreditNoteNumber = creditNoteNum;
            rma.CreditNoteJson = JsonSerializer.Serialize(creditNote);

            // Log dispatched approval email with GST Credit Note attachment
            var notifLog = new DbNotificationLog
            {
                Id = $"notif_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{Random.Shared.Next(100, 999)}",
                StoreId = storeId,
                Channel = "email",
                Type = "return_approved",
                Recipient = rma.CustomerEmail,
                Subject = $"Return Approved #{rma.OrderNumber} - GST Credit Note {creditNoteNum} Issued",
                Snippet = $"Your return for #{rma.OrderNumber} has been approved. GST Credit Note {creditNoteNum} attached. Reverse pickup assigned via {rma.PickupCourier} (AWB: {rma.PickupTrackingNumber}). Refund of ₹{gross:N2} will credit to your account.",
                Status = "delivered",
                HasAttachment = true,
                AttachmentName = $"Credit-Note-{creditNoteNum.Replace('/', '-')}.pdf",
                CreatedAt = now.ToString("o")
            };
            _db.NotificationLogs.Add(notifLog);
        }
        else if (rma.Status == "replacement_issued")
        {
            var replaceTracking = $"APX-EXCH-{Random.Shared.Next(10000000, 99999999)}";
            rma.PickupTrackingNumber = replaceTracking;
            var notifLog = new DbNotificationLog
            {
                Id = $"notif_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{Random.Shared.Next(100, 999)}",
                StoreId = storeId,
                Channel = "email",
                Type = "return_replacement_dispatched",
                Recipient = rma.CustomerEmail,
                Subject = $"Replacement Item Dispatched for Order #{rma.OrderNumber}!",
                Snippet = $"Your requested exchange replacement has been packed and dispatched via Blue Dart Express. Replacement AWB: {replaceTracking}. Track live: https://istora.online/track/{rma.OrderNumber}",
                Status = "delivered",
                HasAttachment = false,
                CreatedAt = now.ToString("o")
            };
            _db.NotificationLogs.Add(notifLog);
        }

        await _db.SaveChangesAsync();

        _logger.LogInformation("[RMA] Updated RMA {Id} to {Status} for Order #{OrderNum}", rma.Id, rma.Status, rma.OrderNumber);
        return ToModel(rma);
    }

    public async Task<GstCreditNote?> GetCreditNoteAsync(string creditNoteNumber, string? storeId = null)
    {
        var clean = creditNoteNumber.Trim().ToLowerInvariant();
        var query = _db.Returns.AsNoTracking().IgnoreQueryFilters();
        if (!string.IsNullOrWhiteSpace(storeId))
        {
            var target = HttpTenantProvider.NormalizeStoreId(storeId);
            query = query.Where(r => r.StoreId == target);
        }

        var rma = await query.FirstOrDefaultAsync(r =>
            (r.CreditNoteNumber != null && r.CreditNoteNumber.ToLower() == clean) ||
            r.Id.ToLower() == clean ||
            (r.OrderNumber != null && r.OrderNumber.ToLower() == clean)
        );

        if (rma == null || string.IsNullOrWhiteSpace(rma.CreditNoteJson)) return null;

        try
        {
            return JsonSerializer.Deserialize<GstCreditNote>(rma.CreditNoteJson);
        }
        catch
        {
            return null;
        }
    }

    private ReturnRequest ToModel(DbReturnRequest r)
    {
        GstCreditNote? creditNote = null;
        if (!string.IsNullOrWhiteSpace(r.CreditNoteJson))
        {
            try
            {
                creditNote = JsonSerializer.Deserialize<GstCreditNote>(r.CreditNoteJson);
            }
            catch { }
        }

        return new ReturnRequest
        {
            Id = r.Id,
            StoreId = r.StoreId,
            OrderId = r.OrderId,
            OrderNumber = r.OrderNumber,
            CustomerName = r.CustomerName,
            CustomerEmail = r.CustomerEmail,
            CustomerPhone = r.CustomerPhone,
            Type = r.Type,
            Reason = r.Reason,
            ReasonDetails = r.ReasonDetails,
            FitInsight = r.FitInsight,
            Items = DeserializeReturnItems(r.ItemsJson),
            TotalRefundAmount = r.TotalRefundAmount,
            Status = r.Status,
            CreditNoteNumber = r.CreditNoteNumber,
            CreditNote = creditNote,
            AdminNotes = r.AdminNotes,
            PickupCourier = r.PickupCourier,
            PickupTrackingNumber = r.PickupTrackingNumber,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt
        };
    }

    private async Task EnsureDemoReturnsAsync(string storeId)
    {
        var count = await _db.Returns.IgnoreQueryFilters().CountAsync(r => r.StoreId == storeId);
        if (count > 0) return;

        var now = DateTime.UtcNow;

        var sampleItems1 = new List<ReturnItem>
        {
            new ReturnItem
            {
                ProductId = "prod_cyberpunk_shell",
                Title = "Cyberpunk Articulated Shell Jacket",
                VariantTitle = "Size M / Matte Obsidian",
                Quantity = 1,
                Price = 3450m,
                ExchangeVariant = "Size L / Matte Obsidian",
                Reason = "size_mismatch"
            }
        };

        var sampleItems2 = new List<ReturnItem>
        {
            new ReturnItem
            {
                ProductId = "prod_matrix_tee",
                Title = "Matrix Techwear Heavyweight Tee",
                VariantTitle = "Size L / Carbon",
                Quantity = 1,
                Price = 1299m,
                Reason = "item_damaged"
            }
        };

        var creditNoteSeed = new GstCreditNote
        {
            CreditNoteNumber = "CN-2026/18492",
            OriginalInvoiceNumber = "INV-2026/84920",
            OriginalOrderNumber = "ORD-84920",
            CreditNoteDate = now.AddDays(-1).ToString("yyyy-MM-dd"),
            SellerLegalName = "Apex Commerce India Pvt. Ltd.",
            SellerGstin = "29AABCU9603R1ZM",
            SellerStateCode = "29",
            SellerStateName = "Karnataka",
            BuyerName = "Alex Rivera",
            BuyerEmail = "alex.rivera@example.com",
            BuyerStateCode = "29",
            TaxableAmountReversed = 2923.73m,
            CgstReversed = 263.14m,
            SgstReversed = 263.13m,
            IgstReversed = 0m,
            TotalGstReversed = 526.27m,
            TotalCreditAmount = 3450.00m,
            Reason = "Size Mismatch (Size Check Exchange to Size L)",
            Items = sampleItems1
        };

        var seedReturns = new List<DbReturnRequest>
        {
            new DbReturnRequest
            {
                Id = "rma_seed_84920",
                StoreId = storeId,
                OrderId = "ord_84920",
                OrderNumber = "ORD-84920",
                CustomerName = "Alex Rivera",
                CustomerEmail = "alex.rivera@example.com",
                CustomerPhone = "+91 98765 43210",
                Type = "exchange",
                Reason = "size_mismatch",
                ReasonDetails = "Sleeves and chest fit tight across upper torso.",
                FitInsight = "Size Check: Customer chest measurement (40.5 in) exceeds garment chest spec (38 in). Exchange to Size L recommended.",
                ItemsJson = JsonSerializer.Serialize(sampleItems1),
                TotalRefundAmount = 3450m,
                Status = "approved",
                CreditNoteNumber = "CN-2026/18492",
                CreditNoteJson = JsonSerializer.Serialize(creditNoteSeed),
                AdminNotes = "Approved for 1-click exchange. Reverse pickup scheduled with Delhivery.",
                PickupCourier = "Delhivery Reverse Logistics",
                PickupTrackingNumber = "DEL-REV-98273614",
                CreatedAt = now.AddDays(-2).ToString("o"),
                UpdatedAt = now.AddDays(-1).ToString("o")
            },
            new DbReturnRequest
            {
                Id = "rma_seed_91824",
                StoreId = storeId,
                OrderId = "ord_91824",
                OrderNumber = "ORD-91824",
                CustomerName = "Sneha Patel",
                CustomerEmail = "sneha.patel@gmail.com",
                CustomerPhone = "+91 98112 33445",
                Type = "return_refund",
                Reason = "item_damaged",
                ReasonDetails = "Tee arrived with a tear near the left collar seam.",
                FitInsight = null,
                ItemsJson = JsonSerializer.Serialize(sampleItems2),
                TotalRefundAmount = 1299m,
                Status = "pending",
                CreditNoteNumber = null,
                CreditNoteJson = null,
                AdminNotes = null,
                PickupCourier = "Delhivery Reverse Logistics",
                PickupTrackingNumber = "DEL-REV-48192033",
                CreatedAt = now.AddHours(-4).ToString("o"),
                UpdatedAt = now.AddHours(-4).ToString("o")
            }
        };

        _db.Returns.AddRange(seedReturns);
        await _db.SaveChangesAsync();
    }
}

