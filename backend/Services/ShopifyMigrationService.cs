using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using ShopifyEngine.Api.Data;
using ShopifyEngine.Api.Models;

namespace ShopifyEngine.Api.Services;

public class MigrationResult
{
    public bool Success { get; set; } = true;
    public string Mode { get; set; } = string.Empty; // "CSV" or "API"
    public string StoreId { get; set; } = string.Empty;
    public string StoreName { get; set; } = string.Empty;
    public int ProductsImported { get; set; }
    public int VariantsImported { get; set; }
    public int CustomersImported { get; set; }
    public int ImagesMirrored { get; set; }
    public int CategoriesCreated { get; set; }
    public List<string> Warnings { get; set; } = new();
    public List<string> Errors { get; set; } = new();
    public List<string> SampleProductTitles { get; set; } = new();
}

public class ShopifyMigrationService
{
    private readonly ShopifyDbContext _db;
    private readonly ITenantProvider _tenantProvider;
    private readonly R2StorageService _r2Storage;
    private readonly ILogger<ShopifyMigrationService> _logger;
    private static readonly HttpClient _httpClient = new() { Timeout = TimeSpan.FromSeconds(15) };

    public ShopifyMigrationService(
        ShopifyDbContext db,
        ITenantProvider tenantProvider,
        R2StorageService r2Storage,
        ILogger<ShopifyMigrationService> logger)
    {
        _db = db;
        _tenantProvider = tenantProvider;
        _r2Storage = r2Storage;
        _logger = logger;
    }

    private string ResolveStoreId(string? explicitStoreId)
    {
        var storeId = !string.IsNullOrWhiteSpace(explicitStoreId)
            ? explicitStoreId
            : _tenantProvider.CurrentStoreId;
        return HttpTenantProvider.NormalizeStoreId(storeId ?? "store_apex");
    }

    // =========================================================================
    // MODEL 1: SHOPIFY CSV IMPORTER
    // =========================================================================
    public async Task<MigrationResult> ImportShopifyCsvAsync(Stream csvStream, string? explicitStoreId, bool mirrorImagesToR2 = true)
    {
        var storeId = ResolveStoreId(explicitStoreId);
        var result = new MigrationResult
        {
            Mode = "CSV",
            StoreId = storeId
        };

        // Determine Store Name
        var store = _db.Stores.IgnoreQueryFilters().FirstOrDefault(s => s.Id == storeId);
        result.StoreName = store?.Name ?? storeId;

        // 1. Parse CSV RFC 4180
        List<List<string>> rows;
        using (var reader = new StreamReader(csvStream, Encoding.UTF8, true, 4096, leaveOpen: true))
        {
            rows = ParseCsvRecords(reader);
        }

        if (rows.Count < 2)
        {
            result.Success = false;
            result.Errors.Add("The uploaded CSV file is empty or does not contain header and data rows.");
            return result;
        }

        var headerRow = rows[0].Select(h => h.Trim().ToLowerInvariant()).ToList();

        // Detect if Customers CSV or Products CSV
        bool isCustomersCsv = headerRow.Contains("email") &&
                              (headerRow.Contains("total spent") || headerRow.Contains("total orders") || headerRow.Contains("first name"));

        if (isCustomersCsv)
        {
            await ProcessCustomerCsvRowsAsync(rows, storeId, result);
        }
        else
        {
            await ProcessProductCsvRowsAsync(rows, storeId, mirrorImagesToR2, result);
        }

        return result;
    }

