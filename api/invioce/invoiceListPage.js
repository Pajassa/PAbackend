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

    // Fetch line items for each invoice
    const invoicesWithLineItems = await Promise.all(
      result.rows.map(async (invoice) => {
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

        // Map line items with food items
        const lineItems = itemsResult.rows.map(item => {
          let foodItems = [];
          if (item.food_items_json) {
            foodItems = typeof item.food_items_json === 'string'
              ? JSON.parse(item.food_items_json)
              : item.food_items_json;
          } else {
            foodItems = [{
              foodChargeType: 'Veg Lunch',
              foodTariff: '',
              foodQuantity: '1',
              foodAmount: '',
              foodTax: '',
              foodSGST: '',
              foodCGST: ''
            }];
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

        return {
          ...invoice,
          line_items: lineItems
        };
      })
    );

    res.status(200).json({
      message: "Invoices fetched successfully",
      data: invoicesWithLineItems
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
    // Frontend expects: location, guestName, checkInDate, checkOutDate, days, tariff, tax, total, foodItems
    // DB has: location, description, check_in_date, check_out_date, days, rate, tax_amount, total_amount, food_items_json
    const lineItems = itemsResult.rows.map(item => {
      // Parse foodItems from JSON column, or create default if not present (backward compatibility)
      let foodItems = [];
      if (item.food_items_json) {
        foodItems = typeof item.food_items_json === 'string'
          ? JSON.parse(item.food_items_json)
          : item.food_items_json;
      } else {
        // Backward compatibility: create default food item
        foodItems = [{
          foodChargeType: 'Veg Lunch',
          foodTariff: '',
          foodQuantity: '1',
          foodAmount: '',
          foodTax: '',
          foodSGST: '',
          foodCGST: ''
        }];
      }

      return {
        location: item.location,
        guestName: item.description || '', // description field stores guest name
        checkInDate: item.check_in_date,
        checkOutDate: item.check_out_date,
        days: item.days,
        tariff: item.rate,
        tax: item.tax_amount,
        sgst: '',
        cgst: '',
        total: item.total_amount,
        foodItems
      };
    });

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
        check_in_date, check_out_date, days, rate, tax_amount, total_amount
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `;

    for (const item of items) {
      await client.query(itemQuery, [
        id,
        item.location,
        item.foodTariff,
        item.checkInDate || null,
        item.checkOutDate || null,
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

// Download Invoice as PDF
export const downloadInvoice = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    // Fetch invoice details
    const invoiceQuery = `
      SELECT * FROM invoices WHERE id = $1
    `;
    const invoiceResult = await client.query(invoiceQuery, [id]);

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const invoice = invoiceResult.rows[0];

    // Try to add the column if it doesn't exist
    try {
      await client.query(`
        ALTER TABLE invoice_items 
        ADD COLUMN IF NOT EXISTS food_items_json JSONB
      `);
    } catch (err) {
      console.log("Column might already exist or permission issue:", err.message);
    }

    // Fetch line items - try with food_items_json first
    let itemsResult;
    try {
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
      itemsResult = await client.query(itemsQuery, [id]);
    } catch (err) {
      // If food_items_json column doesn't exist, query without it
      console.log("Querying without food_items_json column");
      const itemsQuery = `
        SELECT 
          location, 
          description, 
          check_in_date, 
          check_out_date, 
          days, 
          rate, 
          tax_amount, 
          total_amount
        FROM invoice_items 
        WHERE invoice_id = $1
      `;
      itemsResult = await client.query(itemsQuery, [id]);
    }

    // Map line items with food items
    const lineItems = itemsResult.rows.map(item => {
      let foodItems = [];
      if (item.food_items_json) {
        foodItems = typeof item.food_items_json === 'string'
          ? JSON.parse(item.food_items_json)
          : item.food_items_json;
      } else {
        // Default food item if column doesn't exist
        foodItems = [{
          foodChargeType: 'Veg Lunch',
          foodTariff: '',
          foodQuantity: '1',
          foodAmount: '',
          foodTax: '',
          foodSGST: '',
          foodCGST: ''
        }];
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

    // Generate PDF
    const { generateInvoicePDF } = await import('./pdfGenerator.js');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoice.invoice_number}.pdf`);

    generateInvoicePDF(invoice, lineItems, res);

  } catch (error) {
    console.error("Error downloading invoice:", error);
    res.status(500).json({ error: "Failed to download invoice" });
  } finally {
    client.release();
  }
};
