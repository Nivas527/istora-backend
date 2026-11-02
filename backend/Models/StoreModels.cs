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

    // GST Invoicing & Indian Tax Compliance
    [JsonPropertyName("gstEnabled")]
    public bool GstEnabled { get; set; } = true;

    [JsonPropertyName("gstin")]
    public string Gstin { get; set; } = "29AABCU9603R1ZM";

    [JsonPropertyName("legalBusinessName")]
    public string LegalBusinessName { get; set; } = "Apex Commerce India Pvt. Ltd.";

    [JsonPropertyName("stateCode")]
    public string StateCode { get; set; } = "29";

    [JsonPropertyName("stateName")]
    public string StateName { get; set; } = "Karnataka";

    [JsonPropertyName("defaultHsnCode")]
    public string DefaultHsnCode { get; set; } = "6109";

    [JsonPropertyName("gstRatePercent")]
    public decimal GstRatePercent { get; set; } = 18m;

    [JsonPropertyName("pricesIncludeGst")]
    public bool PricesIncludeGst { get; set; } = false;

    [JsonPropertyName("invoicePrefix")]
    public string InvoicePrefix { get; set; } = "INV-2026/";
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

    // GST Tax Invoicing Fields
    [JsonPropertyName("invoiceNumber")]
    public string? InvoiceNumber { get; set; }

    [JsonPropertyName("isB2B")]
    public bool IsB2B { get; set; }

    [JsonPropertyName("customerGstin")]
    public string? CustomerGstin { get; set; }

    [JsonPropertyName("customerCompanyName")]
    public string? CustomerCompanyName { get; set; }

    [JsonPropertyName("buyerStateCode")]
    public string? BuyerStateCode { get; set; }

    [JsonPropertyName("taxableAmount")]
    public decimal TaxableAmount { get; set; }

    [JsonPropertyName("cgstAmount")]
    public decimal CgstAmount { get; set; }

    [JsonPropertyName("sgstAmount")]
    public decimal SgstAmount { get; set; }

    [JsonPropertyName("igstAmount")]
    public decimal IgstAmount { get; set; }

    [JsonPropertyName("totalGst")]
    public decimal TotalGst { get; set; }

    // Shipping Aggregator (Shiprocket / Delhivery)
    [JsonPropertyName("courierAggregator")]
    public string? CourierAggregator { get; set; }

    [JsonPropertyName("awbNumber")]
    public string? AwbNumber { get; set; }

    [JsonPropertyName("routingCode")]
    public string? RoutingCode { get; set; }

    [JsonPropertyName("shippingLabel")]
    public ShippingLabelDto? ShippingLabel { get; set; }

    [JsonPropertyName("shipmentTimeline")]
    public List<ShipmentScanEventDto> ShipmentTimeline { get; set; } = new();
}

public class GenerateAwbRequest
{
    [JsonPropertyName("orderId")]
    public string OrderId { get; set; } = string.Empty;

    [JsonPropertyName("aggregator")]
    public string Aggregator { get; set; } = "delhivery"; // "delhivery" | "shiprocket"

    [JsonPropertyName("carrierName")]
    public string? CarrierName { get; set; } // "Delhivery Surface Express" | "Blue Dart Air" | "DTDC Express"

    [JsonPropertyName("weightKg")]
    public decimal WeightKg { get; set; } = 0.50m;

    [JsonPropertyName("lengthCm")]
    public decimal LengthCm { get; set; } = 20m;

    [JsonPropertyName("widthCm")]
    public decimal WidthCm { get; set; } = 15m;

    [JsonPropertyName("heightCm")]
    public decimal HeightCm { get; set; } = 8m;
}

public class ShippingLabelDto
{
    [JsonPropertyName("awbNumber")]
    public string AwbNumber { get; set; } = string.Empty;

    [JsonPropertyName("barcodeSvg")]
    public string? BarcodeSvg { get; set; }

    [JsonPropertyName("orderNumber")]
    public string OrderNumber { get; set; } = string.Empty;

    [JsonPropertyName("orderId")]
    public string OrderId { get; set; } = string.Empty;

    [JsonPropertyName("aggregator")]
    public string Aggregator { get; set; } = "Delhivery";

    [JsonPropertyName("courierCarrier")]
    public string CourierCarrier { get; set; } = "Delhivery Surface Express";