    private async Task ProcessProductCsvRowsAsync(List<List<string>> rows, string storeId, bool mirrorImagesToR2, MigrationResult result)
    {
        var header = rows[0].Select(h => h.Trim().ToLowerInvariant()).ToList();

        int GetIdx(params string[] names)
        {
            for (int i = 0; i < header.Count; i++)
            {
                var col = header[i];
                if (names.Any(n => string.Equals(col, n, StringComparison.OrdinalIgnoreCase))) return i;
            }
            return -1;
        }

        int handleIdx = GetIdx("handle");
        int titleIdx = GetIdx("title");
        int bodyIdx = GetIdx("body (html)", "body", "description");
        int vendorIdx = GetIdx("vendor");
        int typeIdx = GetIdx("type", "product type", "product category");
        int tagsIdx = GetIdx("tags");
        int opt1NameIdx = GetIdx("option1 name");
        int opt1ValIdx = GetIdx("option1 value");
        int opt2NameIdx = GetIdx("option2 name");
        int opt2ValIdx = GetIdx("option2 value");
        int opt3NameIdx = GetIdx("option3 name");
        int opt3ValIdx = GetIdx("option3 value");
        int skuIdx = GetIdx("variant sku", "sku");
        int priceIdx = GetIdx("variant price", "price");
        int compPriceIdx = GetIdx("variant compare at price", "compare at price");
        int qtyIdx = GetIdx("variant inventory qty", "inventory qty", "variant inventory quantity");
        int imgSrcIdx = GetIdx("image src", "image", "src");

        // Group rows by Handle (or by Title if handle missing)
        var groups = new Dictionary<string, List<List<string>>>(StringComparer.OrdinalIgnoreCase);
        for (int r = 1; r < rows.Count; r++)
        {
            var row = rows[r];
            if (row.Count == 0 || row.All(string.IsNullOrWhiteSpace)) continue;

            string key = "";
            if (handleIdx >= 0 && handleIdx < row.Count && !string.IsNullOrWhiteSpace(row[handleIdx]))
            {
                key = row[handleIdx].Trim();
            }
            else if (titleIdx >= 0 && titleIdx < row.Count && !string.IsNullOrWhiteSpace(row[titleIdx]))
            {
                key = Regex.Replace(row[titleIdx].ToLowerInvariant(), @"[^a-z0-9]+", "-").Trim('-');
            }

            if (string.IsNullOrWhiteSpace(key))
            {
                // Fallback to row index if completely blank
                key = $"item-{r}";
            }

            if (!groups.ContainsKey(key))
            {
                groups[key] = new List<List<string>>();
            }
            groups[key].Add(row);
        }

        // Cache existing categories for this store to avoid duplicate DB insertions
        var existingCategories = await _db.Categories
            .IgnoreQueryFilters()
            .Where(c => c.StoreId == storeId)
            .ToDictionaryAsync(c => c.Name.ToLowerInvariant(), c => c);

        // Fetch existing products for this store to avoid duplication
        var existingProducts = await _db.Products
            .IgnoreQueryFilters()
            .Where(p => p.StoreId == storeId)
            .ToDictionaryAsync(p => p.Title.ToLowerInvariant(), p => p);

        int totalProducts = 0;
        int totalVariants = 0;
        int totalMirrored = 0;
        int newCategoriesCount = 0;

        foreach (var (handle, productRows) in groups)
        {
            try
            {
                // Extract Title
                string title = "";
                foreach (var r in productRows)
                {
                    if (titleIdx >= 0 && titleIdx < r.Count && !string.IsNullOrWhiteSpace(r[titleIdx]))
                    {
                        title = r[titleIdx].Trim();
                        break;
                    }
                }

                if (string.IsNullOrWhiteSpace(title))
                {
                    // Convert slug handle back to Title Case
                    title = CultureInfo.CurrentCulture.TextInfo.ToTitleCase(handle.Replace('-', ' '));
                }

                // Extract Description
                string description = "";
                foreach (var r in productRows)
                {
                    if (bodyIdx >= 0 && bodyIdx < r.Count && !string.IsNullOrWhiteSpace(r[bodyIdx]))
                    {
                        description = r[bodyIdx].Trim();
                        break;
                    }
                }

                // Extract Category
                string category = "General Merchandise";
                foreach (var r in productRows)
                {
                    if (typeIdx >= 0 && typeIdx < r.Count && !string.IsNullOrWhiteSpace(r[typeIdx]))
                    {
                        var t = r[typeIdx].Trim();
                        if (!string.IsNullOrWhiteSpace(t))
                        {
                            category = t;
                            break;
                        }
                    }
                }

                // Ensure Category exists
                var catKey = category.ToLowerInvariant();
                if (!existingCategories.ContainsKey(catKey))
                {
                    var newCat = new DbCategory
                    {
                        Id = $"cat_{Guid.NewGuid().ToString("N")[..8]}",
                        StoreId = storeId,
                        Name = category,
                        Slug = Regex.Replace(category.ToLowerInvariant(), @"[^a-z0-9]+", "-").Trim('-')
                    };
                    _db.Categories.Add(newCat);
                    existingCategories[catKey] = newCat;
                    newCategoriesCount++;
                }

                // Collect unique image URLs
                var imageUrls = new List<string>();
                foreach (var r in productRows)
                {
                    if (imgSrcIdx >= 0 && imgSrcIdx < r.Count && !string.IsNullOrWhiteSpace(r[imgSrcIdx]))
                    {
                        var url = r[imgSrcIdx].Trim();
                        if (url.StartsWith("http", StringComparison.OrdinalIgnoreCase) && !imageUrls.Contains(url))
                        {
                            imageUrls.Add(url);
                        }
                    }
                }

                // Primary image
                string primaryImage = imageUrls.FirstOrDefault() ?? "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800";

                // Mirror primary image to Cloudflare R2 if requested
                if (mirrorImagesToR2 && primaryImage.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                {
                    var r2Url = await MirrorImageToR2SafeAsync(primaryImage, storeId);
                    if (!string.IsNullOrEmpty(r2Url))
                    {
                        primaryImage = r2Url;
                        totalMirrored++;
                    }
                }

                // Build variants
                var variants = new List<ProductVariant>();
                decimal basePrice = 0;
                decimal? baseCompareAtPrice = null;
                int totalInventory = 0;

                for (int i = 0; i < productRows.Count; i++)
                {
                    var r = productRows[i];

                    // Read options
                    var optParts = new List<string>();
                    if (opt1ValIdx >= 0 && opt1ValIdx < r.Count && !string.IsNullOrWhiteSpace(r[opt1ValIdx]))
                        optParts.Add(r[opt1ValIdx].Trim());
                    if (opt2ValIdx >= 0 && opt2ValIdx < r.Count && !string.IsNullOrWhiteSpace(r[opt2ValIdx]))
                        optParts.Add(r[opt2ValIdx].Trim());
                    if (opt3ValIdx >= 0 && opt3ValIdx < r.Count && !string.IsNullOrWhiteSpace(r[opt3ValIdx]))
                        optParts.Add(r[opt3ValIdx].Trim());

                    string variantName = optParts.Count > 0 ? string.Join(" / ", optParts) : "Default";

                    // Read price
                    decimal variantPrice = 0;
                    if (priceIdx >= 0 && priceIdx < r.Count && decimal.TryParse(r[priceIdx].Trim().Replace("$", ""), NumberStyles.Any, CultureInfo.InvariantCulture, out var parsedPrice))
                    {
                        variantPrice = parsedPrice;
                    }

                    // Read compare at price
                    decimal? variantCompareAt = null;
                    if (compPriceIdx >= 0 && compPriceIdx < r.Count && decimal.TryParse(r[compPriceIdx].Trim().Replace("$", ""), NumberStyles.Any, CultureInfo.InvariantCulture, out var parsedCompare))
                    {
                        if (parsedCompare > 0) variantCompareAt = parsedCompare;
                    }

                    // Read SKU
                    string sku = "";
                    if (skuIdx >= 0 && skuIdx < r.Count && !string.IsNullOrWhiteSpace(r[skuIdx]))
                    {
                        sku = r[skuIdx].Trim();
                    }
                    else
                    {
                        sku = $"{handle.ToUpperInvariant()}-{i + 1}";
                    }

                    // Read Inventory
                    int qty = 50;
                    if (qtyIdx >= 0 && qtyIdx < r.Count && int.TryParse(r[qtyIdx].Trim(), out var parsedQty))
                    {
                        qty = parsedQty;
                    }

                    // Only add as a variant if price is valid or options were specified
                    if (variantPrice > 0 || optParts.Count > 0 || i == 0)
                    {
                        variants.Add(new ProductVariant
                        {
                            Id = $"var_{Guid.NewGuid().ToString("N")[..8]}",
                            Name = variantName,
                            Price = variantPrice,
                            Sku = sku
                        });

                        if (basePrice == 0 && variantPrice > 0)
                        {
                            basePrice = variantPrice;
                            baseCompareAtPrice = variantCompareAt;
                        }
                        totalInventory += Math.Max(0, qty);
                    }
                }

                if (variants.Count == 0)
                {
                    variants.Add(new ProductVariant
                    {
                        Id = $"var_{Guid.NewGuid().ToString("N")[..8]}",
                        Name = "Standard",
                        Price = basePrice > 0 ? basePrice : 49.99m,
                        Sku = $"{handle.ToUpperInvariant()}-STD"
                    });
                    if (basePrice == 0) basePrice = 49.99m;
                    totalInventory = 50;
                }

                var titleKey = title.ToLowerInvariant();
                if (existingProducts.TryGetValue(titleKey, out var existingProd))
                {
                    // Update existing product
                    existingProd.Category = category;
                    existingProd.Price = basePrice;
                    existingProd.CompareAtPrice = baseCompareAtPrice;
                    existingProd.Image = primaryImage;
                    existingProd.Description = description;
                    existingProd.Inventory = totalInventory > 0 ? totalInventory : 50;
                    existingProd.VariantsJson = JsonSerializer.Serialize(variants);
                }
                else
                {
                    // Create new DbProduct
                    var newProd = new DbProduct
                    {
                        Id = $"prod_{Guid.NewGuid().ToString("N")[..8]}",
                        StoreId = storeId,
                        Title = title,
                        Category = category,
                        Price = basePrice,
                        CompareAtPrice = baseCompareAtPrice,
                        Badge = baseCompareAtPrice.HasValue && baseCompareAtPrice > basePrice ? "Sale" : "Imported",
                        Image = primaryImage,
                        Description = description,
                        Inventory = totalInventory > 0 ? totalInventory : 50,
                        VariantsJson = JsonSerializer.Serialize(variants)
                    };
                    _db.Products.Add(newProd);
                    existingProducts[titleKey] = newProd;
                }

                totalProducts++;
                totalVariants += variants.Count;
                if (result.SampleProductTitles.Count < 5)
                {
                    result.SampleProductTitles.Add(title);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Shopify CSV Import] Failed to import product handle {Handle}", handle);
                result.Warnings.Add($"Failed to import '{handle}': {ex.Message}");
            }
        }

        await _db.SaveChangesAsync();

        result.ProductsImported = totalProducts;
        result.VariantsImported = totalVariants;
        result.ImagesMirrored = totalMirrored;
        result.CategoriesCreated = newCategoriesCount;
    }

    private async Task ProcessCustomerCsvRowsAsync(List<List<string>> rows, string storeId, MigrationResult result)
    {
        var header = rows[0].Select(h => h.Trim().ToLowerInvariant()).ToList();

        int GetIdx(params string[] names)
        {
            for (int i = 0; i < header.Count; i++)
            {
                var col = header[i];
                if (names.Any(n => string.Equals(col, n, StringComparison.OrdinalIgnoreCase))) return i;
            }
            return -1;
        }

        int firstNameIdx = GetIdx("first name");
        int lastNameIdx = GetIdx("last name");
        int emailIdx = GetIdx("email");
        int phoneIdx = GetIdx("phone");
        int ordersIdx = GetIdx("total orders", "orders count");
        int spentIdx = GetIdx("total spent");

        var existingCustomers = await _db.Customers
            .IgnoreQueryFilters()
            .Where(c => c.StoreId == storeId)
            .ToDictionaryAsync(c => c.Email.ToLowerInvariant(), c => c);

        int imported = 0;

        for (int r = 1; r < rows.Count; r++)
        {
            var row = rows[r];
            if (row.Count == 0) continue;

            string email = "";
            if (emailIdx >= 0 && emailIdx < row.Count) email = row[emailIdx].Trim();
            if (string.IsNullOrWhiteSpace(email)) continue;

            string firstName = firstNameIdx >= 0 && firstNameIdx < row.Count ? row[firstNameIdx].Trim() : "";
            string lastName = lastNameIdx >= 0 && lastNameIdx < row.Count ? row[lastNameIdx].Trim() : "";
            string name = $"{firstName} {lastName}".Trim();
            if (string.IsNullOrWhiteSpace(name)) name = email.Split('@')[0];

            string phone = phoneIdx >= 0 && phoneIdx < row.Count ? row[phoneIdx].Trim() : "";
            int orders = 0;
            if (ordersIdx >= 0 && ordersIdx < row.Count && int.TryParse(row[ordersIdx].Trim(), out var o)) orders = o;

            decimal spent = 0;
            if (spentIdx >= 0 && spentIdx < row.Count && decimal.TryParse(row[spentIdx].Trim().Replace("$", ""), NumberStyles.Any, CultureInfo.InvariantCulture, out var s)) spent = s;

            var emailKey = email.ToLowerInvariant();
            if (existingCustomers.TryGetValue(emailKey, out var existing))
            {
                existing.Name = name;
                if (!string.IsNullOrWhiteSpace(phone)) existing.Phone = phone;
                existing.OrdersCount = Math.Max(existing.OrdersCount, orders);
                existing.TotalSpent = Math.Max(existing.TotalSpent, spent);
            }
            else
            {
                var customer = new DbCustomer
                {
                    Id = $"cust_{Guid.NewGuid().ToString("N")[..8]}",
                    StoreId = storeId,
                    Name = name,
                    Email = email,
                    Phone = !string.IsNullOrWhiteSpace(phone) ? phone : null,
                    OrdersCount = orders,
                    TotalSpent = spent,
                    CreatedAt = DateTime.UtcNow.ToString("o")
                };
                _db.Customers.Add(customer);
                existingCustomers[emailKey] = customer;
            }
            imported++;
        }

        await _db.SaveChangesAsync();
        result.CustomersImported = imported;
    }

    // =========================================================================
    // MODEL 2: 1-CLICK DIRECT SHOPIFY ADMIN API MIGRATOR
    // =========================================================================
    public async Task<MigrationResult> ImportFromShopifyApiAsync(
        string shopifyDomain,
        string accessToken,
        string? explicitStoreId,
        bool mirrorImagesToR2 = true,
        bool importProducts = true,
        bool importCustomers = true)
    {
        var storeId = ResolveStoreId(explicitStoreId);
        var result = new MigrationResult
        {
            Mode = "API",
            StoreId = storeId
        };

        // Normalize domain (e.g. "https://mystore.myshopify.com/" -> "mystore.myshopify.com")
        var cleanDomain = shopifyDomain.Trim()
            .Replace("https://", "", StringComparison.OrdinalIgnoreCase)
            .Replace("http://", "", StringComparison.OrdinalIgnoreCase)
            .TrimEnd('/');

        if (!cleanDomain.Contains('.'))
        {
            cleanDomain = $"{cleanDomain}.myshopify.com";
        }

        var cleanToken = accessToken.Trim();

        _logger.LogInformation("[Shopify API Migration] Starting sync from {Domain} into {StoreId}", cleanDomain, storeId);

        // 1. Validate credentials & Fetch Shop Information
        using var testReq = new HttpRequestMessage(HttpMethod.Get, $"https://{cleanDomain}/admin/api/2024-01/shop.json");
        testReq.Headers.Add("X-Shopify-Access-Token", cleanToken);

        HttpResponseMessage shopRes;
        try
        {
            shopRes = await _httpClient.SendAsync(testReq);
        }
        catch (Exception ex)
        {
            result.Success = false;
            result.Errors.Add($"Could not connect to '{cleanDomain}': {ex.Message}. Please verify the domain name.");
            return result;
        }

        if (!shopRes.IsSuccessStatusCode)
        {
            var errBody = await shopRes.Content.ReadAsStringAsync();
            result.Success = false;
            result.Errors.Add($"Shopify authentication failed (HTTP {shopRes.StatusCode}). Please verify your Shopify Admin API Access Token (shpat_...). Detail: {errBody}");
            return result;
        }

        var shopJson = await shopRes.Content.ReadAsStringAsync();
        using var shopDoc = JsonDocument.Parse(shopJson);
        if (shopDoc.RootElement.TryGetProperty("shop", out var shopEl))
        {
            if (shopEl.TryGetProperty("name", out var sName))
            {
                result.StoreName = sName.GetString() ?? cleanDomain;
            }
        }

        // 2. Import Products
        if (importProducts)
        {
            await ImportProductsFromShopifyApiAsync(cleanDomain, cleanToken, storeId, mirrorImagesToR2, result);
        }

        // 3. Import Customers
        if (importCustomers)
        {
            await ImportCustomersFromShopifyApiAsync(cleanDomain, cleanToken, storeId, result);
        }

        return result;
    }

    private async Task ImportProductsFromShopifyApiAsync(
        string domain,
        string accessToken,
        string storeId,
        bool mirrorImagesToR2,
        MigrationResult result)
    {
        using var req = new HttpRequestMessage(HttpMethod.Get, $"https://{domain}/admin/api/2024-01/products.json?limit=250");
        req.Headers.Add("X-Shopify-Access-Token", accessToken);

        var res = await _httpClient.SendAsync(req);
        if (!res.IsSuccessStatusCode)
        {
            var err = await res.Content.ReadAsStringAsync();
            result.Warnings.Add($"Failed to fetch products from Shopify API: HTTP {res.StatusCode} - {err}");
            return;
        }

        var json = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        if (!doc.RootElement.TryGetProperty("products", out var productsArray) || productsArray.ValueKind != JsonValueKind.Array)
        {
            result.Warnings.Add("No products found in Shopify response.");
            return;
        }

        var existingCategories = await _db.Categories
            .IgnoreQueryFilters()
            .Where(c => c.StoreId == storeId)
            .ToDictionaryAsync(c => c.Name.ToLowerInvariant(), c => c);

        var existingProducts = await _db.Products
            .IgnoreQueryFilters()
            .Where(p => p.StoreId == storeId)
            .ToDictionaryAsync(p => p.Title.ToLowerInvariant(), p => p);

        int productsImported = 0;
        int variantsImported = 0;
        int mirroredImages = 0;
        int newCats = 0;

        foreach (var pEl in productsArray.EnumerateArray())
        {
            try
            {
                var title = pEl.TryGetProperty("title", out var tEl) ? tEl.GetString() ?? "Untitled" : "Untitled";
                var description = pEl.TryGetProperty("body_html", out var bEl) ? bEl.GetString() ?? "" : "";
                var productType = pEl.TryGetProperty("product_type", out var typeEl) ? typeEl.GetString() ?? "General Merchandise" : "General Merchandise";
                if (string.IsNullOrWhiteSpace(productType)) productType = "General Merchandise";

                // Ensure Category exists
                var catKey = productType.ToLowerInvariant();
                if (!existingCategories.ContainsKey(catKey))
                {
                    var cat = new DbCategory
                    {
                        Id = $"cat_{Guid.NewGuid().ToString("N")[..8]}",
                        StoreId = storeId,
                        Name = productType,
                        Slug = Regex.Replace(productType.ToLowerInvariant(), @"[^a-z0-9]+", "-").Trim('-')
                    };
                    _db.Categories.Add(cat);
                    existingCategories[catKey] = cat;
                    newCats++;
                }

                // Images
                string primaryImage = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800";
                if (pEl.TryGetProperty("images", out var imagesEl) && imagesEl.ValueKind == JsonValueKind.Array && imagesEl.GetArrayLength() > 0)
                {
                    var firstImg = imagesEl[0];
                    if (firstImg.TryGetProperty("src", out var srcEl))
                    {
                        var src = srcEl.GetString();
                        if (!string.IsNullOrWhiteSpace(src))
                        {
                            primaryImage = src;
                        }
                    }
                }

                if (mirrorImagesToR2 && primaryImage.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                {
                    var r2Url = await MirrorImageToR2SafeAsync(primaryImage, storeId);
                    if (!string.IsNullOrEmpty(r2Url))
                    {
                        primaryImage = r2Url;
                        mirroredImages++;
                    }
                }

                // Variants
                var variants = new List<ProductVariant>();
                decimal basePrice = 0;
                decimal? baseCompareAtPrice = null;
                int totalInventory = 0;

                if (pEl.TryGetProperty("variants", out var variantsEl) && variantsEl.ValueKind == JsonValueKind.Array)
                {
                    foreach (var vEl in variantsEl.EnumerateArray())
                    {
                        var vTitle = vEl.TryGetProperty("title", out var vtEl) ? vtEl.GetString() ?? "Default" : "Default";
                        var vSku = vEl.TryGetProperty("sku", out var vsEl) ? vsEl.GetString() ?? "" : "";

                        decimal vPrice = 0;
                        if (vEl.TryGetProperty("price", out var vpEl) && decimal.TryParse(vpEl.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var parsedP))
                        {
                            vPrice = parsedP;
                        }

                        decimal? vCompare = null;
                        if (vEl.TryGetProperty("compare_at_price", out var vcEl) && vcEl.ValueKind == JsonValueKind.String && decimal.TryParse(vcEl.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var parsedC))
                        {
                            if (parsedC > 0) vCompare = parsedC;
                        }

                        int vQty = 50;
                        if (vEl.TryGetProperty("inventory_quantity", out var vqEl) && vqEl.TryGetInt32(out var parsedQ))
                        {
                            vQty = parsedQ;
                        }

                        variants.Add(new ProductVariant
                        {
                            Id = $"var_{Guid.NewGuid().ToString("N")[..8]}",
                            Name = vTitle,
                            Price = vPrice,
                            Sku = !string.IsNullOrWhiteSpace(vSku) ? vSku : $"SKU-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}"
                        });

                        if (basePrice == 0 && vPrice > 0)
                        {
                            basePrice = vPrice;
                            baseCompareAtPrice = vCompare;
                        }
                        totalInventory += Math.Max(0, vQty);
                    }
                }

                if (variants.Count == 0)
                {
                    variants.Add(new ProductVariant
                    {
                        Id = $"var_{Guid.NewGuid().ToString("N")[..8]}",
                        Name = "Default",
                        Price = 49.99m,
                        Sku = $"SKU-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}"
                    });
                    basePrice = 49.99m;
                    totalInventory = 50;
                }

                var titleKey = title.ToLowerInvariant();
                if (existingProducts.TryGetValue(titleKey, out var existing))
                {
                    existing.Category = productType;
                    existing.Price = basePrice;
                    existing.CompareAtPrice = baseCompareAtPrice;
                    existing.Image = primaryImage;
                    existing.Description = description;
                    existing.Inventory = totalInventory > 0 ? totalInventory : 50;
                    existing.VariantsJson = JsonSerializer.Serialize(variants);
                }
                else
                {
                    var newProd = new DbProduct
                    {
                        Id = $"prod_{Guid.NewGuid().ToString("N")[..8]}",
                        StoreId = storeId,
                        Title = title,
                        Category = productType,
                        Price = basePrice,
                        CompareAtPrice = baseCompareAtPrice,
                        Badge = baseCompareAtPrice.HasValue && baseCompareAtPrice > basePrice ? "Sale" : "Imported",
                        Image = primaryImage,
                        Description = description,
                        Inventory = totalInventory > 0 ? totalInventory : 50,
                        VariantsJson = JsonSerializer.Serialize(variants)
                    };
                    _db.Products.Add(newProd);
                    existingProducts[titleKey] = newProd;
                }

                productsImported++;
                variantsImported += variants.Count;
                if (result.SampleProductTitles.Count < 5)
                {
                    result.SampleProductTitles.Add(title);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Shopify API Import] Error processing product");
            }
        }

        await _db.SaveChangesAsync();

        result.ProductsImported = productsImported;
        result.VariantsImported = variantsImported;
        result.ImagesMirrored = mirroredImages;
        result.CategoriesCreated = newCats;
    }

    private async Task ImportCustomersFromShopifyApiAsync(
        string domain,
        string accessToken,
        string storeId,
        MigrationResult result)
    {
        using var req = new HttpRequestMessage(HttpMethod.Get, $"https://{domain}/admin/api/2024-01/customers.json?limit=250");
        req.Headers.Add("X-Shopify-Access-Token", accessToken);

        var res = await _httpClient.SendAsync(req);
        if (!res.IsSuccessStatusCode)
        {
            var err = await res.Content.ReadAsStringAsync();
            result.Warnings.Add($"Failed to fetch customers from Shopify API: HTTP {res.StatusCode} - {err}");
            return;
        }

        var json = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        if (!doc.RootElement.TryGetProperty("customers", out var customersArray) || customersArray.ValueKind != JsonValueKind.Array)
        {
            return;
        }

        var existingCustomers = await _db.Customers
            .IgnoreQueryFilters()
            .Where(c => c.StoreId == storeId)
            .ToDictionaryAsync(c => c.Email.ToLowerInvariant(), c => c);

        int imported = 0;

        foreach (var cEl in customersArray.EnumerateArray())
        {
            try
            {
                var email = cEl.TryGetProperty("email", out var eEl) ? eEl.GetString() ?? "" : "";
                if (string.IsNullOrWhiteSpace(email)) continue;

                var first = cEl.TryGetProperty("first_name", out var fEl) ? fEl.GetString() ?? "" : "";
                var last = cEl.TryGetProperty("last_name", out var lEl) ? lEl.GetString() ?? "" : "";
                var name = $"{first} {last}".Trim();
                if (string.IsNullOrWhiteSpace(name)) name = email.Split('@')[0];

                var phone = cEl.TryGetProperty("phone", out var phEl) ? phEl.GetString() : null;

                int ordersCount = 0;
                if (cEl.TryGetProperty("orders_count", out var ocEl) && ocEl.TryGetInt32(out var oc))
                {
                    ordersCount = oc;
                }

                decimal totalSpent = 0;
                if (cEl.TryGetProperty("total_spent", out var tsEl) && decimal.TryParse(tsEl.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var ts))
                {
                    totalSpent = ts;
                }

                var emailKey = email.ToLowerInvariant();
                if (existingCustomers.TryGetValue(emailKey, out var existing))
                {
                    existing.Name = name;
                    if (!string.IsNullOrWhiteSpace(phone)) existing.Phone = phone;
                    existing.OrdersCount = Math.Max(existing.OrdersCount, ordersCount);
                    existing.TotalSpent = Math.Max(existing.TotalSpent, totalSpent);
                }
                else
                {
                    var cust = new DbCustomer
                    {
                        Id = $"cust_{Guid.NewGuid().ToString("N")[..8]}",
                        StoreId = storeId,
                        Name = name,
                        Email = email,
                        Phone = phone,
                        OrdersCount = ordersCount,
                        TotalSpent = totalSpent,
                        CreatedAt = DateTime.UtcNow.ToString("o")
                    };
                    _db.Customers.Add(cust);
                    existingCustomers[emailKey] = cust;
                }
                imported++;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Shopify API Import] Error processing customer");
            }
        }

        await _db.SaveChangesAsync();
        result.CustomersImported = imported;
    }

    // =========================================================================
    // IMAGE MIRRORING TO CLOUDFLARE R2
    // =========================================================================
    private async Task<string?> MirrorImageToR2SafeAsync(string imageUrl, string storeId)
    {
        try
        {
            if (!_r2Storage.IsR2Configured()) return null;

            var uri = new Uri(imageUrl);
            var ext = Path.GetExtension(uri.AbsolutePath);
            if (string.IsNullOrWhiteSpace(ext) || ext.Length > 5) ext = ".jpg";

            var fileName = $"migrated_{storeId}_{Guid.NewGuid().ToString("N")[..12]}{ext}";

            using var response = await _httpClient.GetAsync(imageUrl);
            if (!response.IsSuccessStatusCode) return null;

            var contentType = response.Content.Headers.ContentType?.MediaType ?? "image/jpeg";
            using var stream = await response.Content.ReadAsStreamAsync();

            var r2Url = await _r2Storage.UploadFileAsync(stream, fileName, contentType);
            return r2Url;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[Shopify Migration] Could not mirror image {Url} to R2. Retaining original URL.", imageUrl);
            return null;
        }
    }

    // =========================================================================
    // ROBUST RFC 4180 CSV STREAM PARSER
    // =========================================================================
    private static List<List<string>> ParseCsvRecords(TextReader reader)
    {
        var records = new List<List<string>>();
        var currentRecord = new List<string>();
        var currentField = new StringBuilder();
        bool inQuotes = false;

        int rawChar;
        while ((rawChar = reader.Read()) != -1)
        {
            char c = (char)rawChar;

            if (inQuotes)
            {
                if (c == '"')
                {
                    int nextChar = reader.Peek();
                    if (nextChar == '"')
                    {
                        // Escaped double quote
                        reader.Read();
                        currentField.Append('"');
                    }
                    else
                    {
                        // End of quoted field
                        inQuotes = false;
                    }
                }
                else
                {
                    currentField.Append(c);
                }
            }
            else
            {
                if (c == '"')
                {
                    inQuotes = true;
                }
                else if (c == ',')
                {
                    currentRecord.Add(currentField.ToString());
                    currentField.Clear();
                }
                else if (c == '\r')
                {
                    if (reader.Peek() == '\n') reader.Read();
                    currentRecord.Add(currentField.ToString());
                    currentField.Clear();
                    records.Add(currentRecord);
                    currentRecord = new List<string>();
                }
                else if (c == '\n')
                {
                    currentRecord.Add(currentField.ToString());
                    currentField.Clear();
                    records.Add(currentRecord);
                    currentRecord = new List<string>();
                }
                else
                {
                    currentField.Append(c);
                }
            }
        }

        if (currentField.Length > 0 || currentRecord.Count > 0)
        {
            currentRecord.Add(currentField.ToString());
            records.Add(currentRecord);
        }

        return records;
    }
}
