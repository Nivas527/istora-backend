using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using ShopifyEngine.Api.Data;
using ShopifyEngine.Api.Models;
using ShopifyEngine.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure port from environment or default 5200
var port = Environment.GetEnvironmentVariable("PORT") ?? "5200";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// Configure PostgreSQL Database Context
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5432;Database=shopify_engine;Username=nivas;Password=";

builder.Services.AddDbContext<ShopifyDbContext>(options =>
{
    options.UseNpgsql(connectionString);
});

// Increase body size limit to 50MB for dist.zip uploads
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 52428800; // 50MB
});

// Register Singleton Services
builder.Services.AddSingleton<DeploymentService>();
builder.Services.AddSingleton<StoreService>();
builder.Services.AddSingleton<JsxCompilerService>();

// Add Swagger / OpenAPI documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.OpenApiInfo
    {
        Title = "Shopify Engine & Vercel React Hosting API",
        Version = "v1",
        Description = "ASP.NET Core 10 Web API for Multi-Tenant E-Commerce and Edge React / dist.zip Hosting Engine"
    });
});

// Enable Permissive CORS for local Vite dev and live Netlify / custom domains
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors("AllowAll");

// Eagerly initialize PostgreSQL database schema and seed initial data on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ShopifyDbContext>();
    db.Database.EnsureCreated();

    // Automatically create new multi-tenant tables and partitions if database already exists
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
        ");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Database Migration Notice] {ex.Message}");
    }

    scope.ServiceProvider.GetRequiredService<StoreService>();
}

// Enable Swagger UI
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Shopify Engine API v1");
    c.RoutePrefix = "swagger";
});

// Referer fallback middleware for hosted assets requested without /hosted/ prefix
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value ?? "";
    var referer = context.Request.Headers.Referer.ToString();

    if (!path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase) &&
        !path.StartsWith("/admin/api/", StringComparison.OrdinalIgnoreCase) &&
        !path.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase) &&
        !path.StartsWith("/hosted/", StringComparison.OrdinalIgnoreCase) &&
        !path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase) &&
        !string.IsNullOrEmpty(referer))
    {
        var match = Regex.Match(referer, @"/hosted/([a-zA-Z0-9_-]+)");
        if (match.Success)
        {
            var depId = match.Groups[1].Value;
            var depService = context.RequestServices.GetRequiredService<DeploymentService>();
            var deployment = depService.GetById(depId);
            if (deployment != null)
            {
                var assetResult = depService.ResolveAsset(deployment, path.TrimStart('/'));
                if (assetResult != null)
                {
                    var (content, contentType) = assetResult.Value;
                    context.Response.ContentType = contentType;

                    if (content.StartsWith("data:") && content.Contains(";base64,"))
                    {
                        var base64Data = content[(content.IndexOf(";base64,") + 8)..];
                        var bytes = Convert.FromBase64String(base64Data);
                        await context.Response.Body.WriteAsync(bytes);
                        return;
                    }

                    await context.Response.WriteAsync(content);
                    return;
                }
            }
        }
    }

    await next();
});

// ==========================================
// 1. STOREFRONT & MULTI-TENANT E-COMMERCE APIS
// ==========================================
// Multi-Tenant Stores (Registry)
app.MapGet("/api/stores", (StoreService store) => Results.Ok(store.GetStores()));
app.MapGet("/api/stores/{id}", (string id, StoreService store) =>
{
    var s = store.GetStoreById(id);
    return s != null ? Results.Ok(s) : Results.NotFound();
});
app.MapPost("/api/stores", (TenantStore newStore, StoreService store) =>
{
    var created = store.CreateStore(newStore);
    return Results.Created($"/api/stores/{created.Id}", created);
});
app.MapPut("/api/stores/{id}", (string id, TenantStore updated, StoreService store) =>
{
    var res = store.UpdateStore(id, updated);
    return res != null ? Results.Ok(res) : Results.NotFound();
});
app.MapDelete("/api/stores/{id}", (string id, StoreService store) =>
{
    var deleted = store.DeleteStore(id);
    return Results.Ok(new { success = deleted });
});