    [JsonPropertyName("routingCode")]
    public string RoutingCode { get; set; } = "BLR/HUB-01";

    [JsonPropertyName("paymentMode")]
    public string PaymentMode { get; set; } = "PREPAID";

    [JsonPropertyName("collectableAmount")]
    public decimal CollectableAmount { get; set; } = 0m;

    [JsonPropertyName("weightKg")]
    public decimal WeightKg { get; set; } = 0.50m;

    [JsonPropertyName("dimensions")]
    public string Dimensions { get; set; } = "20x15x8 cm";

    [JsonPropertyName("sellerName")]
    public string SellerName { get; set; } = "Apex Commerce India Pvt. Ltd.";

    [JsonPropertyName("sellerAddress")]
    public string SellerAddress { get; set; } = "Plot 42, Electronics City Phase 1, Hosur Road";

    [JsonPropertyName("sellerCity")]
    public string SellerCity { get; set; } = "Bangalore";

    [JsonPropertyName("sellerState")]
    public string SellerState { get; set; } = "Karnataka (29)";

    [JsonPropertyName("sellerPincode")]
    public string SellerPincode { get; set; } = "560100";

    [JsonPropertyName("sellerGstin")]
    public string SellerGstin { get; set; } = "29AABCU9603R1ZM";

    [JsonPropertyName("consigneeName")]
    public string ConsigneeName { get; set; } = string.Empty;

    [JsonPropertyName("consigneeAddress")]
    public string ConsigneeAddress { get; set; } = string.Empty;

    [JsonPropertyName("consigneeCity")]
    public string ConsigneeCity { get; set; } = string.Empty;

    [JsonPropertyName("consigneeState")]
    public string ConsigneeState { get; set; } = string.Empty;

    [JsonPropertyName("consigneePincode")]
    public string ConsigneePincode { get; set; } = string.Empty;

    [JsonPropertyName("consigneePhone")]
    public string ConsigneePhone { get; set; } = string.Empty;

    [JsonPropertyName("items")]
    public List<CartItem> Items { get; set; } = new();

    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

public class ShipmentScanEventDto
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = "in_transit"; // pickup_scheduled | in_transit | out_for_delivery | delivered

    [JsonPropertyName("statusTitle")]
    public string StatusTitle { get; set; } = "In Transit";

    [JsonPropertyName("location")]
    public string Location { get; set; } = "Bangalore Sorting Hub";

    [JsonPropertyName("timestamp")]
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("o");

    [JsonPropertyName("remarks")]
    public string Remarks { get; set; } = "Package sorted at regional transit hub";

    [JsonPropertyName("carrier")]
    public string Carrier { get; set; } = "Delhivery";
}

public class CarrierWebhookPayload
{
    [JsonPropertyName("awb")]
    public string Awb { get; set; } = string.Empty;

    [JsonPropertyName("orderNumber")]
    public string? OrderNumber { get; set; }

    [JsonPropertyName("currentStatus")]
    public string CurrentStatus { get; set; } = "in_transit"; // pickup_scheduled | in_transit | out_for_delivery | delivered

    [JsonPropertyName("location")]
    public string Location { get; set; } = "Bangalore Central Hub";

    [JsonPropertyName("timestamp")]
    public string? Timestamp { get; set; }

    [JsonPropertyName("remarks")]
    public string? Remarks { get; set; }

    [JsonPropertyName("carrier")]
    public string? Carrier { get; set; }
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

    [JsonPropertyName("avatar")]
    public string? Avatar { get; set; }

    [JsonPropertyName("authProvider")]
    public string AuthProvider { get; set; } = "email";

    [JsonPropertyName("ordersCount")]
    public int OrdersCount { get; set; }

    [JsonPropertyName("totalSpent")]
    public decimal TotalSpent { get; set; }

    [JsonPropertyName("addresses")]
    public List<SavedAddress> Addresses { get; set; } = new();

    [JsonPropertyName("wishlist")]
    public List<WishlistItem> Wishlist { get; set; } = new();

    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

public class WishlistItem
{
    [JsonPropertyName("productId")]
    public string ProductId { get; set; } = string.Empty;

    [JsonPropertyName("variantId")]
    public string? VariantId { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("price")]
    public decimal Price { get; set; }

    [JsonPropertyName("priceWhenAdded")]
    public decimal PriceWhenAdded { get; set; }

