using ShopifyEngine.Api.Models;
using ShopifyEngine.Api.Services;

namespace ShopifyEngine.Api.Endpoints;

public static class AbandonedCartEndpoints
{
    public static IEndpointRouteBuilder MapAbandonedCartEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/abandoned-carts").WithTags("Abandoned Cart Recovery Engine");

        // 1. Capture Checkout Drop-off in Real Time (Debounced on Step 1 / customer info)
        app.MapPost("/api/cart/capture", async (CaptureCartRequest req, AbandonedCartService service) =>
        {
            var res = await service.CaptureCartAsync(req);
            return Results.Ok(res);
        }).WithTags("Abandoned Cart Recovery Engine")
          .WithName("CaptureAbandonedCart")
          .WithSummary("Capture shopper cart and contact state on step 1 of checkout");

        // 2. Look Up Abandoned Cart by Recovery Token (For 1-click cart restoration link)
        app.MapGet("/api/cart/recover/{token}", async (string token, string? storeId, AbandonedCartService service) =>
        {
            var cart = await service.GetCartByTokenAsync(token, storeId);
            if (cart == null) return Results.NotFound(new { error = "Recovery cart session not found or expired" });
            return Results.Ok(cart);
        }).WithTags("Abandoned Cart Recovery Engine")
          .WithName("RecoverCartByToken")
          .WithSummary("Restore customer cart and contact information from recovery link");

        // 3. Admin: List Abandoned Carts for Tenant Store
        group.MapGet("/", async (string? storeId, string? status, int? limit, AbandonedCartService service) =>
        {
            var carts = await service.GetAbandonedCartsAsync(storeId ?? "store_apex", status, limit ?? 50);
            return Results.Ok(carts);
        }).WithName("GetAbandonedCarts")
          .WithSummary("Retrieve abandoned carts list for tenant store");

        // 4. Admin: Recovery Analytics & KPIs (Lost vs. Recovered Revenue)
        group.MapGet("/analytics", async (string? storeId, AbandonedCartService service) =>
        {
            var analytics = await service.GetAnalyticsAsync(storeId ?? "store_apex");
            return Results.Ok(analytics);
        }).WithName("GetAbandonedCartAnalytics")
          .WithSummary("Get lost revenue, recovered revenue, and recovery rate KPIs");

        // 5. Admin: Trigger Timed Recovery Reminder (Email or WhatsApp)
        group.MapPost("/send-recovery", async (SendRecoveryNotificationRequest req, AbandonedCartService service) =>
        {
            var success = await service.SendRecoveryNotificationAsync(req);
            if (!success) return Results.NotFound(new { error = "Abandoned cart not found" });
            return Results.Ok(new { success = true, message = "Recovery notification dispatched successfully." });
        }).WithName("SendRecoveryNotification")
          .WithSummary("Dispatch 1-hour or 24-hour cart recovery notification with discount link");

        return app;
    }
}

