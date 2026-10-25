using System.Text.Json.Serialization;

namespace ShopifyEngine.Api.Models;

public class TenantStore
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("slug")]
    public string Slug { get; set; } = string.Empty;

    [JsonPropertyName("subdomain")]
    public string Subdomain { get; set; } = string.Empty;

    [JsonPropertyName("customDomain")]
    public string? CustomDomain { get; set; }

    [JsonPropertyName("category")]
    public string Category { get; set; } = "General Merchandise";

    [JsonPropertyName("themeId")]
    public string ThemeId { get; set; } = "theme_apex_velocity";

    [JsonPropertyName("accentColor")]
    public string AccentColor { get; set; } = "#008060";

    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "USD";

    [JsonPropertyName("currencySymbol")]
    public string CurrencySymbol { get; set; } = "$";

    [JsonPropertyName("taxRate")]
    public decimal TaxRate { get; set; } = 0.08m;

    [JsonPropertyName("freeShippingThreshold")]
    public decimal FreeShippingThreshold { get; set; } = 75.00m;

    [JsonPropertyName("standardShippingRate")]
    public decimal StandardShippingRate { get; set; } = 6.99m;

    [JsonPropertyName("expressShippingRate")]
    public decimal ExpressShippingRate { get; set; } = 14.99m;

    [JsonPropertyName("contactEmail")]
    public string ContactEmail { get; set; } = "support@example.com";

    [JsonPropertyName("status")]
    public string Status { get; set; } = "active";

    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

public class StoreSettings
{
    [JsonPropertyName("storeName")]
    public string StoreName { get; set; } = "Apex Athletics";

    [JsonPropertyName("storeDomain")]
    public string StoreDomain { get; set; } = "apex-store.myshopify.local";

    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "USD";

    [JsonPropertyName("currencySymbol")]
    public string CurrencySymbol { get; set; } = "$";

    [JsonPropertyName("contactEmail")]
    public string ContactEmail { get; set; } = "support@apexathletics.com";

    [JsonPropertyName("theme")]
    public string Theme { get; set; } = "theme_apex_dark";
}

public class Product
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("storeId")]
    public string StoreId { get; set; } = "store_apex";

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string Category { get; set; } = "Apparel";

    [JsonPropertyName("price")]
    public decimal Price { get; set; }

    [JsonPropertyName("compareAtPrice")]
    public decimal? CompareAtPrice { get; set; }

    [JsonPropertyName("badge")]
    public string? Badge { get; set; }

    [JsonPropertyName("image")]
    public string Image { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("inventory")]
    public int Inventory { get; set; } = 50;

    [JsonPropertyName("variants")]
    public List<ProductVariant> Variants { get; set; } = new();
}

public class ProductVariant
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("price")]
    public decimal Price { get; set; }

    [JsonPropertyName("sku")]
    public string Sku { get; set; } = string.Empty;
}

public class CartItem
{
    [JsonPropertyName("product")]
    public Product? Product { get; set; }

    [JsonPropertyName("variant")]
    public ProductVariant? Variant { get; set; }

    [JsonPropertyName("quantity")]
    public int Quantity { get; set; } = 1;
}

public class Order
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("storeId")]
    public string StoreId { get; set; } = "store_apex";

    [JsonPropertyName("orderNumber")]
    public string OrderNumber { get; set; } = string.Empty;

    [JsonPropertyName("customerName")]
    public string CustomerName { get; set; } = string.Empty;

    [JsonPropertyName("customerEmail")]
    public string CustomerEmail { get; set; } = string.Empty;

    [JsonPropertyName("items")]
    public List<CartItem> Items { get; set; } = new();

    [JsonPropertyName("total")]
    public decimal Total { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "Paid";

    [JsonPropertyName("paymentMethod")]
    public string PaymentMethod { get; set; } = "UPI";

    [JsonPropertyName("trackingNumber")]
    public string? TrackingNumber { get; set; }

    [JsonPropertyName("carrier")]
    public string? Carrier { get; set; }

    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

public class Customer
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("storeId")]
    public string StoreId { get; set; } = "store_apex";

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("ordersCount")]
    public int OrdersCount { get; set; }

    [JsonPropertyName("totalSpent")]
    public decimal TotalSpent { get; set; }

    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

public class CategoryItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("storeId")]
    public string StoreId { get; set; } = "store_apex";

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("slug")]
    public string Slug { get; set; } = string.Empty;
}

public class Discount
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("storeId")]
    public string StoreId { get; set; } = "store_apex";

    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = "percentage"; // percentage | fixed | shipping

    [JsonPropertyName("value")]
    public decimal Value { get; set; }

    [JsonPropertyName("minSubtotal")]
    public decimal MinSubtotal { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;
}

public class ProductReview
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("storeId")]
    public string StoreId { get; set; } = "store_apex";

    [JsonPropertyName("productId")]
    public string ProductId { get; set; } = string.Empty;

    [JsonPropertyName("customerName")]
    public string CustomerName { get; set; } = string.Empty;

    [JsonPropertyName("rating")]
    public int Rating { get; set; } = 5;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("comment")]
    public string Comment { get; set; } = string.Empty;

    [JsonPropertyName("verifiedBuyer")]
    public bool VerifiedBuyer { get; set; } = true;

    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

public class ShopifyApiImportRequest
{
    [JsonPropertyName("shopifyDomain")]
    public string ShopifyDomain { get; set; } = string.Empty;

    [JsonPropertyName("accessToken")]
    public string AccessToken { get; set; } = string.Empty;

    [JsonPropertyName("storeId")]
    public string? StoreId { get; set; }

    [JsonPropertyName("mirrorImages")]
    public bool MirrorImages { get; set; } = true;

    [JsonPropertyName("importProducts")]
    public bool ImportProducts { get; set; } = true;

    [JsonPropertyName("importCustomers")]
    public bool ImportCustomers { get; set; } = true;
}