    [JsonPropertyName("compareAtPrice")]
    public decimal? CompareAtPrice { get; set; }

    [JsonPropertyName("image")]
    public string? Image { get; set; }

    [JsonPropertyName("variantTitle")]
    public string? VariantTitle { get; set; }

    [JsonPropertyName("inStock")]
    public bool InStock { get; set; } = true;

    [JsonPropertyName("stockQuantity")]
    public int StockQuantity { get; set; } = 10;

    [JsonPropertyName("addedAt")]
    public string AddedAt { get; set; } = DateTime.UtcNow.ToString("o");

    [JsonPropertyName("notifyPriceDrop")]
    public bool NotifyPriceDrop { get; set; } = true;

    [JsonPropertyName("notifyRestock")]
    public bool NotifyRestock { get; set; } = true;
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
    public string Type { get; set; } = "percentage"; // percentage | fixed | shipping | bogo | threshold

    [JsonPropertyName("value")]
    public decimal Value { get; set; }

    [JsonPropertyName("minSubtotal")]
    public decimal MinSubtotal { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("ruleType")]
    public string RuleType { get; set; } = "percentage"; // percentage | fixed | shipping | bogo | threshold | volume_tier

    [JsonPropertyName("isAutoApplied")]
    public bool IsAutoApplied { get; set; } = false;

    [JsonPropertyName("buyQuantity")]
    public int? BuyQuantity { get; set; }

    [JsonPropertyName("getQuantity")]
    public int? GetQuantity { get; set; }

    [JsonPropertyName("getDiscountPercent")]
    public decimal? GetDiscountPercent { get; set; } = 100m;

    [JsonPropertyName("applicableCategory")]
    public string? ApplicableCategory { get; set; } = "all";

    [JsonPropertyName("applicableProductId")]
    public string? ApplicableProductId { get; set; }

    [JsonPropertyName("tierPricingJson")]
    public string? TierPricingJson { get; set; } = "[]";

    [JsonPropertyName("usageCount")]
    public int UsageCount { get; set; } = 0;

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;

    [JsonPropertyName("startsAt")]
    public string? StartsAt { get; set; }

    [JsonPropertyName("endsAt")]
    public string? EndsAt { get; set; }
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

    [JsonPropertyName("customerEmail")]
    public string CustomerEmail { get; set; } = string.Empty;

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

    [JsonPropertyName("mediaUrls")]
    public List<ReviewMediaItem> MediaUrls { get; set; } = new();

    [JsonPropertyName("helpfulVotes")]
    public int HelpfulVotes { get; set; } = 0;

    [JsonPropertyName("merchantReply")]
    public string? MerchantReply { get; set; }

    [JsonPropertyName("merchantReplyAt")]
    public string? MerchantReplyAt { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "published";

    [JsonPropertyName("customerFitRating")]
    public string CustomerFitRating { get; set; } = "true_to_size";
}

public class ReviewMediaItem
{
    [JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = "image"; // image | video

    [JsonPropertyName("thumbnail")]
    public string? Thumbnail { get; set; }

    [JsonPropertyName("caption")]
    public string? Caption { get; set; }
}

public class ReviewsSummaryResponse
{
    [JsonPropertyName("productId")]
    public string ProductId { get; set; } = string.Empty;

    [JsonPropertyName("averageRating")]
    public double AverageRating { get; set; } = 5.0;

    [JsonPropertyName("totalReviews")]
    public int TotalReviews { get; set; } = 0;

    [JsonPropertyName("ratingCounts")]
    public Dictionary<int, int> RatingCounts { get; set; } = new();

    [JsonPropertyName("ratingPercentages")]
    public Dictionary<int, double> RatingPercentages { get; set; } = new();

    [JsonPropertyName("fitFeedback")]
    public FitFeedbackSummary FitFeedback { get; set; } = new();

    [JsonPropertyName("mediaCount")]
    public int MediaCount { get; set; } = 0;

    [JsonPropertyName("reviews")]
    public List<ProductReview> Reviews { get; set; } = new();
}

public class FitFeedbackSummary
{
    [JsonPropertyName("trueToSizePercent")]
    public int TrueToSizePercent { get; set; } = 85;

    [JsonPropertyName("runsSmallPercent")]
    public int RunsSmallPercent { get; set; } = 10;

