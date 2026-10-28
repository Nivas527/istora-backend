namespace ShopifyEngine.Api.Endpoints;

public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        // Root redirect to Swagger
        app.MapGet("/", () => Results.Redirect("/swagger"))
           .ExcludeFromDescription();

        // System Health & Telemetry
        app.MapGet("/api/health", () => Results.Ok(new
        {
            engine = "Shopify Engine & Vercel React Hosting Backend",
            architecture = "Clean Architecture / Enterprise Multi-Tenant .NET 10",
            runtime = "ASP.NET Core 10 (C# / Kestrel)",
            status = "Healthy",
            timestamp = DateTime.UtcNow,
            swaggerUi = "/swagger"
        })).WithTags("Health & System")
           .WithName("GetApiHealth")
           .WithSummary("Check backend engine status and runtime telemetry");

        return app;
    }
}
