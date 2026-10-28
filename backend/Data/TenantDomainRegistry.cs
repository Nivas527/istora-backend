using System.Collections.Concurrent;

namespace ShopifyEngine.Api.Data;

public static class TenantDomainRegistry
{
    private static readonly ConcurrentDictionary<string, string> _domainToStoreId = new(StringComparer.OrdinalIgnoreCase);

    public static void Register(string? domainOrHost, string storeId)
    {
        if (string.IsNullOrWhiteSpace(domainOrHost) || string.IsNullOrWhiteSpace(storeId)) return;
        var clean = CleanDomain(domainOrHost);
        if (!string.IsNullOrWhiteSpace(clean))
        {
            _domainToStoreId[clean] = HttpTenantProvider.NormalizeStoreId(storeId);
        }
    }

    public static void Unregister(string? domainOrHost)
    {
        if (string.IsNullOrWhiteSpace(domainOrHost)) return;
        var clean = CleanDomain(domainOrHost);
        _domainToStoreId.TryRemove(clean, out _);
    }

    public static void Clear() => _domainToStoreId.Clear();

    public static string? ResolveStoreId(string? host)
    {
        if (string.IsNullOrWhiteSpace(host)) return null;
        var clean = CleanDomain(host);
        if (_domainToStoreId.TryGetValue(clean, out var storeId))
        {
            return storeId;
        }
        return null;
    }

    public static string CleanDomain(string domain)
    {
        var d = domain.Trim().ToLowerInvariant();
        if (d.StartsWith("https://")) d = d[8..];
        if (d.StartsWith("http://")) d = d[7..];
        var colonIdx = d.IndexOf(':');
        if (colonIdx > 0) d = d[..colonIdx];
        return d.TrimEnd('/');
    }
}
