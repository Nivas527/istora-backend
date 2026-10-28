using ShopifyEngine.Api.Data;
using ShopifyEngine.Api.Models;
using ShopifyEngine.Api.Services;

namespace ShopifyEngine.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Authentication & Merchant Sessions");

        // Merchant Login (Issues HttpOnly, Secure cookie)
        group.MapPost("/merchant-login", (MerchantLoginRequest req, HttpContext ctx, ITenantProvider tenantProvider, StoreService storeService) =>
        {
            var targetStore = !string.IsNullOrWhiteSpace(req.StoreId)
                ? HttpTenantProvider.NormalizeStoreId(req.StoreId)
                : (tenantProvider.CurrentStoreId ?? "store_apex");

            var store = storeService.GetStoreById(targetStore) ?? storeService.GetStoreById("store_apex");
            var cleanSlug = (store?.Slug ?? targetStore.Replace("store_", "")).ToLowerInvariant();

            // Simple hash token generator for demo & production
            var hash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes($"{targetStore}_secret_istora")))[..8].ToLowerInvariant();
            var token = !string.IsNullOrWhiteSpace(req.Token) && req.Token.StartsWith("shppa_sec_")
                ? req.Token
                : $"shppa_sec_{cleanSlug}_{hash}";

            // Set secure HttpOnly cookie
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true, // HTTPS / secure transport
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddDays(14),
                Path = "/"
            };

            ctx.Response.Cookies.Append("istora_merchant_token", token, cookieOptions);

            return Results.Ok(new MerchantAuthResponse
            {
                Authenticated = true,
                StoreId = targetStore,
                StoreName = store?.Name ?? "Merchant Store",
                Token = token,
                Role = "MerchantAdmin",
                Email = req.Email ?? store?.ContactEmail ?? "owner@istora.online"
            });
        }).WithName("MerchantLogin")
          .WithSummary("Merchant login with HttpOnly secure session cookie generation");

        // Merchant Logout (Clears HttpOnly cookie)
        group.MapPost("/merchant-logout", (HttpContext ctx) =>
        {
            ctx.Response.Cookies.Delete("istora_merchant_token", new CookieOptions
            {
                Path = "/",
                Secure = true,
                SameSite = SameSiteMode.Lax
            });

            return Results.Ok(new { success = true, message = "Merchant session terminated." });
        }).WithName("MerchantLogout")
          .WithSummary("Revoke merchant admin session and clear HttpOnly cookie");

        // Current Auth Status
        group.MapGet("/me", (HttpContext ctx, ITenantProvider tenantProvider, StoreService storeService) =>
        {
            var isAuth = tenantProvider.IsMerchantAdmin || tenantProvider.IsMasterPlatformAdmin;
            var storeId = tenantProvider.CurrentStoreId;
            var store = !string.IsNullOrWhiteSpace(storeId) ? storeService.GetStoreById(storeId) : null;

            return Results.Ok(new
            {
                authenticated = isAuth,
                isMerchantAdmin = tenantProvider.IsMerchantAdmin,
                isMasterPlatformAdmin = tenantProvider.IsMasterPlatformAdmin,
                storeId = storeId,
                storeName = store?.Name,
                role = tenantProvider.IsMasterPlatformAdmin ? "MasterPlatformAdmin" : (isAuth ? "MerchantAdmin" : "Shopper")
            });
        }).WithName("GetAuthStatus")
          .WithSummary("Check current caller authorization level and active store tenant");

        return app;
    }
}
