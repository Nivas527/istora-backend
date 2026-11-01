using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ShopifyEngine.Api.Data;
using ShopifyEngine.Api.Models;

namespace ShopifyEngine.Api.Services;

public class TaxReportingService
{
    private readonly ShopifyDbContext _db;
    private readonly ILogger<TaxReportingService> _logger;

    public TaxReportingService(ShopifyDbContext db, ILogger<TaxReportingService> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Computes GSTR-1 government return tables (Table 4 B2B, Table 7 B2CS, Table 12 HSN)
    /// </summary>
    public async Task<Gstr1ReportResponse> GetGstr1ReportAsync(string? storeId = null, string? period = "current_month")
    {
        var tenantId = HttpTenantProvider.NormalizeStoreId(!string.IsNullOrWhiteSpace(storeId) ? storeId : "store_apex");
        var store = await _db.Stores.AsNoTracking().IgnoreQueryFilters().FirstOrDefaultAsync(s => s.Id == tenantId);

        var query = _db.Orders.AsNoTracking().IgnoreQueryFilters().Where(o => o.StoreId == tenantId);
        var orders = await query.ToListAsync();

        var sellerStateCode = store?.StateCode ?? "29";
        var sellerGstin = store?.Gstin ?? "29AABCU9603R1ZM";
        decimal defaultRate = store?.GstRatePercent ?? 18m;

        var b2b = new List<Gstr1B2bItem>();
        var b2cl = new List<Gstr1B2clItem>();
        var b2csMap = new Dictionary<string, Gstr1B2csItem>();
        var hsnMap = new Dictionary<string, Gstr1HsnItem>();

        decimal totalGross = 0m;
        decimal totalTaxable = 0m;
        decimal totalCgst = 0m;
        decimal totalSgst = 0m;
        decimal totalIgst = 0m;

        foreach (var ord in orders)
        {
            totalGross += ord.Total;
            var isB2B = ord.IsB2B && !string.IsNullOrWhiteSpace(ord.CustomerGstin);
            var buyerState = ord.BuyerStateCode ?? "29";
            var isIntraState = sellerStateCode == buyerState;

            var invNumber = ord.InvoiceNumber ?? $"INV-2026/{(ord.OrderNumber ?? ord.Id).Replace("#", "")}";
            var invDate = DateTime.TryParse(ord.CreatedAt, out var dt) ? dt.ToString("yyyy-MM-dd") : DateTime.UtcNow.ToString("yyyy-MM-dd");

            decimal taxableVal = ord.TaxableAmount > 0 ? ord.TaxableAmount : Math.Round(ord.Total / (1m + (defaultRate / 100m)), 2);
            decimal totalTax = ord.Total - taxableVal;
            decimal cgst = isIntraState ? Math.Round(totalTax / 2m, 2) : 0m;
            decimal sgst = isIntraState ? (totalTax - cgst) : 0m;
            decimal igst = isIntraState ? 0m : totalTax;

            totalTaxable += taxableVal;
            totalCgst += cgst;
            totalSgst += sgst;
            totalIgst += igst;

            var posName = $"{buyerState}-State";

            if (isB2B)
            {
                b2b.Add(new Gstr1B2bItem
                {
                    GstinRecipient = ord.CustomerGstin ?? "",
                    ReceiverName = ord.CustomerCompanyName ?? ord.CustomerName,
                    InvoiceNumber = invNumber,
                    InvoiceDate = invDate,
                    InvoiceValue = ord.Total,
                    PlaceOfSupply = posName,
                    Rate = defaultRate,
                    TaxableValue = taxableVal,
                    Cgst = cgst,
                    Sgst = sgst,
                    Igst = igst
                });
            }
            else
            {
                if (!isIntraState && ord.Total > 250000m)
                {
                    b2cl.Add(new Gstr1B2clItem
                    {
                        InvoiceNumber = invNumber,
                        InvoiceDate = invDate,
                        InvoiceValue = ord.Total,
                        PlaceOfSupply = posName,
                        Rate = defaultRate,
                        TaxableValue = taxableVal,
                        Igst = igst
                    });
                }
                else
                {
                    var key = $"{posName}_{defaultRate}";
                    if (!b2csMap.TryGetValue(key, out var b2cs))
                    {
                        b2cs = new Gstr1B2csItem
                        {
                            Type = "E",
                            PlaceOfSupply = posName,
                            Rate = defaultRate,
                            TaxableValue = 0m,
                            EcommerceGstin = sellerGstin
                        };
                        b2csMap[key] = b2cs;
                    }
                    b2cs.TaxableValue += taxableVal;
                }
            }

            // HSN Summary aggregation
            var hsnCode = store?.DefaultHsnCode ?? "6109";
            if (!hsnMap.TryGetValue(hsnCode, out var hsnItem))
            {
                hsnItem = new Gstr1HsnItem
                {
                    Hsn = hsnCode,
                    Description = "Ready-made Garments & Apparel Goods",
                    Uqc = "PCS",
                    TotalQuantity = 0,
                    TotalValue = 0m,
                    TaxableValue = 0m,
                    Cgst = 0m,
                    Sgst = 0m,
                    Igst = 0m
                };
                hsnMap[hsnCode] = hsnItem;
            }

            hsnItem.TotalQuantity += 1;
            hsnItem.TotalValue += ord.Total;
            hsnItem.TaxableValue += taxableVal;
            hsnItem.Cgst += cgst;
            hsnItem.Sgst += sgst;
            hsnItem.Igst += igst;
        }

        return new Gstr1ReportResponse
        {
            Period = period ?? "current_month",
            SellerGstin = sellerGstin,
            LegalBusinessName = store?.LegalBusinessName ?? "Apex Commerce India Pvt. Ltd.",
            TotalOrdersCount = orders.Count,
            TotalGrossValue = totalGross,
            TotalTaxableValue = totalTaxable,
            TotalCgst = totalCgst,
            TotalSgst = totalSgst,
            TotalIgst = totalIgst,
            TotalTax = totalCgst + totalSgst + totalIgst,
            B2bInvoices = b2b,
            B2clInvoices = b2cl,
            B2csSupplies = b2csMap.Values.ToList(),
            HsnSummary = hsnMap.Values.ToList()
        };
    }

    /// <summary>
    /// Generates Tally Prime Sales XML
    /// </summary>
    public async Task<string> GenerateTallyXmlAsync(string? storeId = null)
    {
        var report = await GetGstr1ReportAsync(storeId);
        var sb = new StringBuilder();
        sb.AppendLine("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
        sb.AppendLine("<ENVELOPE>");
        sb.AppendLine("  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>");
        sb.AppendLine("  <BODY>");
        sb.AppendLine("    <IMPORTDATA>");
        sb.AppendLine("      <REQUESTDATA>");

        foreach (var b2b in report.B2bInvoices)
        {
            sb.AppendLine("        <TALLYMESSAGE xmlns:UDF=\"TallyUDF\">");
            sb.AppendLine("          <VOUCHER VCHTYPE=\"Sales\" ACTION=\"Create\">");
            sb.AppendLine($"            <DATE>{b2b.InvoiceDate.Replace("-", "")}</DATE>");
            sb.AppendLine("            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>");
            sb.AppendLine($"            <VOUCHERNUMBER>{b2b.InvoiceNumber}</VOUCHERNUMBER>");
            sb.AppendLine($"            <PARTYLEDGERNAME>{b2b.ReceiverName}</PARTYLEDGERNAME>");
            sb.AppendLine($"            <PARTYGSTIN>{b2b.GstinRecipient}</PARTYGSTIN>");
            sb.AppendLine("            <ALLLEDGERENTRIES.LIST>");
            sb.AppendLine($"              <LEDGERNAME>{b2b.ReceiverName}</LEDGERNAME>");
            sb.AppendLine("              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>");
            sb.AppendLine($"              <AMOUNT>-{b2b.InvoiceValue:F2}</AMOUNT>");
            sb.AppendLine("            </ALLLEDGERENTRIES.LIST>");
            sb.AppendLine("            <ALLLEDGERENTRIES.LIST>");
            sb.AppendLine("              <LEDGERNAME>Sales Account 18%</LEDGERNAME>");
            sb.AppendLine("              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>");
            sb.AppendLine($"              <AMOUNT>{b2b.TaxableValue:F2}</AMOUNT>");
            sb.AppendLine("            </ALLLEDGERENTRIES.LIST>");
            if (b2b.Cgst > 0)
            {
                sb.AppendLine("            <ALLLEDGERENTRIES.LIST>");
                sb.AppendLine("              <LEDGERNAME>Output CGST 9%</LEDGERNAME>");
                sb.AppendLine("              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>");
                sb.AppendLine($"              <AMOUNT>{b2b.Cgst:F2}</AMOUNT>");
                sb.AppendLine("            </ALLLEDGERENTRIES.LIST>");
            }
            if (b2b.Sgst > 0)
            {
                sb.AppendLine("            <ALLLEDGERENTRIES.LIST>");
                sb.AppendLine("              <LEDGERNAME>Output SGST 9%</LEDGERNAME>");
                sb.AppendLine("              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>");
                sb.AppendLine($"              <AMOUNT>{b2b.Sgst:F2}</AMOUNT>");
                sb.AppendLine("            </ALLLEDGERENTRIES.LIST>");
            }
            if (b2b.Igst > 0)
            {
                sb.AppendLine("            <ALLLEDGERENTRIES.LIST>");
                sb.AppendLine("              <LEDGERNAME>Output IGST 18%</LEDGERNAME>");
                sb.AppendLine("              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>");
                sb.AppendLine($"              <AMOUNT>{b2b.Igst:F2}</AMOUNT>");
                sb.AppendLine("            </ALLLEDGERENTRIES.LIST>");
            }
            sb.AppendLine("          </VOUCHER>");
            sb.AppendLine("        </TALLYMESSAGE>");
        }

        foreach (var b2c in report.B2csSupplies)
        {
            var dateStr = DateTime.UtcNow.ToString("yyyyMMdd");
            var gross = b2c.TaxableValue * 1.18m;
            var cgst = b2c.TaxableValue * 0.09m;
            var sgst = b2c.TaxableValue * 0.09m;
            sb.AppendLine("        <TALLYMESSAGE xmlns:UDF=\"TallyUDF\">");
            sb.AppendLine("          <VOUCHER VCHTYPE=\"Sales\" ACTION=\"Create\">");
            sb.AppendLine($"            <DATE>{dateStr}</DATE>");
            sb.AppendLine("            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>");
            sb.AppendLine($"            <VOUCHERNUMBER>B2C-{b2c.PlaceOfSupply.Replace("-", "")}</VOUCHERNUMBER>");
            sb.AppendLine("            <PARTYLEDGERNAME>Sundry Debtors - E-Commerce Retail</PARTYLEDGERNAME>");
            sb.AppendLine("            <ALLLEDGERENTRIES.LIST>");
            sb.AppendLine("              <LEDGERNAME>Sundry Debtors - E-Commerce Retail</LEDGERNAME>");
            sb.AppendLine("              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>");
            sb.AppendLine($"              <AMOUNT>-{gross:F2}</AMOUNT>");
            sb.AppendLine("            </ALLLEDGERENTRIES.LIST>");
            sb.AppendLine("            <ALLLEDGERENTRIES.LIST>");
            sb.AppendLine("              <LEDGERNAME>Sales Account 18%</LEDGERNAME>");
            sb.AppendLine("              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>");
            sb.AppendLine($"              <AMOUNT>{b2c.TaxableValue:F2}</AMOUNT>");
            sb.AppendLine("            </ALLLEDGERENTRIES.LIST>");
            sb.AppendLine("            <ALLLEDGERENTRIES.LIST>");
            sb.AppendLine("              <LEDGERNAME>Output CGST 9%</LEDGERNAME>");
            sb.AppendLine("              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>");
            sb.AppendLine($"              <AMOUNT>{cgst:F2}</AMOUNT>");
            sb.AppendLine("            </ALLLEDGERENTRIES.LIST>");
            sb.AppendLine("            <ALLLEDGERENTRIES.LIST>");
            sb.AppendLine("              <LEDGERNAME>Output SGST 9%</LEDGERNAME>");
            sb.AppendLine("              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>");
            sb.AppendLine($"              <AMOUNT>{sgst:F2}</AMOUNT>");
            sb.AppendLine("            </ALLLEDGERENTRIES.LIST>");
            sb.AppendLine("          </VOUCHER>");
            sb.AppendLine("        </TALLYMESSAGE>");
        }

        sb.AppendLine("      </REQUESTDATA>");
        sb.AppendLine("    </IMPORTDATA>");
        sb.AppendLine("  </BODY>");
        sb.AppendLine("</ENVELOPE>");
        return sb.ToString();
    }
}

public class Gstr1ReportResponse
{
    public string Period { get; set; } = "current_month";
    public string SellerGstin { get; set; } = string.Empty;
    public string LegalBusinessName { get; set; } = string.Empty;
    public int TotalOrdersCount { get; set; }
    public decimal TotalGrossValue { get; set; }
    public decimal TotalTaxableValue { get; set; }
    public decimal TotalCgst { get; set; }
    public decimal TotalSgst { get; set; }
    public decimal TotalIgst { get; set; }
    public decimal TotalTax { get; set; }
    public List<Gstr1B2bItem> B2bInvoices { get; set; } = new();
    public List<Gstr1B2clItem> B2clInvoices { get; set; } = new();
    public List<Gstr1B2csItem> B2csSupplies { get; set; } = new();
    public List<Gstr1HsnItem> HsnSummary { get; set; } = new();
}

public class Gstr1B2bItem
{
    public string GstinRecipient { get; set; } = string.Empty;
    public string ReceiverName { get; set; } = string.Empty;
    public string InvoiceNumber { get; set; } = string.Empty;
    public string InvoiceDate { get; set; } = string.Empty;
    public decimal InvoiceValue { get; set; }
    public string PlaceOfSupply { get; set; } = string.Empty;
    public decimal Rate { get; set; }
    public decimal TaxableValue { get; set; }
    public decimal Cgst { get; set; }
    public decimal Sgst { get; set; }
    public decimal Igst { get; set; }
}

public class Gstr1B2clItem
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public string InvoiceDate { get; set; } = string.Empty;
    public decimal InvoiceValue { get; set; }
    public string PlaceOfSupply { get; set; } = string.Empty;
    public decimal Rate { get; set; }
    public decimal TaxableValue { get; set; }
    public decimal Igst { get; set; }
}

public class Gstr1B2csItem
{
    public string Type { get; set; } = "E";
    public string PlaceOfSupply { get; set; } = string.Empty;
    public decimal Rate { get; set; }
    public decimal TaxableValue { get; set; }
    public string EcommerceGstin { get; set; } = string.Empty;
}

public class Gstr1HsnItem
{
    public string Hsn { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Uqc { get; set; } = "PCS";
    public int TotalQuantity { get; set; }
    public decimal TotalValue { get; set; }
    public decimal TaxableValue { get; set; }
    public decimal Cgst { get; set; }
    public decimal Sgst { get; set; }
    public decimal Igst { get; set; }
}
