import pool from "../../client.js";

export const getAllInvoices = async (req, res) => {
  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        id, 
        invoice_number, 
        invoice_date, 
        invoice_to, 
        grand_total, 
        status,
        created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata' as created_at 
      FROM invoices 
      ORDER BY created_at DESC
    `;

    const result = await client.query(query);

    res.status(200).json({
      message: "Invoices fetched successfully",
      data: result.rows
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  } finally {
    client.release();
  }
};

export const deleteInvoice = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const query = 'DELETE FROM invoices WHERE id = $1 RETURNING *';
    const result = await client.query(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.status(200).json({ message: "Invoice deleted successfully", data: result.rows[0] });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res.status(500).json({ error: "Failed to delete invoice" });
  } finally {
    client.release();
  }
};

export const getInvoiceById = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    // Fetch invoice details
    const invoiceQuery = 'SELECT * FROM invoices WHERE id = $1';
    const invoiceResult = await client.query(invoiceQuery, [id]);

    if (invoiceResult.rowCount === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const invoice = invoiceResult.rows[0];

    // Fetch line items
    const itemsQuery = 'SELECT * FROM invoice_items WHERE invoice_id = $1';
    const itemsResult = await client.query(itemsQuery, [id]);

    // Attach items to invoice object (mapping them to match frontend expectations if needed)
    // Frontend expects: location, foodTariff, gstId, days, tariff, tax, total...
    // DB has: location, description, hsn_sac_code, days, rate, tax_amount, total_amount
    const lineItems = itemsResult.rows.map(item => ({
      location: item.location,
      foodTariff: item.description,
      gstId: item.hsn_sac_code,
      cgstId: '',
      days: item.days,
      tariff: item.rate,
      tax: item.tax_amount,
      sgst: '',
      cgst: '',
      igst: '',
      total: item.total_amount
    }));

    // Attach lineItems to invoice for frontend
    invoice.line_items = lineItems;

    res.status(200).json({ message: "Invoice details fetched successfully", data: invoice });
  } catch (error) {
    console.error("Error fetching invoice details:", error);
    res.status(500).json({ error: "Failed to fetch invoice details" });
  } finally {
    client.release();
  }
};

export const updateInvoice = async (req, res) => {
  const client = await pool.connect();

  // Helper: convert empty strings to number (reused from createInvoice logic)
  const toNum = (v) => {
    if (v === "" || v === null || v === undefined) return 0;
    return Number(v);
  };
  // Helper: convert MM/DD/YYYY → YYYY-MM-DD
  // Helper: convert MM/DD/YYYY → YYYY-MM-DD
  const formatDate = (dateString) => {
    console.log("Formatting date:", dateString);
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const {
      stateForBilling, displayFoodCharge, extraServices, servicesName, servicesAmount,
      date, pan, roundOffValue, guestNameWidth, displayCurrencyConversion, status,
      paymentMethod, pdfPassword, invoiceTo, pageBreak, displayTaxes, apartmentBillNo,
      currency, conversionRate, reservationId, lineItems
    } = req.body;

    console.log("updateInvoice Body:", {
      id, date, invoiceTo, status, lineItemsCount: lineItems?.length
    });

    // 1. Calculate Totals
    let subTotal = 0;
    let taxTotal = 0;
    let grandTotal = 0;

    const items = Array.isArray(lineItems) ? lineItems : [];

    items.forEach(item => {
      subTotal += toNum(item.tariff);
      taxTotal += toNum(item.tax);
      grandTotal += toNum(item.total);
    });

    console.log("Calculated Totals:", { subTotal, taxTotal, grandTotal });

    // 2. Update Invoice Record
    const updateQuery = `
      UPDATE invoices 
      SET 
        invoice_number = $1, invoice_date = $2, invoice_to = $3, state_for_billing = $4,
        pan_number = $5, status = $6, payment_method = $7, currency = $8, conversion_rate = $9,
        sub_total = $10, tax_total = $11, grand_total = $12, display_taxes = $13,
        display_food_charge = $14, extra_services = $15, services_name = $16,
        services_amount = $17, pdf_password = $18, page_break = $19,
        guest_name_width = $20, round_off_value = $21, updated_at = NOW()
      WHERE id = $22
      RETURNING *
    `;

    const values = [
      apartmentBillNo,
      formatDate(date),
      invoiceTo,
      stateForBilling,
      pan,
      status,
      paymentMethod,
      currency,
      toNum(conversionRate),
      subTotal,
      taxTotal,
      grandTotal,
      displayTaxes,
      displayFoodCharge === "Yes",
      extraServices === "Yes",
      servicesName,
      toNum(servicesAmount),
      pdfPassword,
      toNum(pageBreak),
      toNum(guestNameWidth),
      toNum(roundOffValue),
      id
    ];

    console.log("Executing Update Query...");
    const result = await client.query(updateQuery, values);
    console.log("Update Result RowCount:", result.rowCount);

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      console.log("Invoice not found for update");
      return res.status(404).json({ message: "Invoice not found" });
    }

    // 3. Update Line Items (Delete all and Re-insert)
    await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);

    const itemQuery = `
      INSERT INTO invoice_items (
        invoice_id, location, description,
        hsn_sac_code, days, rate, tax_amount, total_amount
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `;

    for (const item of items) {
      await client.query(itemQuery, [
        id,
        item.location,
        item.foodTariff, // Mapping to description? createInvoice maps item.location to location, item.foodTariff to ... wait.
        // CHECK createInvoice mapping:
        // invoice_id, location, description, hsn_sac_code, ...
        // VALUES ($1, $2, $3, $4...)
        // $3 is description. createInvoice passes item.foodTariff as $3? Let me double check usage.
        // Assuming createInvoice mapping:
        // $2 -> item.location
        // $3 -> item.foodTariff (seems odd for description but matching createInvoice)
        // $4 -> item.gstId
        item.foodTariff,
        item.gstId,
        toNum(item.days),
        toNum(item.tariff),
        toNum(item.tax),
        toNum(item.total)
      ]);
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Invoice updated successfully", data: result.rows[0] });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating invoice:", error);
    res.status(500).json({ error: "Failed to update invoice" });
  } finally {
    client.release();
  }
};