    [JsonPropertyName("runsLargePercent")]
    public int RunsLargePercent { get; set; } = 5;
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

    // GST Invoicing & Indian Tax Compliance
    [JsonPropertyName("gstEnabled")]
    public bool GstEnabled { get; set; } = true;

    [JsonPropertyName("gstin")]
    public string Gstin { get; set; } = "29AABCU9603R1ZM";

    [JsonPropertyName("legalBusinessName")]
    public string LegalBusinessName { get; set; } = "Apex Commerce India Pvt. Ltd.";

    [JsonPropertyName("stateCode")]
    public string StateCode { get; set; } = "29";

    [JsonPropertyName("stateName")]
    public string StateName { get; set; } = "Karnataka";

    [JsonPropertyName("defaultHsnCode")]
    public string DefaultHsnCode { get; set; } = "6109";

    [JsonPropertyName("gstRatePercent")]
    public decimal GstRatePercent { get; set; } = 18m;

    [JsonPropertyName("pricesIncludeGst")]
    public bool PricesIncludeGst { get; set; } = false;

    [JsonPropertyName("invoicePrefix")]
    public string InvoicePrefix { get; set; } = "INV-2026/";
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

    [JsonPropertyName("isAutoApplied")]
    public bool IsAutoApplied { get; set; } = false;

    [JsonPropertyName("ruleType")]
    public string RuleType { get; set; } = "percentage";

    [JsonPropertyName("volumeSavings")]
    public decimal VolumeSavings { get; set; } = 0m;

    [JsonPropertyName("bogoSavings")]
    public decimal BogoSavings { get; set; } = 0m;

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

// ==========================================
// CUSTOMER & SHOPPER PORTAL DTOs
// ==========================================
public class SavedAddress
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("label")]
    public string Label { get; set; } = "Home"; // Home | Office | Other

    [JsonPropertyName("firstName")]
    public string FirstName { get; set; } = string.Empty;

    [JsonPropertyName("lastName")]
    public string LastName { get; set; } = string.Empty;

    [JsonPropertyName("address")]
    public string Address { get; set; } = string.Empty;

    [JsonPropertyName("city")]
    public string City { get; set; } = string.Empty;

    [JsonPropertyName("state")]
    public string State { get; set; } = string.Empty;

    [JsonPropertyName("zip")]
    public string Zip { get; set; } = string.Empty;

    [JsonPropertyName("phone")]
    public string Phone { get; set; } = string.Empty;

    [JsonPropertyName("isDefault")]
    public bool IsDefault { get; set; } = false;
}

public class CustomerProfile
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

    [JsonPropertyName("avatar")]
    public string? Avatar { get; set; }

    [JsonPropertyName("authProvider")]
    public string AuthProvider { get; set; } = "email"; // email | google | otp

    [JsonPropertyName("ordersCount")]
    public int OrdersCount { get; set; }

    [JsonPropertyName("totalSpent")]
    public decimal TotalSpent { get; set; }

    [JsonPropertyName("addresses")]
    public List<SavedAddress> Addresses { get; set; } = new();

    [JsonPropertyName("wishlist")]
    public List<WishlistItem> Wishlist { get; set; } = new();

    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

public class CustomerRegisterRequest
{
    [JsonPropertyName("storeId")]
    public string? StoreId { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("password")]
    public string Password { get; set; } = string.Empty;

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }
}

public class CustomerLoginRequest
{
    [JsonPropertyName("storeId")]
    public string? StoreId { get; set; }

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("password")]
    public string Password { get; set; } = string.Empty;
}

public class CustomerOtpRequest
{
    [JsonPropertyName("storeId")]
    public string? StoreId { get; set; }

    [JsonPropertyName("phone")]
    public string Phone { get; set; } = string.Empty;

    [JsonPropertyName("channel")]
    public string Channel { get; set; } = "sms"; // sms | whatsapp
}

public class CustomerOtpVerifyRequest
{
    [JsonPropertyName("storeId")]
    public string? StoreId { get; set; }

    [JsonPropertyName("phone")]
    public string Phone { get; set; } = string.Empty;

    [JsonPropertyName("otp")]
    public string Otp { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string? Name { get; set; }
}

public class CustomerGoogleAuthRequest
{
    [JsonPropertyName("storeId")]
    public string? StoreId { get; set; }

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("avatar")]
    public string? Avatar { get; set; }

