using ShopifyEngine.Api.Models;
using ShopifyEngine.Api.Services;

namespace ShopifyEngine.Api.Endpoints;

public static class NotificationEndpoints
{
    public static IEndpointRouteBuilder MapNotificationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/notifications").WithTags("Automated Notifications");

        // 1. Get Notification Settings
        group.MapGet("/settings", (string? storeId, NotificationService service) =>
        {
            var settings = service.GetSettings(storeId ?? "store_apex");
            return Results.Ok(settings);
        }).WithName("GetNotificationSettings")
          .WithSummary("Retrieve notification channels and provider configuration for tenant store");

        // 2. Save Notification Settings
        group.MapPost("/settings", (NotificationSettings req, NotificationService service) =>
        {
            var saved = service.SaveSettings(req);
            return Results.Ok(saved);
        }).WithName("SaveNotificationSettings")
          .WithSummary("Save notification channels, credentials, and merchant alert triggers");

        // 3. Get Dispatched Notification Logs
        group.MapGet("/logs", (string? storeId, string? channel, int? limit, NotificationService service) =>
        {
            var logs = service.GetLogs(storeId ?? "store_apex", channel, limit ?? 50);
            return Results.Ok(logs);
        }).WithName("GetNotificationLogs")
          .WithSummary("Get recent dispatched notification audit log");

        // 4. Send Test Notification
        group.MapPost("/test", (NotificationTestRequest req, NotificationService service) =>
        {
            var result = service.TestNotification(req);
            return Results.Ok(result);
        }).WithName("TestNotification")
          .WithSummary("Dispatch a test transactional Email or WhatsApp alert");

        return app;
    }
}

