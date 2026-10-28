using System.Text.Json;
using ShopifyEngine.Api.Models;
using ShopifyEngine.Api.Services;

namespace ShopifyEngine.Api.Endpoints;

public static class ShopifyCompatEndpoints
{
    public static IEndpointRouteBuilder MapShopifyCompatEndpoints(this IEndpointRouteBuilder app)
    {
        var adminGroup = app.MapGroup("/admin/api/2024-01").WithTags("Shopify 2024-01 REST API");

        // 1. Shop Info
        adminGroup.MapGet("/shop.json", (StoreService store) =>
        {
            var s = store.GetSettings();
            return Results.Ok(new
            {
                shop = new
                {
                    id = 15429383782462L,
                    name = s.StoreName,
                    email = s.ContactEmail,
                    domain = s.StoreDomain,
                    myshopify_domain = "istora.myshopify.local",
                    currency = s.Currency,
                    money_format = (s.CurrencySymbol ?? "$") + "{{amount}}",
                    plan_name = "enterprise",
                    country_name = "United States"
                }
            });
        }).WithName("ShopifyGetShop")
          .WithSummary("Shopify REST: Get store properties and currency format");

        // 2. Products
        adminGroup.MapGet("/products.json", (string? category, string? storeId, StoreService store) =>
        {
            var products = store.GetProducts(storeId, category);
            return Results.Ok(new { products });
        }).WithName("ShopifyGetProducts")
          .WithSummary("Shopify REST: List products in Shopify JSON envelope");

        adminGroup.MapGet("/products/{id}.json", (string id, string? storeId, StoreService store) =>
        {
            var product = store.GetProductById(id, storeId);
            return product != null ? Results.Ok(new { product }) : Results.NotFound();
        }).WithName("ShopifyGetProductById")
          .WithSummary("Shopify REST: Get product by ID");

        adminGroup.MapPost("/products.json", (JsonDocument body, StoreService store) =>
        {
            Product product;
            if (body.RootElement.TryGetProperty("product", out var prodElem))
            {
                product = JsonSerializer.Deserialize<Product>(prodElem.GetRawText()) ?? new();
            }
            else
            {
                product = JsonSerializer.Deserialize<Product>(body.RootElement.GetRawText()) ?? new();
            }
            var created = store.CreateProduct(product);
            return Results.Created($"/admin/api/2024-01/products/{created.Id}.json", new { product = created });
        }).WithName("ShopifyCreateProduct")
          .WithSummary("Shopify REST: Create product");

        adminGroup.MapPut("/products/{id}.json", (string id, JsonDocument body, StoreService store) =>
        {
            Product product;
            if (body.RootElement.TryGetProperty("product", out var prodElem))
            {
                product = JsonSerializer.Deserialize<Product>(prodElem.GetRawText()) ?? new();
            }
            else
            {
                product = JsonSerializer.Deserialize<Product>(body.RootElement.GetRawText()) ?? new();
            }
            var updated = store.UpdateProduct(id, product);
            return updated != null ? Results.Ok(new { product = updated }) : Results.NotFound();
        }).WithName("ShopifyUpdateProduct")
          .WithSummary("Shopify REST: Update product");

        adminGroup.MapDelete("/products/{id}.json", async (string id, StoreService store) =>
        {
            var deleted = await store.DeleteProductAsync(id);
            return Results.Ok(new { success = deleted });
        }).WithName("ShopifyDeleteProduct")
          .WithSummary("Shopify REST: Delete product");

        // 3. Orders
        adminGroup.MapGet("/orders.json", (string? storeId, StoreService store) =>
        {
            var orders = store.GetOrders(storeId);
            return Results.Ok(new { orders });
        }).WithName("ShopifyGetOrders")
          .WithSummary("Shopify REST: List orders");

        adminGroup.MapPost("/orders.json", (JsonDocument body, StoreService store) =>
        {
            Order orderRequest;
            if (body.RootElement.TryGetProperty("order", out var orderElem))
            {
                orderRequest = JsonSerializer.Deserialize<Order>(orderElem.GetRawText()) ?? new();
            }
            else
            {
                orderRequest = JsonSerializer.Deserialize<Order>(body.RootElement.GetRawText()) ?? new();
            }
            var order = store.CreateOrder(orderRequest);
            return Results.Created($"/admin/api/2024-01/orders/{order.Id}.json", new { order });
        }).WithName("ShopifyCreateOrder")
          .WithSummary("Shopify REST: Create order");

        // 4. Storefront Cart
        var cartGroup = app.MapGroup("/api/storefront").WithTags("Storefront Cart");
        cartGroup.MapGet("/cart.json", () =>
        {
            return Results.Ok(new
            {
                cart = new
                {
                    id = "cart_" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    lines = Array.Empty<object>(),
                    totalQuantity = 0,
                    checkoutUrl = "/checkout",
                    cost = new { subtotalAmount = new { amount = "0.00", currencyCode = "USD" } }
                }
            });
        }).WithName("StorefrontGetCart")
          .WithSummary("Headless Storefront Cart session");

        cartGroup.MapPost("/cart.json", (JsonDocument body) =>
        {
            var id = "cart_" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            int qty = 1;
            if (body.RootElement.TryGetProperty("lines", out var linesElem) && linesElem.ValueKind == JsonValueKind.Array)
            {
                qty = linesElem.GetArrayLength();
            }
            return Results.Ok(new
            {
                cart = new
                {
                    id,
                    checkoutUrl = "/checkout",
                    totalQuantity = qty,
                    cost = new { subtotalAmount = new { amount = "0.00", currencyCode = "USD" } }
                }
            });
        }).WithName("StorefrontUpdateCart")
          .WithSummary("Update headless Storefront Cart lines");

        // 5. Migration & Sync Endpoints
        var importGroup = app.MapGroup("/api/import").WithTags("Shopify Migration");

        importGroup.MapPost("/shopify-csv", async (HttpRequest request, ShopifyMigrationService migrationService) =>
        {
            try
            {
                if (!request.HasFormContentType)
                    return Results.BadRequest(new { error = "Multipart form-data expected" });

                var form = await request.ReadFormAsync();
                var file = form.Files.FirstOrDefault();
                if (file == null || file.Length == 0)
                    return Results.BadRequest(new { error = "No CSV file uploaded" });

                var mirrorImages = true;
                if (form.TryGetValue("mirrorImages", out var mirrorVal) && bool.TryParse(mirrorVal, out var parsedMirror))
                    mirrorImages = parsedMirror;

                string? storeId = null;
                if (form.TryGetValue("storeId", out var sIdVal) && !string.IsNullOrWhiteSpace(sIdVal))
                    storeId = sIdVal.ToString();

                using var stream = file.OpenReadStream();
                var result = await migrationService.ImportShopifyCsvAsync(stream, storeId, mirrorImages);

                return result.Success ? Results.Ok(result) : Results.BadRequest(result);
            }
            catch (Exception ex)
            {
                return Results.Problem($"Shopify CSV import failed: {ex.Message}");
            }
        }).WithName("ImportShopifyCsv")
          .WithSummary("Import standard Shopify products and customers CSV export");

        importGroup.MapPost("/shopify-api", async (ShopifyApiImportRequest req, ShopifyMigrationService migrationService) =>
        {
            try
            {
                if (string.IsNullOrWhiteSpace(req.ShopifyDomain) || string.IsNullOrWhiteSpace(req.AccessToken))
                    return Results.BadRequest(new { error = "Shopify domain and Admin API Access Token are required." });

                var result = await migrationService.ImportFromShopifyApiAsync(
                    req.ShopifyDomain,
                    req.AccessToken,
                    req.StoreId,
                    req.MirrorImages,
                    req.ImportProducts,
                    req.ImportCustomers
                );

                return result.Success ? Results.Ok(result) : Results.BadRequest(result);
            }
            catch (Exception ex)
            {
                return Results.Problem($"Shopify API sync failed: {ex.Message}");
            }
        }).WithName("ImportShopifyApi")
          .WithSummary("1-Click direct live Shopify store migration over Admin REST API");

        return app;
    }
}
