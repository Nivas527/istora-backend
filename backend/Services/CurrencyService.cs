using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace ShopifyEngine.Api.Services;

public class CurrencyService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<CurrencyService> _logger;

    // Cache rates for 60 minutes
    private static ExchangeRateResult? _cachedRates;
    private static DateTime _cacheExpiry = DateTime.MinValue;
    private static readonly object _lock = new();

    // Default static fallback rates relative to 1 INR (as of late 2026 / current market)
    private static readonly Dictionary<string, decimal> FallbackInrRates = new(StringComparer.OrdinalIgnoreCase)
    {
        { "INR", 1.00m },
        { "USD", 0.0118m }, // 1 USD ~ 84.75 INR
        { "EUR", 0.0110m }, // 1 EUR ~ 90.90 INR
        { "GBP", 0.0093m }, // 1 GBP ~ 107.50 INR
        { "AED", 0.0433m }  // 1 AED ~ 23.09 INR
    };

    public CurrencyService(ILogger<CurrencyService> logger)
    {
        _logger = logger;
        _httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(5)
        };
    }

    /// <summary>
    /// Fetches live exchange rates for INR, USD, EUR, GBP, and AED.
    /// Uses Open Exchange Rates API with automatic 1-hour cache and resilient fallback.
    /// </summary>
    public async Task<ExchangeRateResult> GetExchangeRatesAsync(string baseCurrency = "INR")
    {
        lock (_lock)
        {
            if (_cachedRates != null && DateTime.UtcNow < _cacheExpiry)
            {
                return _cachedRates;
            }
        }

        try
        {
            // Open Exchange API (ECB daily feed, high availability, free)
            var response = await _httpClient.GetFromJsonAsync<OpenErApiResponse>("https://open.er-api.com/v6/latest/INR");
            if (response != null && response.Rates != null && response.Rates.Count > 0)
            {
                var liveRates = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
                {
                    { "INR", 1.0m },
                    { "USD", response.Rates.GetValueOrDefault("USD", FallbackInrRates["USD"]) },
                    { "EUR", response.Rates.GetValueOrDefault("EUR", FallbackInrRates["EUR"]) },
                    { "GBP", response.Rates.GetValueOrDefault("GBP", FallbackInrRates["GBP"]) },
                    { "AED", response.Rates.GetValueOrDefault("AED", FallbackInrRates["AED"]) }
                };

                var inverseRates = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
                {
                    { "INR", 1.0m },
                    { "USD", liveRates["USD"] > 0 ? Math.Round(1.0m / liveRates["USD"], 2) : 84.75m },
                    { "EUR", liveRates["EUR"] > 0 ? Math.Round(1.0m / liveRates["EUR"], 2) : 90.90m },
                    { "GBP", liveRates["GBP"] > 0 ? Math.Round(1.0m / liveRates["GBP"], 2) : 107.50m },
                    { "AED", liveRates["AED"] > 0 ? Math.Round(1.0m / liveRates["AED"], 2) : 23.09m }
                };

                var result = new ExchangeRateResult
                {
                    BaseCurrency = "INR",
                    Rates = liveRates,
                    InverseRates = inverseRates,
                    Source = "Live Market Rates (Open Exchange API / ECB)",
                    LastUpdated = DateTime.UtcNow,
                    SupportedCurrencies = GetSupportedCurrenciesList()
                };

                lock (_lock)
                {
                    _cachedRates = result;
                    _cacheExpiry = DateTime.UtcNow.AddMinutes(60);
                }

                _logger.LogInformation("Fetched live currency exchange rates: USD={UsdRate}, EUR={EurRate}, GBP={GbpRate}, AED={AedRate}",
                    liveRates["USD"], liveRates["EUR"], liveRates["GBP"], liveRates["AED"]);

                return result;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch live exchange rates from external API. Using fallback rates.");
        }

        // Fallback rates
        var fallbackInverse = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
        {
            { "INR", 1.0m },
            { "USD", 84.75m },
            { "EUR", 90.90m },
            { "GBP", 107.50m },
            { "AED", 23.09m }
        };

        var fallbackResult = new ExchangeRateResult
        {
            BaseCurrency = "INR",
            Rates = FallbackInrRates,
            InverseRates = fallbackInverse,
            Source = "Market Benchmark Rates (Resilient Fallback)",
            LastUpdated = DateTime.UtcNow,
            SupportedCurrencies = GetSupportedCurrenciesList()
        };

        lock (_lock)
        {
            _cachedRates = fallbackResult;
            _cacheExpiry = DateTime.UtcNow.AddMinutes(15);
        }

        return fallbackResult;
    }

    /// <summary>
    /// Detects shopper location from Cloudflare headers, proxies, or client IP,
    /// returning recommended currency and country metadata.
    /// </summary>
    public GeoIpDetectionResult DetectGeoIp(HttpContext context)
    {
        var headers = context.Request.Headers;

        // 1. Check Cloudflare IP Country Header (provided natively on Cloudflare Pages / CDN)
        string countryCode = headers["CF-IPCountry"].ToString().Trim().ToUpperInvariant();

        // 2. Fallbacks for proxies or custom headers
        if (string.IsNullOrEmpty(countryCode) || countryCode == "XX" || countryCode == "T1")
        {
            countryCode = headers["X-Country-Code"].ToString().Trim().ToUpperInvariant();
        }

        // 3. Extract Client IP
        string clientIp = headers["CF-Connecting-IP"].ToString();
        if (string.IsNullOrEmpty(clientIp))
        {
            clientIp = headers["X-Forwarded-For"].ToString().Split(',')[0].Trim();
        }
        if (string.IsNullOrEmpty(clientIp))
        {
            clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        }

        // Default to India if localhost or not detected
        if (string.IsNullOrEmpty(countryCode) || countryCode.Length != 2)
        {
            countryCode = "IN";
        }

        return ResolveCurrencyForCountry(countryCode, clientIp);
    }

    /// <summary>
    /// Resolves recommended currency, flag, and formatting for a given ISO 3166-1 alpha-2 country code.
    /// </summary>
    public static GeoIpDetectionResult ResolveCurrencyForCountry(string countryCode, string? ip = null)
    {
        var code = (countryCode ?? "IN").ToUpperInvariant();

        // Country Mapping Rules
        if (code == "IN")
        {
            return new GeoIpDetectionResult
            {
                CountryCode = "IN",
                CountryName = "India",
                Flag = "🇮🇳",
                Currency = "INR",
                Symbol = "₹",
                Locale = "en-IN",
                ClientIp = ip ?? "127.0.0.1",
                Detected = true
            };
        }

        if (code == "GB")
        {
            return new GeoIpDetectionResult
            {
                CountryCode = "GB",
                CountryName = "United Kingdom",
                Flag = "🇬🇧",
                Currency = "GBP",
                Symbol = "£",
                Locale = "en-GB",
                ClientIp = ip ?? "127.0.0.1",
                Detected = true
            };
        }

        if (code is "AE" or "SA" or "QA" or "OM" or "KW" or "BH")
        {
            var countryName = code switch
            {
                "AE" => "United Arab Emirates",
                "SA" => "Saudi Arabia",
                "QA" => "Qatar",
                "OM" => "Oman",
                "KW" => "Kuwait",
                _ => "Bahrain"
            };
            var flag = code switch
            {
                "AE" => "🇦🇪",
                "SA" => "🇸🇦",
                "QA" => "🇶🇦",
                "OM" => "🇴🇲",
                "KW" => "🇰🇼",
                _ => "🇧🇭"
            };

            return new GeoIpDetectionResult
            {
                CountryCode = code,
                CountryName = countryName,
                Flag = flag,
                Currency = "AED",
                Symbol = "AED",
                Locale = "en-AE",
                ClientIp = ip ?? "127.0.0.1",
                Detected = true
            };
        }

        // Eurozone Countries
        var eurozone = new HashSet<string>
        {
            "DE", "FR", "IT", "ES", "NL", "BE", "AT", "IE", "PT", "FI",
            "GR", "CY", "EE", "LV", "LT", "LU", "MT", "SK", "SI", "HR"
        };

        if (eurozone.Contains(code))
        {
            return new GeoIpDetectionResult
            {
                CountryCode = code,
                CountryName = GetEuropeanCountryName(code),
                Flag = "🇪🇺",
                Currency = "EUR",
                Symbol = "€",
                Locale = "en-IE",
                ClientIp = ip ?? "127.0.0.1",
                Detected = true
            };
        }

        // All other international shoppers default to USD ($)
        return new GeoIpDetectionResult
        {
            CountryCode = code,
            CountryName = code == "US" ? "United States" : code == "CA" ? "Canada" : code == "AU" ? "Australia" : code == "SG" ? "Singapore" : "International",
            Flag = code == "US" ? "🇺🇸" : code == "CA" ? "🇨🇦" : code == "AU" ? "🇦🇺" : code == "SG" ? "🇸🇬" : "🌐",
            Currency = "USD",
            Symbol = "$",
            Locale = "en-US",
            ClientIp = ip ?? "127.0.0.1",
            Detected = true
        };
    }

    private static string GetEuropeanCountryName(string code) => code switch
    {
        "DE" => "Germany",
        "FR" => "France",
        "IT" => "Italy",
        "ES" => "Spain",
        "NL" => "Netherlands",
        "BE" => "Belgium",
        "AT" => "Austria",
        "IE" => "Ireland",
        "PT" => "Portugal",
        "FI" => "Finland",
        _ => "European Union"
    };

    public static List<CurrencyInfoDto> GetSupportedCurrenciesList()
    {
        return new List<CurrencyInfoDto>
        {
            new() { Code = "INR", Name = "Indian Rupee", Symbol = "₹", Flag = "🇮🇳", Locale = "en-IN", Decimals = 0 },
            new() { Code = "USD", Name = "US Dollar", Symbol = "$", Flag = "🇺🇸", Locale = "en-US", Decimals = 2 },
            new() { Code = "EUR", Name = "Euro", Symbol = "€", Flag = "🇪🇺", Locale = "en-IE", Decimals = 2 },
            new() { Code = "GBP", Name = "British Pound", Symbol = "£", Flag = "🇬🇧", Locale = "en-GB", Decimals = 2 },
            new() { Code = "AED", Name = "UAE Dirham", Symbol = "AED", Flag = "🇦🇪", Locale = "en-AE", Decimals = 2 }
        };
    }
}

