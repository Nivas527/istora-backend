using System.Text.Json.Serialization;

namespace ShopifyEngine.Api.Models;

public class GarmentSizeMeasurements
{
    [JsonPropertyName("chestCm")]
    public double ChestCm { get; set; }

    [JsonPropertyName("waistCm")]
    public double WaistCm { get; set; }

    [JsonPropertyName("lowHipCm")]
    public double LowHipCm { get; set; }

    [JsonPropertyName("acrossShoulderCm")]
    public double AcrossShoulderCm { get; set; }

    [JsonPropertyName("sleeveLengthCm")]
    public double SleeveLengthCm { get; set; }

    [JsonPropertyName("totalLengthCm")]
    public double TotalLengthCm { get; set; }

    [JsonPropertyName("thighGirthCm")]
    public double ThighGirthCm { get; set; }

    [JsonPropertyName("inseamCm")]
    public double InseamCm { get; set; }
}

public class GarmentSpec
{
    [JsonPropertyName("fabricComposition")]
    public string FabricComposition { get; set; } = "100% Cotton";

    [JsonPropertyName("fabricType")]
    public string FabricType { get; set; } = "woven"; // woven, denim, knit, jersey

    [JsonPropertyName("usableStretchPercent")]
    public double UsableStretchPercent { get; set; } = 0.0; // 0.0 for rigid cotton, 0.15 for 15% stretch

    [JsonPropertyName("intendedFit")]
    public string IntendedFit { get; set; } = "regular"; // skinny, slim, regular, relaxed, oversized

    [JsonPropertyName("intendedEaseCm")]
    public Dictionary<string, double> IntendedEaseCm { get; set; } = new()
    {
        { "chest", 4.0 },
        { "waist", 3.0 },
        { "hip", 4.0 },
        { "shoulder", 0.0 },
        { "sleeve", 1.5 }
    };

    [JsonPropertyName("sizes")]
    public Dictionary<string, GarmentSizeMeasurements> Sizes { get; set; } = new();
}

public class ShopperBodyProfile
{
    [JsonPropertyName("heightCm")]
    public double HeightCm { get; set; } = 175.0;

    [JsonPropertyName("weightKg")]
    public double WeightKg { get; set; } = 72.0;

    [JsonPropertyName("gender")]
    public string Gender { get; set; } = "unisex"; // male, female, unisex

    [JsonPropertyName("chestCm")]
    public double ChestCm { get; set; } = 98.0;

    [JsonPropertyName("waistCm")]
    public double WaistCm { get; set; } = 82.0;

    [JsonPropertyName("lowHipCm")]
    public double LowHipCm { get; set; } = 99.0;

    [JsonPropertyName("acrossShoulderCm")]
    public double AcrossShoulderCm { get; set; } = 44.0;

    [JsonPropertyName("sleeveLengthCm")]
    public double SleeveLengthCm { get; set; } = 62.0;

    [JsonPropertyName("thighGirthCm")]
    public double ThighGirthCm { get; set; } = 56.0;

    [JsonPropertyName("inseamCm")]
    public double InseamCm { get; set; } = 79.0;

    [JsonPropertyName("scanConfidence")]
    public double ScanConfidence { get; set; } = 0.95;

    [JsonPropertyName("captureMethod")]
    public string CaptureMethod { get; set; } = "two_photo_hmr"; // two_photo_hmr, manual_metric, statistical_prior
}

public class ZoneFitEvaluation
{
    [JsonPropertyName("zone")]
    public string Zone { get; set; } = string.Empty;

    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;

    [JsonPropertyName("bodyCm")]
    public double BodyCm { get; set; }

    [JsonPropertyName("garmentDimensionCm")]
    public double GarmentDimensionCm { get; set; }

    [JsonPropertyName("usableStretchCm")]
    public double UsableStretchCm { get; set; }

    [JsonPropertyName("effectiveDimensionCm")]
    public double EffectiveDimensionCm { get; set; }

    [JsonPropertyName("easeCm")]
    public double EaseCm { get; set; }

    [JsonPropertyName("intendedEaseCm")]
    public double IntendedEaseCm { get; set; }

    [JsonPropertyName("tensionIndex")]
    public double TensionIndex { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "optimal"; // tight, snug, optimal, relaxed, oversized

    [JsonPropertyName("severity")]
    public int Severity { get; set; } // 0 = optimal, 1 = snug/relaxed, 2 = tight/oversized return risk

    [JsonPropertyName("explanation")]
    public string Explanation { get; set; } = string.Empty;
}

public class SizeFitResult
{
    [JsonPropertyName("size")]
    public string Size { get; set; } = string.Empty;

    [JsonPropertyName("overallFitScore")]
    public int OverallFitScore { get; set; } // 0 - 100

    [JsonPropertyName("isRecommended")]
    public bool IsRecommended { get; set; }

    [JsonPropertyName("overallStatus")]
    public string OverallStatus { get; set; } = "optimal";

    [JsonPropertyName("returnRiskPercent")]
    public int ReturnRiskPercent { get; set; }

    [JsonPropertyName("zones")]
    public Dictionary<string, ZoneFitEvaluation> Zones { get; set; } = new();

    [JsonPropertyName("summaryText")]
    public string SummaryText { get; set; } = string.Empty;

    [JsonPropertyName("bracketWarning")]
    public string? BracketWarning { get; set; }
}

public class FitVerificationRequest
{
    [JsonPropertyName("productId")]
    public string ProductId { get; set; } = string.Empty;

    [JsonPropertyName("storeId")]
    public string? StoreId { get; set; }

    [JsonPropertyName("requestedSize")]
    public string? RequestedSize { get; set; }

    [JsonPropertyName("shopperProfile")]
    public ShopperBodyProfile ShopperProfile { get; set; } = new();

    [JsonPropertyName("compareSizes")]
    public List<string>? CompareSizes { get; set; }
}

public class FitVerificationResponse
{
    [JsonPropertyName("productId")]
    public string ProductId { get; set; } = string.Empty;

    [JsonPropertyName("productTitle")]
    public string ProductTitle { get; set; } = string.Empty;

    [JsonPropertyName("fabricComposition")]
    public string FabricComposition { get; set; } = string.Empty;

    [JsonPropertyName("usableStretchPercent")]
    public double UsableStretchPercent { get; set; }

    [JsonPropertyName("intendedFit")]
    public string IntendedFit { get; set; } = "regular";

    [JsonPropertyName("recommendedSize")]
    public string RecommendedSize { get; set; } = string.Empty;

    [JsonPropertyName("recommendedScore")]
    public int RecommendedScore { get; set; }

    [JsonPropertyName("summary")]
    public string Summary { get; set; } = string.Empty;

    [JsonPropertyName("shopperProfile")]
    public ShopperBodyProfile ShopperProfile { get; set; } = new();

    [JsonPropertyName("sizeEvaluations")]
    public List<SizeFitResult> SizeEvaluations { get; set; } = new();

    [JsonPropertyName("bracketNotice")]
    public string? BracketNotice { get; set; }
}

public class TechPackParseRequest
{
    [JsonPropertyName("rawText")]
    public string RawText { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string? Category { get; set; }

    [JsonPropertyName("fabricType")]
    public string? FabricType { get; set; }

    [JsonPropertyName("usableStretchPercent")]
    public double? UsableStretchPercent { get; set; }

    [JsonPropertyName("intendedFit")]
    public string? IntendedFit { get; set; }
}
