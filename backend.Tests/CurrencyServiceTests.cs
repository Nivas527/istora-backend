using System.Collections.Generic;
using Microsoft.Extensions.Logging.Abstractions;
using ShopifyEngine.Api.Services;
using Xunit;

namespace backend.Tests;

public class CurrencyServiceTests
{
    private readonly CurrencyService _currencyService;

    public CurrencyServiceTests()
    {
        _currencyService = new CurrencyService(NullLogger<CurrencyService>.Instance);
    }

    [Fact]
    public async Task GetExchangeRatesAsync_ReturnsValidSupportedCurrencies()
    {
        var result = await _currencyService.GetExchangeRatesAsync("INR");

        Assert.NotNull(result);
        Assert.Equal("INR", result.BaseCurrency);
        Assert.NotEmpty(result.Rates);
        Assert.Contains("USD", result.Rates.Keys);
        Assert.Contains("EUR", result.Rates.Keys);
        Assert.Contains("GBP", result.Rates.Keys);
        Assert.Contains("AED", result.Rates.Keys);

        // All rates must be positive numbers
        foreach (var rate in result.Rates.Values)
        {
            Assert.True(rate > 0, "Exchange rates must be strictly positive");
        }
    }

    [Fact]
    public async Task GetExchangeRatesAsync_ReturnsValidInverseRates()
    {
        var result = await _currencyService.GetExchangeRatesAsync("INR");

        Assert.NotNull(result.InverseRates);
        Assert.True(result.InverseRates["USD"] > 50, "1 USD in INR should realistically be > 50");
        Assert.True(result.InverseRates["EUR"] > 50, "1 EUR in INR should realistically be > 50");
        Assert.True(result.InverseRates["GBP"] > 50, "1 GBP in INR should realistically be > 50");
    }

    [Fact]
    public void SupportedCurrencies_ContainsExpectedCurrenciesWithSymbols()
    {
        var list = CurrencyService.GetSupportedCurrenciesList();

        Assert.NotNull(list);
        Assert.True(list.Count >= 5);
        Assert.Contains(list, c => c.Code == "INR" && c.Symbol == "₹");
        Assert.Contains(list, c => c.Code == "USD" && c.Symbol == "$");
        Assert.Contains(list, c => c.Code == "EUR" && c.Symbol == "€");
        Assert.Contains(list, c => c.Code == "GBP" && c.Symbol == "£");
    }
}

