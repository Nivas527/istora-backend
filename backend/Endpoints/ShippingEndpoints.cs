using ShopifyEngine.Api.Models;
using ShopifyEngine.Api.Services;

namespace ShopifyEngine.Api.Endpoints;

public static class ShippingEndpoints
{
    public static IEndpointRouteBuilder MapShippingEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/shipping").WithTags("Shipping & Logistics Aggregators (Shiprocket / Delhivery)");

        // 1. Automated 1-Click AWB Generation (Shiprocket / Delhivery)
        group.MapPost("/generate-awb", async (GenerateAwbRequest req, string? storeId, ShippingService shipping) =>
        {
            try
            {
                var result = await shipping.GenerateAwbAsync(req, storeId);
                return Results.Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        }).WithName("GenerateAwb")
          .WithSummary("1-Click automated AWB generation with Shiprocket or Delhivery, registers 4x6 thermal shipping label and dispatches notifications");

        // 2. Fetch 4x6 Thermal Shipping Label Metadata
        group.MapGet("/labels/{orderId}", async (string orderId, string? storeId, ShippingService shipping) =>
        {
            var label = await shipping.GetShippingLabelAsync(orderId, storeId);
            return label != null ? Results.Ok(label) : Results.NotFound(new { error = $"Shipping label for order '{orderId}' not found" });
        }).WithName("GetShippingLabel")
          .WithSummary("Get official 4x6 thermal shipping label with barcode, routing code, and consignee details");

        // 3. Live Courier Tracking Webhook (Shiprocket / Delhivery Scan Updates)
        group.MapPost("/webhooks/carrier-update", async (CarrierWebhookPayload payload, string? storeId, ShippingService shipping) =>
        {
            var updatedOrder = await shipping.ProcessCarrierWebhookAsync(payload, storeId);
            if (updatedOrder == null)
            {
                return Results.NotFound(new { error = $"No matching order found for AWB '{payload.Awb}'" });
            }

            return Results.Ok(new
            {
                success = true,
                message = $"Order {updatedOrder.OrderNumber} tracking milestone updated to '{payload.CurrentStatus}'",
                order = updatedOrder
            });
        }).WithName("CarrierWebhookUpdate")
          .WithSummary("Real-time webhook receiver for courier barcode scans (In-Transit, Out for Delivery, Delivered)");

        return app;
    }
}

