/**
 * GSTR-1 & Accounting (Tally / Zoho Books) Export Engine
 * 
 * Generates official GSTN-compliant GSTR-1 CSV/Excel tables:
 * 1. Table 4: B2B Invoices (with Buyer GSTIN)
 * 2. Table 5: B2C Large Invoices (Inter-State > ₹2.5L)
 * 3. Table 7: B2C Small Details (Aggregated by POS & Tax Rate)
 * 4. Table 12: HSN Summary of Outward Supplies
 * 5. Tally Prime XML (Import-Ready Sales Vouchers)
 * 6. Zoho Books Invoices CSV
 */

import { INDIAN_GST_STATES, resolveStateCode, calculateGstTax } from './gstUtils';

/**
 * Filter orders by date period (month, quarter, or custom range)
 */
export function filterOrdersByPeriod(orders = [], period = 'current_month') {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  return (orders || []).filter((ord) => {
    if (!ord.createdAt) return true;
    const ordDate = new Date(ord.createdAt);
    if (isNaN(ordDate.getTime())) return true;

    if (period === 'current_month') {
      return ordDate.getFullYear() === currentYear && ordDate.getMonth() === currentMonth;
    }
    if (period === 'last_month') {
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return ordDate.getFullYear() === prevYear && ordDate.getMonth() === prevMonth;
    }
    if (period === 'quarter') {
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      return (
        ordDate.getFullYear() === currentYear &&
        ordDate.getMonth() >= quarterStartMonth &&
        ordDate.getMonth() <= quarterStartMonth + 2
      );
    }
    return true; // 'all'
  });
}

/**
 * Compute statutory summary of GSTR-1 tables from a list of orders
 */
