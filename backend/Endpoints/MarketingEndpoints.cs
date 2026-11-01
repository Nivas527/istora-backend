using ShopifyEngine.Api.Models;
using ShopifyEngine.Api.Services;

namespace ShopifyEngine.Api.Endpoints;

public static class MarketingEndpoints
{
    public static IEndpointRouteBuilder MapMarketingEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api").WithTags("Customers & Marketing");

        // Customers
        group.MapGet("/customers", (string? storeId, StoreService store) =>
            Results.Ok(store.GetCustomers(storeId)))
            .WithName("GetCustomers")
            .WithSummary("List customers for tenant store");

        // Discounts
        group.MapGet("/discounts", (string? storeId, StoreService store) =>
            Results.Ok(store.GetDiscounts(storeId)))
            .WithName("GetDiscounts")
            .WithSummary("List active discount codes");

        group.MapPost("/discounts", (Discount discount, StoreService store) =>
        {
            var created = store.CreateDiscount(discount);
            return Results.Created($"/api/discounts/{created.Id}", created);
        }).WithName("CreateDiscount")
          .WithSummary("Create promotional discount coupon");

        group.MapPut("/discounts/{id}", (string id, Discount discount, StoreService store) =>
        {
            var updated = store.UpdateDiscount(id, discount);
            return updated != null ? Results.Ok(updated) : Results.NotFound(new { error = $"Discount '{id}' not found" });
        }).WithName("UpdateDiscount")
          .WithSummary("Update promotional discount or campaign rule");

        group.MapDelete("/discounts/{id}", (string id, StoreService store) =>
        {
            var deleted = store.DeleteDiscount(id);
            return deleted ? Results.Ok(new { success = true, id }) : Results.NotFound(new { error = $"Discount '{id}' not found" });
        }).WithName("DeleteDiscount")
          .WithSummary("Delete promotional discount rule");

        // Categories
        group.MapGet("/categories", (string? storeId, StoreService store) =>
            Results.Ok(store.GetCategories(storeId)))
            .WithName("GetCategories")
            .WithSummary("List category taxonomy for tenant");

        group.MapPost("/categories", (CategoryItem category, StoreService store) =>
        {
            var created = store.CreateCategory(category);
            return Results.Created($"/api/categories/{created.Id}", created);
        }).WithName("CreateCategory")
          .WithSummary("Add a product category");

        // Reviews
        group.MapGet("/reviews", (string? storeId, string? productId, StoreService store) =>
            Results.Ok(store.GetReviews(storeId, productId)))
            .WithName("GetReviews")
            .WithSummary("List customer reviews and star ratings");

        group.MapPost("/reviews", (ProductReview review, StoreService store) =>
        {
            var created = store.CreateReview(review);
            return Results.Created($"/api/reviews/{created.Id}", created);
        }).WithName("CreateReview")
          .WithSummary("Submit customer product review");

        return app;
    }
}