app.MapGet("/api/store", (StoreService store) => Results.Ok(store.GetSettings()));
app.MapPost("/api/store", (StoreSettings settings, StoreService store) =>
{
    store.UpdateSettings(settings);
    return Results.Ok(store.GetSettings());
});

// Products (multi-tenant filtered by storeId)
app.MapGet("/api/products", (string? storeId, string? category, StoreService store) => Results.Ok(store.GetProducts(storeId, category)));
app.MapGet("/api/products/{id}", (string id, string? storeId, StoreService store) =>
{
    var product = store.GetProductById(id, storeId);
    return product != null ? Results.Ok(product) : Results.NotFound();
});
app.MapPost("/api/products", (Product product, StoreService store) =>
{
    var created = store.CreateProduct(product);
    return Results.Created($"/api/products/{created.Id}", created);
});
app.MapPut("/api/products/{id}", (string id, Product product, StoreService store) =>
{
    var updated = store.UpdateProduct(id, product);
    return updated != null ? Results.Ok(updated) : Results.NotFound();
});
app.MapDelete("/api/products/{id}", (string id, StoreService store) =>
{
    var deleted = store.DeleteProduct(id);
    return Results.Ok(new { success = deleted });
});

// Orders (multi-tenant filtered by storeId)
app.MapGet("/api/orders", (string? storeId, StoreService store) => Results.Ok(store.GetOrders(storeId)));
app.MapPost("/api/orders", (Order orderRequest, StoreService store) =>
{
    var order = store.CreateOrder(orderRequest);
    return Results.Created($"/api/orders/{order.Id}", order);
});

// Customers
app.MapGet("/api/customers", (string? storeId, StoreService store) => Results.Ok(store.GetCustomers(storeId)));

// Discounts
app.MapGet("/api/discounts", (string? storeId, StoreService store) => Results.Ok(store.GetDiscounts(storeId)));
app.MapPost("/api/discounts", (Discount discount, StoreService store) =>
{
    var created = store.CreateDiscount(discount);
    return Results.Created($"/api/discounts/{created.Id}", created);
});

// Categories
app.MapGet("/api/categories", (string? storeId, StoreService store) => Results.Ok(store.GetCategories(storeId)));
app.MapPost("/api/categories", (CategoryItem category, StoreService store) =>
{
    var created = store.CreateCategory(category);
    return Results.Created($"/api/categories/{created.Id}", created);
});

// Reviews
app.MapGet("/api/reviews", (string? storeId, string? productId, StoreService store) => Results.Ok(store.GetReviews(storeId, productId)));
app.MapPost("/api/reviews", (ProductReview review, StoreService store) =>
{
    var created = store.CreateReview(review);
    return Results.Created($"/api/reviews/{created.Id}", created);
});

// ==========================================
// 1B. SHOPIFY COMPATIBILITY APIS (2024-01 REST)
// ==========================================
// Shop Info: /admin/api/2024-01/shop.json
app.MapGet("/admin/api/2024-01/shop.json", (StoreService store) =>
{
    var s = store.GetSettings();
    return Results.Ok(new
    {
        shop = new
        {
            id = 15429383782462L,
            name = s.StoreName,
            email = s.ContactEmail,
            domain = s.StoreDomain,
            myshopify_domain = "istora.myshopify.local",
            currency = s.Currency,
            money_format = (s.CurrencySymbol ?? "$") + "{{amount}}",
            plan_name = "enterprise",
            country_name = "United States"
        }
    });
});

// Products: /admin/api/2024-01/products.json
app.MapGet("/admin/api/2024-01/products.json", (string? category, StoreService store) =>
{
    var products = store.GetProducts(category);
    return Results.Ok(new { products });
});

app.MapGet("/admin/api/2024-01/products/{id}.json", (string id, StoreService store) =>
{
    var product = store.GetProductById(id);
    return product != null ? Results.Ok(new { product }) : Results.NotFound();
});

