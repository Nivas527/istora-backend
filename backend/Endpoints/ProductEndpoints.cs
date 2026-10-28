using ShopifyEngine.Api.Models;
using ShopifyEngine.Api.Services;

namespace ShopifyEngine.Api.Endpoints;

public static class ProductEndpoints
{
    public static IEndpointRouteBuilder MapProductEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/products").WithTags("Products");

        // Products (multi-tenant filtered by storeId)
        group.MapGet("/", (string? storeId, string? category, StoreService store) =>
            Results.Ok(store.GetProducts(storeId, category)))
            .WithName("GetProducts")
            .WithSummary("List products isolated by tenant store");

        group.MapGet("/{id}", (string id, string? storeId, StoreService store) =>
        {
            var product = store.GetProductById(id, storeId);
            return product != null ? Results.Ok(product) : Results.NotFound();
        }).WithName("GetProductById")
          .WithSummary("Get product details by ID");

        group.MapPost("/", (Product product, StoreService store) =>
        {
            var created = store.CreateProduct(product);
            return Results.Created($"/api/products/{created.Id}", created);
        }).WithName("CreateProduct")
          .WithSummary("Create a new product within current tenant");

        group.MapPut("/{id}", (string id, Product product, StoreService store) =>
        {
            var updated = store.UpdateProduct(id, product);
            return updated != null ? Results.Ok(updated) : Results.NotFound();
        }).WithName("UpdateProduct")
          .WithSummary("Update product inventory, price, or media");

        group.MapDelete("/{id}", async (string id, StoreService store) =>
        {
            var deleted = await store.DeleteProductAsync(id);
            return Results.Ok(new { success = deleted });
        }).WithName("DeleteProduct")
          .WithSummary("Remove a product from tenant inventory");

        return app;
    }
}
