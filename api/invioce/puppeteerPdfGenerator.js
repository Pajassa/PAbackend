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

    // --- DYNAMIC CALCULATIONS ---
    let totalTaxableAmount = 0;
    let totalSGST = 0;
    let totalCGST = 0;
    const gstGroups = {};

    const showFoodCharge = invoiceData.display_food_charge !== false && invoiceData.display_food_charge !== 'No';

    const processedLineItems = lineItems.map(item => {
        const nights = parseFloat(item.days || 0);
        const tariff = parseFloat(item.tariff || 0);
        const amount = nights * tariff; // Nights × Tariff

        const taxAmountInData = parseFloat(item.tax || 0);
        const derivedRate = amount > 0 ? (taxAmountInData / amount) * 100 : 0;
        const intendedTaxRate = Math.round(derivedRate);
        const halfRate = intendedTaxRate / 2;

        const sgst = amount * (halfRate / 100);
        const cgst = amount * (halfRate / 100);

        totalTaxableAmount += amount;
        totalSGST += sgst;
        totalCGST += cgst;

        if (intendedTaxRate > 0) {
            const hRateKey = halfRate.toString();
            if (!gstGroups[hRateKey]) gstGroups[hRateKey] = { sgst: 0, cgst: 0 };
            gstGroups[hRateKey].sgst += sgst;
            gstGroups[hRateKey].cgst += cgst;
        }

        const foodItems = (showFoodCharge && item.foodItems && Array.isArray(item.foodItems))
            ? item.foodItems.filter(f => (parseFloat(f.foodQuantity) * parseFloat(f.foodTariff)) > 0).map(f => {
                const fQty = parseFloat(f.foodQuantity || 0);
                const fTariff = parseFloat(f.foodTariff || 0);
                const fAmount = fQty * fTariff;

                const fTaxInData = parseFloat(f.foodTax || (parseFloat(f.foodSGST || 0) + parseFloat(f.foodCGST || 0)) || 0);
                const fDerivedRate = fAmount > 0 ? (fTaxInData / fAmount) * 100 : 0;
                const fIntendedRate = f.foodTaxPercentage ? parseFloat(f.foodTaxPercentage) : Math.round(fDerivedRate || 5);
                const fHalfRate = fIntendedRate / 2;

                const fSGST = fAmount * (fHalfRate / 100);
                const fCGST = fAmount * (fHalfRate / 100);

                totalTaxableAmount += fAmount;
                totalSGST += fSGST;
                totalCGST += fCGST;

                if (fIntendedRate > 0) {
                    const hRateKey = fHalfRate.toString();
                    if (!gstGroups[hRateKey]) gstGroups[hRateKey] = { sgst: 0, cgst: 0 };
                    gstGroups[hRateKey].sgst += fSGST;
                    gstGroups[hRateKey].cgst += fCGST;
                }

                return { ...f, fAmount, fIntendedRate, fSGST, fCGST };
            })
            : [];

        return { ...item, nights, tariff, amount, intendedTaxRate, sgst, cgst, foodItems };
    });

    const showExtraServices = invoiceData.extra_services === true || invoiceData.extra_services === 'Yes';
    const servicesAmount = showExtraServices ? parseFloat(invoiceData.services_amount || 0) : 0;
    const roundOffValue = parseFloat(invoiceData.round_off_value || 0);
    const totalWithGST = totalTaxableAmount + totalSGST + totalCGST;
    const grandTotal = totalWithGST + servicesAmount + roundOffValue;
    const roundedGrandTotal = Math.round(grandTotal);
    const amountInWords = numberToWords(roundedGrandTotal);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page { size: A4; margin: 0; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; margin: 0; padding: 40px; color: #333; font-size: 8pt; line-height: 1.3; background: white; }
        .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .logo-section img { width: 90px; }
        .company-info { text-align: right; width: 320px; font-size: 7.5pt; color: #444; }
        .company-name { font-weight: bold; color: #000; font-size: 10pt; margin-bottom: 4px; }
        
        .title { text-align: center; font-size: 14pt; font-weight: bold; margin: 10px 0 20px 0; letter-spacing: 1px; }
        
        .invoice-details-section { display: flex; justify-content: space-between; margin-bottom: 20px; align-items: flex-start; }
        .bill-to { width: 50%; }
        .client-name { font-weight: bold; margin-bottom: 5px; font-size: 9pt; color: #000; }
        
        .invoice-info { width: 45%; }
        .info-row { display: flex; justify-content: flex-start; margin-bottom: 1px; }
        .info-label { font-weight: bold; width: 140px; }
        .info-value { flex: 1; text-align: left; }
        
        table.main-table { width: 100%; border-collapse: collapse; margin-bottom: 0px; table-layout: fixed; border: 1px solid #ccc; }
        table.main-table th { background-color: #f9f9f9; border: 1px solid #ccc; padding: 6px 2px; font-size: 7pt; text-align: center; font-weight: bold; }
        table.main-table td { border: 1px solid #ccc; padding: 4px 2px; font-size: 7.5pt; text-align: center; }
        
        .summary-container { margin-top: 15px; }
        table.summary-table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1px solid #ccc; }
        table.summary-table td { border: 1px solid #ccc; padding: 5px; font-size: 8pt; vertical-align: middle; }
        .summary-label { text-align: center; font-weight: bold; }
        .total-amount-row { background-color: #f0f0f0; font-weight: bold; font-size: 9pt; }
        
        .amount-words { margin: 15px 0; font-weight: bold; font-size: 8.5pt; text-align: center; border: 1px solid #ccc; padding: 8px; }
        
        .bank-details { margin-top: 20px; font-size: 7.5pt; color: #333; line-height: 1.4; width: 60%; }
        
        .authorized-section { display: flex; justify-content: flex-end; align-items: center; margin-top: -60px; }
        .signatory-container { text-align: center; width: 150px; }
        .stamp-area { height: 60px; width: 60px; border: 1px solid #000; border-radius: 50%; margin: 0 auto 5px auto; }
        .signatory-label { font-weight: bold; font-size: 8pt; }
        
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
                <th style="width: 15%;">NAME</th>
                <th style="width: 10%;">LOCATION</th>
                <th style="width: 10%;">C.I.D</th>
                <th style="width: 10%;">C.O.D</th>
                <th style="width: 6%;">NIGHTS</th>
                <th style="width: 9%;">HSN</th>
                <th style="width: 10%;">TARIFF</th>
                <th style="width: 10%;">AMOUNT</th>
                <th style="width: 5%;">TAX</th>
                <th style="width: 10%;">SGST</th>
                <th style="width: 10%;">CGST</th>
            </tr>
        </thead>
        <tbody>
            ${processedLineItems.map(item => `
                <tr>
                    <td class="text-left">${item.guestName}</td>
                    <td>${item.location || 'Mumbai'}</td>
                    <td>${formatDate(item.checkInDate)}</td>
                    <td>${formatDate(item.checkOutDate)}</td>
                    <td>${item.nights}</td>
                    <td>996311</td>
                    <td class="text-right">₹${item.tariff.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="text-right">₹${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>${item.intendedTaxRate}%</td>
                    <td class="text-right">₹${item.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="text-right">₹${item.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                ${item.foodItems.map(f => `
                    <tr>
                        <td class="text-left">${f.foodChargeType}</td>
                        <td>${item.location || 'Mumbai'}</td>
                        <td>${formatDate(item.checkInDate)}</td>
                        <td>${formatDate(item.checkOutDate)}</td>
                        <td>${f.foodQuantity}</td>
                        <td>999711</td>
                        <td class="text-right">₹${parseFloat(f.foodTariff).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="text-right">₹${f.fAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>${f.fIntendedRate}%</td>
                        <td class="text-right">₹${f.fSGST.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="text-right">₹${f.fCGST.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                `).join('')}
            `).join('')}
            <tr class="bold">
                <td colspan="7" class="text-right">Total Amount</td>
                <td class="text-right">₹${totalTaxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td></td>
                <td class="text-right">₹${totalSGST.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="text-right">₹${totalCGST.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        </tbody>
    </table>

    <div class="summary-container">
        <table class="summary-table">
            <tbody>
                <tr>
                    <td colspan="3" class="summary-label">Total Amount without GST</td>
                    <td class="text-right bold" style="width: 20%;">₹${totalTaxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                ${Object.keys(gstGroups).sort().map(rate => `
                    <tr>
                        <td colspan="3" class="summary-label">SGST @ ${rate}%</td>
                        <td class="text-right">₹${gstGroups[rate].sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                        <td colspan="3" class="summary-label">CGST @ ${rate}%</td>
                        <td class="text-right">₹${gstGroups[rate].cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                `).join('')}
                <tr class="bold">
                    <td colspan="3" class="summary-label">Total Amount with GST</td>
                    <td class="text-right">₹${totalWithGST.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                ${servicesAmount > 0 ? `
                <tr>
                    <td colspan="3" class="summary-label">${invoiceData.services_name || 'Laundry Charges'}</td>
                    <td class="text-right">₹${servicesAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                ` : ''}
                <tr class="total-amount-row">
                    <td colspan="3" class="summary-label" style="font-size: 10pt;">Grand Total Amount</td>
                    <td class="text-right" style="font-size: 10pt;">₹${roundedGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="amount-words">
        Amount (In Words) : ${amountInWords} Only
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
            <div class="stamp-area"></div>
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
