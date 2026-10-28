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

    [JsonPropertyName("location")]
    public string Location { get; set; } = "India";

    [JsonPropertyName("plan")]
    public string Plan { get; set; } = "monthly"; // monthly | yearly

    [JsonPropertyName("environment")]
    public string Environment { get; set; } = "production"; // testing | production

    [JsonPropertyName("adminToken")]
    public string? AdminToken { get; set; }

    [JsonPropertyName("publicToken")]
    public string? PublicToken { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "active";

    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");

    // Payment Gateway Settings
    [JsonPropertyName("razorpayEnabled")]
    public bool RazorpayEnabled { get; set; } = true;

    [JsonPropertyName("razorpayKeyId")]
    public string RazorpayKeyId { get; set; } = string.Empty;

    [JsonPropertyName("razorpayKeySecret")]
    public string RazorpayKeySecret { get; set; } = string.Empty;

    [JsonPropertyName("stripeEnabled")]
    public bool StripeEnabled { get; set; } = true;

    [JsonPropertyName("stripePublishableKey")]
    public string StripePublishableKey { get; set; } = string.Empty;

    [JsonPropertyName("stripeSecretKey")]
    public string StripeSecretKey { get; set; } = string.Empty;

    [JsonPropertyName("codEnabled")]
    public bool CodEnabled { get; set; } = true;

    // Media & Video Configurations
    [JsonPropertyName("bannerVideoUrl")]
    public string? BannerVideoUrl { get; set; }

    [JsonPropertyName("previewVideos")]
    public List<PreviewVideoItem> PreviewVideos { get; set; } = new();
}

public class PreviewVideoItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("videoUrl")]
    public string VideoUrl { get; set; } = string.Empty;

    [JsonPropertyName("thumbnailUrl")]
    public string? ThumbnailUrl { get; set; }

    [JsonPropertyName("productId")]
    public string? ProductId { get; set; }

    [JsonPropertyName("productTitle")]
    public string? ProductTitle { get; set; }

    [JsonPropertyName("durationSeconds")]
    public int? DurationSeconds { get; set; }

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

    [JsonPropertyName("previewVideoUrl")]
    public string? PreviewVideoUrl { get; set; }

    [JsonPropertyName("garmentSpec")]
    public GarmentSpec? GarmentSpec { get; set; }
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

// ==========================================
// PAYMENT GATEWAY MODELS (RAZORPAY & STRIPE)
// ==========================================
public class CreatePaymentOrderRequest
{
    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }

    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "INR";

    [JsonPropertyName("storeId")]
    public string? StoreId { get; set; }

    [JsonPropertyName("receipt")]
    public string? Receipt { get; set; }

    [JsonPropertyName("customerName")]
    public string? CustomerName { get; set; }

    [JsonPropertyName("customerEmail")]
    public string? CustomerEmail { get; set; }
}

public class RazorpayOrderResponse
{
    [JsonPropertyName("orderId")]
    public string OrderId { get; set; } = string.Empty;

    [JsonPropertyName("amount")]
    public long Amount { get; set; }

    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "INR";

    [JsonPropertyName("keyId")]
    public string KeyId { get; set; } = string.Empty;

    [JsonPropertyName("isSimulated")]
    public bool IsSimulated { get; set; }
}

public class RazorpayVerificationRequest
{
    [JsonPropertyName("razorpay_order_id")]
    public string RazorpayOrderId { get; set; } = string.Empty;

    [JsonPropertyName("razorpay_payment_id")]
    public string RazorpayPaymentId { get; set; } = string.Empty;

    [JsonPropertyName("razorpay_signature")]
    public string RazorpaySignature { get; set; } = string.Empty;

    [JsonPropertyName("storeId")]
    public string? StoreId { get; set; }

    [JsonPropertyName("order")]
    public Order? Order { get; set; }
}

public class StripeIntentResponse
{
    [JsonPropertyName("clientSecret")]
    public string ClientSecret { get; set; } = string.Empty;

    [JsonPropertyName("paymentIntentId")]
    public string PaymentIntentId { get; set; } = string.Empty;

    [JsonPropertyName("publishableKey")]
    public string PublishableKey { get; set; } = string.Empty;

    [JsonPropertyName("amount")]
    public long Amount { get; set; }

    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "USD";

    [JsonPropertyName("isSimulated")]
    public bool IsSimulated { get; set; }
}

