import pool from "../../client.js";
import QRCode from "qrcode";

// GET /api/public/invoice/:invoiceNumber/:token
export const getPublicInvoice = async (req, res) => {
  const client = await pool.connect();
  try {
    const { invoiceNumber, token } = req.params;

    // Fetch invoice details with joined client information
    const invoiceQuery = `
      SELECT i.*, 
             r.client_id,
             c.client_name, c.street_address, c.street_address_2, 
             c.city, c.state, c.zip_code, c.email_address, c.gst_no as client_gst
      FROM invoices i
      LEFT JOIN reservations r ON i.reservation_id = r.id
      LEFT JOIN clients c ON r.client_id = c.id
      WHERE i.invoice_number = $1 AND i.secure_token = $2
    `;
    const invoiceResult = await client.query(invoiceQuery, [invoiceNumber, token]);

    if (invoiceResult.rowCount === 0) {
      return res.status(404).json({ error: "Invoice not found or invalid token" });
    }

    const invoice = invoiceResult.rows[0];

    // Fetch line items
    const itemsQuery = 'SELECT * FROM invoice_items WHERE invoice_id = $1';
    const itemsResult = await client.query(itemsQuery, [invoice.id]);

    const lineItems = itemsResult.rows.map(item => {
      let foodItems = [];
      if (item.food_items_json) {
        foodItems = typeof item.food_items_json === 'string'
          ? JSON.parse(item.food_items_json)
          : item.food_items_json;
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

    invoice.line_items = lineItems;

    // Generate UPI Payment Link
    const upiId = process.env.UPI_ID || "pajasastaysolutionspvtltd.9820830989.ibz@icici";
    const payeeName = process.env.UPI_PAYEE_NAME || "PAJASA STAY SOLUTIONS PVT LTD";
    const amount = Math.round(parseFloat(invoice.grand_total || 0));
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=Invoice%20${invoice.invoice_number}`;

    // Generate UPI QR Code as Base64 Image
    const upiQRBase64 = await QRCode.toDataURL(upiLink, {
      margin: 1,
      width: 250,
      color: {
        dark: "#000000",
        light: "#FFFFFF"
      }
    });

    res.status(200).json({
      message: "Public invoice fetched successfully",
      data: {
        invoice,
        upiLink,
        upiQR: upiQRBase64,
        paymentInstructions: {
          payeeName,
          upiId,
          bankName: "Axis Bank",
          accountNo: "914020029004193",
          ifsc: "UTIB0000246",
          pan: "AAHCP7561R"
        }
      }
    });

  } catch (error) {
    console.error("Error fetching public invoice details:", error);
    res.status(500).json({ error: "Failed to fetch public invoice details" });
  } finally {
    client.release();
  }
};

// GET /api/public/invoice/:invoiceNumber/:token/download
export const downloadPublicInvoice = async (req, res) => {
  const client = await pool.connect();
  try {
    const { invoiceNumber, token } = req.params;

    // Fetch invoice details with client information
    const invoiceQuery = `
      SELECT i.*, 
             c.client_name, c.street_address, c.city as client_city, 
             c.state as client_state, c.zip_code as client_zip, 
             c.gst_no as client_gst, c.email_address as client_email
      FROM invoices i
      LEFT JOIN reservations r ON i.reservation_id = r.id
      LEFT JOIN clients c ON r.client_id = c.id
      WHERE i.invoice_number = $1 AND i.secure_token = $2
    `;
    const invoiceResult = await client.query(invoiceQuery, [invoiceNumber, token]);

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found or invalid token" });
    }

    const invoice = invoiceResult.rows[0];

    // Fetch line items
    const itemsQuery = `
      SELECT 
        location, 
        description, 
        check_in_date, 
        check_out_date, 
        days, 
        rate, 
        tax_amount, 
        total_amount,
        food_items_json
      FROM invoice_items 
      WHERE invoice_id = $1
    `;
    const itemsResult = await client.query(itemsQuery, [invoice.id]);

    const lineItems = itemsResult.rows.map(item => {
      let foodItems = [];
      if (item.food_items_json) {
        foodItems = typeof item.food_items_json === 'string'
          ? JSON.parse(item.food_items_json)
          : item.food_items_json;
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

    // Generate PDF using existing generator
    const { generateInvoicePDF } = await import('./pdfGenerator.js');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoice_number}.pdf"`);

    await generateInvoicePDF(invoice, lineItems, res);

  } catch (error) {
    console.error("Error downloading public invoice:", error);
    res.status(500).json({ error: "Failed to download invoice" });
  } finally {
    client.release();
  }
};