    [JsonPropertyName("googleId")]
    public string? GoogleId { get; set; }
}

public class CustomerAuthResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; } = true;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("token")]
    public string Token { get; set; } = string.Empty;

    [JsonPropertyName("customer")]
    public CustomerProfile? Customer { get; set; }
}

// ==========================================
// AUTOMATED NOTIFICATIONS DTOs
// ==========================================
public class NotificationSettings
{
    [JsonPropertyName("storeId")]
    public string StoreId { get; set; } = "store_apex";

    [JsonPropertyName("emailProvider")]
    public string EmailProvider { get; set; } = "resend"; // resend | sendgrid | ses | simulation

    [JsonPropertyName("emailApiKey")]
    public string EmailApiKey { get; set; } = "re_live_sec_istora_2026";

    [JsonPropertyName("senderEmail")]
    public string SenderEmail { get; set; } = "orders@istora.online";

    [JsonPropertyName("senderName")]
    public string SenderName { get; set; } = "Apex Athletics";

    [JsonPropertyName("whatsAppProvider")]
    public string WhatsAppProvider { get; set; } = "twilio"; // twilio | gupshup | simulation

    [JsonPropertyName("whatsAppApiKey")]
    public string WhatsAppApiKey { get; set; } = "tw_sec_istora_wa_2026";

    [JsonPropertyName("whatsAppSenderNumber")]
    public string WhatsAppSenderNumber { get; set; } = "+14155238886";

    [JsonPropertyName("merchantAlertEmail")]
    public string MerchantAlertEmail { get; set; } = "owner@istora.online";

    [JsonPropertyName("lowStockThreshold")]
    public int LowStockThreshold { get; set; } = 5;

    [JsonPropertyName("orderConfirmationEmail")]
    public bool OrderConfirmationEmail { get; set; } = true;

    [JsonPropertyName("orderConfirmationWhatsApp")]
    public bool OrderConfirmationWhatsApp { get; set; } = true;

    [JsonPropertyName("dispatchEmail")]
    public bool DispatchEmail { get; set; } = true;

    [JsonPropertyName("dispatchWhatsApp")]
    public bool DispatchWhatsApp { get; set; } = true;

    [JsonPropertyName("merchantNewOrderAlert")]
    public bool MerchantNewOrderAlert { get; set; } = true;

    [JsonPropertyName("merchantLowStockAlert")]
    public bool MerchantLowStockAlert { get; set; } = true;

    [JsonPropertyName("attachGstInvoicePdf")]
    public bool AttachGstInvoicePdf { get; set; } = true;
}

public class NotificationLog
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("storeId")]
    public string StoreId { get; set; } = "store_apex";

    [JsonPropertyName("channel")]
    public string Channel { get; set; } = "email"; // email | whatsapp | sms

    [JsonPropertyName("type")]
    public string Type { get; set; } = "order_confirmation"; // order_confirmation | order_dispatched | merchant_new_order | merchant_low_stock

    [JsonPropertyName("recipient")]
    public string Recipient { get; set; } = string.Empty;

    [JsonPropertyName("subject")]
    public string Subject { get; set; } = string.Empty;

    [JsonPropertyName("snippet")]
    public string Snippet { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = "delivered"; // delivered | sent | simulated

    [JsonPropertyName("hasAttachment")]
    public bool HasAttachment { get; set; } = false;

    [JsonPropertyName("attachmentName")]
    public string? AttachmentName { get; set; }

    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}

public class NotificationTestRequest
{
    [JsonPropertyName("storeId")]
    public string? StoreId { get; set; }

    [JsonPropertyName("channel")]
    public string Channel { get; set; } = "email"; // email | whatsapp

    [JsonPropertyName("type")]
    public string Type { get; set; } = "order_confirmation"; // order_confirmation | order_dispatched | merchant_new_order | merchant_low_stock

    [JsonPropertyName("recipient")]
    public string Recipient { get; set; } = string.Empty;
}

public class NotificationTestResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; } = true;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("channel")]
    public string Channel { get; set; } = "email";

    [JsonPropertyName("recipient")]
    public string Recipient { get; set; } = string.Empty;

    [JsonPropertyName("log")]
    public NotificationLog? Log { get; set; }
}