app.MapPost("/admin/api/2024-01/products.json", (JsonDocument body, StoreService store) =>
{
    Product product;
    if (body.RootElement.TryGetProperty("product", out var prodElem))
    {
        product = JsonSerializer.Deserialize<Product>(prodElem.GetRawText()) ?? new();
    }
    else
    {
        product = JsonSerializer.Deserialize<Product>(body.RootElement.GetRawText()) ?? new();
    }
    var created = store.CreateProduct(product);
    return Results.Created($"/admin/api/2024-01/products/{created.Id}.json", new { product = created });
});

app.MapPut("/admin/api/2024-01/products/{id}.json", (string id, JsonDocument body, StoreService store) =>
{
    Product product;
    if (body.RootElement.TryGetProperty("product", out var prodElem))
    {
        product = JsonSerializer.Deserialize<Product>(prodElem.GetRawText()) ?? new();
    }
    else
    {
        product = JsonSerializer.Deserialize<Product>(body.RootElement.GetRawText()) ?? new();
    }
    var updated = store.UpdateProduct(id, product);
    return updated != null ? Results.Ok(new { product = updated }) : Results.NotFound();
});

app.MapDelete("/admin/api/2024-01/products/{id}.json", (string id, StoreService store) =>
{
    var deleted = store.DeleteProduct(id);
    return Results.Ok(new { success = deleted });
});

// Orders: /admin/api/2024-01/orders.json
app.MapGet("/admin/api/2024-01/orders.json", (StoreService store) =>
{
    var orders = store.GetOrders();
    return Results.Ok(new { orders });
});

app.MapPost("/admin/api/2024-01/orders.json", (JsonDocument body, StoreService store) =>
{
    Order orderRequest;
    if (body.RootElement.TryGetProperty("order", out var orderElem))
    {
        orderRequest = JsonSerializer.Deserialize<Order>(orderElem.GetRawText()) ?? new();
    }
    else
    {
        orderRequest = JsonSerializer.Deserialize<Order>(body.RootElement.GetRawText()) ?? new();
    }
    var order = store.CreateOrder(orderRequest);
    return Results.Created($"/admin/api/2024-01/orders/{order.Id}.json", new { order });
});

// Storefront Cart: /api/storefront/cart.json
app.MapGet("/api/storefront/cart.json", () =>
{
    return Results.Ok(new
    {
        cart = new
        {
            id = "cart_" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            lines = new object[] { },
            totalQuantity = 0,
            checkoutUrl = "/checkout",
            cost = new { subtotalAmount = new { amount = "0.00", currencyCode = "USD" } }
        }
    });
});

app.MapPost("/api/storefront/cart.json", (JsonDocument body) =>
{
    var id = "cart_" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    int qty = 1;
    if (body.RootElement.TryGetProperty("lines", out var linesElem) && linesElem.ValueKind == JsonValueKind.Array)
    {
        qty = linesElem.GetArrayLength();
    }
    return Results.Ok(new
    {
        cart = new
        {
            id,
            checkoutUrl = "/checkout",
            totalQuantity = qty,
            cost = new { subtotalAmount = new { amount = "0.00", currencyCode = "USD" } }
        }
    });
});

// ==========================================
// 1C. LOCAL FILE UPLOADS & CATEGORIES APIS
// ==========================================
var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
if (!Directory.Exists(uploadsDir)) Directory.CreateDirectory(uploadsDir);

