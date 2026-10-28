using ShopifyEngine.Api.Models;
using ShopifyEngine.Api.Services;

namespace ShopifyEngine.Api.Endpoints;

public static class StoreEndpoints
{
    public static IEndpointRouteBuilder MapStoreEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api").WithTags("Store Management");

        // Multi-Tenant Stores (Registry)
        group.MapGet("/stores", (StoreService store) => Results.Ok(store.GetStores()))
            .WithName("GetStores")
            .WithSummary("Retrieve all registered tenant stores");

        group.MapGet("/stores/{id}", (string id, StoreService store) =>
        {
            var s = store.GetStoreById(id);
            return s != null ? Results.Ok(s) : Results.NotFound();
        }).WithName("GetStoreById")
          .WithSummary("Get a specific store profile by ID");

        group.MapPost("/stores", (TenantStore newStore, StoreService store) =>
        {
            var created = store.CreateStore(newStore);
            return Results.Created($"/api/stores/{created.Id}", created);
        }).WithName("CreateStore")
          .WithSummary("Register a new tenant store");

        group.MapPut("/stores/{id}", (string id, TenantStore updated, StoreService store) =>
        {
            var res = store.UpdateStore(id, updated);
            return res != null ? Results.Ok(res) : Results.NotFound();
        }).WithName("UpdateStore")
          .WithSummary("Update store metadata, theme, and gateway configurations");

        group.MapDelete("/stores/{id}", (string id, StoreService store) =>
        {
            var deleted = store.DeleteStore(id);
            return Results.Ok(new { success = deleted });
        }).WithName("DeleteStore")
          .WithSummary("Decommission a tenant store");

        // Active Tenant Settings
        group.MapGet("/store", (StoreService store) => Results.Ok(store.GetSettings()))
            .WithName("GetActiveStoreSettings")
            .WithSummary("Get the resolved tenant store settings");

        group.MapPost("/store", (StoreSettings settings, StoreService store) =>
        {
            store.UpdateSettings(settings);
            return Results.Ok(store.GetSettings());
        }).WithName("UpdateActiveStoreSettings")
          .WithSummary("Update settings for the currently active tenant");

        return app;
    }
}
