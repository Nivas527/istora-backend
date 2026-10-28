using ShopifyEngine.Api.Data;
using ShopifyEngine.Api.Endpoints;
using ShopifyEngine.Api.Infrastructure;
using ShopifyEngine.Api.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Configure port from environment or default 5200
var port = Environment.GetEnvironmentVariable("PORT") ?? "5200";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// Register Application Infrastructure & Multi-Tenant Services
builder.Services.AddBackendInfrastructure(builder.Configuration);

var app = builder.Build();

// 1. Enterprise Observability & Correlation Tracing
app.UseMiddleware<CorrelationIdMiddleware>();

// 2. Global Exception Handling (RFC 7807 ProblemDetails)
app.UseMiddleware<GlobalExceptionMiddleware>();

// 3. Permissive CORS for Frontends
app.UseCors("AllowAll");

// 4. Database Schema Migration and Multi-Tenant Seeding
DatabaseMigrator.MigrateAndSeed(app.Services, app.Logger);

// 5. OpenAPI / Swagger Documentation
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Shopify Engine API v1");
    c.RoutePrefix = "swagger";
});

// 6. Hosted Apps Referer Asset Fallback Middleware
app.UseMiddleware<HostedAssetFallbackMiddleware>();

// 7. Map Clean Modular Endpoint Groups
app.MapStoreEndpoints()
   .MapProductEndpoints()
   .MapOrderEndpoints()
   .MapMarketingEndpoints()
   .MapPaymentEndpoints()
   .MapShopifyCompatEndpoints()
   .MapDeploymentEndpoints()
   .MapUploadEndpoints()
   .MapHealthEndpoints();

// 8. Startup Telemetry Banner
app.Lifetime.ApplicationStarted.Register(() =>
{
    Console.WriteLine("\n=========================================================");
    Console.WriteLine("🚀 Shopify Engine & Vercel React Hosting Engine (.NET 10)");
    Console.WriteLine($"🏛️ Architecture: Enterprise Clean Modular Layering");
    Console.WriteLine($"🐘 Database:    PostgreSQL (localhost:5432/shopify_engine)");
    Console.WriteLine($"📖 Swagger UI:  http://localhost:{port}/swagger");
    Console.WriteLine($"🌐 Web / Root:   http://localhost:{port}/ (auto-redirects to Swagger)");
    Console.WriteLine($"⚡ API Health:   http://localhost:{port}/api/health");
    Console.WriteLine("=========================================================\n");
});

app.Run();