public class OrderFulfillRequest
{
    [JsonPropertyName("storeId")]
    public string? StoreId { get; set; }

    [JsonPropertyName("trackingNumber")]
    public string? TrackingNumber { get; set; }

    [JsonPropertyName("carrier")]
    public string Carrier { get; set; } = "Blue Dart / Delhivery Express";

    [JsonPropertyName("trackingUrl")]
    public string? TrackingUrl { get; set; }

    [JsonPropertyName("notifyCustomer")]
    public bool NotifyCustomer { get; set; } = true;
}

// =========================================================================
// 10. ABANDONED CART RECOVERY ENGINE MODELS
// =========================================================================
public class AbandonedCart
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("storeId")]
    public string StoreId { get; set; } = "store_apex";

    [JsonPropertyName("customerEmail")]
    public string CustomerEmail { get; set; } = string.Empty;

    [JsonPropertyName("customerPhone")]
    public string CustomerPhone { get; set; } = string.Empty;

    [JsonPropertyName("customerName")]
    public string CustomerName { get; set; } = string.Empty;

    [JsonPropertyName("cartItems")]
    public List<CartItem> CartItems { get; set; } = new();

    [JsonPropertyName("totalValue")]
    public decimal TotalValue { get; set; }

    [JsonPropertyName("checkoutStep")]
    public string CheckoutStep { get; set; } = "customer_info"; // customer_info | shipping | payment

    [JsonPropertyName("recoveryToken")]
    public string RecoveryToken { get; set; } = string.Empty;

    [JsonPropertyName("recoveryUrl")]
    public string RecoveryUrl { get; set; } = string.Empty;

    [JsonPropertyName("recoveryStatus")]
    public string RecoveryStatus { get; set; } = "abandoned"; // abandoned | recovering | recovered | expired

    [JsonPropertyName("emailSequenceStep")]
    public int EmailSequenceStep { get; set; } = 0; // 0 = none, 1 = 1hr, 2 = 24hr

    [JsonPropertyName("discountCode")]
    public string? DiscountCode { get; set; } = "SAVE5";

    [JsonPropertyName("discountPercent")]
    public decimal DiscountPercent { get; set; } = 5m;

    [JsonPropertyName("lastEmailSentAt")]
    public string? LastEmailSentAt { get; set; }

    [JsonPropertyName("recoveredAt")]
    public string? RecoveredAt { get; set; }

    [JsonPropertyName("recoveredOrderId")]
    public string? RecoveredOrderId { get; set; }

    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = string.Empty;

    [JsonPropertyName("updatedAt")]
    public string UpdatedAt { get; set; } = string.Empty;
}

public class CaptureCartRequest
{
    [JsonPropertyName("storeId")]
    public string? StoreId { get; set; }

    [JsonPropertyName("customerEmail")]
    public string CustomerEmail { get; set; } = string.Empty;

    [JsonPropertyName("customerPhone")]
    public string? CustomerPhone { get; set; }

    [JsonPropertyName("customerName")]
    public string? CustomerName { get; set; }

    [JsonPropertyName("cartItems")]
    public List<CartItem> CartItems { get; set; } = new();

    [JsonPropertyName("totalValue")]
    public decimal TotalValue { get; set; }

    [JsonPropertyName("checkoutStep")]
    public string CheckoutStep { get; set; } = "customer_info";

    [JsonPropertyName("existingToken")]
    public string? ExistingToken { get; set; }
}

public class CaptureCartResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; } = true;

    [JsonPropertyName("cartId")]
    public string CartId { get; set; } = string.Empty;

    [JsonPropertyName("recoveryToken")]
    public string RecoveryToken { get; set; } = string.Empty;

    [JsonPropertyName("recoveryUrl")]
    public string RecoveryUrl { get; set; } = string.Empty;
}

public class SendRecoveryNotificationRequest
{
    [JsonPropertyName("storeId")]
    public string? StoreId { get; set; }

    [JsonPropertyName("cartId")]
    public string CartId { get; set; } = string.Empty;

    [JsonPropertyName("channel")]
    public string Channel { get; set; } = "email"; // email | whatsapp

    [JsonPropertyName("customDiscountCode")]
    public string? CustomDiscountCode { get; set; }

    [JsonPropertyName("customDiscountPercent")]
    public decimal? CustomDiscountPercent { get; set; }
}

