using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ShopifyEngine.Api.Models;

namespace ShopifyEngine.Api.Data;

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
    public string OrderNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;

    [Column(TypeName = "jsonb")]
    public string ItemsJson { get; set; } = "[]";

    public decimal Total { get; set; }
    public string Status { get; set; } = "Paid";
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

    public DbSet<DbStoreSetting> StoreSettings => Set<DbStoreSetting>();
    public DbSet<DbProduct> Products => Set<DbProduct>();
    public DbSet<DbOrder> Orders => Set<DbOrder>();
    public DbSet<DbDeployment> Deployments => Set<DbDeployment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<DbStoreSetting>().ToTable("store_settings");
        modelBuilder.Entity<DbProduct>().ToTable("products");
        modelBuilder.Entity<DbOrder>().ToTable("orders");
        modelBuilder.Entity<DbDeployment>().ToTable("deployments");
    }
}
