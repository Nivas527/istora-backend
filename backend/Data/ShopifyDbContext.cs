using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace ShopifyEngine.Api.Data;

public class DbStore
{
    [Key]
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Subdomain { get; set; } = string.Empty;
    public string? CustomDomain { get; set; }
    public string Category { get; set; } = "General Merchandise";
    public string ThemeId { get; set; } = "theme_apex_velocity";
    public string AccentColor { get; set; } = "#008060";
    public string Currency { get; set; } = "USD";
    public string CurrencySymbol { get; set; } = "$";
    public decimal TaxRate { get; set; } = 0.08m;
    public decimal FreeShippingThreshold { get; set; } = 75.00m;
    public decimal StandardShippingRate { get; set; } = 6.99m;
    public decimal ExpressShippingRate { get; set; } = 14.99m;
    public string ContactEmail { get; set; } = "support@example.com";
    public string Status { get; set; } = "active";
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

public class DbStoreSetting
{
    [Key]
    public string Id { get; set; } = "default";
    public string StoreName { get; set; } = "Apex Athletics";
    public string StoreDomain { get; set; } = "apex-store.myshopify.local";
    public string Currency { get; set; } = "USD";
    public string CurrencySymbol { get; set; } = "$";
    public string ContactEmail { get; set; } = "support@apexathletics.com";
    public string Theme { get; set; } = "theme_apex_dark";
}

public class DbProduct
{
    [Key]
    public string Id { get; set; } = string.Empty;

    public string StoreId { get; set; } = "store_apex";
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = "Apparel";
    public decimal Price { get; set; }
    public decimal? CompareAtPrice { get; set; }
    public string? Badge { get; set; }
    public string Image { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Inventory { get; set; } = 50;

    [Column(TypeName = "jsonb")]
    public string VariantsJson { get; set; } = "[]";
}

public class DbOrder
{
    [Key]
    public string Id { get; set; } = string.Empty;

    public string StoreId { get; set; } = "store_apex";
    public string OrderNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;

    [Column(TypeName = "jsonb")]
    public string ItemsJson { get; set; } = "[]";

    public decimal Total { get; set; }
    public string Status { get; set; } = "Paid";
    public string PaymentMethod { get; set; } = "UPI";
    public string? TrackingNumber { get; set; }
    public string? Carrier { get; set; }
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

public class DbCustomer
{
    [Key]
    public string Id { get; set; } = string.Empty;

    public string StoreId { get; set; } = "store_apex";
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public int OrdersCount { get; set; }
    public decimal TotalSpent { get; set; }
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

public class DbCategory
{
    [Key]
    public string Id { get; set; } = string.Empty;

    public string StoreId { get; set; } = "store_apex";
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
}

public class DbDiscount
{
    [Key]
    public string Id { get; set; } = string.Empty;

    public string StoreId { get; set; } = "store_apex";
    public string Code { get; set; } = string.Empty;
    public string Type { get; set; } = "percentage";
    public decimal Value { get; set; }
    public decimal MinSubtotal { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class DbReview
{
    [Key]
    public string Id { get; set; } = string.Empty;

    public string StoreId { get; set; } = "store_apex";
    public string ProductId { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public int Rating { get; set; } = 5;
    public string Title { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public bool VerifiedBuyer { get; set; } = true;
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

public class DbDeployment
{
    [Key]
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Project { get; set; } = string.Empty;
    public string Subdomain { get; set; } = string.Empty;
    public string LiveUrl { get; set; } = string.Empty;
    public string Status { get; set; } = "READY";
    public string Environment { get; set; } = "production";
    public bool IsDistZip { get; set; }

    [Column(TypeName = "jsonb")]
    public string? CommitJson { get; set; }

    public string Framework { get; set; } = "React 19";
    public string NodeVersion { get; set; } = "20.x";
    public string Region { get; set; } = "iad1 (Washington, D.C.)";
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
    public int BuildDurationMs { get; set; } = 840;
    public double BundleSizeKb { get; set; } = 0;

    [Column(TypeName = "jsonb")]
    public string EnvVarsJson { get; set; } = "{}";

    [Column(TypeName = "jsonb")]
    public string FilesJson { get; set; } = "{}";

    [Column(TypeName = "jsonb")]
    public string LogsJson { get; set; } = "[]";
}

public class ShopifyDbContext : DbContext
{
    public ShopifyDbContext(DbContextOptions<ShopifyDbContext> options) : base(options)
    {
    }

    public DbSet<DbStore> Stores => Set<DbStore>();
    public DbSet<DbStoreSetting> StoreSettings => Set<DbStoreSetting>();
    public DbSet<DbProduct> Products => Set<DbProduct>();
    public DbSet<DbOrder> Orders => Set<DbOrder>();
    public DbSet<DbCustomer> Customers => Set<DbCustomer>();
    public DbSet<DbCategory> Categories => Set<DbCategory>();
    public DbSet<DbDiscount> Discounts => Set<DbDiscount>();
    public DbSet<DbReview> Reviews => Set<DbReview>();
    public DbSet<DbDeployment> Deployments => Set<DbDeployment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<DbStore>().ToTable("stores");
        modelBuilder.Entity<DbStoreSetting>().ToTable("store_settings");
        modelBuilder.Entity<DbProduct>().ToTable("products");
        modelBuilder.Entity<DbOrder>().ToTable("orders");
        modelBuilder.Entity<DbCustomer>().ToTable("customers");
        modelBuilder.Entity<DbCategory>().ToTable("categories");
        modelBuilder.Entity<DbDiscount>().ToTable("discounts");
        modelBuilder.Entity<DbReview>().ToTable("reviews");
        modelBuilder.Entity<DbDeployment>().ToTable("deployments");

        // Indexes for multi-tenant query speed
        modelBuilder.Entity<DbProduct>().HasIndex(p => p.StoreId);
        modelBuilder.Entity<DbOrder>().HasIndex(o => o.StoreId);
        modelBuilder.Entity<DbCustomer>().HasIndex(c => c.StoreId);
        modelBuilder.Entity<DbCategory>().HasIndex(cat => cat.StoreId);
        modelBuilder.Entity<DbDiscount>().HasIndex(d => d.StoreId);
        modelBuilder.Entity<DbReview>().HasIndex(r => new { r.StoreId, r.ProductId });
    }
}
