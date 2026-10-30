// gstUtils.js - Centralized Indian GST Invoicing & Compliance Engine

export const INDIAN_GST_STATES = [
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra & Nagar Haveli and Daman & Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '28', name: 'Andhra Pradesh' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman & Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh (New)' },
  { code: '38', name: 'Ladakh' },
  { code: '97', name: 'Other Territory' }
];

export const GST_RATE_SLABS = [
  { rate: 0, label: '0% (Exempt / Nil Rated)' },
  { rate: 5, label: '5% (Apparel under ₹1,000, Essentials)' },
  { rate: 12, label: '12% (Apparel above ₹1,000, Textiles)' },
  { rate: 18, label: '18% (Standard / Footwear, Electronics)' },
  { rate: 28, label: '28% (Luxury / Premium Goods)' }
];

export const COMMON_HSN_CODES = [
  { hsn: '6109', description: 'T-Shirts, singlets and other vests (Knitted/crocheted)' },
  { hsn: '6203', description: 'Men’s or boys’ suits, trousers, shorts (Woven)' },
  { hsn: '6204', description: 'Women’s or girls’ suits, dresses, skirts (Woven)' },
  { hsn: '6403', description: 'Footwear with outer soles of rubber/leather' },
  { hsn: '4202', description: 'Bags, backpacks, wallets, travel goods' },
  { hsn: '6505', description: 'Hats and other headgear, caps' },
  { hsn: '8517', description: 'Smart devices, wearables & accessories' },
  { hsn: '9983', description: 'Information technology / Digital services' }
];

/**
 * Validates 15-character Indian GSTIN format
 * Format: 2 digits State Code + 10 alphanumeric PAN + 1 digit entity number + 1 'Z' default + 1 check digit
 */
export function isValidGSTIN(gstin) {
  if (!gstin || typeof gstin !== 'string') return false;
  const clean = gstin.trim().toUpperCase();
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(clean);
}

/**
 * Extracts state code and name from GSTIN
 */
export function getStateFromGSTIN(gstin) {
  if (!gstin || gstin.length < 2) return null;
  const code = gstin.trim().substring(0, 2);
  const state = INDIAN_GST_STATES.find(s => s.code === code);
  return state || { code, name: 'Unknown State' };
}

/**
 * Extracts 10-digit PAN from GSTIN
 */
export function getPanFromGSTIN(gstin) {
  if (!gstin || gstin.trim().length < 12) return '';
  return gstin.trim().toUpperCase().substring(2, 12);
}

/**
 * Resolves State Code from state name or code
 */
export function resolveStateCode(stateNameOrCode) {
  if (!stateNameOrCode) return '29'; // Default Karnataka
  const clean = stateNameOrCode.trim().toLowerCase();
  const directMatch = INDIAN_GST_STATES.find(s => s.code === clean);
  if (directMatch) return directMatch.code;

  const nameMatch = INDIAN_GST_STATES.find(s => 
    s.name.toLowerCase() === clean || 
    s.name.toLowerCase().includes(clean) || 
    clean.includes(s.name.toLowerCase())
  );
  return nameMatch ? nameMatch.code : '29';
}

/**
 * Computes official Indian GST Tax breakdown for line items and orders
 */
