import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  calculateGstTax, 
  numberToIndianWords, 
  resolveStateCode 
} from './gstUtils';

/**
 * Generates and downloads a high-fidelity PDF of the Indian GST Tax Invoice.
 * Works either with an existing DOM element (modal) or generates an offscreen DOM node.
 */
export async function downloadInvoicePdf({ order, store, settings, element = null }) {
  if (!order) throw new Error('Order data is required to generate invoice PDF.');

  const invoiceNumber = order.invoiceNumber || `INV-${new Date(order.createdAt || Date.now()).getFullYear()}-${order.orderNumber?.replace(/[^0-9]/g, '') || '1001'}`;
  const safeFilename = `Tax-Invoice-${invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

  let targetElement = element;
  let temporaryWrapper = null;

  try {
    if (!targetElement) {
      // Build an offscreen invoice element for direct table row downloads
      temporaryWrapper = document.createElement('div');
      temporaryWrapper.style.position = 'fixed';
      temporaryWrapper.style.left = '-9999px';
      temporaryWrapper.style.top = '0';
      temporaryWrapper.style.width = '800px';
      temporaryWrapper.style.backgroundColor = '#ffffff';
      temporaryWrapper.style.zIndex = '-1000';
      temporaryWrapper.innerHTML = generateInvoiceHtmlSnippet({ order, store, settings });
      document.body.appendChild(temporaryWrapper);
      targetElement = temporaryWrapper;
    }

    // Capture DOM element using html2canvas
    const canvas = await html2canvas(targetElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Create A4 PDF in portrait orientation
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;

    // Multi-page handling if invoice exceeds single A4 page
    while (heightLeft > 5) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save PDF directly to user's device
    pdf.save(safeFilename);
    return { success: true, filename: safeFilename };
  } catch (error) {
    console.error('Invoice PDF Generation error:', error);
    // Fallback: If canvas or PDF generation hits an edge-case, fallback to formatted print dialog
    window.print();
    return { success: false, error };
  } finally {
    if (temporaryWrapper && temporaryWrapper.parentNode) {
      temporaryWrapper.parentNode.removeChild(temporaryWrapper);
    }
  }
}

/**
 * Downloads a standalone, self-contained HTML invoice file with inline CSS for offline preservation.
 */
export function downloadInvoiceHtml({ order, store, settings }) {
  if (!order) return;
  const invoiceNumber = order.invoiceNumber || `INV-${new Date(order.createdAt || Date.now()).getFullYear()}-${order.orderNumber?.replace(/[^0-9]/g, '') || '1001'}`;
  const safeFilename = `Tax-Invoice-${invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.html`;

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GST Tax Invoice - ${invoiceNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; background: #f4f4f5; color: #18181b; }
    .sheet { max-width: 820px; margin: 0 auto; background: #fff; padding: 32px; border: 1px solid #e4e4e7; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    @media print { body { background: #fff; padding: 0; } .sheet { border: none; box-shadow: none; padding: 0; max-width: 100%; } }
  </style>
</head>
<body>
  <div class="sheet">
    ${generateInvoiceHtmlSnippet({ order, store, settings })}
  </div>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates the clean HTML markup of the Tax Invoice for offscreen capture or HTML export.
 */
export function generateInvoiceHtmlSnippet({ order, store, settings }) {
  // Merchant details
  const merchantGstin = store?.gstin || settings?.gstin || '29AABCU9603R1ZM';
  const legalName = store?.legalBusinessName || settings?.legalBusinessName || store?.name || settings?.storeName || 'Apex Commerce India Pvt. Ltd.';
  const tradeName = store?.name || settings?.storeName || 'Apex Athletics & Co.';
  const merchantStateCode = store?.stateCode || settings?.stateCode || merchantGstin.substring(0, 2) || '29';
  const defaultHsn = store?.defaultHsnCode || settings?.defaultHsnCode || '6109';
  const defaultGstRate = typeof store?.gstRatePercent === 'number' ? store.gstRatePercent : (typeof settings?.gstRatePercent === 'number' ? settings.gstRatePercent : 18);
  const pricesIncludeGst = store?.pricesIncludeGst ?? settings?.pricesIncludeGst ?? false;

  // Customer details
  const customerName = order.customer?.firstName 
    ? `${order.customer.firstName} ${order.customer.lastName || ''}`.trim() 
    : (order.customerName || 'Customer');
  const customerEmail = order.customer?.email || order.customerEmail || 'support@apexcommerce.com';
  const customerPhone = order.customer?.phone || '+91 98765 43210';
  const customerAddress = order.customer?.address || '124, 4th Main, Indiranagar';
  const customerCity = order.customer?.city || 'Bengaluru';
  const customerZip = order.customer?.zip || '560038';
  const customerState = order.customer?.state || 'Karnataka';

  const buyerStateCode = order.buyerStateCode || resolveStateCode(customerState);
  const isB2B = Boolean(order.isB2B || order.customerGstin);
  const customerGstin = order.customerGstin || (isB2B ? '29BBBCU8472P1ZK' : null);
  const customerCompanyName = order.customerCompanyName || (isB2B ? `${customerName} Enterprises` : null);

  const invoiceNumber = order.invoiceNumber || `INV-${new Date(order.createdAt || Date.now()).getFullYear()}-${order.orderNumber?.replace(/[^0-9]/g, '') || '1001'}`;
  const invoiceDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const gstData = calculateGstTax({
    items: order.items || [],
    merchantStateCode,
    buyerStateCode,
    defaultGstRate,
    pricesIncludeGst,
    shippingFee: order.shippingCost || 0,
    discountAmount: order.discountAmount || 0
  });

  const totalAmount = order.total || gstData.netPayable;
  const amountInWords = numberToIndianWords(totalAmount);

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #18181b; line-height: 1.4; padding: 24px; background: #fff;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #18181b; padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <h1 style="font-size: 20px; font-weight: 900; margin: 0; text-transform: uppercase; color: #09090b;">TAX INVOICE</h1>
          <p style="font-size: 10px; color: #71717a; margin: 2px 0 0 0;">(Issued under Section 31 of CGST Act, 2017 read with Rule 46 of CGST Rules, 2017)</p>
          <p style="font-size: 11px; font-weight: 700; color: #008060; margin: 4px 0 0 0;">Original for Recipient • Reverse Charge: NO</p>
        </div>
        <div style="text-align: right;">
          <div style="display: inline-block; background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 4px; padding: 4px 8px; margin-bottom: 4px;">
            <span style="font-size: 9px; color: #71717a; text-transform: uppercase; font-weight: 700; display: block;">Invoice Number</span>
            <span style="font-size: 12px; font-weight: 900; font-family: monospace;">${invoiceNumber}</span>
          </div>
          <p style="font-size: 10px; color: #52525b; margin: 2px 0;">Date: <strong>${invoiceDate}</strong></p>
          <p style="font-size: 10px; color: #52525b; margin: 2px 0;">Place of Supply: <strong>${gstData.buyerState.name} (${gstData.buyerState.code})</strong></p>
        </div>
      </div>

      <!-- Supplier & Buyer Details -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; border: 1px solid #d4d4d8; border-radius: 6px; padding: 12px; background: #fafafa; margin-bottom: 16px;">
        <div style="border-right: 1px solid #e4e4e7; padding-right: 12px;">
          <span style="font-size: 9px; font-weight: 800; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Details of Supplier (Billed From)</span>
          <p style="font-size: 13px; font-weight: 900; margin: 0 0 2px 0; color: #09090b;">${legalName}</p>
          ${tradeName !== legalName ? `<p style="font-size: 11px; font-weight: 600; color: #52525b; margin: 0 0 2px 0;">Trade Name: ${tradeName}</p>` : ''}
          <p style="font-size: 10px; color: #52525b; margin: 0 0 4px 0;">Registered Office: Tech Park, Indiranagar, Bengaluru, ${gstData.merchantState.name} - 560038</p>
          <div style="margin-top: 4px;">
            <span style="font-size: 11px; font-family: monospace; font-weight: 800; color: #065f46; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 6px; border-radius: 4px; display: inline-block;">GSTIN: ${merchantGstin}</span>
            <p style="font-size: 10px; color: #52525b; margin: 4px 0 0 0;">State: <strong>${gstData.merchantState.name} (${gstData.merchantState.code})</strong> • PAN: <strong>${merchantGstin.substring(2, 12)}</strong></p>
          </div>
        </div>

        <div style="padding-left: 4px;">
          <span style="font-size: 9px; font-weight: 800; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Details of Recipient (Billed & Shipped To)</span>
          <p style="font-size: 13px; font-weight: 900; margin: 0 0 2px 0; color: #09090b;">${isB2B && customerCompanyName ? customerCompanyName : customerName}</p>
          ${isB2B ? `<p style="font-size: 10px; font-weight: 600; color: #52525b; margin: 0 0 2px 0;">Attn: ${customerName}</p>` : ''}
          <p style="font-size: 10px; color: #52525b; margin: 0 0 4px 0;">${customerAddress}, ${customerCity}, ${customerState} - ${customerZip}</p>
          <div style="margin-top: 4px;">
            ${customerGstin ? `<span style="font-size: 11px; font-family: monospace; font-weight: 800; color: #581c87; background: #faf5ff; border: 1px solid #e9d5ff; padding: 2px 6px; border-radius: 4px; display: inline-block;">Buyer GSTIN: ${customerGstin}</span>` : '<span style="font-size: 10px; color: #71717a; font-style: italic;">Consumer / Unregistered Person (B2C)</span>'}
            <p style="font-size: 10px; color: #52525b; margin: 4px 0 0 0;">Place of Supply: <strong>${customerState} (${gstData.buyerState.code})</strong></p>
          </div>
        </div>
      </div>

      <!-- Item Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; border: 1px solid #d4d4d8;">
        <thead>
          <tr style="background: #18181b; color: #fff; font-size: 9px; text-transform: uppercase;">
            <th style="padding: 6px; border-right: 1px solid #3f3f46; width: 24px; text-align: center;">#</th>
            <th style="padding: 6px 8px; border-right: 1px solid #3f3f46; text-align: left;">Item Description</th>
            <th style="padding: 6px; border-right: 1px solid #3f3f46; width: 50px; text-align: center;">HSN</th>
            <th style="padding: 6px; border-right: 1px solid #3f3f46; width: 30px; text-align: center;">Qty</th>
            <th style="padding: 6px; border-right: 1px solid #3f3f46; width: 60px; text-align: right;">Rate (₹)</th>
            <th style="padding: 6px; border-right: 1px solid #3f3f46; width: 70px; text-align: right;">Taxable (₹)</th>
            ${gstData.isIntraState ? `
              <th style="padding: 6px; border-right: 1px solid #3f3f46; width: 60px; text-align: right;">CGST (₹)</th>
              <th style="padding: 6px; border-right: 1px solid #3f3f46; width: 60px; text-align: right;">SGST (₹)</th>
            ` : `
              <th style="padding: 6px; border-right: 1px solid #3f3f46; width: 70px; text-align: right;">IGST (₹)</th>
            `}
            <th style="padding: 6px 8px; width: 70px; text-align: right;">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${gstData.items.map(item => `
            <tr style="border-bottom: 1px solid #e4e4e7; font-size: 10px;">
              <td style="padding: 6px; text-align: center; border-right: 1px solid #e4e4e7; color: #71717a;">${item.sNo}</td>
              <td style="padding: 6px 8px; border-right: 1px solid #e4e4e7;">
                <strong style="color: #09090b;">${item.title}</strong>
                ${item.variantTitle ? `<div style="font-size: 9px; color: #71717a;">${item.variantTitle}</div>` : ''}
              </td>
              <td style="padding: 6px; text-align: center; font-family: monospace; border-right: 1px solid #e4e4e7;">${item.hsn}</td>
              <td style="padding: 6px; text-align: center; font-weight: bold; border-right: 1px solid #e4e4e7;">${item.quantity}</td>
              <td style="padding: 6px; text-align: right; font-family: monospace; border-right: 1px solid #e4e4e7;">₹${item.unitPrice.toFixed(2)}</td>
              <td style="padding: 6px; text-align: right; font-family: monospace; font-weight: 700; border-right: 1px solid #e4e4e7;">₹${item.taxableValue.toFixed(2)}</td>
              ${gstData.isIntraState ? `
                <td style="padding: 6px; text-align: right; font-family: monospace; border-right: 1px solid #e4e4e7;">₹${item.cgstAmt.toFixed(2)}</td>
                <td style="padding: 6px; text-align: right; font-family: monospace; border-right: 1px solid #e4e4e7;">₹${item.sgstAmt.toFixed(2)}</td>
              ` : `
                <td style="padding: 6px; text-align: right; font-family: monospace; border-right: 1px solid #e4e4e7;">₹${item.igstAmt.toFixed(2)}</td>
              `}
              <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: 900;">₹${item.totalAmount.toFixed(2)}</td>
            </tr>
          `).join('')}

          ${gstData.shippingFee > 0 ? `
            <tr style="border-bottom: 1px solid #e4e4e7; font-size: 10px; background: #fafafa;">
              <td style="padding: 6px; text-align: center; border-right: 1px solid #e4e4e7;">•</td>
              <td style="padding: 6px 8px; border-right: 1px solid #e4e4e7; font-weight: 600;">Express Parcel Shipping & Handling</td>
              <td style="padding: 6px; text-align: center; font-family: monospace; border-right: 1px solid #e4e4e7;">9968</td>
              <td style="padding: 6px; text-align: center; border-right: 1px solid #e4e4e7;">1</td>
              <td style="padding: 6px; text-align: right; font-family: monospace; border-right: 1px solid #e4e4e7;">₹${gstData.shippingFee.toFixed(2)}</td>
              <td style="padding: 6px; text-align: right; font-family: monospace; font-weight: 700; border-right: 1px solid #e4e4e7;">₹${gstData.shippingFee.toFixed(2)}</td>
              ${gstData.isIntraState ? `
                <td style="padding: 6px; text-align: right; font-family: monospace; border-right: 1px solid #e4e4e7;">Incl.</td>
                <td style="padding: 6px; text-align: right; font-family: monospace; border-right: 1px solid #e4e4e7;">Incl.</td>
              ` : `
                <td style="padding: 6px; text-align: right; font-family: monospace; border-right: 1px solid #e4e4e7;">Incl.</td>
              `}
              <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: 700;">₹${gstData.shippingFee.toFixed(2)}</td>
            </tr>
          ` : ''}
        </tbody>
      </table>

      <!-- Bottom Summary Box -->
      <div style="display: grid; grid-template-columns: 3fr 2fr; gap: 16px; margin-bottom: 16px;">
        <div>
          <!-- HSN Summary -->
          <div style="border: 1px solid #d4d4d8; border-radius: 6px; overflow: hidden; margin-bottom: 8px;">
            <div style="background: #f4f4f5; padding: 4px 8px; font-weight: 800; font-size: 9px; text-transform: uppercase;">HSN / SAC Tax Liability Summary</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
              <thead>
                <tr style="border-bottom: 1px solid #e4e4e7; background: #fafafa; color: #71717a;">
                  <th style="padding: 4px; text-align: left; border-right: 1px solid #e4e4e7;">HSN</th>
                  <th style="padding: 4px; text-align: right; border-right: 1px solid #e4e4e7;">Taxable</th>
                  ${gstData.isIntraState ? `
                    <th style="padding: 4px; text-align: right; border-right: 1px solid #e4e4e7;">CGST</th>
                    <th style="padding: 4px; text-align: right; border-right: 1px solid #e4e4e7;">SGST</th>
                  ` : `
                    <th style="padding: 4px; text-align: right; border-right: 1px solid #e4e4e7;">IGST</th>
                  `}
                  <th style="padding: 4px; text-align: right;">Total Tax</th>
                </tr>
              </thead>
              <tbody>
                ${gstData.hsnSummary.map(h => `
                  <tr style="border-bottom: 1px solid #f4f4f5;">
                    <td style="padding: 4px; font-family: monospace; font-weight: bold; border-right: 1px solid #e4e4e7;">${h.hsn}</td>
                    <td style="padding: 4px; text-align: right; font-family: monospace; border-right: 1px solid #e4e4e7;">₹${h.taxableValue.toFixed(2)}</td>
                    ${gstData.isIntraState ? `
                      <td style="padding: 4px; text-align: right; font-family: monospace; border-right: 1px solid #e4e4e7;">₹${h.cgstAmt.toFixed(2)}</td>
                      <td style="padding: 4px; text-align: right; font-family: monospace; border-right: 1px solid #e4e4e7;">₹${h.sgstAmt.toFixed(2)}</td>
                    ` : `
                      <td style="padding: 4px; text-align: right; font-family: monospace; border-right: 1px solid #e4e4e7;">₹${h.igstAmt.toFixed(2)}</td>
                    `}
                    <td style="padding: 4px; text-align: right; font-family: monospace; font-weight: bold;">₹${h.totalTax.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 4px; padding: 6px 8px; margin-bottom: 6px;">
            <span style="font-size: 9px; color: #71717a; text-transform: uppercase; font-weight: bold; display: block;">Amount in Words:</span>
            <span style="font-size: 10px; font-weight: 700; color: #18181b;">${amountInWords}</span>
          </div>

          <div style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 4px; padding: 6px 8px; font-size: 9px; color: #52525b;">
            <span style="font-weight: bold; color: #27272a; text-transform: uppercase; display: block;">Bank Remittance:</span>
            Bank: <strong>HDFC Bank Ltd.</strong> • A/C: <strong>50200084729104</strong> • IFSC: <strong>HDFC0001248</strong>
          </div>
        </div>

        <!-- Totals & Signatory -->
        <div style="background: #fafafa; border: 1px solid #d4d4d8; border-radius: 6px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between;">
          <div style="font-size: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #52525b;">
              <span>Taxable Value:</span>
              <strong style="font-family: monospace; color: #09090b;">₹${gstData.taxableValue.toFixed(2)}</strong>
            </div>
            ${gstData.isIntraState ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #52525b;">
                <span>CGST:</span>
                <span style="font-family: monospace;">₹${gstData.totalCgst.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #52525b;">
                <span>SGST:</span>
                <span style="font-family: monospace;">₹${gstData.totalSgst.toFixed(2)}</span>
              </div>
            ` : `
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #52525b;">
                <span>IGST:</span>
                <span style="font-family: monospace;">₹${gstData.totalIgst.toFixed(2)}</span>
              </div>
            `}
            ${gstData.shippingFee > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #52525b;">
                <span>Shipping:</span>
                <span style="font-family: monospace;">₹${gstData.shippingFee.toFixed(2)}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; border-top: 1px solid #d4d4d8; padding-top: 6px; margin-top: 6px;">
              <span style="font-weight: 900; font-size: 12px; color: #09090b;">Total:</span>
              <span style="font-weight: 900; font-size: 14px; font-family: monospace; color: #008060;">₹${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div style="text-align: center; border-top: 1px dashed #d4d4d8; padding-top: 8px; margin-top: 12px;">
            <div style="font-family: serif; font-style: italic; font-size: 13px; font-weight: bold; color: #27272a; height: 24px; line-height: 24px;">
              ${store?.authorizedSignatory || 'Apex Commerce Authority'}
            </div>
            <span style="font-size: 9px; color: #71717a; text-transform: uppercase; font-weight: 700; display: block;">Authorized Signatory</span>
          </div>
        </div>
      </div>

      <div style="border-top: 1px solid #e4e4e7; padding-top: 6px; font-size: 8px; color: #a1a1aa;">
        Terms: Goods once sold can be exchanged within 7 days. Subject to Bengaluru jurisdiction. Electronically generated tax invoice under IT Act, 2000.
      </div>
    </div>
  `;
}