public class AbandonedCartAnalytics
{
    [JsonPropertyName("totalLostRevenue")]
    public decimal TotalLostRevenue { get; set; }

    [JsonPropertyName("totalRecoveredRevenue")]
    public decimal TotalRecoveredRevenue { get; set; }

    [JsonPropertyName("totalAbandonedCarts")]
    public int TotalAbandonedCarts { get; set; }

    [JsonPropertyName("totalRecoveredCarts")]
    public int TotalRecoveredCarts { get; set; }

    [JsonPropertyName("activeAbandonedCount")]
    public int ActiveAbandonedCount { get; set; }

    [JsonPropertyName("recoveryRatePercent")]
    public decimal RecoveryRatePercent { get; set; }

    [JsonPropertyName("averageAbandonedValue")]
    public decimal AverageAbandonedValue { get; set; }

    [JsonPropertyName("sequence1HourSent")]
    public int Sequence1HourSent { get; set; }

    [JsonPropertyName("sequence24HourSent")]
    public int Sequence24HourSent { get; set; }
}

public class AbandonedCartSettings
{
    [JsonPropertyName("storeId")]
    public string StoreId { get; set; } = "store_apex";

    [JsonPropertyName("enableAutoRecovery")]
    public bool EnableAutoRecovery { get; set; } = true;

    [JsonPropertyName("send1HourReminder")]
    public bool Send1HourReminder { get; set; } = true;

    [JsonPropertyName("send24HourReminder")]
    public bool Send24HourReminder { get; set; } = true;

    [JsonPropertyName("defaultDiscountCode")]
    public string DefaultDiscountCode { get; set; } = "SAVE5";

    [JsonPropertyName("defaultDiscountPercent")]
    public decimal DefaultDiscountPercent { get; set; } = 5m;

    [JsonPropertyName("emailSubject1Hour")]
    public string EmailSubject1Hour { get; set; } = "Did you forget something? Your cart is waiting!";

    [JsonPropertyName("emailSubject24Hour")]
    public string EmailSubject24Hour { get; set; } = "Still thinking it over? Enjoy 5% off to complete your order!";
}

// =========================================================================
// 11. SELF-SERVICE RETURNS, RMA & GST CREDIT NOTE MODELS
// =========================================================================
public class ReturnItem
{
    [JsonPropertyName("productId")]
    public string ProductId { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("variantTitle")]
    public string VariantTitle { get; set; } = string.Empty;

    [JsonPropertyName("quantity")]
    public int Quantity { get; set; } = 1;

    [JsonPropertyName("price")]
    public decimal Price { get; set; }

    [JsonPropertyName("exchangeVariant")]
    public string? ExchangeVariant { get; set; }

    [JsonPropertyName("reason")]
    public string Reason { get; set; } = "size_mismatch"; // size_mismatch | item_damaged | changed_mind | wrong_item | quality_issue
}

public class GstCreditNote
{
    [JsonPropertyName("creditNoteNumber")]
    public string CreditNoteNumber { get; set; } = string.Empty;

    [JsonPropertyName("originalInvoiceNumber")]
    public string OriginalInvoiceNumber { get; set; } = string.Empty;

    [JsonPropertyName("originalOrderNumber")]
    public string OriginalOrderNumber { get; set; } = string.Empty;

    [JsonPropertyName("creditNoteDate")]
    public string CreditNoteDate { get; set; } = string.Empty;

    [JsonPropertyName("sellerLegalName")]
    public string SellerLegalName { get; set; } = "Apex Commerce India Pvt. Ltd.";

    [JsonPropertyName("sellerGstin")]
    public string SellerGstin { get; set; } = "29AABCU9603R1ZM";

    [JsonPropertyName("sellerStateCode")]
    public string SellerStateCode { get; set; } = "29";

    [JsonPropertyName("sellerStateName")]
    public string SellerStateName { get; set; } = "Karnataka";

    [JsonPropertyName("buyerName")]
    public string BuyerName { get; set; } = string.Empty;

    [JsonPropertyName("buyerEmail")]
    public string BuyerEmail { get; set; } = string.Empty;

    [JsonPropertyName("buyerGstin")]
    public string? BuyerGstin { get; set; }

    [JsonPropertyName("buyerStateCode")]
    public string BuyerStateCode { get; set; } = "29";

