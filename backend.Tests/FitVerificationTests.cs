using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using ShopifyEngine.Api.Data;
using ShopifyEngine.Api.Models;
using ShopifyEngine.Api.Services;
using Xunit;

namespace backend.Tests;

public class FitVerificationTests
{
    private readonly FitVerificationService _fitService;

    public FitVerificationTests()
    {
        var options = new DbContextOptionsBuilder<ShopifyDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var dbContext = new ShopifyDbContext(options);
        _fitService = new FitVerificationService(dbContext, NullLogger<FitVerificationService>.Instance);
    }

    [Fact]
    public void GenerateDefaultSpecForProduct_CreatesCompleteSizeGrid()
    {
        var product = new Product
        {
            Id = "prod_shirt_1",
            Title = "Classic Oxford Shirt",
            Category = "Apparel",
            Description = "Premium button-down shirt"
        };

        var spec = _fitService.GenerateDefaultSpecForProduct(product);

        Assert.NotNull(spec);
        Assert.NotEmpty(spec.Sizes);
        Assert.True(spec.Sizes.ContainsKey("S"));
        Assert.True(spec.Sizes.ContainsKey("M"));
        Assert.True(spec.Sizes.ContainsKey("L"));
        Assert.True(spec.Sizes.ContainsKey("XL"));

        // Progressive chest measurements: XL > L > M > S
        Assert.True(spec.Sizes["M"].ChestCm > spec.Sizes["S"].ChestCm);
        Assert.True(spec.Sizes["L"].ChestCm > spec.Sizes["M"].ChestCm);
        Assert.True(spec.Sizes["XL"].ChestCm > spec.Sizes["L"].ChestCm);
    }

    [Fact]
    public void EvaluateFit_RecommendsClosestMatchingSize()
    {
        var product = new Product
        {
            Id = "prod_shirt_1",
            Title = "Tailored Cotton Shirt",
            Category = "Apparel"
        };

        var shopperProfile = new ShopperBodyProfile
        {
            ChestCm = 100,
            WaistCm = 84,
            HeightCm = 178,
            WeightKg = 74
        };

        var evaluation = _fitService.EvaluateFit(product, shopperProfile);

        Assert.NotNull(evaluation);
        Assert.NotNull(evaluation.RecommendedSize);
        Assert.True(evaluation.RecommendedScore >= 70, "Score should be >= 70");
        Assert.NotEmpty(evaluation.SizeEvaluations);
        Assert.Contains(evaluation.SizeEvaluations, e => e.IsRecommended);
    }

    [Fact]
    public void EvaluateFit_AntiBracketingAlert_FiresWhenComparingSizes()
    {
        var product = new Product
        {
            Id = "prod_shirt_1",
            Title = "Tailored Cotton Shirt",
            Category = "Apparel"
        };

        var shopperProfile = new ShopperBodyProfile
        {
            ChestCm = 100,
            WaistCm = 84,
            HeightCm = 178,
            WeightKg = 74
        };

        // Shopper attempting to buy both M and XL to try at home (bracketing)
        var evaluation = _fitService.EvaluateFit(
            product,
            shopperProfile,
            requestedSize: "M",
            compareSizes: new List<string> { "M", "XL" }
        );

        Assert.NotNull(evaluation.BracketNotice);
        Assert.Contains("XL", evaluation.BracketNotice);
    }
}
