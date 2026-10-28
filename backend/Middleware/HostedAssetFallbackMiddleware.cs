using System.Text.RegularExpressions;
using ShopifyEngine.Api.Services;

namespace ShopifyEngine.Api.Middleware;

public class HostedAssetFallbackMiddleware
{
    private readonly RequestDelegate _next;

    public HostedAssetFallbackMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, DeploymentService depService)
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

        await _next(context);
    }
}