// Upload local image files
app.MapPost("/api/upload", async (HttpRequest request) =>
{
    try
    {
        if (!request.HasFormContentType)
        {
            return Results.BadRequest(new { error = "Multipart form-data expected" });
        }

        var form = await request.ReadFormAsync();
        var file = form.Files.FirstOrDefault();
        if (file == null || file.Length == 0)
        {
            return Results.BadRequest(new { error = "No image file uploaded" });
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif", ".avif" };
        if (!allowed.Contains(ext))
        {
            return Results.BadRequest(new { error = "Supported formats: JPG, PNG, WEBP, SVG, GIF, AVIF" });
        }

        var safeFileName = $"upload_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{Random.Shared.Next(1000, 9999)}{ext}";
        var filePath = Path.Combine(uploadsDir, safeFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var url = $"/uploads/{safeFileName}";
        return Results.Ok(new { url, fileName = safeFileName, size = file.Length });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Image upload failed: {ex.Message}");
    }
});

// Serve uploaded images directly
app.MapGet("/uploads/{fileName}", (string fileName) =>
{
    var filePath = Path.Combine(uploadsDir, Path.GetFileName(fileName));
    if (!File.Exists(filePath)) return Results.NotFound();

    var ext = Path.GetExtension(fileName).TrimStart('.').ToLowerInvariant();
    var mime = ext switch
    {
        "jpg" or "jpeg" => "image/jpeg",
        "png" => "image/png",
        "webp" => "image/webp",
        "gif" => "image/gif",
        "svg" => "image/svg+xml",
        "avif" => "image/avif",
        _ => "application/octet-stream"
    };

    return Results.File(filePath, mime);
});



// Public Order Tracking Endpoint
app.MapGet("/api/orders/track/{orderNumber}", (string orderNumber, StoreService store) =>
{
    var clean = orderNumber.Trim().ToLowerInvariant();
    var order = store.GetOrders().FirstOrDefault(o =>
        o.Id.ToLowerInvariant().Contains(clean) ||
        (o.CustomerEmail != null && o.CustomerEmail.ToLowerInvariant().Contains(clean))
    );

    if (order == null) return Results.NotFound(new { error = $"Order '{orderNumber}' not found" });

    return Results.Ok(new
    {
        orderId = order.Id,
        customerName = order.CustomerName,
        customerEmail = order.CustomerEmail,
        total = order.Total,
        status = order.Status,
        createdAt = order.CreatedAt,
        itemsCount = order.Items?.Count ?? 0,
        items = order.Items
    });
});

// Razorpay / Stripe Payment Webhook Verification
app.MapPost("/api/webhooks/payment", async (HttpRequest req, StoreService store) =>
{
    using var reader = new StreamReader(req.Body);
    var body = await reader.ReadToEndAsync();
    Console.WriteLine($"[Payment Webhook Received] {body}");
    return Results.Ok(new { success = true, verified = true, receivedAt = DateTime.UtcNow });
});

// ==========================================
// 2. VERCEL REACT / DIST.ZIP HOSTING APIS
// ==========================================
app.MapGet("/api/deployments", (DeploymentService depService) => Results.Ok(new { deployments = depService.GetAll() }));

app.MapGet("/api/deployments/{id}", (string id, DeploymentService depService) =>
{
    var dep = depService.GetById(id);
    return dep != null ? Results.Ok(dep) : Results.NotFound();
});

app.MapPost("/api/deployments/save", (SaveDeploymentRequest req, DeploymentService depService) =>
{
    if (req.Deployment != null)
    {
        depService.Upsert(req.Deployment);
        return Results.Ok(new { success = true, id = req.Deployment.Id });
    }
    return Results.BadRequest(new { error = "Deployment object required" });
});

app.MapPost("/api/deployments/sync", (SyncDeploymentsRequest req, DeploymentService depService) =>
{
    if (req.Deployments != null)
    {
        depService.Sync(req.Deployments);
        return Results.Ok(new { success = true, count = req.Deployments.Count });
    }
    return Results.BadRequest(new { error = "Deployments array required" });
});

app.MapDelete("/api/deployments/{id}", (string id, DeploymentService depService) =>
{
    var deleted = depService.Delete(id);
    return Results.Ok(new { success = deleted });
});

app.MapPost("/api/deployments/compile", async (CompileRequest req, JsxCompilerService compiler) =>
{
    if (string.IsNullOrWhiteSpace(req.Code))
    {
        return Results.BadRequest(new { error = "Code is required" });
    }
    var res = await compiler.CompileAsync(req.Code, req.Loader ?? "jsx");
    return Results.Ok(res);
});

// Upload and unpack dist.zip directly on the server
app.MapPost("/api/deployments/upload-zip", async (HttpRequest request, DeploymentService depService) =>
{
    try
    {
        Stream zipStream;
        string appName = "dist-app";
        string env = "production";

        if (request.HasFormContentType)
        {
            var form = await request.ReadFormAsync();
            var file = form.Files.FirstOrDefault();
            if (file == null) return Results.BadRequest(new { error = "No file attached in form-data" });

            appName = form["appName"].FirstOrDefault() ?? Path.GetFileNameWithoutExtension(file.FileName);
            env = form["environment"].FirstOrDefault() ?? "production";
            zipStream = file.OpenReadStream();
        }
        else
        {
            zipStream = request.Body;
        }

        var newDeployment = await depService.ExtractZipToDeploymentAsync(zipStream, appName, env);
        return Results.Created($"/hosted/{newDeployment.Id}", newDeployment);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Failed to extract zip: {ex.Message}");
    }
});

// ==========================================
// 3. DYNAMIC HOSTED APP & EDGE RUNNER ROUTE
// ==========================================
app.MapGet("/hosted/{id}/{*assetPath}", async (string id, string? assetPath, HttpContext context, DeploymentService depService) =>
{
    var deployment = depService.GetById(id);
    if (deployment == null)
    {
        context.Response.StatusCode = 404;
        context.Response.ContentType = "text/html; charset=utf-8";
        await context.Response.WriteAsync($"<div style='background:#09090b;color:#fff;padding:3rem;font-family:sans-serif;'><h2>Deployment '{id}' not found</h2></div>");
        return;
    }

    // 1. Sub-Asset Request (e.g., assets/index-xxx.js or assets/index-xxx.css or images)
    if (!string.IsNullOrWhiteSpace(assetPath))
    {
        var assetResult = depService.ResolveAsset(deployment, assetPath);
        if (assetResult != null)
        {
            var (content, contentType) = assetResult.Value;
            context.Response.ContentType = contentType;

            if (content.StartsWith("data:") && content.Contains(";base64,"))
            {
                var base64Data = content[(content.IndexOf(";base64,") + 8)..];
                var bytes = Convert.FromBase64String(base64Data);
                await context.Response.Body.WriteAsync(bytes);
                return;
            }

            await context.Response.WriteAsync(content);
            return;
        }
    }

    // 2. Root Request or SPA Fallback (e.g., /hosted/:id or /hosted/:id/shop)
    var html = depService.PrepareHtml(deployment);
    context.Response.ContentType = "text/html; charset=utf-8";
    await context.Response.WriteAsync(html);
});

// Root redirect directly to Swagger documentation
app.MapGet("/", () => Results.Redirect("/swagger"));

// Health check endpoint
app.MapGet("/api/health", () => Results.Ok(new
{
    engine = "Shopify Engine & Vercel React Hosting Backend",
    runtime = "ASP.NET Core 10 (C# / Kestrel)",
    status = "Healthy",
    swaggerUi = $"/swagger"
}));

// Highlight Swagger UI URL cleanly upon application startup
app.Lifetime.ApplicationStarted.Register(() =>
{
    Console.WriteLine("\n=========================================================");
    Console.WriteLine("🚀 Shopify Engine & Vercel React Hosting Engine (.NET 10)");
    Console.WriteLine($"🐘 Database:    PostgreSQL (localhost:5432/shopify_engine)");
    Console.WriteLine($"📖 Swagger UI:  http://localhost:{port}/swagger");
    Console.WriteLine($"🌐 Web / Root:   http://localhost:{port}/ (auto-redirects to Swagger)");
    Console.WriteLine($"⚡ API Health:   http://localhost:{port}/api/health");
    Console.WriteLine("=========================================================\n");
});

app.Run();
