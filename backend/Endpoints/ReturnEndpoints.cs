using ShopifyEngine.Api.Models;
using ShopifyEngine.Api.Services;

namespace ShopifyEngine.Api.Endpoints;

public static class ReturnEndpoints
{
    public static IEndpointRouteBuilder MapReturnEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/returns").WithTags("Self-Service Returns & RMA");

        // 1. Customer: Initiate Return or Exchange
        group.MapPost("/", async (CreateReturnRequest req, ReturnService service) =>
        {
            var res = await service.CreateReturnAsync(req);
            return Results.Created($"/api/returns/{res.Id}", res);
        }).WithName("CreateReturn")
          .WithSummary("Submit a customer self-service return or exchange request");

        // 2. Customer & Admin: Get Return by Order Number or RMA ID
        group.MapGet("/{orderNumber}", async (string orderNumber, string? storeId, ReturnService service) =>
        {
            var res = await service.GetReturnByOrderAsync(orderNumber, storeId);
            if (res == null) return Results.NotFound(new { error = $"No return request found for '{orderNumber}'" });
            return Results.Ok(res);
        }).WithName("GetReturnByOrder")
          .WithSummary("Lookup return and reverse pickup status for an order");

        // 3. Admin: List All Return Requests for Tenant Store
        app.MapGet("/api/admin/returns", async (string? storeId, string? status, int? limit, ReturnService service) =>
        {
            var list = await service.GetReturnsAsync(storeId ?? "store_apex", status, limit ?? 50);
            return Results.Ok(list);
        }).WithTags("Self-Service Returns & RMA")
          .WithName("GetAdminReturns")
          .WithSummary("Retrieve all RMA return and exchange requests for store");

        // 4. Admin: Update Return Status (Approve, Reject, Issue Replacement)
        app.MapPost("/api/admin/returns/{id}/status", async (string id, UpdateReturnStatusRequest req, ReturnService service) =>
        {
            var updated = await service.UpdateReturnStatusAsync(id, req);
            if (updated == null) return Results.NotFound(new { error = $"Return request '{id}' not found" });
            return Results.Ok(updated);
        }).WithTags("Self-Service Returns & RMA")
          .WithName("UpdateReturnStatus")
          .WithSummary("Approve return (generates GST Credit Note), reject, or issue replacement");

        // 5. Customer & Admin: Retrieve GST Credit Note by ID or Number
        group.MapGet("/{id}/credit-note", async (string id, string? storeId, ReturnService service) =>
        {
            var creditNote = await service.GetCreditNoteAsync(id, storeId);
            if (creditNote == null) return Results.NotFound(new { error = $"GST Credit Note not found for '{id}'" });
            return Results.Ok(creditNote);
        }).WithName("GetGstCreditNote")
          .WithSummary("Download or view official GST Credit Note (Rule 54 compliant)");

        return app;
    }
}

