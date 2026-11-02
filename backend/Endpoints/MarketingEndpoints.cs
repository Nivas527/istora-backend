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

        // Customer Reviews, Star Ratings & UGC Uploads
        group.MapGet("/reviews", (string? storeId, string? productId, int? rating, bool? withMedia, StoreService store) =>
        {
            var summary = store.GetReviewsSummary(storeId, productId, rating, withMedia ?? false);
            return Results.Ok(summary);
        })
        .WithName("GetReviewsSummary")
        .WithSummary("List customer reviews, rating histogram, UGC media, and fit feedback summary");

        group.MapPost("/reviews", (ProductReview review, StoreService store) =>
        {
            var created = store.CreateReview(review);
            return Results.Created($"/api/reviews/{created.Id}", created);
        }).WithName("CreateReview")
          .WithSummary("Submit customer product review");

        group.MapPost("/reviews/{id}/helpful", (string id, StoreService store) =>
        {
            var updated = store.VoteReviewHelpful(id);
            if (updated == null) return Results.NotFound(new { error = "Review not found" });
            return Results.Ok(updated);
        })
        .WithName("VoteReviewHelpful")
        .WithSummary("Upvote review as helpful");

        group.MapPost("/reviews/{id}/reply", (string id, MerchantReplyRequest request, StoreService store) =>
        {
            if (string.IsNullOrWhiteSpace(request?.ReplyText))
            {
                return Results.BadRequest(new { error = "Reply text cannot be empty" });
            }
            var updated = store.AddMerchantReply(id, request.ReplyText);
            if (updated == null) return Results.NotFound(new { error = "Review not found" });
            return Results.Ok(updated);
        })
        .WithName("AddMerchantReviewReply")
        .WithSummary("Post official merchant response to a customer review");

        group.MapDelete("/reviews/{id}", (string id, StoreService store) =>
        {
            var deleted = store.DeleteReview(id);
            return deleted ? Results.Ok(new { success = true }) : Results.NotFound(new { error = "Review not found" });
        })
        .WithName("DeleteReview")
        .WithSummary("Remove or moderate customer review");

        return app;
    }
}

public class MerchantReplyRequest
{
    public string ReplyText { get; set; } = string.Empty;
}
