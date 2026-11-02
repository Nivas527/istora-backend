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

                CREATE TABLE IF NOT EXISTS notification_logs (
                    ""Id"" text PRIMARY KEY,
                    ""StoreId"" text NOT NULL,
                    ""Channel"" text NOT NULL,
                    ""Type"" text NOT NULL,
                    ""Recipient"" text NOT NULL,
                    ""Subject"" text NOT NULL,
                    ""Snippet"" text NOT NULL,
                    ""Status"" text NOT NULL,
                    ""HasAttachment"" boolean NOT NULL,
                    ""AttachmentName"" text,
                    ""CreatedAt"" text NOT NULL
                );

                CREATE TABLE IF NOT EXISTS abandoned_carts (
                    ""Id"" text PRIMARY KEY,
                    ""StoreId"" text NOT NULL,
                    ""CustomerEmail"" text NOT NULL,
                    ""CustomerPhone"" text NOT NULL DEFAULT '',
                    ""CustomerName"" text NOT NULL DEFAULT '',
                    ""CartJson"" jsonb NOT NULL DEFAULT '[]'::jsonb,
                    ""TotalValue"" numeric NOT NULL DEFAULT 0,
                    ""CheckoutStep"" text NOT NULL DEFAULT 'customer_info',
                    ""RecoveryToken"" text NOT NULL,
                    ""RecoveryStatus"" text NOT NULL DEFAULT 'abandoned',
                    ""EmailSequenceStep"" integer NOT NULL DEFAULT 0,
                    ""DiscountCode"" text DEFAULT 'SAVE5',
                    ""DiscountPercent"" numeric NOT NULL DEFAULT 5,
                    ""LastEmailSentAt"" text,
                    ""RecoveredAt"" text,
                    ""RecoveredOrderId"" text,
                    ""CreatedAt"" text NOT NULL,
                    ""UpdatedAt"" text NOT NULL
                );

                CREATE UNIQUE INDEX IF NOT EXISTS ix_abandoned_carts_token ON abandoned_carts (""StoreId"", ""RecoveryToken"");
                CREATE INDEX IF NOT EXISTS ix_abandoned_carts_status ON abandoned_carts (""StoreId"", ""RecoveryStatus"");

                CREATE TABLE IF NOT EXISTS returns (
                    ""Id"" text PRIMARY KEY,
                    ""StoreId"" text NOT NULL,
                    ""OrderId"" text NOT NULL,
                    ""OrderNumber"" text NOT NULL,
                    ""CustomerName"" text NOT NULL DEFAULT '',
                    ""CustomerEmail"" text NOT NULL DEFAULT '',
                    ""CustomerPhone"" text NOT NULL DEFAULT '',
                    ""Type"" text NOT NULL DEFAULT 'return_refund',
                    ""Reason"" text NOT NULL DEFAULT 'size_mismatch',
                    ""ReasonDetails"" text NOT NULL DEFAULT '',
                    ""FitInsight"" text,
                    ""ItemsJson"" jsonb NOT NULL DEFAULT '[]'::jsonb,
                    ""TotalRefundAmount"" numeric NOT NULL DEFAULT 0,
                    ""Status"" text NOT NULL DEFAULT 'pending',
                    ""CreditNoteNumber"" text,
                    ""CreditNoteJson"" jsonb,
                    ""AdminNotes"" text,
                    ""PickupCourier"" text DEFAULT 'Delhivery Reverse Logistics',
                    ""PickupTrackingNumber"" text,
                    ""CreatedAt"" text NOT NULL,
                    ""UpdatedAt"" text NOT NULL
                );

                CREATE INDEX IF NOT EXISTS ix_returns_order ON returns (""StoreId"", ""OrderId"");
                CREATE INDEX IF NOT EXISTS ix_returns_status ON returns (""StoreId"", ""Status"");

                ALTER TABLE products ADD COLUMN IF NOT EXISTS ""StoreId"" text NOT NULL DEFAULT 'store_apex';
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS ""StoreId"" text NOT NULL DEFAULT 'store_apex';
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS ""PaymentMethod"" text NOT NULL DEFAULT 'UPI';
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS ""TrackingNumber"" text;
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS ""Carrier"" text;
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS ""InvoiceNumber"" text;
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS ""IsB2B"" boolean NOT NULL DEFAULT false;
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS ""CustomerGstin"" text;
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS ""CustomerCompanyName"" text;
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS ""BuyerStateCode"" text DEFAULT '29';
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS ""TaxableAmount"" numeric NOT NULL DEFAULT 0;
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS ""CgstAmount"" numeric NOT NULL DEFAULT 0;
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS ""SgstAmount"" numeric NOT NULL DEFAULT 0;
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS ""IgstAmount"" numeric NOT NULL DEFAULT 0;
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS ""TotalGst"" numeric NOT NULL DEFAULT 0;
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS ""CourierAggregator"" text DEFAULT 'Delhivery';
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS ""AwbNumber"" text;
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS ""RoutingCode"" text;
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS ""ShippingLabelJson"" text;
                ALTER TABLE orders ADD COLUMN IF NOT EXISTS ""ShipmentTimelineJson"" text DEFAULT '[]';

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
                ALTER TABLE stores ADD COLUMN IF NOT EXISTS ""GstEnabled"" boolean NOT NULL DEFAULT true;
                ALTER TABLE stores ADD COLUMN IF NOT EXISTS ""Gstin"" text NOT NULL DEFAULT '29AABCU9603R1ZM';
                ALTER TABLE stores ADD COLUMN IF NOT EXISTS ""LegalBusinessName"" text NOT NULL DEFAULT 'Apex Commerce India Pvt. Ltd.';
                ALTER TABLE stores ADD COLUMN IF NOT EXISTS ""StateCode"" text NOT NULL DEFAULT '29';
                ALTER TABLE stores ADD COLUMN IF NOT EXISTS ""StateName"" text NOT NULL DEFAULT 'Karnataka';
                ALTER TABLE stores ADD COLUMN IF NOT EXISTS ""DefaultHsnCode"" text NOT NULL DEFAULT '6109';
                ALTER TABLE stores ADD COLUMN IF NOT EXISTS ""GstRatePercent"" numeric NOT NULL DEFAULT 18.0;
                ALTER TABLE stores ADD COLUMN IF NOT EXISTS ""PricesIncludeGst"" boolean NOT NULL DEFAULT false;
                ALTER TABLE stores ADD COLUMN IF NOT EXISTS ""InvoicePrefix"" text NOT NULL DEFAULT 'INV-2026/';
                ALTER TABLE stores ADD COLUMN IF NOT EXISTS ""NotificationSettingsJson"" text NOT NULL DEFAULT '{{}}';
                ALTER TABLE products ADD COLUMN IF NOT EXISTS ""PreviewVideoUrl"" text;
                ALTER TABLE products ADD COLUMN IF NOT EXISTS ""GarmentSpecJson"" text;

                ALTER TABLE customers ADD COLUMN IF NOT EXISTS ""PasswordHash"" text;
                ALTER TABLE customers ADD COLUMN IF NOT EXISTS ""SavedAddressesJson"" text NOT NULL DEFAULT '[]';
                ALTER TABLE customers ADD COLUMN IF NOT EXISTS ""WishlistJson"" text NOT NULL DEFAULT '[]';
                ALTER TABLE customers ADD COLUMN IF NOT EXISTS ""AuthProvider"" text NOT NULL DEFAULT 'email';
                ALTER TABLE customers ADD COLUMN IF NOT EXISTS ""Avatar"" text;

                ALTER TABLE discounts ADD COLUMN IF NOT EXISTS ""RuleType"" text NOT NULL DEFAULT 'percentage';
                ALTER TABLE discounts ADD COLUMN IF NOT EXISTS ""IsAutoApplied"" boolean NOT NULL DEFAULT false;
                ALTER TABLE discounts ADD COLUMN IF NOT EXISTS ""BuyQuantity"" integer;
                ALTER TABLE discounts ADD COLUMN IF NOT EXISTS ""GetQuantity"" integer;
                ALTER TABLE discounts ADD COLUMN IF NOT EXISTS ""GetDiscountPercent"" numeric DEFAULT 100;
                ALTER TABLE discounts ADD COLUMN IF NOT EXISTS ""ApplicableCategory"" text DEFAULT 'all';
                ALTER TABLE discounts ADD COLUMN IF NOT EXISTS ""ApplicableProductId"" text;
                ALTER TABLE discounts ADD COLUMN IF NOT EXISTS ""TierPricingJson"" text DEFAULT '[]';
                ALTER TABLE discounts ADD COLUMN IF NOT EXISTS ""UsageCount"" integer NOT NULL DEFAULT 0;
                ALTER TABLE discounts ADD COLUMN IF NOT EXISTS ""IsActive"" boolean NOT NULL DEFAULT true;
                ALTER TABLE discounts ADD COLUMN IF NOT EXISTS ""StartsAt"" text;
                ALTER TABLE discounts ADD COLUMN IF NOT EXISTS ""EndsAt"" text;

                ALTER TABLE reviews ADD COLUMN IF NOT EXISTS ""CustomerEmail"" text DEFAULT '';
                ALTER TABLE reviews ADD COLUMN IF NOT EXISTS ""MediaUrlsJson"" jsonb DEFAULT '[]'::jsonb;
                ALTER TABLE reviews ADD COLUMN IF NOT EXISTS ""HelpfulVotes"" integer NOT NULL DEFAULT 0;
                ALTER TABLE reviews ADD COLUMN IF NOT EXISTS ""MerchantReply"" text;
                ALTER TABLE reviews ADD COLUMN IF NOT EXISTS ""MerchantReplyAt"" text;
                ALTER TABLE reviews ADD COLUMN IF NOT EXISTS ""Status"" text NOT NULL DEFAULT 'published';
                ALTER TABLE reviews ADD COLUMN IF NOT EXISTS ""CustomerFitRating"" text DEFAULT 'true_to_size';
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
