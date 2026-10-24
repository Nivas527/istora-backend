using System.Text.Json.Serialization;

namespace ShopifyEngine.Api.Models;

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

    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}
