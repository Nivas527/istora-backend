using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using ShopifyEngine.Api.Data;
using ShopifyEngine.Api.Services;

namespace ShopifyEngine.Api.Infrastructure;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddBackendInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // 1. Configure PostgreSQL Database Context
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Port=5432;Database=shopify_engine;Username=nivas;Password=";

        services.AddDbContext<ShopifyDbContext>(options =>
        {
            options.UseNpgsql(connectionString);
        });

        // 2. Increase body size limit to 50MB for dist.zip uploads
        services.Configure<FormOptions>(options =>
        {
            options.MultipartBodyLengthLimit = 52428800; // 50MB
        });

        // 3. Register Multi-Tenant Context & Domain Services
        services.AddHttpContextAccessor();
        services.AddScoped<ITenantProvider, HttpTenantProvider>();
        services.AddScoped<StoreService>();
        services.AddScoped<ShopifyMigrationService>();
        services.AddScoped<PaymentService>();
        services.AddScoped<FitVerificationService>();

        // 4. Register Singleton Engine Services
        services.AddSingleton<DeploymentService>();
        services.AddSingleton<R2StorageService>();
        services.AddSingleton<JsxCompilerService>();

        // 5. Permissive CORS for local Vite dev and live Cloudflare Pages / custom domains
        services.AddCors(options =>
        {
            options.AddPolicy("AllowAll", policy =>
            {
                policy.SetIsOriginAllowed(_ => true)
                      .AllowAnyMethod()
                      .AllowAnyHeader()
                      .AllowCredentials();
            });
        });

        // 6. OpenAPI / Swagger Documentation
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Shopify Engine & Vercel React Hosting API",
                Version = "v1",
                Description = "Enterprise Multi-Tenant E-Commerce and Edge React / dist.zip Hosting Engine"
            });
        });

        return services;
    }
}
