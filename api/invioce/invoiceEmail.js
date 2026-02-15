import { Resend } from "resend";
import pool from "../../client.js";
import { generatePuppeteerPDF } from "./puppeteerPdfGenerator.js";
import fs from 'fs';
import path from 'path';
import os from 'os';

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper: Convert number to words (Indian Rupees)
const numberToWords = (num) => {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    const inWords = (n) => {
        if ((n = n.toString()).length > 9) return 'overflow';
        let nArr = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!nArr) return '';
        let str = '';
        str += nArr[1] != 0 ? (a[Number(nArr[1])] || b[nArr[1][0]] + ' ' + a[nArr[1][1]]) + 'crore ' : '';
        str += nArr[2] != 0 ? (a[Number(nArr[2])] || b[nArr[2][0]] + ' ' + a[nArr[2][1]]) + 'lakh ' : '';
        str += nArr[3] != 0 ? (a[Number(nArr[3])] || b[nArr[3][0]] + ' ' + a[nArr[3][1]]) + 'thousand ' : '';
        str += nArr[4] != 0 ? (a[Number(nArr[4])] || b[nArr[4][0]] + ' ' + a[nArr[4][1]]) + 'hundred ' : '';
        str += nArr[5] != 0 ? ((str != '') ? 'and ' : '') + (a[Number(nArr[5])] || b[nArr[5][0]] + ' ' + a[nArr[5][1]]) : '';
        return str;
    };

    const whole = Math.floor(num);
    const fraction = Math.round((num - whole) * 100);
    let res = inWords(whole) + 'Rupees ';
    if (fraction > 0) {
        res += 'and ' + inWords(fraction) + 'Paise ';
    }
    return res.trim().toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + ' Only';
};

