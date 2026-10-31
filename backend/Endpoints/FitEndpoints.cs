using Microsoft.AspNetCore.Mvc;
using ShopifyEngine.Api.Models;
using ShopifyEngine.Api.Services;

namespace ShopifyEngine.Api.Endpoints;

public static class FitEndpoints
{
    public static IEndpointRouteBuilder MapFitEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/fit")
                       .WithTags("Fit Verification & Return Reduction Engine");

        // 1. Verify Fit for Shopper Profile (Ephemeral Biometric Processing)
        group.MapPost("/verify", (
            [FromBody] FitVerificationRequest request,
            StoreService storeService,
            FitVerificationService fitService) =>
        {
            if (string.IsNullOrWhiteSpace(request.ProductId))
            {
                return Results.BadRequest(new { error = "ProductId is required" });
            }

            var product = storeService.GetProductById(request.ProductId, request.StoreId);
            if (product == null)
            {
                return Results.NotFound(new { error = $"Product '{request.ProductId}' not found" });
            }

            var result = fitService.EvaluateFit(
                product,
                request.ShopperProfile,
                request.RequestedSize,
                request.CompareSizes
            );

            return Results.Ok(result);
        }).WithSummary("Ephemeral biometric sizing calculation - zero disk storage, no body photos accepted, strictly purpose-limited to active sizing advice");

        // 2. Parse Brand Tech Pack (Point of Measure sheet)
        group.MapPost("/tech-pack/parse", (
            [FromBody] TechPackParseRequest request,
            FitVerificationService fitService) =>
        {
            if (string.IsNullOrWhiteSpace(request.RawText))
            {
                return Results.BadRequest(new { error = "RawText is required for tech pack parsing" });
            }

            var parsedSpec = fitService.ParseTechPack(request);
            return Results.Ok(parsedSpec);
        });

        // 3. Update Garment Spec for a Product
        group.MapPost("/products/{id}/garment-spec", (
            string id,
            [FromBody] GarmentSpec spec,
            StoreService storeService) =>
        {
            var product = storeService.GetProductById(id);
            if (product == null)
            {
                return Results.NotFound(new { error = $"Product '{id}' not found" });
            }

            product.GarmentSpec = spec;
            var updated = storeService.UpdateProduct(id, product);
            return Results.Ok(new
            {
                message = "Garment specification updated successfully",
                productId = id,
                garmentSpec = updated?.GarmentSpec
            });
        });

        // 4. Get Garment Spec for a Product
        group.MapGet("/products/{id}/garment-spec", (
            string id,
            StoreService storeService,
            FitVerificationService fitService) =>
        {
            var product = storeService.GetProductById(id);
            if (product == null)
            {
                return Results.NotFound(new { error = $"Product '{id}' not found" });
            }

            var spec = product.GarmentSpec ?? fitService.GenerateDefaultSpecForProduct(product);
            return Results.Ok(spec);
        });

        // 5. Anti-Bracketing Cart Interception Check
        group.MapPost("/anti-bracketing/check", (
            [FromBody] AntiBracketingCheckRequest request,
            StoreService storeService,
            FitVerificationService fitService) =>
        {
            if (request.Items == null || request.Items.Count == 0)
            {
                return Results.Ok(new AntiBracketingCheckResponse { HasBracketRisk = false });
            }

            // Group cart items by ProductId where more than 1 unit exists for the same SKU
            var grouped = request.Items.GroupBy(i => i.ProductId).Where(g => g.Count() > 1).ToList();
            if (grouped.Count == 0)
            {
                return Results.Ok(new AntiBracketingCheckResponse { HasBracketRisk = false });
            }

            var alerts = new List<BracketAlertItem>();
            foreach (var groupItem in grouped)
            {
                var prodId = groupItem.Key;
                var product = storeService.GetProductById(prodId);
                if (product == null) continue;

                var sizesInCart = groupItem.Select(i => i.Size ?? i.VariantTitle ?? "M").Distinct().ToList();
                if (sizesInCart.Count < 2) continue;

                var fitEval = fitService.EvaluateFit(
                    product,
                    request.ShopperProfile ?? new ShopperBodyProfile(),
                    compareSizes: sizesInCart
                );

                var topSize = fitEval.SizeEvaluations.OrderByDescending(s => s.OverallFitScore).FirstOrDefault();
                var redundantSizes = fitEval.SizeEvaluations.Where(s => s.Size != topSize?.Size).ToList();

                alerts.Add(new BracketAlertItem
                {
                    ProductId = prodId,
                    ProductTitle = product.Title,
                    RecommendedSize = topSize?.Size ?? "M",
                    RecommendedScore = topSize?.OverallFitScore ?? 90,
                    RedundantSizes = redundantSizes.Select(r => new RedundantSizeInfo
                    {
                        Size = r.Size,
                        FitScore = r.OverallFitScore,
                        Reason = r.SummaryText
                    }).ToList(),
                    Headline = $"Multi-Size Order Detected: Size {topSize?.Size} is your guaranteed cut.",
                    Explanation = fitEval.BracketNotice ?? $"Based on your biometric scan, Size {topSize?.Size} fits your frame with optimal ease ({topSize?.OverallFitScore}% match). Removing the secondary size avoids an unnecessary return."
                });
            }

            return Results.Ok(new AntiBracketingCheckResponse
            {
                HasBracketRisk = alerts.Count > 0,
                Alerts = alerts
            });
        });

        return app;
    }
}

public class AntiBracketingCheckRequest
{
    public List<CartItemDto> Items { get; set; } = new();
    public ShopperBodyProfile? ShopperProfile { get; set; }
}

public class CartItemDto
{
    public string ProductId { get; set; } = string.Empty;
    public string? VariantId { get; set; }
    public string? Size { get; set; }
    public string? VariantTitle { get; set; }
    public int Quantity { get; set; } = 1;
}

public class AntiBracketingCheckResponse
{
    public bool HasBracketRisk { get; set; }
    public List<BracketAlertItem> Alerts { get; set; } = new();
}

public class BracketAlertItem
{
    public string ProductId { get; set; } = string.Empty;
    public string ProductTitle { get; set; } = string.Empty;
    public string RecommendedSize { get; set; } = string.Empty;
    public int RecommendedScore { get; set; }
    public List<RedundantSizeInfo> RedundantSizes { get; set; } = new();
    public string Headline { get; set; } = string.Empty;
    public string Explanation { get; set; } = string.Empty;
}

public class RedundantSizeInfo
{
    public string Size { get; set; } = string.Empty;
    public int FitScore { get; set; }
    public string Reason { get; set; } = string.Empty;
}