export function calculateGstTax({
  items = [],
  merchantStateCode = '29', // e.g. Karnataka
  buyerStateCode = '29',
  defaultGstRate = 18,
  pricesIncludeGst = false,
  shippingFee = 0,
  discountAmount = 0
}) {
  const isIntraState = merchantStateCode === buyerStateCode;
  let grossSubtotal = 0;
  let totalTaxableValue = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  const hsnSummaryMap = {};

  const processedItems = items.map((item, index) => {
    const qty = Number(item.quantity) || 1;
    const unitPrice = Number(item.price) || 0;
    const lineTotal = unitPrice * qty;
    grossSubtotal += lineTotal;

    // Use product-specific HSN/rate if available or defaults
    const hsn = item.hsnCode || item.hsn || (item.product?.hsnCode) || '6109';
    const rate = typeof item.gstRate === 'number' ? item.gstRate : defaultGstRate;

    let taxableValue = lineTotal;
    let taxAmt = 0;

    if (pricesIncludeGst) {
      // Reverse calculate: Taxable = Gross / (1 + Rate / 100)
      taxableValue = Math.round((lineTotal / (1 + rate / 100)) * 100) / 100;
      taxAmt = Math.round((lineTotal - taxableValue) * 100) / 100;
    } else {
      taxableValue = lineTotal;
      taxAmt = Math.round((taxableValue * (rate / 100)) * 100) / 100;
    }

    let cgstRate = 0;
    let cgstAmt = 0;
    let sgstRate = 0;
    let sgstAmt = 0;
    let igstRate = 0;
    let igstAmt = 0;

    if (isIntraState) {
      cgstRate = rate / 2;
      sgstRate = rate / 2;
      cgstAmt = Math.round((taxAmt / 2) * 100) / 100;
      sgstAmt = Math.round((taxAmt - cgstAmt) * 100) / 100;
      totalCgst += cgstAmt;
      totalSgst += sgstAmt;
    } else {
      igstRate = rate;
      igstAmt = taxAmt;
      totalIgst += igstAmt;
    }

    totalTaxableValue += taxableValue;

    // Aggregate into HSN Summary
    if (!hsnSummaryMap[hsn]) {
      hsnSummaryMap[hsn] = {
        hsn,
        description: item.title || item.name || 'Apparel Goods',
        taxableValue: 0,
        cgstRate,
        cgstAmt: 0,
        sgstRate,
        sgstAmt: 0,
        igstRate,
        igstAmt: 0,
        totalTax: 0
      };
    }
    hsnSummaryMap[hsn].taxableValue += taxableValue;
    hsnSummaryMap[hsn].cgstAmt += cgstAmt;
    hsnSummaryMap[hsn].sgstAmt += sgstAmt;
    hsnSummaryMap[hsn].igstAmt += igstAmt;
    hsnSummaryMap[hsn].totalTax += taxAmt;

    return {
      sNo: index + 1,
      title: item.title || item.name || 'Product Item',
      variantTitle: item.variantTitle || item.variant?.name || '',
      sku: item.sku || item.variant?.sku || `SKU-${1000 + index}`,
      hsn,
      quantity: qty,
      unitPrice,
      grossTotal: lineTotal,
      taxableValue,
      gstRate: rate,
      cgstRate,
      cgstAmt,
      sgstRate,
      sgstAmt,
      igstRate,
      igstAmt,
      totalAmount: pricesIncludeGst ? lineTotal : taxableValue + taxAmt
    };
  });

  // Handle shipping GST (standard 18% SAC 9968)
  let shippingGst = 0;
  if (shippingFee > 0) {
    const shippingRate = 18;
    const shippingTaxable = pricesIncludeGst
      ? Math.round((shippingFee / (1 + shippingRate / 100)) * 100) / 100
      : shippingFee;
    shippingGst = Math.round((shippingTaxable * (shippingRate / 100)) * 100) / 100;
    
    if (isIntraState) {
      const half = Math.round((shippingGst / 2) * 100) / 100;
      totalCgst += half;
      totalSgst += (shippingGst - half);
    } else {
      totalIgst += shippingGst;
    }
    totalTaxableValue += shippingTaxable;
  }

  const totalGst = totalCgst + totalSgst + totalIgst;
  const netPayable = pricesIncludeGst
    ? grossSubtotal + shippingFee - discountAmount
    : totalTaxableValue + totalGst + shippingFee - discountAmount;

  const hsnSummary = Object.values(hsnSummaryMap).map(h => ({
    ...h,
    taxableValue: Math.round(h.taxableValue * 100) / 100,
    cgstAmt: Math.round(h.cgstAmt * 100) / 100,
    sgstAmt: Math.round(h.sgstAmt * 100) / 100,
    igstAmt: Math.round(h.igstAmt * 100) / 100,
    totalTax: Math.round(h.totalTax * 100) / 100
  }));

  const merchantState = INDIAN_GST_STATES.find(s => s.code === merchantStateCode) || { code: merchantStateCode, name: 'Karnataka' };
  const buyerState = INDIAN_GST_STATES.find(s => s.code === buyerStateCode) || { code: buyerStateCode, name: 'Karnataka' };

  return {
    isIntraState,
    supplyType: isIntraState ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)',
    merchantState,
    buyerState,
    grossSubtotal: Math.round(grossSubtotal * 100) / 100,
    taxableValue: Math.round(totalTaxableValue * 100) / 100,
    totalCgst: Math.round(totalCgst * 100) / 100,
    totalSgst: Math.round(totalSgst * 100) / 100,
    totalIgst: Math.round(totalIgst * 100) / 100,
    totalGst: Math.round(totalGst * 100) / 100,
    shippingFee: Math.round(shippingFee * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    netPayable: Math.round(netPayable * 100) / 100,
    items: processedItems,
    hsnSummary
  };
}

/**
 * Converts numbers to Indian English Words (Crores, Lakhs, Thousands, Hundreds)
 * e.g. 14250.50 -> "INR Fourteen Thousand Two Hundred Fifty and Fifty Paise Only"
 */
export function numberToIndianWords(num) {
  if (num === null || num === undefined || isNaN(num)) return 'Zero';
  
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = parseFloat(num).toFixed(2).split('.');
  let whole = parseInt(n[0], 10);
  const fraction = parseInt(n[1], 10);

  if (whole === 0 && fraction === 0) return 'INR Zero Only';

  function convertTwoDigits(n) {
    if (n < 20) return a[n];
    return `${b[Math.floor(n / 10)]} ${a[n % 10]}`.trim();
  }

  function convertThreeDigits(n) {
    if (n === 0) return '';
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundreds > 0) res += `${a[hundreds]} Hundred `;
    if (rest > 0) res += convertTwoDigits(rest);
    return res.trim();
  }

  let str = '';
  const crore = Math.floor(whole / 10000000);
  whole %= 10000000;
  const lakh = Math.floor(whole / 100000);
  whole %= 100000;
  const thousand = Math.floor(whole / 1000);
  whole %= 1000;
  const remainder = whole;

  if (crore > 0) str += `${convertTwoDigits(crore)} Crore `;
  if (lakh > 0) str += `${convertTwoDigits(lakh)} Lakh `;
  if (thousand > 0) str += `${convertTwoDigits(thousand)} Thousand `;
  if (remainder > 0) str += `${convertThreeDigits(remainder)} `;

  str = str.trim();
  let result = str ? `INR ${str}` : 'INR Zero';

  if (fraction > 0) {
    result += ` and ${convertTwoDigits(fraction)} Paise`;
  }
  result += ' Only';

  return result;
}