export const sendInvoiceEmail = async (req, res) => {
    const { invoiceId, customerName, customerEmail, invoiceNumber, invoiceDate, amount } = req.body;

    try {
        // 1. Fetch deep data for the system with client details
        const client = await pool.connect();
        let invoiceData = {};
        let lineItems = [];

        try {
            const invoiceQueryResult = await client.query(`
                SELECT i.*, 
                       c.client_name, c.street_address, c.city as client_city, 
                       c.state as client_state, c.zip_code as client_zip, 
                       c.gst_no as client_gst, c.email_address as client_email
                FROM invoices i
                LEFT JOIN reservations r ON i.reservation_id = r.id
                LEFT JOIN clients c ON r.client_id = c.id
                WHERE i.id = $1
            `, [invoiceId]);

            if (invoiceQueryResult.rows.length === 0) {
                return res.status(404).json({ message: "Invoice not found" });
            }
            invoiceData = invoiceQueryResult.rows[0];

            const itemsQueryResult = await client.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [invoiceId]);
            lineItems = itemsQueryResult.rows.map(item => {
                let foodItems = [];
                if (item.food_items_json) {
                    foodItems = typeof item.food_items_json === 'string' ? JSON.parse(item.food_items_json) : item.food_items_json;
                }
                return {
                    location: item.location,
                    guestName: item.description || '',
                    checkInDate: item.check_in_date,
                    checkOutDate: item.check_out_date,
                    days: item.days,
                    tariff: item.rate,
                    tax: item.tax_amount,
                    total: item.total_amount,
                    foodItems
                };
            });
            invoiceData.line_items = lineItems;

            // Add amount in words to invoiceData
            invoiceData.amount_in_words = numberToWords(parseFloat(invoiceData.grand_total || amount || 0));

        } finally {
            client.release();
        }

        // Logic check for target email
        let targetEmail = customerEmail || invoiceData.client_email || invoiceData.customer_email;
        if (!targetEmail) {
            // Re-run fallback lookup if still missing (via bridge table)
            const fallbackQuery = `
                SELECT r.guest_email 
                FROM reservations r
                JOIN invoice_reservations ir ON r.id = ir.reservation_id
                WHERE ir.invoice_id = $1
                LIMIT 1
            `;
            const fbResult = await pool.query(fallbackQuery, [invoiceId]);
            if (fbResult.rows.length > 0) {
                targetEmail = fbResult.rows[0].guest_email;
            }
        }

        // 2. Generate PDF
        console.log("Generating PDF for invoice:", invoiceData.invoice_number);
        const pdfBuffer = await generatePuppeteerPDF(invoiceData, lineItems);
        console.log("PDF generated. Buffer size:", pdfBuffer ? pdfBuffer.length : "undefined");

        if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error("Generated PDF buffer is empty");
        }

        // Save temporarily as requested
        const tmpPath = path.join(os.tmpdir(), `invoice-${invoiceData.invoice_number || invoiceNumber}.pdf`);
        fs.writeFileSync(tmpPath, pdfBuffer);

        // 3. Email content - Keep format EXACTLY SAME
        const currentYear = new Date().getFullYear();
        const dateObj = new Date(invoiceData.invoice_date || invoiceDate);
        const formattedDate = isNaN(dateObj.getTime()) ? (invoiceData.invoice_date || invoiceDate) : dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

        // Prioritize customerName (from UI) then invoiceData fields
        const displayClientName = customerName || invoiceData.guest_name || invoiceData.client_name || invoiceData.invoice_to || "Guest";

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; }
        .container { max-width: 650px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e0e0e0; }
        .header { background-color: #f39c12; padding: 25px 20px; text-align: center; color: white; font-size: 20px; font-weight: bold; }
        .content { padding: 40px 30px; color: #333; line-height: 1.6; }
        .greeting { font-size: 16px; margin-bottom: 15px; }
        .intro { font-size: 15px; margin-bottom: 25px; }
        .table-container { margin: 30px 0; }
        .details-table { width: 100%; border-collapse: collapse; border: 1px solid #f0f0f0; }
        .details-table th, .details-table td { padding: 12px 20px; border: 1px solid #f0f0f0; text-align: left; font-size: 14px; }
        .details-table th { background-color: #f9f9f9; color: #666; width: 40%; font-weight: 600; text-align: center; }
        .details-table td { background-color: #ffffff; color: #333; text-align: center; }
        .thanks { margin-top: 30px; font-size: 15px; }
        .signature { margin-top: 20px; font-size: 15px; }
        .bank-details { font-size: 12px; color: #777; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; list-style-type: none; padding-left: 0; }
        .bank-details li { margin-bottom: 5px; }
        .footer { background-color: #666; padding: 20px; text-align: center; color: white; font-size: 13px; letter-spacing: 0.5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            Invoice For ${displayClientName}
        </div>
        <div class="content">
            <div class="greeting">Dear ${displayClientName},</div>
            <div class="intro">Please find attached the invoice for your stay at PAJASA Apartments:</div>
            
            <div class="table-container">
                <table class="details-table">
                    <tr>
                        <th>Invoice Number</th>
                        <td>${invoiceData.invoice_number || invoiceNumber}</td>
                    </tr>
                    <tr>
                        <th>Invoice Date</th>
                        <td>${formattedDate}</td>
                    </tr>
                    <tr>
                        <th>Amount</th>
                        <td style="font-weight: bold;">₹${Number(invoiceData.grand_total || amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                </table>
            </div>

            <div class="thanks">Thanks for your business with us!</div>
            <div class="signature">
                Team Accounts,<br>
                <strong>PAJASA Stay Solutions Pvt Ltd.</strong>
            </div>

            <ul class="bank-details">
                <li>1. Please issue cheque in the name of PAJASA STAY SOLUTIONS PVT. LTD.</li>
                <li>2. Current A/C NO : 914020029004193</li>
                <li>3. Account Holder Bank : Axis Bank</li>
                <li>4. IFSC Code : UTIB0000246</li>
                <li>5. PAN. NO : AAHCP7561R</li>
                <li>6. HSN CODE : 996311; Accomodation Services</li>
            </ul>
        </div>
        <div class="footer">
            &copy; ${currentYear} Pajasa Apartments. All Rights Reserved
        </div>
    </div>
</body>
</html>
    `;

        // 4. Send Email with Attachment
        const sendTo = (targetEmail && targetEmail !== "") ? targetEmail : "harshitshukla6388@gmail.com";
        const emailTo = Array.isArray(sendTo) ? sendTo : [sendTo];

        console.log("Sending email to:", emailTo);
        const { data, resendError } = await resend.emails.send({
            from: "hosting@pajasa.com",
            to: ["harshitshukla6388@gmail.com"], // Force test email for now
            subject: `${invoiceData.invoice_number || invoiceNumber} : Invoice Generated For Stay At PAJASA Apartments`,
            html: htmlContent,
            attachments: [
                {
                    filename: `invoice-${invoiceData.invoice_number || invoiceNumber || 'details'}.pdf`,
                    content: Buffer.from(pdfBuffer),
                }
            ]
        });

        if (resendError) {
            console.error("Resend API error:", resendError);
            throw new Error(`Resend Error: ${resendError.message}`);
        }

        console.log("Resend API result (data):", data);

        // Cleanup tmp file
        try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch (e) { }

        res.status(200).json({ message: "Invoice email sent successfully with PDF attachment" });

    } catch (error) {
        console.error("Error sending invoice email with PDF:", error);
        res.status(500).json({ message: "Failed to send invoice email", error: error.message });
    }
};
