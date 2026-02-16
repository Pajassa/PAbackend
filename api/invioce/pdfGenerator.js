import PDFDocument from 'pdfkit';
import { numberToWords } from '../../helpers/numberToWords.js';

export const generateInvoicePDF = (invoice, lineItems, res) => {
    const doc = new PDFDocument({
        size: 'A4',
        margin: 20,
        bufferPages: true
    });

    // Pipe PDF to response
    doc.pipe(res);

    // A4 width: 595 points, with 20pt margins on each side = 555pt usable width
    const pageWidth = 595;
    const margin = 20;
    const usableWidth = pageWidth - (margin * 2); // 555pt

    // Helper function to format currency
    const formatCurrency = (amount) => {
        const num = parseFloat(amount || 0);
        return `Rs. ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
            paddingLeft = 3,
            paddingRight = 3,
            valign = 'middle'
        } = options;

        // Draw cell border
        if (fillColor) {
            doc.rect(x, y, width, height).fillAndStroke(fillColor, '#000000');
        } else {
            doc.rect(x, y, width, height).stroke('#000000');
        }

        // Set font
        doc.fontSize(fontSize)
            .font(bold ? 'Helvetica-Bold' : 'Helvetica')
            .fillColor('#000000');

        // Calculate vertical position based on valign
        let textY;
        if (valign === 'top') {
            textY = y + 3;
        } else if (valign === 'bottom') {
            textY = y + height - fontSize - 3;
        } else { // middle
            textY = y + (height - fontSize) / 2 + 1;
        }

        // Draw text with proper alignment
        const textWidth = width - paddingLeft - paddingRight;

        if (align === 'center') {
            doc.text(text, x + paddingLeft, textY, {
                width: textWidth,
                align: 'center',
                lineBreak: false
            });
        } else if (align === 'right') {
            doc.text(text, x + paddingLeft, textY, {
                width: textWidth,
                align: 'right',
                lineBreak: false
            });
        } else {
            doc.text(text, x + paddingLeft, textY, {
                width: textWidth,
                lineBreak: false
            });
        }
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
            .font('Helvetica-Bold')
            .fillColor('#FF9800')
            .text('PAJASA', 500, 25, { width: 75, align: 'right' });

        doc.fontSize(9)
            .fillColor('#666666')
            .text('APARTMENTS', 500, 38, { width: 75, align: 'right' });

        doc.fontSize(7)
            .font('Helvetica')
            .text('Extended Stay Partner', 500, 50, { width: 75, align: 'right' });
    }

    // ===== TAX INVOICE TITLE =====
    yPos = 90;
    doc.fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('TAX INVOICE', 0, yPos, { align: 'center', width: pageWidth });

    // ===== LEFT SECTION: BILLED TO =====
    yPos = 130;
    doc.fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(invoice.client_name || invoice.invoice_to || 'Client Name Not Specified', 30, yPos);

    yPos += 16;
    doc.fontSize(8)
        .font('Helvetica')
        .text(invoice.street_address || '', 30, yPos);

    if (invoice.client_city || invoice.client_state || invoice.client_zip) {
        yPos += 11;
        doc.text(`${invoice.client_city || ''} ${invoice.client_state || ''} ${invoice.client_zip || ''}`.trim(), 30, yPos);
    }

    yPos += 16;
    doc.fontSize(8)
        .font('Helvetica-Bold')
        .text('GSTIN: ', 30, yPos, { continued: true })
        .font('Helvetica')
        .text(invoice.client_gst || invoice.gst_no || 'N/A');

    yPos += 12;
    doc.font('Helvetica-Bold')
        .text('Place of Supply: ', 30, yPos, { continued: true })
        .font('Helvetica')
        .text(invoice.state_for_billing || invoice.client_state || 'Maharashtra');

    // ===== RIGHT SECTION: INVOICE DETAILS =====
    const rightX = 330;
    let rightY = 130;

    doc.fontSize(8)
        .font('Helvetica-Bold')
        .text('Invoice No.: ', rightX, rightY, { continued: true })
        .font('Helvetica')
        .text(invoice.invoice_number || 'PAMH24250243');

    rightY += 12;
    doc.font('Helvetica-Bold')
        .text('Invoice Date: ', rightX, rightY, { continued: true })
        .font('Helvetica')
        .text(formatDate(invoice.invoice_date) || '07th March 2025');

    rightY += 12;
    doc.font('Helvetica-Bold')
        .text('Pajasa HSN Code: ', rightX, rightY, { continued: true })
        .font('Helvetica')
        .text('996311');

    rightY += 12;
    doc.font('Helvetica-Bold')
        .text('Pajasa GSTIN: ', rightX, rightY, { continued: true })
        .font('Helvetica')
        .text('27AAHCP7561R1ZH');

    rightY += 12;
    doc.font('Helvetica-Bold')
        .text('Place of Supply State Code: ', rightX, rightY, { continued: true })
        .font('Helvetica')
        .text('27');

    rightY += 12;
    doc.font('Helvetica-Bold')
        .text('Udyam Registration No: ', rightX, rightY, { continued: true })
        .font('Helvetica')
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
    let totalSGST_6 = 0, totalCGST_6 = 0;
    let totalSGST_9 = 0, totalCGST_9 = 0;
    let totalSGST_2_5 = 0, totalCGST_2_5 = 0;

    lineItems.forEach((item) => {
        // Main line item (room charges)
        const roomAmount = parseFloat(item.total || 0);
        const roomTax = parseFloat(item.tax || 0);
        const roomSGST = roomTax / 2;
        const roomCGST = roomTax / 2;

        drawCell(colX.guest, yPos, colWidths.guest, rowHeight, item.guestName || '', {
            fontSize: 8,
            align: 'left',
            paddingLeft: 3,
            paddingRight: 2,
            valign: 'middle'
        });
        drawCell(colX.checkIn, yPos, colWidths.checkIn, rowHeight, formatDate(item.checkInDate), {
            fontSize: 8,
            align: 'center',
            paddingLeft: 2,
            paddingRight: 2,
            valign: 'middle'
        });
        drawCell(colX.checkOut, yPos, colWidths.checkOut, rowHeight, formatDate(item.checkOutDate), {
            fontSize: 8,
            align: 'center',
            paddingLeft: 2,
            paddingRight: 2,
            valign: 'middle'
        });
        drawCell(colX.nights, yPos, colWidths.nights, rowHeight, String(item.days || '0'), {
            fontSize: 8,
            align: 'center',
            paddingLeft: 2,
            paddingRight: 2,
            valign: 'middle'
        });
        drawCell(colX.hsn, yPos, colWidths.hsn, rowHeight, '996311', {
            fontSize: 8,
            align: 'center',
            paddingLeft: 2,
            paddingRight: 2,
            valign: 'middle'
        });
        drawCell(colX.tariff, yPos, colWidths.tariff, rowHeight, formatCurrency(item.tariff), {
            fontSize: 8,
            align: 'center',
            paddingLeft: 2,
            paddingRight: 2,
            valign: 'middle'
        });
        drawCell(colX.amount, yPos, colWidths.amount, rowHeight, formatCurrency(roomAmount), {
            fontSize: 8,
            align: 'center',
            paddingLeft: 2,
            paddingRight: 2,
            valign: 'middle'
        });
        drawCell(colX.tax, yPos, colWidths.tax, rowHeight, String(roomTax.toFixed(0)), {
            fontSize: 8,
            align: 'center',
            paddingLeft: 2,
            paddingRight: 2,
            valign: 'middle'
        });
        drawCell(colX.sgst, yPos, colWidths.sgst, rowHeight, formatCurrency(roomSGST), {
            fontSize: 8,
            align: 'center',
            paddingLeft: 2,
            paddingRight: 2,
            valign: 'middle'
        });
        drawCell(colX.cgst, yPos, colWidths.cgst, rowHeight, formatCurrency(roomCGST), {
            fontSize: 8,
            align: 'center',
            paddingLeft: 2,
            paddingRight: 2,
            valign: 'middle'
        });

        totalAmount += roomAmount;
        const roomAmountWithoutTax = roomAmount - roomTax;
        totalWithoutGST += roomAmountWithoutTax;

        // Categorize room tax dynamically based on calculated rate
        if (roomAmountWithoutTax > 0) {
            const rate = (roomTax / roomAmountWithoutTax) * 100;
            if (rate > 15) { // Likely 18% (9+9)
                totalSGST_9 += roomSGST;
                totalCGST_9 += roomCGST;
            } else if (rate > 10) { // Likely 12% (6+6)
                totalSGST_6 += roomSGST;
                totalCGST_6 += roomCGST;
            } else if (rate > 4) { // Likely 5% (2.5+2.5)
                totalSGST_2_5 += roomSGST;
                totalCGST_2_5 += roomCGST;
            } else {
                totalSGST_9 += roomSGST;
                totalCGST_9 += roomCGST;
            }
        } else {
            totalSGST_9 += roomSGST;
            totalCGST_9 += roomCGST;
        }

        yPos += rowHeight;

        // Food items
        if (item.foodItems && item.foodItems.length > 0) {
            item.foodItems.forEach((food) => {
                const foodAmount = parseFloat(food.foodAmount || 0);
                const foodTax = parseFloat(food.foodTax || 0);
                const foodSGST = parseFloat(food.foodSGST || 0);
                const foodCGST = parseFloat(food.foodCGST || 0);
                const foodQty = food.foodQuantity || '1';

                drawCell(colX.guest, yPos, colWidths.guest, rowHeight, food.foodChargeType || 'Food', {
                    fontSize: 8,
                    align: 'left',
                    paddingLeft: 3,
                    paddingRight: 2,
                    valign: 'middle'
                });
                drawCell(colX.checkIn, yPos, colWidths.checkIn, rowHeight, formatDate(item.checkInDate), {
                    fontSize: 8,
                    align: 'center',
                    paddingLeft: 2,
                    paddingRight: 2,
                    valign: 'middle'
                });
                drawCell(colX.checkOut, yPos, colWidths.checkOut, rowHeight, formatDate(item.checkOutDate), {
                    fontSize: 8,
                    align: 'center',
                    paddingLeft: 2,
                    paddingRight: 2,
                    valign: 'middle'
                });
                drawCell(colX.nights, yPos, colWidths.nights, rowHeight, String(foodQty), {
                    fontSize: 8,
                    align: 'center',
                    paddingLeft: 2,
                    paddingRight: 2,
                    valign: 'middle'
                });
                drawCell(colX.hsn, yPos, colWidths.hsn, rowHeight, '999711', {
                    fontSize: 8,
                    align: 'center',
                    paddingLeft: 2,
                    paddingRight: 2,
                    valign: 'middle'
                });
                drawCell(colX.tariff, yPos, colWidths.tariff, rowHeight, formatCurrency(food.foodTariff), {
                    fontSize: 8,
                    align: 'center',
                    paddingLeft: 2,
                    paddingRight: 2,
                    valign: 'middle'
                });
                drawCell(colX.amount, yPos, colWidths.amount, rowHeight, formatCurrency(foodAmount), {
                    fontSize: 8,
                    align: 'center',
                    paddingLeft: 2,
                    paddingRight: 2,
                    valign: 'middle'
                });
                drawCell(colX.tax, yPos, colWidths.tax, rowHeight, String(foodTax.toFixed(0)), {
                    fontSize: 8,
                    align: 'center',
                    paddingLeft: 2,
                    paddingRight: 2,
                    valign: 'middle'
                });
                drawCell(colX.sgst, yPos, colWidths.sgst, rowHeight, formatCurrency(foodSGST), {
                    fontSize: 8,
                    align: 'center',
                    paddingLeft: 2,
                    paddingRight: 2,
                    valign: 'middle'
                });
                drawCell(colX.cgst, yPos, colWidths.cgst, rowHeight, formatCurrency(foodCGST), {
                    fontSize: 8,
                    align: 'center',
                    paddingLeft: 2,
                    paddingRight: 2,
                    valign: 'middle'
                });

                totalAmount += foodAmount;
                totalWithoutGST += (foodAmount - foodTax);
                totalSGST_2_5 += foodSGST;
                totalCGST_2_5 += foodCGST;

                yPos += rowHeight;
            });
        }
    });

    // Total Amount Row (spans columns up to Amount, then shows SGST and CGST)
    const totalRowHeight = 20;
    const totalLabelWidth = colWidths.guest + colWidths.checkIn + colWidths.checkOut + colWidths.nights + colWidths.hsn + colWidths.tariff;

    drawCell(tableX, yPos, totalLabelWidth, totalRowHeight, 'Total Amount', {
        fontSize: 9,
        bold: true,
        align: 'center',
        valign: 'middle',
        paddingLeft: 3,
        paddingRight: 3
    });
    drawCell(colX.amount, yPos, colWidths.amount, totalRowHeight, formatCurrency(totalAmount), {
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
    const totalSGST = totalSGST_6 + totalSGST_9 + totalSGST_2_5;
    const totalCGST = totalCGST_6 + totalCGST_9 + totalCGST_2_5;

    drawCell(tableX, yPos, totalLabelWidth, totalRowHeight, 'Total Amount', {
        fontSize: 9,
        bold: true,
        align: 'center',
        valign: 'middle',
        paddingLeft: 3,
        paddingRight: 3
    });
    drawCell(colX.amount, yPos, colWidths.amount, totalRowHeight, formatCurrency(totalAmount), {
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
    drawCell(colX.sgst, yPos, colWidths.sgst, totalRowHeight, formatCurrency(totalSGST), {
        fontSize: 9,
        bold: true,
        align: 'center',
        paddingLeft: 2,
        paddingRight: 2,
        valign: 'middle'
    });
    drawCell(colX.cgst, yPos, colWidths.cgst, totalRowHeight, formatCurrency(totalCGST), {
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

    const summaryRows = [
        { label: 'Total Amount without GST', value: formatCurrency(invoice.sub_total || totalWithoutGST) },
        { label: 'SGST @ 6%', value: formatCurrency(totalSGST_6) },
        { label: 'CGST @ 6%', value: formatCurrency(totalCGST_6) },
        { label: 'SGST @ 9%', value: formatCurrency(totalSGST_9) },
        { label: 'CGST @ 9%', value: formatCurrency(totalCGST_9) },
        { label: 'SGST @ 2.5%', value: formatCurrency(totalSGST_2_5) },
        { label: 'CGST @ 2.5%', value: formatCurrency(totalCGST_2_5) },
        { label: 'Total Amount with GST (Round Off)', value: formatCurrency(invoice.grand_total || totalAmount), bold: true },
        { label: 'Payment received for Lunch & Laundry', value: formatCurrency(0) },
        { label: 'Amount', value: formatCurrency(invoice.grand_total || totalAmount) },
        { label: invoice.services_name || '2 % Bank Charges', value: formatCurrency(invoice.services_amount || 0) },
        { label: 'Total Amount', value: formatCurrency(invoice.grand_total || totalAmount), bold: true }
    ];

    summaryRows.forEach(row => {
        drawCell(tableX, yPos, summaryLabelWidth, totalRowHeight, row.label, {
            fontSize: 8,
            bold: true,  // All labels are now bold
            align: 'center',
            valign: 'middle',
            paddingLeft: 3,
            paddingRight: 3
        });
        drawCell(colX.cgst, yPos, colWidths.cgst, totalRowHeight, row.value, {
            fontSize: 8,
            bold: row.bold || false,
            align: 'center',
            paddingLeft: 2,
            paddingRight: 2,
            valign: 'middle'
        });
        yPos += totalRowHeight;
    });

    // Amount in Words (full width)
    const amountInWords = numberToWords(invoice.grand_total || totalAmount);
    drawCell(tableX, yPos, tableWidth, totalRowHeight, `Amount (in Words) ${amountInWords}`, {
        fontSize: 8,
        bold: true,
        align: 'center',
        valign: 'middle',
        paddingLeft: 3,
        paddingRight: 3
    });
    yPos += totalRowHeight + 12;

    // ===== FOOTER NOTES =====
    doc.fontSize(7)
        .font('Helvetica')
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
        .font('Helvetica-Bold')
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
        .font('Helvetica-Bold')
        .fillColor('#FFFFFF')
        .text('PAJASA STAY SOLUTIONS PVT LTD', 25, footerY + 8);

    doc.fontSize(6.5)
        .font('Helvetica')
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
