using Microsoft.EntityFrameworkCore;
using ShopifyEngine.Api.Services;

namespace ShopifyEngine.Api.Data;

public static class DatabaseMigrator
{
    public static void MigrateAndSeed(IServiceProvider services, ILogger logger)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();

        logger.LogInformation("Verifying PostgreSQL database schema and migrations...");
        db.Database.EnsureCreated();

        try
        {
            db.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS stores (
                    ""Id"" text PRIMARY KEY,
                    ""Name"" text NOT NULL,
                    ""Slug"" text NOT NULL,
                    ""Subdomain"" text NOT NULL,
                    ""CustomDomain"" text,
                    ""Category"" text NOT NULL,
                    ""ThemeId"" text NOT NULL,
                    ""AccentColor"" text NOT NULL,
                    ""Currency"" text NOT NULL,
                    ""CurrencySymbol"" text NOT NULL,
                    ""TaxRate"" numeric NOT NULL,
                    ""FreeShippingThreshold"" numeric NOT NULL,
                    ""StandardShippingRate"" numeric NOT NULL,
                    ""ExpressShippingRate"" numeric NOT NULL,
                    ""ContactEmail"" text NOT NULL,
                    ""Status"" text NOT NULL,
                    ""CreatedAt"" text NOT NULL
                );

                CREATE TABLE IF NOT EXISTS customers (
                    ""Id"" text PRIMARY KEY,
                    ""StoreId"" text NOT NULL,
                    ""Name"" text NOT NULL,
                    ""Email"" text NOT NULL,
                    ""Phone"" text,
                    ""OrdersCount"" integer NOT NULL,
                    ""TotalSpent"" numeric NOT NULL,
                    ""CreatedAt"" text NOT NULL
                );

                CREATE TABLE IF NOT EXISTS categories (
                    ""Id"" text PRIMARY KEY,
                    ""StoreId"" text NOT NULL,
                    ""Name"" text NOT NULL,
                    ""Slug"" text NOT NULL
                );

                CREATE TABLE IF NOT EXISTS discounts (
                    ""Id"" text PRIMARY KEY,
                    ""StoreId"" text NOT NULL,
                    ""Code"" text NOT NULL,
                    ""Type"" text NOT NULL,
                    ""Value"" numeric NOT NULL,
                    ""MinSubtotal"" numeric NOT NULL,
                    ""Description"" text NOT NULL
                );

                CREATE TABLE IF NOT EXISTS reviews (
                    ""Id"" text PRIMARY KEY,
                    ""StoreId"" text NOT NULL,
                    ""ProductId"" text NOT NULL,
                    ""CustomerName"" text NOT NULL,
                    ""Rating"" integer NOT NULL,
                    ""Title"" text NOT NULL,
                    ""Comment"" text NOT NULL,
                    ""VerifiedBuyer"" boolean NOT NULL,
                    ""CreatedAt"" text NOT NULL
                );

                ALTER TABLE products ADD COLUMN IF NOT EXISTS ""StoreId"" text NOT NULL DEFAULT 'store_apex';
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS ""StoreId"" text NOT NULL DEFAULT 'store_apex';
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS ""PaymentMethod"" text NOT NULL DEFAULT 'UPI';
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS ""TrackingNumber"" text;
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS ""Carrier"" text;

                ALTER TABLE stores ADD COLUMN IF NOT EXISTS ""Location"" text NOT NULL DEFAULT 'India';
                ALTER TABLE stores ADD COLUMN IF NOT EXISTS ""Plan"" text NOT NULL DEFAULT 'monthly';
                ALTER TABLE stores ADD COLUMN IF NOT EXISTS ""Environment"" text NOT NULL DEFAULT 'production';
                ALTER TABLE stores ADD COLUMN IF NOT EXISTS ""RazorpayEnabled"" boolean NOT NULL DEFAULT true;
                ALTER TABLE stores ADD COLUMN IF NOT EXISTS ""RazorpayKeyId"" text NOT NULL DEFAULT '';
                ALTER TABLE stores ADD COLUMN IF NOT EXISTS ""RazorpayKeySecret"" text NOT NULL DEFAULT '';
                ALTER TABLE stores ADD COLUMN IF NOT EXISTS ""StripeEnabled"" boolean NOT NULL DEFAULT true;
                ALTER TABLE stores ADD COLUMN IF NOT EXISTS ""StripePublishableKey"" text NOT NULL DEFAULT '';
                ALTER TABLE stores ADD COLUMN IF NOT EXISTS ""StripeSecretKey"" text NOT NULL DEFAULT '';
                ALTER TABLE stores ADD COLUMN IF NOT EXISTS ""CodEnabled"" boolean NOT NULL DEFAULT true;
                ALTER TABLE stores ADD COLUMN IF NOT EXISTS ""BannerVideoUrl"" text;
                ALTER TABLE stores ADD COLUMN IF NOT EXISTS ""PreviewVideosJson"" text NOT NULL DEFAULT '[]';
                ALTER TABLE products ADD COLUMN IF NOT EXISTS ""PreviewVideoUrl"" text;
            ");
            logger.LogInformation("Database tables and multi-tenant schema partitions verified successfully.");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "[Database Migration Notice] {Message}", ex.Message);
        }

        var storeService = scope.ServiceProvider.GetRequiredService<StoreService>();
        storeService.InitializeDatabase();
    }
}