public class ExchangeRateResult
{
    public string BaseCurrency { get; set; } = "INR";
    public Dictionary<string, decimal> Rates { get; set; } = new();
    public Dictionary<string, decimal> InverseRates { get; set; } = new();
    public string Source { get; set; } = string.Empty;
    public DateTime LastUpdated { get; set; }
    public List<CurrencyInfoDto> SupportedCurrencies { get; set; } = new();
}

public class GeoIpDetectionResult
{
    public string CountryCode { get; set; } = "IN";
    public string CountryName { get; set; } = "India";
    public string Flag { get; set; } = "🇮🇳";
    public string Currency { get; set; } = "INR";
    public string Symbol { get; set; } = "₹";
    public string Locale { get; set; } = "en-IN";
    public string ClientIp { get; set; } = "127.0.0.1";
    public bool Detected { get; set; } = true;
}

public class CurrencyInfoDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Symbol { get; set; } = string.Empty;
    public string Flag { get; set; } = string.Empty;
    public string Locale { get; set; } = string.Empty;
    public int Decimals { get; set; } = 2;
}

public class OpenErApiResponse
{
    [JsonPropertyName("result")]
    public string? Result { get; set; }

    [JsonPropertyName("base_code")]
    public string? BaseCode { get; set; }

    [JsonPropertyName("rates")]
    public Dictionary<string, decimal>? Rates { get; set; }
}