export function computeGstr1Data(orders = [], store = {}) {
  const sellerStateCode = store?.stateCode || '29';
  const sellerGstin = store?.gstin || '29AABCU9603R1ZM';
  const pricesIncludeGst = Boolean(store?.pricesIncludeGst);
  const defaultRate = typeof store?.gstRatePercent === 'number' ? store.gstRatePercent : 18;

  const b2bList = [];
  const b2clList = [];
  const b2csMap = {};
  const hsnMap = {};

  let totalGross = 0;
  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  orders.forEach((ord) => {
    const isB2B = Boolean(ord.isB2B && ord.customerGstin);
    const buyerStateCode = ord.buyerStateCode || resolveStateCode(ord.customer?.state || ord.customer?.city || 'Karnataka');
    const isIntraState = sellerStateCode === buyerStateCode;
    const invNumber = ord.invoiceNumber || `INV-2026/${(ord.orderNumber || ord.id || '').replace(/[^0-9]/g, '') || '1001'}`;
    const invDate = ord.createdAt
      ? new Date(ord.createdAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    const invValue = Number(ord.total) || 0;

    totalGross += invValue;

    // Calculate item tax breakdown
    const taxCalc = calculateGstTax({
      items: ord.items || [],
      merchantStateCode: sellerStateCode,
      buyerStateCode,
      defaultGstRate: defaultRate,
      pricesIncludeGst
    });

    const taxableVal = ord.taxableAmount > 0 ? ord.taxableAmount : taxCalc.totalTaxableValue;
    const cgstVal = ord.cgstAmount > 0 ? ord.cgstAmount : taxCalc.totalCgst;
    const sgstVal = ord.sgstAmount > 0 ? ord.sgstAmount : taxCalc.totalSgst;
    const igstVal = ord.igstAmount > 0 ? ord.igstAmount : taxCalc.totalIgst;

    totalTaxable += taxableVal;
    totalCgst += cgstVal;
    totalSgst += sgstVal;
    totalIgst += igstVal;

    const posState = INDIAN_GST_STATES.find((s) => s.code === buyerStateCode);
    const posName = posState ? `${buyerStateCode}-${posState.name}` : `${buyerStateCode}-Karnataka`;

    // 1. Table 4: B2B Invoices
    if (isB2B) {
      b2bList.push({
        gstinRecipient: ord.customerGstin.trim().toUpperCase(),
        receiverName: ord.customerCompanyName || ord.customerName || 'Trade Buyer',
        invoiceNumber: invNumber,
        invoiceDate: invDate,
        invoiceValue: invValue,
        placeOfSupply: posName,
        reverseCharge: 'N',
        applicableTaxRate: '',
        invoiceType: 'Regular',
        ecommerceGstin: '',
        rate: defaultRate,
        taxableValue: Math.round(taxableVal * 100) / 100,
        cgst: Math.round(cgstVal * 100) / 100,
        sgst: Math.round(sgstVal * 100) / 100,
        igst: Math.round(igstVal * 100) / 100,
        cess: 0
      });
    } else {
      // 2. Table 5: B2C Large (Inter-state & Invoice Value > ₹2.5 Lakhs)
      if (!isIntraState && invValue > 250000) {
        b2clList.push({
          invoiceNumber: invNumber,
          invoiceDate: invDate,
          invoiceValue: invValue,
          placeOfSupply: posName,
          applicableTaxRate: '',
          rate: defaultRate,
          taxableValue: Math.round(taxableVal * 100) / 100,
          igst: Math.round(igstVal * 100) / 100,
          cess: 0,
          ecommerceGstin: ''
        });
      } else {
        // 3. Table 7: B2C Small (Aggregated by POS and Rate)
        const key = `${posName}_${defaultRate}`;
        if (!b2csMap[key]) {
          b2csMap[key] = {
            type: 'E', // E-Commerce Supply
            placeOfSupply: posName,
            rate: defaultRate,
            applicableTaxRate: '',
            taxableValue: 0,
            cess: 0,
            ecommerceGstin: sellerGstin
          };
        }
        b2csMap[key].taxableValue += taxableVal;
      }
    }

    // 4. Table 12: HSN Summary Aggregation
    const rawItems = Array.isArray(ord.items) && ord.items.length > 0 ? ord.items : [{ quantity: 1, price: ord.total }];
    rawItems.forEach((item) => {
      const hsn = item.hsnCode || item.hsn || (item.product?.hsnCode) || '6109';
      const desc = item.title || item.name || 'Apparel & Ready-made Garments';
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.price) || 0;
      const lineTotal = unitPrice * qty;

      if (!hsnMap[hsn]) {
        hsnMap[hsn] = {
          hsn,
          description: desc,
          uqc: 'PCS',
          totalQty: 0,
          totalValue: 0,
          taxableValue: 0,
          igst: 0,
          cgst: 0,
          sgst: 0,
          cess: 0
        };
      }

      const itemTaxable = pricesIncludeGst ? Math.round((lineTotal / (1 + defaultRate / 100)) * 100) / 100 : lineTotal;
      const itemTax = lineTotal - itemTaxable;

      hsnMap[hsn].totalQty += qty;
      hsnMap[hsn].totalValue += lineTotal;
      hsnMap[hsn].taxableValue += itemTaxable;

      if (isIntraState) {
        hsnMap[hsn].cgst += itemTax / 2;
        hsnMap[hsn].sgst += itemTax / 2;
      } else {
        hsnMap[hsn].igst += itemTax;
      }
    });
  });

  const b2csList = Object.values(b2csMap).map((item) => ({
    ...item,
    taxableValue: Math.round(item.taxableValue * 100) / 100
  }));

  const hsnList = Object.values(hsnMap).map((h) => ({
    ...h,
    totalValue: Math.round(h.totalValue * 100) / 100,
    taxableValue: Math.round(h.taxableValue * 100) / 100,
    igst: Math.round(h.igst * 100) / 100,
    cgst: Math.round(h.cgst * 100) / 100,
    sgst: Math.round(h.sgst * 100) / 100
  }));

  return {
    periodOrdersCount: orders.length,
    totalGross: Math.round(totalGross * 100) / 100,
    totalTaxable: Math.round(totalTaxable * 100) / 100,
    totalCgst: Math.round(totalCgst * 100) / 100,
    totalSgst: Math.round(totalSgst * 100) / 100,
    totalIgst: Math.round(totalIgst * 100) / 100,
    totalTax: Math.round((totalCgst + totalSgst + totalIgst) * 100) / 100,
    sellerGstin,
    b2bList,
    b2clList,
    b2csList,
    hsnList
  };
}

/**
 * Convert array of objects to CSV string
 */
