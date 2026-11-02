using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using ShopifyEngine.Api.Services;

namespace ShopifyEngine.Api.Endpoints;

public static class CurrencyEndpoints
{
    public static IEndpointRouteBuilder MapCurrencyEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/currency").WithTags("Currency & Internationalization");

        // 1. Get Live Dynamic Exchange Rates
        group.MapGet("/rates", async (CurrencyService currencyService, string? baseCurrency) =>
        {
            var baseCurr = string.IsNullOrWhiteSpace(baseCurrency) ? "INR" : baseCurrency.Trim().ToUpperInvariant();
            var rates = await currencyService.GetExchangeRatesAsync(baseCurr);
            return Results.Ok(rates);
        })
        .WithName("GetExchangeRates")
        .WithSummary("Fetches real-time market exchange rates for INR, USD, EUR, GBP, and AED with 1-hour cache and resilient fallback.");

        // 2. Geo-IP Country & Currency Auto-Detection
        group.MapGet("/geo-ip", (HttpContext context, CurrencyService currencyService) =>
        {
            var detection = currencyService.DetectGeoIp(context);
            return Results.Ok(detection);
        })
        .WithName("DetectShopperGeoIp")
        .WithSummary("Auto-detects shopper country from Cloudflare / IP headers and recommends native shopping currency.");

        // 3. Currency Conversion Utility
        group.MapPost("/convert", async (CurrencyService currencyService, ConvertCurrencyRequest request) =>
        {
            if (request.Amount < 0) return Results.BadRequest(new { error = "Amount must be non-negative" });

            var rates = await currencyService.GetExchangeRatesAsync("INR");
            var from = request.FromCurrency?.ToUpperInvariant() ?? "INR";
            var to = request.ToCurrency?.ToUpperInvariant() ?? "USD";

            decimal amountInInr = from == "INR" 
                ? request.Amount 
                : (rates.InverseRates.TryGetValue(from, out var invRate) && invRate > 0 ? request.Amount * invRate : request.Amount);

            decimal targetRate = rates.Rates.TryGetValue(to, out var tr) ? tr : 1.0m;
            decimal converted = amountInInr * targetRate;

            return Results.Ok(new
            {
                fromCurrency = from,
                toCurrency = to,
                originalAmount = request.Amount,
                convertedAmount = Math.Round(converted, 2),
                effectiveRate = targetRate,
                lastUpdated = rates.LastUpdated
            });
        })
        .WithName("ConvertCurrency")
        .WithSummary("Utility endpoint to calculate converted prices on the server.");

        return app;
    }
}

public class ConvertCurrencyRequest
{
    public decimal Amount { get; set; }
    public string FromCurrency { get; set; } = "INR";
    public string ToCurrency { get; set; } = "USD";
}

