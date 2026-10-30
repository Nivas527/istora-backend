using ShopifyEngine.Api.Models;
using ShopifyEngine.Api.Services;

namespace ShopifyEngine.Api.Endpoints;

public static class OrderEndpoints
{
    public static IEndpointRouteBuilder MapOrderEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/orders").WithTags("Orders & Fulfillment");

        // Orders list
        group.MapGet("/", (string? storeId, StoreService store) =>
            Results.Ok(store.GetOrders(storeId)))
            .WithName("GetOrders")
            .WithSummary("Retrieve orders for tenant store");

        // Order creation
        group.MapPost("/", (Order orderRequest, StoreService store) =>
        {
            var order = store.CreateOrder(orderRequest);
            return Results.Created($"/api/orders/{order.Id}", order);
        }).WithName("CreateOrder")
          .WithSummary("Submit a new order");

        // Server-Side Order & Price Validation (Single Source of Truth)
        app.MapPost("/api/checkout/validate-order", (ValidateOrderRequest req, string? storeId, StoreService store) =>
        {
            var validated = store.ValidateAndCalculateOrder(req, storeId);
            return validated.IsValid ? Results.Ok(validated) : Results.UnprocessableEntity(validated);
        }).WithTags("Orders & Fulfillment")
          .WithName("ValidateOrder")
          .WithSummary("Server authority for real-time inventory validation, DB price verification, and tax/shipping recalculation");

        // Public Order Tracking
        group.MapGet("/track/{orderNumber}", (string orderNumber, string? storeId, StoreService store) =>
        {
            var clean = orderNumber.Trim().ToLowerInvariant();
            var order = store.GetOrders(storeId).FirstOrDefault(o =>
                o.Id.ToLowerInvariant().Contains(clean) ||
                (o.CustomerEmail != null && o.CustomerEmail.ToLowerInvariant().Contains(clean)) ||
                (o.OrderNumber != null && o.OrderNumber.ToLowerInvariant().Contains(clean))
            );

            if (order == null) return Results.NotFound(new { error = $"Order '{orderNumber}' not found" });

            return Results.Ok(new
            {
                orderId = order.Id,
                customerName = order.CustomerName,
                customerEmail = order.CustomerEmail,
                total = order.Total,
                status = order.Status,
                createdAt = order.CreatedAt,
                trackingNumber = order.TrackingNumber,
                carrier = order.Carrier,
                invoiceNumber = order.InvoiceNumber,
                isB2B = order.IsB2B,
                customerGstin = order.CustomerGstin,
                customerCompanyName = order.CustomerCompanyName,
                buyerStateCode = order.BuyerStateCode,
                taxableAmount = order.TaxableAmount,
                cgstAmount = order.CgstAmount,
                sgstAmount = order.SgstAmount,
                igstAmount = order.IgstAmount,
                totalGst = order.TotalGst,
                itemsCount = order.Items?.Count ?? 0,
                items = order.Items
            });
        }).WithName("TrackOrder")
          .WithSummary("Public order shipment and tracking lookup");

        // GST Tax Invoice by Order ID or Order Number
        group.MapGet("/{id}/invoice", (string id, string? storeId, StoreService store) =>
        {
            var clean = id.Trim().ToLowerInvariant();
            var order = store.GetOrders(storeId).FirstOrDefault(o =>
                o.Id.ToLowerInvariant() == clean ||
                (o.OrderNumber != null && o.OrderNumber.ToLowerInvariant() == clean) ||
                (o.InvoiceNumber != null && o.InvoiceNumber.ToLowerInvariant() == clean)
            );

            if (order == null) return Results.NotFound(new { error = $"Order or Invoice '{id}' not found" });

            var storeObj = store.GetStoreById(order.StoreId ?? storeId ?? "store_apex");

            return Results.Ok(new
            {
                invoiceNumber = order.InvoiceNumber,
                orderNumber = order.OrderNumber,
                orderDate = order.CreatedAt,
                status = order.Status,
                seller = new
                {
                    legalName = storeObj?.LegalBusinessName ?? storeObj?.Name ?? "Apex Commerce India Pvt. Ltd.",
                    tradeName = storeObj?.Name ?? "Apex Commerce",
                    gstin = storeObj?.Gstin ?? "29AABCU9603R1ZM",
                    stateCode = storeObj?.StateCode ?? "29",
                    stateName = storeObj?.StateName ?? "Karnataka",
                    email = storeObj?.ContactEmail ?? "billing@istora.online",
                    location = storeObj?.Location ?? "Bangalore, India"
                },
                buyer = new
                {
                    name = order.CustomerName,
                    email = order.CustomerEmail,
                    isB2B = order.IsB2B,
                    companyName = order.CustomerCompanyName,
                    gstin = order.CustomerGstin,
                    stateCode = order.BuyerStateCode ?? storeObj?.StateCode ?? "29"
                },
                items = order.Items,
                pricing = new
                {
                    taxableAmount = order.TaxableAmount,
                    cgstAmount = order.CgstAmount,
                    sgstAmount = order.SgstAmount,
                    igstAmount = order.IgstAmount,
                    totalGst = order.TotalGst,
                    totalAmount = order.Total
                }
            });
        }).WithName("GetOrderInvoice")
          .WithSummary("Retrieve compliant Indian GST Tax Invoice details for order");

        return app;
    }
}
