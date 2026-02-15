import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generatePuppeteerPDF = async (invoiceData, lineItems) => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const page = await browser.newPage();

    // Format dates: DD-MM-YYYY
    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return date;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };

    // Convert logo to base64
    let logoBase64 = '';
    try {
        // Try both paths just in case
        let logoPath = path.join(__dirname, '../../logo.png');
        if (!fs.existsSync(logoPath)) {
            logoPath = path.join(__dirname, '../../../logo.png');
        }
        if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        }
    } catch (err) {
        console.error("Logo not found for PDF", err);
    }

    // Calculate SGST and CGST values for total row
    const totalTax = parseFloat(invoiceData.tax_total || invoiceData.total_tax || 0);
    const sgstTotal = (totalTax / 2).toFixed(2);
    const cgstTotal = (totalTax / 2).toFixed(2);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page { size: A4; margin: 0; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; margin: 0; padding: 40px; color: #333; font-size: 8.5pt; line-height: 1.3; background: white; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .logo-section img { width: 100px; }
        .company-info { text-align: right; width: 320px; font-size: 7.5pt; color: #444; }
        .company-name { font-weight: bold; color: #000; font-size: 10pt; margin-bottom: 4px; }
        
        .title { text-align: center; font-size: 14pt; font-weight: bold; margin: 15px 0 25px 0; letter-spacing: 1px; }
        
        .invoice-details-section { display: flex; justify-content: space-between; margin-bottom: 25px; align-items: flex-start; }
        .bill-to { width: 50%; }
        .bill-to-title { font-weight: normal; margin-bottom: 8px; font-size: 9pt; }
        .client-name { font-weight: bold; margin-bottom: 5px; font-size: 9.5pt; color: #000; }
        
        .invoice-info { width: 40%; }
        .info-row { display: flex; justify-content: flex-start; margin-bottom: 2px; }
        .info-label { font-weight: bold; width: 140px; }
        .info-value { flex: 1; text-align: left; }
        
        table.main-table { width: 100%; border-collapse: collapse; margin-bottom: 0px; table-layout: fixed; }
        table.main-table th { background-color: white; border: 1px solid #ccc; padding: 6px 2px; font-size: 7.5pt; text-align: center; font-weight: bold; }
        table.main-table td { border: 1px solid #ccc; padding: 6px 2px; font-size: 7.5pt; text-align: center; }
        
        .summary-container { margin-top: 20px; }
        table.summary-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        table.summary-table td { border: 1px solid #ccc; padding: 5px; font-size: 8pt; vertical-align: middle; }
        .summary-header { background-color: #f5f5f5; font-weight: bold; text-align: center !important; }
        .total-amount-row { background-color: #f0f0f0; font-weight: bold; font-size: 9pt; }
        
        .amount-words { margin: 20px 0; font-weight: bold; font-size: 9pt; text-align: right; }
        
        .bank-details { margin-top: 30px; font-size: 8pt; color: #555; line-height: 1.5; width: 60%; }
        .bank-details-title { font-weight: normal; margin-bottom: 5px; }
        
        .authorized-section { display: flex; justify-content: flex-end; align-items: center; margin-top: -80px; }
        .signatory-container { text-align: center; width: 160px; }
        .stamp-area { height: 80px; display: flex; justify-content: center; align-items: center; margin-bottom: 5px; }
        .signatory-label { font-weight: bold; font-size: 8.5pt; border-top: 1px solid #000; padding-top: 5px; }
        
        .text-left { text-align: left !important; padding-left: 5px !important; }
        .text-right { text-align: right !important; padding-right: 5px !important; }
        .bold { font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-section">
            <img src="${logoBase64}" alt="Pajasa Logo">
        </div>
        <div class="company-info">
            <div class="company-name">PAJASA Stay Solutions Pvt. Ltd.</div>
            307, 3rd Floor, Powai Plaza, Hiranandani Gardens,<br>
            Central Avenue, Powai, Mumbai - 400076<br>
            24x7 Hotline: 91-22-69999891<br>
            Email: info@pajasaapartments.com<br>
            Web: www.pajasaapartments.com<br>
            CIN: U63000MH2014PTC256085
        </div>
    </div>

    <div class="title">TAX INVOICE</div>

    <div class="invoice-details-section">
        <div class="bill-to">
            <div class="bill-to-title">To</div>
            <div class="client-name">${invoiceData.client_name || invoiceData.invoice_to || 'Client Name Not Specified'}</div>
            <div style="font-size: 8pt; line-height: 1.4;">
                ${invoiceData.street_address || ''}<br>
                ${invoiceData.client_city || ''} ${invoiceData.client_state || ''} ${invoiceData.client_zip || ''}<br>
                <span class="bold">GSTIN :</span> ${invoiceData.client_gst || invoiceData.gst_no || 'N/A'}<br>
                <span class="bold">PLACE OF SUPPLY:</span> ${invoiceData.state_for_billing || invoiceData.client_state || 'Maharashtra'}
            </div>
        </div>
        <div class="invoice-info">
            <div class="info-row"><span class="info-label">INVOICE DATE :</span> <span class="info-value">${formatDate(invoiceData.invoice_date)}</span></div>
            <div class="info-row"><span class="info-label">INVOICE NO :</span> <span class="info-value">${invoiceData.invoice_number}</span></div>
            <div class="info-row"><span class="info-label">PAJASA HSN CODE :</span> <span class="info-value">996311</span></div>
            <div class="info-row"><span class="info-label">PAJASA GSTIN :</span> <span class="info-value">27AAHCP7561R1ZH</span></div>
            <div class="info-row"><span class="info-label">PLACE OF SUPPLY STATE CODE :</span> <span class="info-value">27</span></div>
        </div>
    </div>

    <table class="main-table">
        <thead>
            <tr>
                <th style="width: 18%;">NAME</th>
                <th style="width: 10%;">LOCATION</th>
                <th style="width: 10%;">C.I.D</th>
                <th style="width: 10%;">C.O.D</th>
                <th style="width: 6%;">NIGHTS</th>
                <th style="width: 10%;">TARIFF</th>
                <th style="width: 10%;">AMOUNT</th>
                <th style="width: 6%;">TAX(%)</th>
                <th style="width: 10%;">SGST</th>
                <th style="width: 10%;">CGST</th>
            </tr>
        </thead>
        <tbody>
            ${lineItems.map(item => `
                <tr>
                    <td class="text-left">${item.guestName}</td>
                    <td>${item.location || 'Mumbai'}</td>
                    <td>${formatDate(item.checkInDate)}</td>
                    <td>${formatDate(item.checkOutDate)}</td>
                    <td>${item.days}</td>
                    <td class="text-right">₹${Number(item.tariff).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td class="text-right">₹${Number(item.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td>18</td>
                    <td class="text-right">₹${(Number(item.tax) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td class="text-right">₹${(Number(item.tax) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                ${item.foodItems && Array.isArray(item.foodItems) ? item.foodItems.filter(f => f.foodAmount && parseFloat(f.foodAmount) != 0).map(f => `
                    <tr>
                        <td class="text-left">${f.foodChargeType}</td>
                        <td>${item.location || 'Mumbai'}</td>
                        <td>${formatDate(item.checkInDate)}</td>
                        <td>${formatDate(item.checkOutDate)}</td>
                        <td>${f.foodQuantity || '1'}</td>
                        <td class="text-right">₹${Number(f.foodTariff).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td class="text-right">₹${Number(f.foodAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td>5</td>
                        <td class="text-right">₹${Number(f.foodSGST || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td class="text-right">₹${Number(f.foodCGST || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                `).join('') : ''}
            `).join('')}
        </tbody>
    </table>

    <div class="summary-container">
        <table class="summary-table">
            <thead>
                <tr>
                    <td class="summary-header" style="width: 20%;">HSN CODE</td>
                    <td class="summary-header" style="width: 25%;">Taxable Amount</td>
                    <td class="summary-header" style="width: 35%;">Total Room Charges</td>
                    <td class="bold text-right" style="width: 20%;">₹${Number(invoiceData.sub_total || invoiceData.total_room_charges || invoiceData.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="text-align: center;">996311</td>
                    <td style="text-align: center;">₹${Number(invoiceData.sub_total || invoiceData.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td>
                        <div style="display: flex; justify-content: space-between; padding: 0 10px;">
                            <span>SGST @ 9%</span>
                            <span>CGST @ 9%</span>
                        </div>
                    </td>
                    <td class="text-right">
                        <div style="display: flex; justify-content: space-between; padding: 0 5px;">
                            <span>₹${Number(sgstTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            <span>₹${Number(cgstTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </td>
                </tr>
                <tr class="total-amount-row">
                    <td colspan="3" class="text-right">Total Amount with GST(Round off)</td>
                    <td class="text-right">₹${Number(invoiceData.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="amount-words">
        <span>Amount (In Words) </span> ${invoiceData.amount_in_words || ''}
    </div>

    <div class="bank-details">
        1. Please issue cheque in the name of <strong>PAJASA STAY SOLUTIONS PVT. LTD.</strong><br>
        2. Current A/C NO : 914020029004193<br>
        3. Account Holder Bank : Axis Bank<br>
        4. IFSC Code : UTIB0000246<br>
        5. PAN. NO : AAHCP7561R<br>
        6. HSN CODE : 996311; Accomodation Services
    </div>

    <div class="authorized-section">
        <div class="signatory-container">
            <div class="stamp-area">
                <!-- Round Stamp Placeholder if needed -->
            </div>
            <div class="signatory-label">Authorized Signatory</div>
        </div>
    </div>
</body>
</html>
  `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
            top: '0px',
            bottom: '0px',
            left: '0px',
            right: '0px'
        }
    });

    await browser.close();
    return pdfBuffer;
};
