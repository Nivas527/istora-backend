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
                itemsCount = order.Items?.Count ?? 0,
                items = order.Items
            });
        }).WithName("TrackOrder")
          .WithSummary("Public order shipment and tracking lookup");

        return app;
    }
}