function toCsvString(headers = [], rows = []) {
  const headerLine = headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',');
  const rowLines = rows.map((r) =>
    r
      .map((val) => {
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(',')
  );
  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Trigger browser file download
 */
export function downloadFile(content, fileName, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 1. Export GSTR-1 Table 4 (B2B Invoices CSV)
 */
export function exportGstr1B2bCsv(data, periodLabel = '2026-11') {
  const headers = [
    'GSTIN/UIN of Recipient',
    'Receiver Name',
    'Invoice Number',
    'Invoice date',
    'Invoice Value',
    'Place Of Supply',
    'Reverse Charge',
    'Applicable % of Tax Rate',
    'Invoice Type',
    'E-Commerce GSTIN',
    'Rate',
    'Taxable Value',
    'Cess Amount'
  ];

  const rows = data.b2bList.map((item) => [
    item.gstinRecipient,
    item.receiverName,
    item.invoiceNumber,
    item.invoiceDate,
    item.invoiceValue.toFixed(2),
    item.placeOfSupply,
    item.reverseCharge,
    item.applicableTaxRate,
    item.invoiceType,
    item.ecommerceGstin,
    item.rate.toFixed(2),
    item.taxableValue.toFixed(2),
    item.cess.toFixed(2)
  ]);

  const csv = toCsvString(headers, rows);
  downloadFile(csv, `GSTR1_B2B_${periodLabel}.csv`);
}

/**
 * 2. Export GSTR-1 Table 7 (B2C Small CSV)
 */
export function exportGstr1B2csCsv(data, periodLabel = '2026-11') {
  const headers = [
    'Type',
    'Place Of Supply',
    'Rate',
    'Applicable % of Tax Rate',
    'Taxable Value',
    'Cess Amount',
    'E-Commerce GSTIN'
  ];

  const rows = data.b2csList.map((item) => [
    item.type,
    item.placeOfSupply,
    item.rate.toFixed(2),
    item.applicableTaxRate,
    item.taxableValue.toFixed(2),
    item.cess.toFixed(2),
    item.ecommerceGstin
  ]);

  const csv = toCsvString(headers, rows);
  downloadFile(csv, `GSTR1_B2CS_${periodLabel}.csv`);
}

/**
 * 3. Export GSTR-1 Table 12 (HSN Summary CSV)
 */
export function exportGstr1HsnCsv(data, periodLabel = '2026-11') {
  const headers = [
    'HSN',
    'Description',
    'UQC',
    'Total Quantity',
    'Total Value',
    'Taxable Value',
    'Integrated Tax Amount',
    'Central Tax Amount',
    'State/UT Tax Amount',
    'Cess Amount'
  ];

  const rows = data.hsnList.map((item) => [
    item.hsn,
    item.description,
    item.uqc,
    item.totalQty.toString(),
    item.totalValue.toFixed(2),
    item.taxableValue.toFixed(2),
    item.igst.toFixed(2),
    item.cgst.toFixed(2),
    item.sgst.toFixed(2),
    item.cess.toFixed(2)
  ]);

  const csv = toCsvString(headers, rows);
  downloadFile(csv, `GSTR1_HSN_Summary_${periodLabel}.csv`);
}

/**
 * 4. Export Combined Complete GSTR-1 Master CSV
 */
export function exportCompleteGstr1Package(data, periodLabel = '2026-11') {
  let combined = '';

  // Section 1: Summary Header
  combined += `=== GSTR-1 OUTWARD SUPPLIES REPORT (${periodLabel}) ===\r\n`;
  combined += `Store GSTIN: ${data.sellerGstin}, Total Orders: ${data.periodOrdersCount}, Total Gross: INR ${data.totalGross}, Total Taxable: INR ${data.totalTaxable}, Total Tax: INR ${data.totalTax}\r\n\r\n`;

  // Section 2: Table 4 B2B
  combined += `--- TABLE 4: B2B INVOICES ---\r\n`;
  const b2bHeaders = [
    'GSTIN/UIN of Recipient',
    'Receiver Name',
    'Invoice Number',
    'Invoice date',
    'Invoice Value',
    'Place Of Supply',
    'Rate',
    'Taxable Value',
    'CGST',
    'SGST',
    'IGST'
  ];
  const b2bRows = data.b2bList.map((item) => [
    item.gstinRecipient,
    item.receiverName,
    item.invoiceNumber,
    item.invoiceDate,
    item.invoiceValue.toFixed(2),
    item.placeOfSupply,
    item.rate.toFixed(2),
    item.taxableValue.toFixed(2),
    item.cgst.toFixed(2),
    item.sgst.toFixed(2),
    item.igst.toFixed(2)
  ]);
  combined += toCsvString(b2bHeaders, b2bRows) + '\r\n\r\n';

  // Section 3: Table 7 B2CS
  combined += `--- TABLE 7: B2C SMALL SUPPLIES ---\r\n`;
  const b2csHeaders = ['Type', 'Place Of Supply', 'Rate', 'Taxable Value', 'E-Commerce GSTIN'];
  const b2csRows = data.b2csList.map((item) => [
    item.type,
    item.placeOfSupply,
    item.rate.toFixed(2),
    item.taxableValue.toFixed(2),
    item.ecommerceGstin
  ]);
  combined += toCsvString(b2csHeaders, b2csRows) + '\r\n\r\n';

  // Section 4: Table 12 HSN Summary
  combined += `--- TABLE 12: HSN SUMMARY OF OUTWARD SUPPLIES ---\r\n`;
  const hsnHeaders = [
    'HSN',
    'Description',
    'UQC',
    'Total Quantity',
    'Total Value',
    'Taxable Value',
    'Integrated Tax',
    'Central Tax',
    'State Tax'
  ];
  const hsnRows = data.hsnList.map((item) => [
    item.hsn,
    item.description,
    item.uqc,
    item.totalQty.toString(),
    item.totalValue.toFixed(2),
    item.taxableValue.toFixed(2),
    item.igst.toFixed(2),
    item.cgst.toFixed(2),
    item.sgst.toFixed(2)
  ]);
  combined += toCsvString(hsnHeaders, hsnRows);

  downloadFile(combined, `GSTR1_Full_Monthly_Filing_${periodLabel}.csv`);
}

/**
 * 5. Tally Prime XML Export (Import-ready Sales Vouchers)
 */
export function exportTallyPrimeXml(orders = [], store = {}, periodLabel = '2026-11') {
  const sellerStateCode = store?.stateCode || '29';
  const defaultRate = typeof store?.gstRatePercent === 'number' ? store.gstRatePercent : 18;

  let xml = '<?xml version="1.0" encoding="utf-8"?>\r\n';
  xml += '<ENVELOPE>\r\n';
  xml += '  <HEADER>\r\n';
  xml += '    <TALLYREQUEST>Import Data</TALLYREQUEST>\r\n';
  xml += '  </HEADER>\r\n';
  xml += '  <BODY>\r\n';
  xml += '    <IMPORTDATA>\r\n';
  xml += '      <REQUESTDATA>\r\n';

  orders.forEach((ord) => {
    const invNumber = ord.invoiceNumber || `INV-2026/${(ord.orderNumber || ord.id || '').replace(/[^0-9]/g, '') || '1001'}`;
    const dateFormatted = ord.createdAt
      ? new Date(ord.createdAt).toISOString().split('T')[0].replace(/-/g, '')
      : new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    const buyerStateCode = ord.buyerStateCode || resolveStateCode(ord.customer?.state || 'Karnataka');
    const isIntraState = sellerStateCode === buyerStateCode;
    const customerParty = ord.isB2B && ord.customerCompanyName ? ord.customerCompanyName : ord.customerName || 'Store Customer';
    const totalAmount = Number(ord.total) || 0;
    const taxableVal = ord.taxableAmount > 0 ? ord.taxableAmount : Math.round((totalAmount / (1 + defaultRate / 100)) * 100) / 100;
    const taxTotal = totalAmount - taxableVal;

    xml += '        <TALLYMESSAGE xmlns:UDF="TallyUDF">\r\n';
    xml += '          <VOUCHER VCHTYPE="Sales" ACTION="Create">\r\n';
    xml += `            <DATE>${dateFormatted}</DATE>\r\n`;
    xml += `            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>\r\n`;
    xml += `            <VOUCHERNUMBER>${invNumber}</VOUCHERNUMBER>\r\n`;
    xml += `            <PARTYLEDGERNAME>${customerParty}</PARTYLEDGERNAME>\r\n`;
    xml += `            <PERSISTEDVIEW>Invoice View</PERSISTEDVIEW>\r\n`;
    xml += `            <BASICBUYERNAME>${customerParty}</BASICBUYERNAME>\r\n`;
    if (ord.customerGstin) {
      xml += `            <PARTYGSTIN>${ord.customerGstin}</PARTYGSTIN>\r\n`;
    }
    xml += `            <NARRATION>Online E-Commerce Order #${ord.orderNumber} via Istora Portal</NARRATION>\r\n`;

    // Debit Party Ledger
    xml += '            <ALLLEDGERENTRIES.LIST>\r\n';
    xml += `              <LEDGERNAME>${customerParty}</LEDGERNAME>\r\n`;
    xml += `              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>\r\n`;
    xml += `              <AMOUNT>-${totalAmount.toFixed(2)}</AMOUNT>\r\n`;
    xml += '            </ALLLEDGERENTRIES.LIST>\r\n';

    // Credit Sales Account
    xml += '            <ALLLEDGERENTRIES.LIST>\r\n';
    xml += `              <LEDGERNAME>Sales Account - ${defaultRate}%</LEDGERNAME>\r\n`;
    xml += `              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\r\n`;
    xml += `              <AMOUNT>${taxableVal.toFixed(2)}</AMOUNT>\r\n`;
    xml += '            </ALLLEDGERENTRIES.LIST>\r\n';

    // Credit Tax Ledgers
    if (isIntraState) {
      const halfTax = (taxTotal / 2).toFixed(2);
      xml += '            <ALLLEDGERENTRIES.LIST>\r\n';
      xml += `              <LEDGERNAME>Output CGST @ ${defaultRate / 2}%</LEDGERNAME>\r\n`;
      xml += `              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\r\n`;
      xml += `              <AMOUNT>${halfTax}</AMOUNT>\r\n`;
      xml += '            </ALLLEDGERENTRIES.LIST>\r\n';
      xml += '            <ALLLEDGERENTRIES.LIST>\r\n';
      xml += `              <LEDGERNAME>Output SGST @ ${defaultRate / 2}%</LEDGERNAME>\r\n`;
      xml += `              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\r\n`;
      xml += `              <AMOUNT>${halfTax}</AMOUNT>\r\n`;
      xml += '            </ALLLEDGERENTRIES.LIST>\r\n';
    } else {
      xml += '            <ALLLEDGERENTRIES.LIST>\r\n';
      xml += `              <LEDGERNAME>Output IGST @ ${defaultRate}%</LEDGERNAME>\r\n`;
      xml += `              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\r\n`;
      xml += `              <AMOUNT>${taxTotal.toFixed(2)}</AMOUNT>\r\n`;
      xml += '            </ALLLEDGERENTRIES.LIST>\r\n';
    }

    xml += '          </VOUCHER>\r\n';
    xml += '        </TALLYMESSAGE>\r\n';
  });

  xml += '      </REQUESTDATA>\r\n';
  xml += '    </IMPORTDATA>\r\n';
  xml += '  </BODY>\r\n';
  xml += '</ENVELOPE>\r\n';

  downloadFile(xml, `Tally_Prime_Sales_Import_${periodLabel}.xml`, 'application/xml;charset=utf-8;');
}

/**
 * 6. Zoho Books Invoices CSV Export
 */
export function exportZohoBooksCsv(orders = [], store = {}, periodLabel = '2026-11') {
  const sellerStateCode = store?.stateCode || '29';
  const defaultRate = typeof store?.gstRatePercent === 'number' ? store.gstRatePercent : 18;

  const headers = [
    'Invoice Date',
    'Invoice Number',
    'Customer Name',
    'GST Identification Number (GSTIN)',
    'Place of Supply',
    'Item Name',
    'Item Description',
    'HSN/SAC',
    'Quantity',
    'Item Price',
    'Discount',
    'Tax Percentage',
    'Tax Type',
    'Is Inclusive Tax'
  ];

  const rows = [];

  orders.forEach((ord) => {
    const invNumber = ord.invoiceNumber || `INV-2026/${(ord.orderNumber || ord.id || '').replace(/[^0-9]/g, '') || '1001'}`;
    const invDate = ord.createdAt
      ? new Date(ord.createdAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    const buyerStateCode = ord.buyerStateCode || resolveStateCode(ord.customer?.state || 'Karnataka');
    const isIntraState = sellerStateCode === buyerStateCode;
    const posState = INDIAN_GST_STATES.find((s) => s.code === buyerStateCode);
    const posName = posState ? `[${buyerStateCode}] ${posState.name}` : `[${buyerStateCode}] Karnataka`;
    const custName = ord.isB2B && ord.customerCompanyName ? ord.customerCompanyName : ord.customerName || 'Store Customer';
    const gstin = ord.customerGstin || '';
    const taxType = isIntraState ? 'GST' : 'IGST';

    const items = Array.isArray(ord.items) && ord.items.length > 0 ? ord.items : [{ title: 'Apparel Item', quantity: 1, price: ord.total }];

    items.forEach((item) => {
      rows.push([
        invDate,
        invNumber,
        custName,
        gstin,
        posName,
        item.title || item.name || 'Apparel Item',
        item.variantTitle || 'Standard SKU',
        item.hsnCode || item.hsn || '6109',
        (item.quantity || 1).toString(),
        (item.price || ord.total || 0).toFixed(2),
        '0',
        defaultRate.toString(),
        taxType,
        store?.pricesIncludeGst ? 'true' : 'false'
      ]);
    });
  });

  const csv = toCsvString(headers, rows);
  downloadFile(csv, `Zoho_Books_Invoices_${periodLabel}.csv`);
}