public class StripeVerificationRequest
{
    [JsonPropertyName("paymentIntentId")]
    public string PaymentIntentId { get; set; } = string.Empty;

    [JsonPropertyName("storeId")]
    public string? StoreId { get; set; }

    [JsonPropertyName("order")]
    public Order? Order { get; set; }
}

public class CodOrderRequest
{
    [JsonPropertyName("storeId")]
    public string? StoreId { get; set; }

    [JsonPropertyName("order")]
    public Order? Order { get; set; }
}

public class PaymentVerificationResult
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("orderId")]
    public string OrderId { get; set; } = string.Empty;

    [JsonPropertyName("orderNumber")]
    public string OrderNumber { get; set; } = string.Empty;

    [JsonPropertyName("paymentMethod")]
    public string PaymentMethod { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = "Paid";

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}

public class PaymentGatewayConfigResponse
{
    [JsonPropertyName("storeId")]
    public string StoreId { get; set; } = string.Empty;

    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "USD";

    [JsonPropertyName("currencySymbol")]
    public string CurrencySymbol { get; set; } = "$";

    [JsonPropertyName("razorpay")]
    public RazorpayConfigDto Razorpay { get; set; } = new();

    [JsonPropertyName("stripe")]
    public StripeConfigDto Stripe { get; set; } = new();

    [JsonPropertyName("cod")]
    public CodConfigDto Cod { get; set; } = new();
}

public class RazorpayConfigDto
{
    [JsonPropertyName("enabled")]
    public bool Enabled { get; set; } = true;

    [JsonPropertyName("keyId")]
    public string KeyId { get; set; } = string.Empty;

    [JsonPropertyName("isTestMode")]
    public bool IsTestMode { get; set; } = true;
}

public class StripeConfigDto
{
    [JsonPropertyName("enabled")]
    public bool Enabled { get; set; } = true;

    [JsonPropertyName("publishableKey")]
    public string PublishableKey { get; set; } = string.Empty;

    [JsonPropertyName("isTestMode")]
    public bool IsTestMode { get; set; } = true;
}

public class CodConfigDto
{
    [JsonPropertyName("enabled")]
    public bool Enabled { get; set; } = true;
}

// ==========================================
// STOREFRONT BOOTSTRAP DTOs
// ==========================================
public class StorefrontBootstrapResponse
{
    [JsonPropertyName("store")]
    public StoreMetadataDto Store { get; set; } = new();

    [JsonPropertyName("theme")]
    public ThemeTokensDto Theme { get; set; } = new();

    [JsonPropertyName("categories")]
    public List<CategoryItem> Categories { get; set; } = new();

    [JsonPropertyName("featuredProducts")]
    public List<Product> FeaturedProducts { get; set; } = new();

    [JsonPropertyName("serverTime")]
    public DateTime ServerTime { get; set; } = DateTime.UtcNow;
}

public class StoreMetadataDto
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
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "USD";

    [JsonPropertyName("currencySymbol")]
    public string CurrencySymbol { get; set; } = "$";

    [JsonPropertyName("taxRate")]
    public decimal TaxRate { get; set; }

    [JsonPropertyName("freeShippingThreshold")]
    public decimal FreeShippingThreshold { get; set; }

    [JsonPropertyName("standardShippingRate")]
    public decimal StandardShippingRate { get; set; }

    [JsonPropertyName("expressShippingRate")]
    public decimal ExpressShippingRate { get; set; }

    [JsonPropertyName("contactEmail")]
    public string ContactEmail { get; set; } = string.Empty;

    [JsonPropertyName("location")]
    public string Location { get; set; } = "United States";

    [JsonPropertyName("bannerVideoUrl")]
    public string? BannerVideoUrl { get; set; }

    [JsonPropertyName("previewVideos")]
    public List<PreviewVideoItem> PreviewVideos { get; set; } = new();
}

public class ThemeTokensDto
{
    [JsonPropertyName("themeId")]
    public string ThemeId { get; set; } = "theme_modern";

    [JsonPropertyName("accentColor")]
    public string AccentColor { get; set; } = "#008060";

    [JsonPropertyName("fontFamily")]
    public string FontFamily { get; set; } = "Inter, sans-serif";

    [JsonPropertyName("logoUrl")]
    public string? LogoUrl { get; set; }

