using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http;

namespace ShopifyEngine.Api.Data;

public interface IMultiTenantEntity
{
    string StoreId { get; set; }
}

public interface ITenantProvider
{
    string? CurrentStoreId { get; }
    bool IsMasterPlatformAdmin { get; }
    IDisposable SetCurrentTenant(string storeId);
}

public class HttpTenantProvider : ITenantProvider
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private static readonly AsyncLocal<string?> _asyncLocalTenant = new();

    public HttpTenantProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public bool IsMasterPlatformAdmin
    {
        get
        {
            var ctx = _httpContextAccessor.HttpContext;
            if (ctx == null) return false;

            if (ctx.Request.Headers.TryGetValue("X-Master-Key", out var key) && !string.IsNullOrWhiteSpace(key))
                return true;

            if (ctx.Request.Headers.TryGetValue("X-Platform-Admin", out var admin) && admin == "true")
                return true;

            return false;
        }
    }

    public string? CurrentStoreId
    {
        get
        {
            // 1. Explicit AsyncLocal override (useful for background tasks, explicit scoping, testing)
            if (!string.IsNullOrWhiteSpace(_asyncLocalTenant.Value))
            {
                return NormalizeStoreId(_asyncLocalTenant.Value);
            }

            var ctx = _httpContextAccessor.HttpContext;
            if (ctx == null) return null;

            // 2. Explicit HTTP Header: X-Store-Id or X-Tenant-Id
            if (ctx.Request.Headers.TryGetValue("X-Store-Id", out var storeHeader) && !string.IsNullOrWhiteSpace(storeHeader))
            {
                return NormalizeStoreId(storeHeader.ToString());
            }
            if (ctx.Request.Headers.TryGetValue("X-Tenant-Id", out var tenantHeader) && !string.IsNullOrWhiteSpace(tenantHeader))
            {
                return NormalizeStoreId(tenantHeader.ToString());
            }

            // 3. Query string: ?storeId=...
            if (ctx.Request.Query.TryGetValue("storeId", out var queryVal) && !string.IsNullOrWhiteSpace(queryVal))
            {
                return NormalizeStoreId(queryVal.ToString());
            }

            // 4. Hostname / Subdomain extraction (e.g. mouse.istora.online -> store_mouse)
            var host = ctx.Request.Host.Host.ToLowerInvariant();
            var parts = host.Split('.');
            if (parts.Length > 2 && parts[0] != "www" && parts[0] != "admin" && parts[0] != "api")
            {
                return NormalizeStoreId(parts[0]);
            }
            else if (host.Contains(".localhost"))
            {
                return NormalizeStoreId(host.Split('.')[0]);
            }

            return null;
        }
    }

    public IDisposable SetCurrentTenant(string storeId)
    {
        var prev = _asyncLocalTenant.Value;
        _asyncLocalTenant.Value = NormalizeStoreId(storeId);
        return new DisposableAction(() => _asyncLocalTenant.Value = prev);
    }

    public static string NormalizeStoreId(string id)
    {
        if (string.IsNullOrWhiteSpace(id)) return string.Empty;
        var clean = id.Trim().ToLowerInvariant();
        if (clean.StartsWith("store_")) return clean;
        return "store_" + clean;
    }

    private sealed class DisposableAction : IDisposable
    {
        private readonly Action _action;
        public DisposableAction(Action action) => _action = action;
        public void Dispose() => _action();
    }
}
