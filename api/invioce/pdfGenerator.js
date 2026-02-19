import PDFDocument from 'pdfkit';
import { numberToWords } from '../../helpers/numberToWords.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateInvoicePDF = (invoice, lineItems, res) => {
    const doc = new PDFDocument({
        size: 'A4',
        margin: 20,
        bufferPages: true
    });

    // Register Fonts (Roboto supports Indian Rupee Symbol ₹)
    const robotoRegularPath = path.join(__dirname, '../../fonts/Roboto-Regular.ttf');
    const robotoBoldPath = path.join(__dirname, '../../fonts/Roboto-Bold.ttf');

    doc.registerFont('Roboto-Regular', robotoRegularPath);
    doc.registerFont('Roboto-Bold', robotoBoldPath);

    // Pipe PDF to response
    doc.pipe(res);

    // A4 width: 595 points, with 20pt margins on each side = 555pt usable width
    const pageWidth = 595;
    const margin = 20;
    const usableWidth = pageWidth - (margin * 2); // 555pt

    // Helper function to format currency
    const formatCurrency = (amount) => {
        const num = parseFloat(amount || 0);
        return `₹ ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Helper function to format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    // Improved helper to draw table cell with proper padding and alignment
    const drawCell = (x, y, width, height, text, options = {}) => {
        const {
            align = 'left',
            fontSize = 8,
            bold = false,
            fillColor = null,
            paddingLeft = 4,
            paddingRight = 4,
            valign = 'middle'
        } = options;

        // Draw cell border
        if (fillColor) {
            doc.rect(x, y, width, height).fillAndStroke(fillColor, '#000000');
        } else {
            doc.rect(x, y, width, height).stroke('#000000');
        }

        // Set font and get line height
        doc.fontSize(fontSize)
            .font(bold ? 'Roboto-Bold' : 'Roboto-Regular')
            .fillColor('#000000');

        const textWidth = width - paddingLeft - paddingRight;
        const actualTextHeight = doc.heightOfString(text, { width: textWidth, lineBreak: true });

        // Calculate vertical position based on valign and actual text height
        let textY;
        if (valign === 'top') {
            textY = y + 4;
        } else if (valign === 'bottom') {
            textY = y + height - actualTextHeight - 4;
        } else { // middle
            textY = y + (height - actualTextHeight) / 2 + 1;
        }

        // Draw text with proper alignment and wrapping
        doc.text(text, x + paddingLeft, textY, {
            width: textWidth,
            align: align,
            lineBreak: true,
            lineGap: 1
        });
    };

    let yPos = 20;

    // ===== TOP DECORATIVE TRIANGLE =====
    doc.save();
    doc.polygon([20, 20], [20, 60], [60, 20])
        .fillAndStroke('#FF9800', '#FF9800');
    doc.restore();

    // ===== LOGO AREA (Top Right) =====
    // Add logo image
    try {
        const logoPath = './logo.png';
        doc.image(logoPath, 480, 20, { width: 80, height: 80, fit: [80, 80] });
    } catch (error) {
        console.log('Logo not found, using text fallback');
        // Fallback to text if logo not found
        doc.fontSize(11)
            .font('Roboto-Bold')
            .fillColor('#FF9800')
            .text('PAJASA', 500, 25, { width: 75, align: 'right' });

        doc.fontSize(9)
            .fillColor('#666666')
            .text('APARTMENTS', 500, 38, { width: 75, align: 'right' });

        doc.fontSize(7)
            .font('Roboto-Regular')
            .text('Extended Stay Partner', 500, 50, { width: 75, align: 'right' });
    }

    // ===== TAX INVOICE TITLE =====
    yPos = 90;
    doc.fontSize(16)
        .font('Roboto-Bold')
        .fillColor('#000000')
        .text('TAX INVOICE', 0, yPos, { align: 'center', width: pageWidth });

    // ===== LEFT SECTION: BILLED TO =====
    yPos = 130;
    doc.fontSize(9)
        .font('Roboto-Bold')
        .fillColor('#000000')
        .text(invoice.client_name || invoice.invoice_to || 'Client Name Not Specified', 30, yPos);

    yPos += 16;
    doc.fontSize(8)
        .font('Roboto-Regular')
        .text(invoice.street_address || '', 30, yPos);

    if (invoice.client_city || invoice.client_state || invoice.client_zip) {
        yPos += 11;
        doc.text(`${invoice.client_city || ''} ${invoice.client_state || ''} ${invoice.client_zip || ''}`.trim(), 30, yPos);
    }

    yPos += 16;
    doc.fontSize(8)
        .font('Roboto-Bold')
        .text('GSTIN: ', 30, yPos, { continued: true })
        .font('Roboto-Regular')
        .text(invoice.client_gst || invoice.gst_no || 'N/A');

    yPos += 12;
    doc.font('Roboto-Bold')
        .text('Place of Supply: ', 30, yPos, { continued: true })
        .font('Roboto-Regular')
        .text(invoice.state_for_billing || invoice.client_state || 'Maharashtra');

    // ===== RIGHT SECTION: INVOICE DETAILS =====
    const rightX = 330;
    let rightY = 130;

    doc.fontSize(8)
        .font('Roboto-Bold')
        .text('Invoice No.: ', rightX, rightY, { continued: true })
        .font('Roboto-Regular')
        .text(invoice.invoice_number || 'PAMH24250243');

    rightY += 12;
    doc.font('Roboto-Bold')
        .text('Invoice Date: ', rightX, rightY, { continued: true })
        .font('Roboto-Regular')
        .text(formatDate(invoice.invoice_date) || '07th March 2025');

    rightY += 12;
    doc.font('Roboto-Bold')
        .text('Pajasa HSN Code: ', rightX, rightY, { continued: true })
        .font('Roboto-Regular')
        .text('996311');

    rightY += 12;
    doc.font('Roboto-Bold')
        .text('Pajasa GSTIN: ', rightX, rightY, { continued: true })
        .font('Roboto-Regular')
        .text('27AAHCP7561R1ZH');

    rightY += 12;
    doc.font('Roboto-Bold')
        .text('Place of Supply State Code: ', rightX, rightY, { continued: true })
        .font('Roboto-Regular')
        .text('27');

    rightY += 12;
    doc.font('Roboto-Bold')
        .text('Udyam Registration No: ', rightX, rightY, { continued: true })
        .font('Roboto-Regular')
        .text('MH-19-0215452');

    // ===== MAIN TABLE =====
    yPos = Math.max(yPos + 25, rightY + 25);
    const tableX = margin;
    const tableWidth = usableWidth; // 555pt

    // Optimized column widths to fit in 555pt
    const colWidths = {
        guest: 52,      // Guest Name
        checkIn: 58,    // Check In Date
        checkOut: 58,   // Check Out Date
        nights: 38,     // Nights
        hsn: 42,        // HSN Code
        tariff: 62,     // Tariff
        amount: 72,     // Amount
        tax: 32,        // Tax
        sgst: 70,       // SGST
        cgst: 71        // CGST
    };
    // Total: 555pt (perfect fit!)

    // Calculate X positions
    let currentX = tableX;
    const colX = {
        guest: currentX,
        checkIn: (currentX += colWidths.guest),
        checkOut: (currentX += colWidths.checkIn),
        nights: (currentX += colWidths.checkOut),
        hsn: (currentX += colWidths.nights),
        tariff: (currentX += colWidths.hsn),
        amount: (currentX += colWidths.tariff),
        tax: (currentX += colWidths.amount),
        sgst: (currentX += colWidths.tax),
        cgst: (currentX += colWidths.sgst)
    };

    // Table header
    const headerHeight = 28;
    drawCell(colX.guest, yPos, colWidths.guest, headerHeight, 'Guest\nName', {
        fontSize: 8,
        bold: true,
        align: 'center',
        valign: 'middle',
        paddingLeft: 2,
        paddingRight: 2
    });
    drawCell(colX.checkIn, yPos, colWidths.checkIn, headerHeight, 'Check In\nDate', {
        fontSize: 8,
        bold: true,
        align: 'center',
        valign: 'middle',
        paddingLeft: 2,
        paddingRight: 2
    });
    drawCell(colX.checkOut, yPos, colWidths.checkOut, headerHeight, 'Check Out\nDate', {
        fontSize: 8,
        bold: true,
        align: 'center',
        valign: 'middle',
        paddingLeft: 2,
        paddingRight: 2
    });
    drawCell(colX.nights, yPos, colWidths.nights, headerHeight, 'Nights', {
        fontSize: 8,
        bold: true,
        align: 'center',
        valign: 'middle',
        paddingLeft: 2,
        paddingRight: 2
    });
    drawCell(colX.hsn, yPos, colWidths.hsn, headerHeight, 'HSN\nCode', {
        fontSize: 8,
        bold: true,
        align: 'center',
        valign: 'middle',
        paddingLeft: 2,
        paddingRight: 2
    });
    drawCell(colX.tariff, yPos, colWidths.tariff, headerHeight, 'Tariff', {
        fontSize: 8,
        bold: true,
        align: 'center',
        valign: 'middle',
        paddingLeft: 2,
        paddingRight: 2
    });
    drawCell(colX.amount, yPos, colWidths.amount, headerHeight, 'Amount', {
        fontSize: 8,
        bold: true,
        align: 'center',
        valign: 'middle',
        paddingLeft: 2,
        paddingRight: 2
    });
    drawCell(colX.tax, yPos, colWidths.tax, headerHeight, 'Tax', {
        fontSize: 8,
        bold: true,
        align: 'center',
        valign: 'middle',
        paddingLeft: 2,
        paddingRight: 2
    });
    drawCell(colX.sgst, yPos, colWidths.sgst, headerHeight, 'SGST', {
        fontSize: 8,
        bold: true,
        align: 'center',
        valign: 'middle',
        paddingLeft: 2,
        paddingRight: 2
    });
    drawCell(colX.cgst, yPos, colWidths.cgst, headerHeight, 'CGST', {
        fontSize: 8,
        bold: true,
        align: 'center',
        valign: 'middle',
        paddingLeft: 2,
        paddingRight: 2
    });

    yPos += headerHeight;

    // Table data rows
    const rowHeight = 20;
    let totalAmount = 0;
    let totalWithoutGST = 0;

    // Dynamic GST grouping: { rate: { sgst: value, cgst: value } }
    const gstGroups = {};

    // Check if food charges should be displayed
    const showFoodCharge = invoice.display_food_charge !== false && invoice.display_food_charge !== 'No';

    lineItems.forEach((item) => {
        // Identification criteria for food charge rows
        const foodKeywords = ["Lunch", "Dinner", "Breakfast", "Food"];
        const guestName = (item.guestName || '').toLowerCase();
        const isFoodByKeyword = foodKeywords.some(keyword => guestName.includes(keyword.toLowerCase()));

        // Check if current row is a food charge row
        const isFoodChargeRow = isFoodByKeyword || item.hsnCode === '999711' || item.foodCharge === true;

        // Skip main item if it's a food charge and we're hiding food charges
        if (!showFoodCharge && isFoodChargeRow) {
            return;
        }

        // Main line item (room charges)
        const roomAmount = parseFloat(item.total || 0);
        const roomTax = parseFloat(item.tax || 0);
        const roomSGST = roomTax / 2;
        const roomCGST = roomTax / 2;

        const roomBaseAmount = roomAmount - roomTax;
        const actualRoomRate = roomBaseAmount > 0 ? (roomTax / roomBaseAmount) * 100 : 0;
        const intendedTaxRate = Math.round(actualRoomRate);
        const intendedHalfRate = intendedTaxRate / 2;

        // Corrected SGST/CGST based on intended percentage
        const correctedRoomSGST = Math.round(roomBaseAmount * intendedHalfRate) / 100;
        const correctedRoomCGST = Math.round(roomBaseAmount * intendedHalfRate) / 100;
        const correctedRoomTax = correctedRoomSGST + correctedRoomCGST;

        // Calculate dynamic row height for room entry (primarily based on Guest Name)
        doc.fontSize(8);
        const guestNamePadding = 8;
        const guestNameHeight = doc.heightOfString(item.guestName || '', { width: colWidths.guest - guestNamePadding, lineBreak: true });
        const currentRowHeight = Math.max(20, guestNameHeight + 10); // Minimum 20px, plus 10px total vertical padding

        drawCell(colX.guest, yPos, colWidths.guest, currentRowHeight, item.guestName || '', {
            fontSize: 8,
            align: 'left',
            paddingLeft: 4,
            paddingRight: 2,
            valign: 'middle'
        });
        drawCell(colX.checkIn, yPos, colWidths.checkIn, currentRowHeight, formatDate(item.checkInDate), {
            fontSize: 8,
            align: 'center',
            paddingLeft: 2,
            paddingRight: 2,
            valign: 'middle'
        });
        drawCell(colX.checkOut, yPos, colWidths.checkOut, currentRowHeight, formatDate(item.checkOutDate), {
            fontSize: 8,
            align: 'center',
            paddingLeft: 2,
            paddingRight: 2,
            valign: 'middle'
        });
        drawCell(colX.nights, yPos, colWidths.nights, currentRowHeight, String(item.days || '0'), {
            fontSize: 8,
            align: 'center',
            paddingLeft: 2,
            paddingRight: 2,
            valign: 'middle'
        });
        drawCell(colX.hsn, yPos, colWidths.hsn, currentRowHeight, '996311', {
            fontSize: 8,
            align: 'center',
            paddingLeft: 2,
            paddingRight: 2,
            valign: 'middle'
        });
        drawCell(colX.tariff, yPos, colWidths.tariff, currentRowHeight, formatCurrency(item.tariff), {
            fontSize: 8,
            align: 'center',
            paddingLeft: 2,
            paddingRight: 2,
            valign: 'middle'
        });
        drawCell(colX.amount, yPos, colWidths.amount, currentRowHeight, formatCurrency(roomBaseAmount), {
            fontSize: 8,
            align: 'center',
            paddingLeft: 2,
            paddingRight: 2,
            valign: 'middle'
        });
        drawCell(colX.tax, yPos, colWidths.tax, currentRowHeight, intendedTaxRate > 0 ? `${intendedTaxRate}%` : '0%', {
            fontSize: 8,
            align: 'center',
            paddingLeft: 2,
            paddingRight: 2,
            valign: 'middle'
        });
        drawCell(colX.sgst, yPos, colWidths.sgst, currentRowHeight, formatCurrency(correctedRoomSGST), {
            fontSize: 8,
            align: 'center',
            paddingLeft: 2,
            paddingRight: 2,
            valign: 'middle'
        });
        drawCell(colX.cgst, yPos, colWidths.cgst, currentRowHeight, formatCurrency(correctedRoomCGST), {
            fontSize: 8,
            align: 'center',
            paddingLeft: 2,
            paddingRight: 2,
            valign: 'middle'
        });

        totalAmount += (roomBaseAmount + correctedRoomTax);
        totalWithoutGST += roomBaseAmount;

        // Categorize room tax dynamically based on calculated rate
        if (roomBaseAmount > 0 && correctedRoomTax > 0) {
            const halfRateStr = intendedHalfRate.toString();

            if (!gstGroups[halfRateStr]) {
                gstGroups[halfRateStr] = { sgst: 0, cgst: 0 };
            }
            gstGroups[halfRateStr].sgst += correctedRoomSGST;
            gstGroups[halfRateStr].cgst += correctedRoomCGST;
        }

        yPos += currentRowHeight;

        // Food items
        if (showFoodCharge && item.foodItems && item.foodItems.length > 0) {
            item.foodItems.forEach((food) => {
                const foodAmount = parseFloat(food.foodAmount || 0);
                const foodTax = parseFloat(food.foodTax || 0);
                const foodSGST = parseFloat(food.foodSGST || 0);
                const foodCGST = parseFloat(food.foodCGST || 0);
                const foodQty = food.foodQuantity || '1';
                const foodBaseAmount = foodAmount - foodTax;

                // Calculate dynamic row height for food entry
                const foodLabelPadding = 8;
                const foodLabelHeight = doc.heightOfString(food.foodChargeType || 'Food', { width: colWidths.guest - foodLabelPadding, lineBreak: true });
                const currentFoodRowHeight = Math.max(20, foodLabelHeight + 10);

                const actualFoodRate = foodBaseAmount > 0 ? (foodTax / foodBaseAmount) * 100 : 0;

                // Determine intended rate (allow override from data if exists)
                const intendedTaxRate = food.foodTaxPercentage ? parseFloat(food.foodTaxPercentage) : Math.round(actualFoodRate);
                const intendedHalfRate = intendedTaxRate / 2;

                const correctedFoodSGST = Math.round(foodBaseAmount * intendedHalfRate) / 100;
                const correctedFoodCGST = Math.round(foodBaseAmount * intendedHalfRate) / 100;
                const correctedFoodTax = correctedFoodSGST + correctedFoodCGST;

                drawCell(colX.guest, yPos, colWidths.guest, currentFoodRowHeight, food.foodChargeType || 'Food', {
                    fontSize: 8,
                    align: 'left',
                    paddingLeft: 4,
                    paddingRight: 2,
                    valign: 'middle'
                });
                drawCell(colX.checkIn, yPos, colWidths.checkIn, currentFoodRowHeight, formatDate(item.checkInDate), {
                    fontSize: 8,
                    align: 'center',
                    paddingLeft: 2,
                    paddingRight: 2,
                    valign: 'middle'
                });
                drawCell(colX.checkOut, yPos, colWidths.checkOut, currentFoodRowHeight, formatDate(item.checkOutDate), {
                    fontSize: 8,
                    align: 'center',
                    paddingLeft: 2,
                    paddingRight: 2,
                    valign: 'middle'
                });
                drawCell(colX.nights, yPos, colWidths.nights, currentFoodRowHeight, String(foodQty), {
                    fontSize: 8,
                    align: 'center',
                    paddingLeft: 2,
                    paddingRight: 2,
                    valign: 'middle'
                });
                drawCell(colX.hsn, yPos, colWidths.hsn, currentFoodRowHeight, '999711', {
                    fontSize: 8,
                    align: 'center',
                    paddingLeft: 2,
                    paddingRight: 2,
                    valign: 'middle'
                });
                drawCell(colX.tariff, yPos, colWidths.tariff, currentFoodRowHeight, formatCurrency(food.foodTariff), {
                    fontSize: 8,
                    align: 'center',
                    paddingLeft: 2,
                    paddingRight: 2,
                    valign: 'middle'
                });
                drawCell(colX.amount, yPos, colWidths.amount, currentFoodRowHeight, formatCurrency(foodBaseAmount), {
                    fontSize: 8,
                    align: 'center',
                    paddingLeft: 2,
                    paddingRight: 2,
                    valign: 'middle'
                });
                drawCell(colX.tax, yPos, colWidths.tax, currentFoodRowHeight, intendedTaxRate > 0 ? `${intendedTaxRate}%` : '0%', {
                    fontSize: 8,
                    align: 'center',
                    paddingLeft: 2,
                    paddingRight: 2,
                    valign: 'middle'
                });
                drawCell(colX.sgst, yPos, colWidths.sgst, currentFoodRowHeight, formatCurrency(correctedFoodSGST), {
                    fontSize: 8,
                    align: 'center',
                    paddingLeft: 2,
                    paddingRight: 2,
                    valign: 'middle'
                });
                drawCell(colX.cgst, yPos, colWidths.cgst, currentFoodRowHeight, formatCurrency(correctedFoodCGST), {
                    fontSize: 8,
                    align: 'center',
                    paddingLeft: 2,
                    paddingRight: 2,
                    valign: 'middle'
                });

                totalAmount += (foodBaseAmount + correctedFoodTax);
                totalWithoutGST += foodBaseAmount;

                if (foodBaseAmount > 0 && correctedFoodTax > 0) {
                    const halfRateStr = intendedHalfRate.toString();

                    if (!gstGroups[halfRateStr]) {
                        gstGroups[halfRateStr] = { sgst: 0, cgst: 0 };
                    }
                    gstGroups[halfRateStr].sgst += correctedFoodSGST;
                    gstGroups[halfRateStr].cgst += correctedFoodCGST;
                }

                yPos += currentFoodRowHeight;
            });
        }
    });

    // Total Amount Row (spans columns up to Amount, then shows SGST and CGST)
    const totalRowHeight = 20;
    const totalLabelWidth = colWidths.guest + colWidths.checkIn + colWidths.checkOut + colWidths.nights + colWidths.hsn + colWidths.tariff;

    const totalSummarySGST = Object.values(gstGroups).reduce((acc, curr) => acc + curr.sgst, 0);
    const totalSummaryCGST = Object.values(gstGroups).reduce((acc, curr) => acc + curr.cgst, 0);

    drawCell(tableX, yPos, totalLabelWidth, totalRowHeight, 'Total Amount', {
        fontSize: 9,
        bold: true,
        align: 'center',
        valign: 'middle',
        paddingLeft: 3,
        paddingRight: 3
    });
    drawCell(colX.amount, yPos, colWidths.amount, totalRowHeight, formatCurrency(totalWithoutGST), {
        fontSize: 9,
        bold: true,
        align: 'center',
        paddingLeft: 2,
        paddingRight: 2,
        valign: 'middle'
    });
    drawCell(colX.tax, yPos, colWidths.tax, totalRowHeight, '', {
        fontSize: 9,
        bold: true,
        align: 'center',
        valign: 'middle'
    });
    drawCell(colX.sgst, yPos, colWidths.sgst, totalRowHeight, formatCurrency(totalSummarySGST), {
        fontSize: 9,
        bold: true,
        align: 'center',
        paddingLeft: 2,
        paddingRight: 2,
        valign: 'middle'
    });
    drawCell(colX.cgst, yPos, colWidths.cgst, totalRowHeight, formatCurrency(totalSummaryCGST), {
        fontSize: 9,
        bold: true,
        align: 'center',
        paddingLeft: 2,
        paddingRight: 2,
        valign: 'middle'
    });
    yPos += totalRowHeight;

    // Summary rows - spanning from start to Tax column, value in CGST column
    const summaryLabelWidth = tableWidth - colWidths.cgst;

    // Recalculate Final totals
    const servicesAmount = parseFloat(invoice.services_amount || 0);
    const roundOffValue = parseFloat(invoice.round_off_value || 0);

    // Use calculated totals to ensure consistency, especially when filtering
    const finalSubTotal = (!showFoodCharge) ? totalWithoutGST : (invoice.sub_total || totalWithoutGST);
    const calculatedGrandTotal = totalAmount + servicesAmount + roundOffValue;
    const finalGrandTotal = (!showFoodCharge) ? calculatedGrandTotal : (invoice.grand_total || calculatedGrandTotal);

    const summaryRows = [
        { label: 'Total Amount without GST', value: formatCurrency(finalSubTotal) }
    ];

    // Add dynamic GST rows from grouping
    const sortedRates = Object.keys(gstGroups).sort((a, b) => parseFloat(a) - parseFloat(b));
    let totalSGST = 0;
    let totalCGST = 0;

    sortedRates.forEach(rate => {
        const { sgst, cgst } = gstGroups[rate];
        totalSGST += sgst;
        totalCGST += cgst;

        // Convert "2.5" back to number for display, remove .0 if integer
        const displayRate = parseFloat(rate);

        summaryRows.push({ label: `SGST @ ${displayRate}%`, value: formatCurrency(sgst) });
        summaryRows.push({ label: `CGST @ ${displayRate}%`, value: formatCurrency(cgst) });
    });

    summaryRows.push(
        { label: 'Amount', value: formatCurrency(totalWithoutGST) },
        { label: invoice.services_name || '2 % Bank Charges', value: formatCurrency(servicesAmount) },
        { label: 'Total Amount', value: formatCurrency(totalWithoutGST + servicesAmount), bold: true },
        { label: 'Total Amount with GST (Round Off)', value: formatCurrency(finalGrandTotal), bold: true },
    );

    summaryRows.forEach(row => {
        // Calculate dynamic height for summary rows (just in case they wrap)
        const labelPadding = 6;
        const labelHeight = doc.heightOfString(row.label, { width: summaryLabelWidth - labelPadding });
        const currentSummaryRowHeight = Math.max(20, labelHeight + 8);

        drawCell(tableX, yPos, summaryLabelWidth, currentSummaryRowHeight, row.label, {
            fontSize: 8,
            bold: true,  // All labels are now bold
            align: 'center',
            valign: 'middle',
            paddingLeft: 4,
            paddingRight: 4
        });
        drawCell(colX.cgst, yPos, colWidths.cgst, currentSummaryRowHeight, row.value, {
            fontSize: 8,
            bold: row.bold || false,
            align: 'center',
            paddingLeft: 2,
            paddingRight: 2,
            valign: 'middle'
        });
        yPos += currentSummaryRowHeight;
    });

    // Amount in Words (full width)
    const amountInWords = numberToWords(finalGrandTotal);
    const wordsText = `Amount (in Words) ${amountInWords}`;
    const wordsPadding = 10;
    const wordsHeight = doc.heightOfString(wordsText, { width: tableWidth - wordsPadding });
    const dynamicWordsHeight = Math.max(20, wordsHeight + 8);

    drawCell(tableX, yPos, tableWidth, dynamicWordsHeight, wordsText, {
        fontSize: 8,
        bold: true,
        align: 'center',
        valign: 'middle',
        paddingLeft: 4,
        paddingRight: 4
    });
    yPos += dynamicWordsHeight + 12;

    // ===== FOOTER NOTES =====
    doc.fontSize(7)
        .font('Roboto-Regular')
        .fillColor('#000000')
        .text('1. Please issue cheque in the name of PAJASA STAY SOLUTIONS PVT. LTD.', 25, yPos);

    yPos += 9;
    doc.text('2. Current A/C NO : 914020029004193', 25, yPos);

    yPos += 9;
    doc.text('3. Account Holder Bank : Axis Bank', 25, yPos);

    yPos += 9;
    doc.text('4. IFSC Code: UTIB0000246', 25, yPos);

    yPos += 9;
    doc.text('5. PAN. NO: AAHCP7561R', 25, yPos);

    yPos += 9;
    doc.text('6. HSN CODE : 996311, Accommodation Services', 25, yPos);

    // Authorized Signatory (with seal placeholder)
    doc.fontSize(8)
        .font('Roboto-Bold')
        .text('Authorized Signatory', 480, yPos - 18);

    // Draw seal circle placeholder
    doc.circle(530, yPos + 8, 22).stroke('#000000');

    // ===== ORANGE FOOTER =====
    const footerY = doc.page.height - 80;

    // Orange background
    doc.rect(0, footerY, doc.page.width, 80)
        .fillAndStroke('#FF9800', '#FF9800');

    // Footer text
    doc.fontSize(9)
        .font('Roboto-Bold')
        .fillColor('#FFFFFF')
        .text('PAJASA STAY SOLUTIONS PVT LTD', 25, footerY + 8);

    doc.fontSize(6.5)
        .font('Roboto-Regular')
        .text('Corporate Office : HO 83 C20, We Work Enam Sambhavnath Block Road BKC, Bandra Kurla Complex, Mumbai, Maharashtra, 400051', 25, footerY + 23, { width: 545 });

    doc.text('Connect Us : +91 7738777602 | info@pajasaapartments.com | www.pajasaapartments.com', 25, footerY + 38);

    doc.text('CIN Number: U55101MH2020PTC348068 | GST Number: 27AAHCP7561R1ZH | PAN Number: AAHCP7561R', 25, footerY + 50);

    // Decorative triangle at bottom right
    doc.save();
    doc.polygon([doc.page.width - 60, doc.page.height], [doc.page.width, doc.page.height], [doc.page.width, doc.page.height - 60])
        .fillAndStroke('#FF6F00', '#FF6F00');
    doc.restore();

    // Finalize PDF
    doc.end();
};
