using ShopifyEngine.Api.Services;

namespace ShopifyEngine.Api.Endpoints;

public static class TaxReportingEndpoints
{
    public static IEndpointRouteBuilder MapTaxReportingEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/reports").WithTags("GST Returns & Accounting Exports (GSTR-1, Tally, Zoho Books)");

        // 1. GSTR-1 Structured Data (Tables 4 B2B, 5 B2CL, 7 B2CS, 12 HSN Summary)
        group.MapGet("/gstr1", async (string? storeId, string? period, TaxReportingService taxReporting) =>
        {
            var report = await taxReporting.GetGstr1ReportAsync(storeId, period);
            return Results.Ok(report);
        }).WithName("GetGstr1Report")
          .WithSummary("Government-compliant GSTR-1 monthly sales report (B2B, B2CL, B2CS, and HSN Summary)");

        // 2. Tally Prime XML Export
        group.MapGet("/accounting/tally-xml", async (string? storeId, TaxReportingService taxReporting) =>
        {
            var xml = await taxReporting.GenerateTallyXmlAsync(storeId);
            return Results.Content(xml, "application/xml; charset=utf-8");
        }).WithName("GetTallyXml")
          .WithSummary("Export automated sales vouchers formatted for direct import into Tally Prime");

        return app;
    }
}