    [JsonPropertyName("taxableAmountReversed")]
    public decimal TaxableAmountReversed { get; set; }

    [JsonPropertyName("cgstReversed")]
    public decimal CgstReversed { get; set; }

    [JsonPropertyName("sgstReversed")]
    public decimal SgstReversed { get; set; }

    [JsonPropertyName("igstReversed")]
    public decimal IgstReversed { get; set; }

    [JsonPropertyName("totalGstReversed")]
    public decimal TotalGstReversed { get; set; }

    [JsonPropertyName("totalCreditAmount")]
    public decimal TotalCreditAmount { get; set; }

    [JsonPropertyName("reason")]
    public string Reason { get; set; } = "Sales Return / Defective Goods";

    [JsonPropertyName("items")]
    public List<ReturnItem> Items { get; set; } = new();
}

public class ReturnRequest
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("storeId")]
    public string StoreId { get; set; } = "store_apex";

    [JsonPropertyName("orderId")]
    public string OrderId { get; set; } = string.Empty;

    [JsonPropertyName("orderNumber")]
    public string OrderNumber { get; set; } = string.Empty;

    [JsonPropertyName("customerName")]
    public string CustomerName { get; set; } = string.Empty;

    [JsonPropertyName("customerEmail")]
    public string CustomerEmail { get; set; } = string.Empty;

    [JsonPropertyName("customerPhone")]
    public string CustomerPhone { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = "return_refund"; // return_refund | exchange

    [JsonPropertyName("reason")]
    public string Reason { get; set; } = "size_mismatch"; // size_mismatch | item_damaged | changed_mind | wrong_item | quality_issue

    [JsonPropertyName("reasonDetails")]
    public string ReasonDetails { get; set; } = string.Empty;

    [JsonPropertyName("fitInsight")]
    public string? FitInsight { get; set; }

    [JsonPropertyName("items")]
    public List<ReturnItem> Items { get; set; } = new();

    [JsonPropertyName("totalRefundAmount")]
    public decimal TotalRefundAmount { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "pending"; // pending | approved | rejected | replacement_issued | completed

    [JsonPropertyName("creditNoteNumber")]
    public string? CreditNoteNumber { get; set; }

    [JsonPropertyName("creditNote")]
    public GstCreditNote? CreditNote { get; set; }

    [JsonPropertyName("adminNotes")]
    public string? AdminNotes { get; set; }

    [JsonPropertyName("pickupCourier")]
    public string? PickupCourier { get; set; } = "Delhivery Reverse Logistics";

    [JsonPropertyName("pickupTrackingNumber")]
    public string? PickupTrackingNumber { get; set; }

    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = string.Empty;

    [JsonPropertyName("updatedAt")]
    public string UpdatedAt { get; set; } = string.Empty;
}

public class CreateReturnRequest
{
    [JsonPropertyName("storeId")]
    public string? StoreId { get; set; }

    [JsonPropertyName("orderId")]
    public string OrderId { get; set; } = string.Empty;

    [JsonPropertyName("orderNumber")]
    public string OrderNumber { get; set; } = string.Empty;

    [JsonPropertyName("customerEmail")]
    public string CustomerEmail { get; set; } = string.Empty;

    [JsonPropertyName("customerName")]
    public string CustomerName { get; set; } = string.Empty;

    [JsonPropertyName("customerPhone")]
    public string? CustomerPhone { get; set; }

    [JsonPropertyName("type")]
    public string Type { get; set; } = "return_refund"; // return_refund | exchange

    [JsonPropertyName("reason")]
    public string Reason { get; set; } = "size_mismatch";

    [JsonPropertyName("reasonDetails")]
    public string? ReasonDetails { get; set; }

    [JsonPropertyName("fitInsight")]
    public string? FitInsight { get; set; }

    [JsonPropertyName("items")]
    public List<ReturnItem> Items { get; set; } = new();
}

public class UpdateReturnStatusRequest
{
    [JsonPropertyName("storeId")]
    public string? StoreId { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "approved"; // approved | rejected | replacement_issued | completed

    [JsonPropertyName("adminNotes")]
    public string? AdminNotes { get; set; }

    [JsonPropertyName("pickupCourier")]
    public string? PickupCourier { get; set; }

    [JsonPropertyName("pickupTrackingNumber")]
    public string? PickupTrackingNumber { get; set; }
}


