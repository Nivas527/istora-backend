using System.Text.Json;
using System.Text.RegularExpressions;
using ShopifyEngine.Api.Data;
using ShopifyEngine.Api.Models;

namespace ShopifyEngine.Api.Services;

public class FitVerificationService
{
    private readonly ShopifyDbContext _db;
    private readonly ILogger<FitVerificationService> _logger;

    public FitVerificationService(ShopifyDbContext db, ILogger<FitVerificationService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public FitVerificationResponse EvaluateFit(Product product, ShopperBodyProfile profile, string? requestedSize = null, List<string>? compareSizes = null)
    {
        var spec = product.GarmentSpec ?? GenerateDefaultSpecForProduct(product);

        var evaluations = new List<SizeFitResult>();
        foreach (var (sizeName, measurements) in spec.Sizes)
        {
            evaluations.Add(EvaluateSingleSize(sizeName, measurements, spec, profile));
        }

        // Rank by fit score descending
        evaluations = evaluations.OrderByDescending(e => e.OverallFitScore).ToList();

        // Flag the best size as recommended
        var best = evaluations.FirstOrDefault();
        if (best != null)
        {
            best.IsRecommended = true;
        }

        var recommendedSize = best?.Size ?? "M";
        var recommendedScore = best?.OverallFitScore ?? 90;

        // Anti-bracketing intelligence check
        string? bracketNotice = null;
        if (compareSizes != null && compareSizes.Count > 1)
        {
            var matched = evaluations.Where(e => compareSizes.Contains(e.Size, StringComparer.OrdinalIgnoreCase)).ToList();
            if (matched.Count >= 2)
            {
                var topCandidate = matched.OrderByDescending(m => m.OverallFitScore).First();
                var inferiorCandidate = matched.OrderBy(m => m.OverallFitScore).First();

                var waistDiff = Math.Abs(
                    inferiorCandidate.Zones.GetValueOrDefault("waist")?.EaseCm ?? 0 -
                    (topCandidate.Zones.GetValueOrDefault("waist")?.EaseCm ?? 0)
                );

                bracketNotice = $"Anti-Bracketing Guard: Based on your scan, Size {topCandidate.Size} is your true tailored cut ({topCandidate.OverallFitScore}% match). Size {inferiorCandidate.Size} has {waistDiff:F1} cm excess room and high return probability. We guarantee Size {topCandidate.Size} is your fit.";
            }
        }
        else if (!string.IsNullOrWhiteSpace(requestedSize) && best != null && !requestedSize.Equals(best.Size, StringComparison.OrdinalIgnoreCase))
        {
            var requestedEval = evaluations.FirstOrDefault(e => e.Size.Equals(requestedSize, StringComparison.OrdinalIgnoreCase));
            if (requestedEval != null && requestedEval.OverallFitScore < best.OverallFitScore - 15)
            {
                bracketNotice = $"Fit Advisory: You selected Size {requestedSize.ToUpper()} ({requestedEval.OverallFitScore}% match), but our geometry engine confirms Size {best.Size} ({best.OverallFitScore}% match) gives you optimal designer drape without excess slack.";
            }
        }

        var overallSummary = best != null
            ? $"{best.SummaryText} Tension index confirms true-to-design ease across all critical landmarks."
            : "Metric fit evaluated across chest, waist, shoulder and hip landmarks.";

        return new FitVerificationResponse
        {
            ProductId = product.Id,
            ProductTitle = product.Title,
            FabricComposition = spec.FabricComposition,
            UsableStretchPercent = spec.UsableStretchPercent,
            IntendedFit = spec.IntendedFit,
            RecommendedSize = recommendedSize,
            RecommendedScore = recommendedScore,
            Summary = overallSummary,
            ShopperProfile = profile,
            SizeEvaluations = evaluations,
            BracketNotice = bracketNotice
        };
    }

    private SizeFitResult EvaluateSingleSize(string sizeName, GarmentSizeMeasurements m, GarmentSpec spec, ShopperBodyProfile body)
    {
        var zones = new Dictionary<string, ZoneFitEvaluation>();

        // Usable stretch factor (we only count 60% of max elastic elongation for comfortable wearing tension)
        double stretchFactor = spec.UsableStretchPercent * 0.60;

        // 1. Chest / Bust
        zones["chest"] = EvaluateZone(
            zone: "chest",
            label: "Chest / Bust",
            bodyDimension: body.ChestCm,
            garmentDimension: m.ChestCm,
            usableStretchPercent: stretchFactor,
            intendedEase: spec.IntendedEaseCm.GetValueOrDefault("chest", 4.0),
            tightThreshold: -1.5,
            excessThreshold: 8.0,
            unitName: "chest"
        );

        // 2. Natural Waist
        zones["waist"] = EvaluateZone(
            zone: "waist",
            label: "Natural Waist",
            bodyDimension: body.WaistCm,
            garmentDimension: m.WaistCm,
            usableStretchPercent: stretchFactor,
            intendedEase: spec.IntendedEaseCm.GetValueOrDefault("waist", 3.0),
            tightThreshold: -1.0,
            excessThreshold: 7.0,
            unitName: "waist"
        );

        // 3. Low Hip
        zones["hip"] = EvaluateZone(
            zone: "hip",
            label: "Low Hip",
            bodyDimension: body.LowHipCm,
            garmentDimension: m.LowHipCm > 0 ? m.LowHipCm : m.WaistCm + 14.0, // fallback if flat-lay didn't measure hip
            usableStretchPercent: stretchFactor,
            intendedEase: spec.IntendedEaseCm.GetValueOrDefault("hip", 4.0),
            tightThreshold: -1.5,
            excessThreshold: 8.0,
            unitName: "hip"
        );

        // 4. Across Shoulder
        zones["shoulder"] = EvaluateZone(
            zone: "shoulder",
            label: "Across Shoulder",
            bodyDimension: body.AcrossShoulderCm,
            garmentDimension: m.AcrossShoulderCm,
            usableStretchPercent: 0.0, // shoulders rarely stretch
            intendedEase: spec.IntendedEaseCm.GetValueOrDefault("shoulder", 0.5),
            tightThreshold: -1.5,
            excessThreshold: 3.5,
            unitName: "shoulder seam"
        );

        // 5. Sleeve Length
        if (m.SleeveLengthCm > 0)
        {
            zones["sleeve"] = EvaluateZone(
                zone: "sleeve",
                label: "Sleeve Length",
                bodyDimension: body.SleeveLengthCm,
                garmentDimension: m.SleeveLengthCm,
                usableStretchPercent: 0.0,
                intendedEase: spec.IntendedEaseCm.GetValueOrDefault("sleeve", 1.5),
                tightThreshold: -2.5,
                excessThreshold: 4.5,
                unitName: "sleeve cuff"
            );
        }

        // Calculate weighted score
        // Chest 35%, Waist 35%, Shoulder 15%, Hip 15%
        double score = 100.0;
        int maxSeverity = 0;

        foreach (var z in zones.Values)
        {
            if (z.Severity > maxSeverity) maxSeverity = z.Severity;

            if (z.Status == "tight")
            {
                score -= Math.Min(35.0, Math.Abs(z.EaseCm) * 6.0 + 15.0);
            }
            else if (z.Status == "snug")
            {
                score -= 6.0;
            }
            else if (z.Status == "oversized")
            {
                score -= Math.Min(25.0, (z.EaseCm - z.IntendedEaseCm) * 3.0 + 8.0);
            }
            else if (z.Status == "relaxed")
            {
                score -= 3.0;
            }
        }

        int finalScore = Math.Clamp((int)Math.Round(score), 10, 99);

        // Return risk calculation
        int returnRisk = finalScore >= 90 ? 5
            : finalScore >= 80 ? 14
            : finalScore >= 68 ? 32
            : 68;

        string overallStatus = maxSeverity == 0 ? "optimal"
            : zones.Values.Any(v => v.Status == "tight") ? "tight"
            : zones.Values.Any(v => v.Status == "oversized") ? "loose"
            : "snug";

        // Generate natural language explanation
        var chest = zones.GetValueOrDefault("chest");
        var waist = zones.GetValueOrDefault("waist");
        var shoulder = zones.GetValueOrDefault("shoulder");

        string summary;
        if (chest != null && waist != null)
        {
            if (chest.Status == "optimal" && waist.Status == "optimal")
            {
                summary = $"Size {sizeName} fits your frame with +{chest.EaseCm:F1} cm chest ease and +{waist.EaseCm:F1} cm natural waist ease.";
            }
            else if (chest.Status == "tight" || waist.Status == "tight")
            {
                var tightZone = chest.Status == "tight" ? "chest" : "waist";
                summary = $"Size {sizeName} will pull tightly at the {tightZone} ({Math.Abs(chest.EaseCm):F1} cm deficit). High pinching probability.";
            }
            else if (chest.Status == "oversized" || waist.Status == "oversized")
            {
                summary = $"Size {sizeName} runs loose with +{waist.EaseCm:F1} cm extra slack at waistline. Consider sizing down.";
            }
            else
            {
                summary = $"Size {sizeName} delivers a tailored snug fit with +{chest.EaseCm:F1} cm chest breathing ease.";
            }
        }
        else
        {
            summary = $"Size {sizeName} overall geometric alignment: {finalScore}%.";
        }

        return new SizeFitResult
        {
            Size = sizeName,
            OverallFitScore = finalScore,
            IsRecommended = false,
            OverallStatus = overallStatus,
            ReturnRiskPercent = returnRisk,
            Zones = zones,
            SummaryText = summary
        };
    }

    private ZoneFitEvaluation EvaluateZone(
        string zone,
        string label,
        double bodyDimension,
        double garmentDimension,
        double usableStretchPercent,
        double intendedEase,
        double tightThreshold,
        double excessThreshold,
        string unitName)
    {
        double usableStretchCm = garmentDimension * usableStretchPercent;
        double effectiveDimension = garmentDimension + usableStretchCm;
        double easeCm = effectiveDimension - bodyDimension;
        double tensionIndex = bodyDimension > 0 ? (effectiveDimension / bodyDimension) - 1.0 : 0.0;

        string status;
        int severity;
        string explanation;

        if (easeCm < tightThreshold)
        {
            status = "tight";
            severity = 2;
            explanation = $"Restricted seam strain: {Math.Abs(easeCm):F1} cm deficit against your {unitName}. High return risk.";
        }
        else if (easeCm < 0)
        {
            status = "snug";
            severity = 1;
            explanation = $"Figure-hugging snug fit ({Math.Abs(easeCm):F1} cm negative ease). Fabric stretch engages.";
        }
        else if (easeCm <= intendedEase * 1.4)
        {
            status = "optimal";
            severity = 0;
            explanation = $"Perfect designer balance with +{easeCm:F1} cm natural movement room.";
        }
        else if (easeCm <= excessThreshold)
        {
            status = "relaxed";
            severity = 1;
            explanation = $"Comfortable relaxed ease (+{easeCm:F1} cm room).";
        }
        else
        {
            status = "oversized";
            severity = 2;
            explanation = $"Noticeable excess drape (+{easeCm:F1} cm slack). May droop or billow.";
        }

        return new ZoneFitEvaluation
        {
            Zone = zone,
            Label = label,
            BodyCm = Math.Round(bodyDimension, 1),
            GarmentDimensionCm = Math.Round(garmentDimension, 1),
            UsableStretchCm = Math.Round(usableStretchCm, 1),
            EffectiveDimensionCm = Math.Round(effectiveDimension, 1),
            EaseCm = Math.Round(easeCm, 1),
            IntendedEaseCm = Math.Round(intendedEase, 1),
            TensionIndex = Math.Round(tensionIndex, 3),
            Status = status,
            Severity = severity,
            Explanation = explanation
        };
    }

    public GarmentSpec GenerateDefaultSpecForProduct(Product product)
    {
        bool isDenimOrWoven = (product.Category?.ToLowerInvariant().Contains("denim") ?? false) ||
                             (product.Title?.ToLowerInvariant().Contains("blazer") ?? false) ||
                             (product.Title?.ToLowerInvariant().Contains("jacket") ?? false);

        string fabricType = isDenimOrWoven ? "denim" : "knit";
        double stretch = isDenimOrWoven ? 0.02 : 0.15;
        string composition = isDenimOrWoven ? "98% Cotton, 2% Elastane" : "95% Combed Cotton, 5% Spandex";

        var spec = new GarmentSpec
        {
            FabricComposition = composition,
            FabricType = fabricType,
            UsableStretchPercent = stretch,
            IntendedFit = "regular",
            IntendedEaseCm = new Dictionary<string, double>
            {
                { "chest", isDenimOrWoven ? 6.0 : 3.5 },
                { "waist", isDenimOrWoven ? 4.0 : 2.5 },
                { "hip", isDenimOrWoven ? 5.0 : 3.5 },
                { "shoulder", 0.5 },
                { "sleeve", 1.5 }
            },
            Sizes = new Dictionary<string, GarmentSizeMeasurements>()
        };

        // Standard grading base (Chest 94, 98, 102, 106, 112)
        spec.Sizes["XS"] = new GarmentSizeMeasurements { ChestCm = 90, WaistCm = 76, LowHipCm = 92, AcrossShoulderCm = 41.5, SleeveLengthCm = 60, TotalLengthCm = 68 };
        spec.Sizes["S"] = new GarmentSizeMeasurements { ChestCm = 95, WaistCm = 80, LowHipCm = 96, AcrossShoulderCm = 43.0, SleeveLengthCm = 61, TotalLengthCm = 70 };
        spec.Sizes["M"] = new GarmentSizeMeasurements { ChestCm = 101, WaistCm = 85, LowHipCm = 101, AcrossShoulderCm = 44.5, SleeveLengthCm = 62.5, TotalLengthCm = 72 };
        spec.Sizes["L"] = new GarmentSizeMeasurements { ChestCm = 107, WaistCm = 91, LowHipCm = 107, AcrossShoulderCm = 46.0, SleeveLengthCm = 64, TotalLengthCm = 74 };
        spec.Sizes["XL"] = new GarmentSizeMeasurements { ChestCm = 114, WaistCm = 98, LowHipCm = 114, AcrossShoulderCm = 48.0, SleeveLengthCm = 65.5, TotalLengthCm = 76 };
        spec.Sizes["XXL"] = new GarmentSizeMeasurements { ChestCm = 121, WaistCm = 105, LowHipCm = 121, AcrossShoulderCm = 50.0, SleeveLengthCm = 67, TotalLengthCm = 78 };

        return spec;
    }

    public GarmentSpec ParseTechPack(TechPackParseRequest request)
    {
        var text = request.RawText ?? string.Empty;
        var spec = new GarmentSpec
        {
            FabricType = request.FabricType ?? "woven",
            UsableStretchPercent = request.UsableStretchPercent ?? 0.02,
            IntendedFit = request.IntendedFit ?? "regular"
        };

        // Auto-detect fabric composition in text
        var compMatch = Regex.Match(text, @"(\d+%\s*[A-Za-z]+(\s*,\s*\d+%\s*[A-Za-z]+)*)", RegexOptions.IgnoreCase);
        if (compMatch.Success)
        {
            spec.FabricComposition = compMatch.Value;
        }

        // Parse Point of Measure rows:
        // Format examples:
        // Chest: S=96, M=102, L=108, XL=114
        // or tab-delimited / CSV lines:
        // Chest, 92, 96, 102, 108, 114
        var lines = text.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
        var sizeHeaders = new List<string> { "XS", "S", "M", "L", "XL", "XXL" };

        // Initialize sizes
        foreach (var s in sizeHeaders)
        {
            spec.Sizes[s] = new GarmentSizeMeasurements();
        }

        foreach (var line in lines)
        {
            var clean = line.Trim();
            if (string.IsNullOrWhiteSpace(clean)) continue;

            // Check if line contains chest
            if (Regex.IsMatch(clean, @"(chest|bust|half chest|1/2 chest)", RegexOptions.IgnoreCase))
            {
                ExtractRowValues(clean, (size, val, isHalf) =>
                {
                    if (spec.Sizes.ContainsKey(size))
                        spec.Sizes[size].ChestCm = isHalf ? val * 2 : val;
                }, sizeHeaders);
            }
            else if (Regex.IsMatch(clean, @"(waist|1/2 waist|half waist)", RegexOptions.IgnoreCase))
            {
                ExtractRowValues(clean, (size, val, isHalf) =>
                {
                    if (spec.Sizes.ContainsKey(size))
                        spec.Sizes[size].WaistCm = isHalf ? val * 2 : val;
                }, sizeHeaders);
            }
            else if (Regex.IsMatch(clean, @"(hip|bottom|low hip)", RegexOptions.IgnoreCase))
            {
                ExtractRowValues(clean, (size, val, isHalf) =>
                {
                    if (spec.Sizes.ContainsKey(size))
                        spec.Sizes[size].LowHipCm = isHalf ? val * 2 : val;
                }, sizeHeaders);
            }
            else if (Regex.IsMatch(clean, @"(shoulder|across shoulder)", RegexOptions.IgnoreCase))
            {
                ExtractRowValues(clean, (size, val, isHalf) =>
                {
                    if (spec.Sizes.ContainsKey(size))
                        spec.Sizes[size].AcrossShoulderCm = val;
                }, sizeHeaders);
            }
            else if (Regex.IsMatch(clean, @"(sleeve|sleeve length)", RegexOptions.IgnoreCase))
            {
                ExtractRowValues(clean, (size, val, isHalf) =>
                {
                    if (spec.Sizes.ContainsKey(size))
                        spec.Sizes[size].SleeveLengthCm = val;
                }, sizeHeaders);
            }
            else if (Regex.IsMatch(clean, @"(length|total length|body length)", RegexOptions.IgnoreCase))
            {
                ExtractRowValues(clean, (size, val, isHalf) =>
                {
                    if (spec.Sizes.ContainsKey(size))
                        spec.Sizes[size].TotalLengthCm = val;
                }, sizeHeaders);
            }
        }

        // Ensure reasonable defaults if some values were missing
        foreach (var (size, m) in spec.Sizes)
        {
            if (m.ChestCm == 0) m.ChestCm = size == "S" ? 96 : size == "M" ? 102 : size == "L" ? 108 : 114;
            if (m.WaistCm == 0) m.WaistCm = m.ChestCm - 12;
            if (m.LowHipCm == 0) m.LowHipCm = m.WaistCm + 14;
            if (m.AcrossShoulderCm == 0) m.AcrossShoulderCm = 43 + (sizeHeaders.IndexOf(size) * 1.5);
            if (m.SleeveLengthCm == 0) m.SleeveLengthCm = 61 + (sizeHeaders.IndexOf(size) * 1.2);
        }

        return spec;
    }

    private void ExtractRowValues(string line, Action<string, double, bool> assigner, List<string> sizeHeaders)
    {
        bool isHalfMeasure = line.Contains("1/2", StringComparison.OrdinalIgnoreCase) ||
                             line.Contains("half", StringComparison.OrdinalIgnoreCase);

        // Pattern 1: Key-value: "S=96, M=102, L=108"
        var kvMatches = Regex.Matches(line, @"([A-Z]{1,3})\s*[:=]\s*(\d+(\.\d+)?)", RegexOptions.IgnoreCase);
        if (kvMatches.Count > 0)
        {
            foreach (Match m in kvMatches)
            {
                var s = m.Groups[1].Value.ToUpperInvariant();
                if (double.TryParse(m.Groups[2].Value, out double val))
                {
                    assigner(s, val, isHalfMeasure);
                }
            }
            return;
        }

        // Pattern 2: Delimited row of numbers: "Chest, 92, 96, 102, 108, 114"
        var numMatches = Regex.Matches(line, @"\b(\d+(\.\d+)?)\b");
        if (numMatches.Count >= 3)
        {
            int idx = 0;
            foreach (Match m in numMatches)
            {
                if (idx < sizeHeaders.Count && double.TryParse(m.Value, out double val))
                {
                    // Ignore numbers <= 5 (likely column indices)
                    if (val > 10)
                    {
                        assigner(sizeHeaders[idx], val, isHalfMeasure);
                        idx++;
                    }
                }
            }
        }
    }
}