    [JsonPropertyName("bannerUrl")]
    public string? BannerUrl { get; set; }

    [JsonPropertyName("bannerVideoUrl")]
    public string? BannerVideoUrl { get; set; }
}

// ==========================================
// BATCH STOCK DTOs
// ==========================================
public class StockItemDto
{
    [JsonPropertyName("productId")]
    public string ProductId { get; set; } = string.Empty;

    [JsonPropertyName("inStock")]
    public bool InStock { get; set; }

    [JsonPropertyName("inventoryQuantity")]
    public int InventoryQuantity { get; set; }

    [JsonPropertyName("isLowStock")]
    public bool IsLowStock { get; set; }
}

// ==========================================
// SERVER-SIDE ORDER & CHECKOUT VALIDATION DTOs
// ==========================================
public class ValidateOrderRequest
{
    [JsonPropertyName("items")]
    public List<ValidateOrderItemDto> Items { get; set; } = new();

    [JsonPropertyName("discountCode")]
    public string? DiscountCode { get; set; }

    [JsonPropertyName("shippingMethod")]
    public string ShippingMethod { get; set; } = "standard"; // standard | express
}

public class ValidateOrderItemDto
{
    [JsonPropertyName("productId")]
    public string ProductId { get; set; } = string.Empty;

    [JsonPropertyName("variantId")]
    public string? VariantId { get; set; }

    [JsonPropertyName("quantity")]
    public int Quantity { get; set; } = 1;
}

public class ValidatedOrderResponse
{
    [JsonPropertyName("isValid")]
    public bool IsValid { get; set; } = true;

    [JsonPropertyName("errors")]
    public List<string> Errors { get; set; } = new();

    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "USD";

    [JsonPropertyName("currencySymbol")]
    public string CurrencySymbol { get; set; } = "$";

    [JsonPropertyName("items")]
    public List<ValidatedLineItemDto> Items { get; set; } = new();

    [JsonPropertyName("subtotal")]
    public decimal Subtotal { get; set; }

    [JsonPropertyName("discountAmount")]
    public decimal DiscountAmount { get; set; }

    [JsonPropertyName("discountCode")]
    public string? DiscountCode { get; set; }

    [JsonPropertyName("discountDescription")]
    public string? DiscountDescription { get; set; }

    [JsonPropertyName("taxAmount")]
    public decimal TaxAmount { get; set; }

    [JsonPropertyName("taxRate")]
    public decimal TaxRate { get; set; }

    [JsonPropertyName("shippingAmount")]
    public decimal ShippingAmount { get; set; }

    [JsonPropertyName("shippingMethod")]
    public string ShippingMethod { get; set; } = "standard";

    [JsonPropertyName("total")]
    public decimal Total { get; set; }

    [JsonPropertyName("verifiedAt")]
    public DateTime VerifiedAt { get; set; } = DateTime.UtcNow;
}

public class ValidatedLineItemDto
{
    [JsonPropertyName("productId")]
    public string ProductId { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("variantId")]
    public string? VariantId { get; set; }

    [JsonPropertyName("variantName")]
    public string? VariantName { get; set; }

    [JsonPropertyName("quantity")]
    public int Quantity { get; set; }

    [JsonPropertyName("unitPrice")]
    public decimal UnitPrice { get; set; }

    [JsonPropertyName("lineTotal")]
    public decimal LineTotal { get; set; }

    [JsonPropertyName("image")]
    public string Image { get; set; } = string.Empty;

    [JsonPropertyName("inStock")]
    public bool InStock { get; set; }
}

// ==========================================
// MERCHANT AUTH DTOs
// ==========================================
public class MerchantLoginRequest
{
    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("password")]
    public string? Password { get; set; }

    [JsonPropertyName("token")]
    public string? Token { get; set; }

    [JsonPropertyName("storeId")]
    public string? StoreId { get; set; }
}

public class MerchantAuthResponse
{
    [JsonPropertyName("authenticated")]
    public bool Authenticated { get; set; }

    [JsonPropertyName("storeId")]
    public string StoreId { get; set; } = string.Empty;

    [JsonPropertyName("storeName")]
    public string StoreName { get; set; } = string.Empty;

    [JsonPropertyName("token")]
    public string Token { get; set; } = string.Empty;

    [JsonPropertyName("role")]
    public string Role { get; set; } = "MerchantAdmin";

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;
}

