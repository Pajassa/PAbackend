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

    // Fetch invoice details with joined client information
    const invoiceQuery = `
      SELECT i.*, 
             r.client_id,
             c.client_name, c.street_address, c.street_address_2, 
             c.city, c.state, c.zip_code, c.email_address
      FROM invoices i
      LEFT JOIN reservations r ON i.reservation_id = r.id
      LEFT JOIN clients c ON r.client_id = c.id
      WHERE i.id = $1
    `;
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
      currency, conversionRate, reservationIds, lineItems
    } = req.body;

    console.log("updateInvoice Body:", {
      id, date, invoiceTo, status, lineItemsCount: lineItems?.length, reservationIds
    });

    // 1. Calculate Totals
    let subTotal = 0;
    let taxTotal = 0;
    let grandTotal = 0;

    const items = Array.isArray(lineItems) ? lineItems : [];

    items.forEach(item => {
      const tariff = toNum(item.tariff);
      const days = toNum(item.days);
      const roomTax = toNum(item.tax);

      subTotal += (tariff * days);
      taxTotal += roomTax;

      // Calculate food items for this row if they exist
      if (item.foodItems && Array.isArray(item.foodItems)) {
        item.foodItems.forEach(food => {
          const foodAmount = toNum(food.foodAmount);
          const foodTax = toNum(food.foodTax) || (toNum(food.foodSGST) + toNum(food.foodCGST));

          subTotal += foodAmount;
          taxTotal += foodTax;
        });
      }

      grandTotal += toNum(item.total);
    });

    // Add extra services to subTotal and grandTotal
    const sAmt = toNum(servicesAmount);
    subTotal += sAmt;
    grandTotal += sAmt;

    // Add round off to grandTotal
    grandTotal += toNum(roundOffValue);

    console.log("Calculated Totals:", { subTotal, taxTotal, grandTotal });

    // Primary reservation ID for the main table
    const primaryReservationId = reservationIds && reservationIds.length > 0 ? reservationIds[0] : null;

    // 2. Update Invoice Record
    const updateQuery = `
      UPDATE invoices 
      SET 
        invoice_date = $1, invoice_to = $2, state_for_billing = $3,
        pan_number = $4, status = $5, payment_method = $6, currency = $7, conversion_rate = $8,
        sub_total = $9, tax_total = $10, grand_total = $11, display_taxes = $12,
        display_food_charge = $13, extra_services = $14, services_name = $15,
        services_amount = $16, pdf_password = $17, page_break = $18,
        guest_name_width = $19, round_off_value = $20, reservation_id = $21, updated_at = NOW()
      WHERE id = $22
      RETURNING *
    `;

    const values = [
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
      primaryReservationId,
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

    // 2.5 Update invoice_reservations junction table
    await client.query('DELETE FROM invoice_reservations WHERE invoice_id = $1', [id]);
    if (reservationIds && Array.isArray(reservationIds)) {
      for (const resId of reservationIds) {
        await client.query(
          `INSERT INTO invoice_reservations (invoice_id, reservation_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [id, resId]
        );
      }
    }

    // 3. Update Line Items (Delete all and Re-insert)
    await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);

    for (const item of items) {
      // Convert foodItems array to JSON string for storage if it exists
      const foodItemsJson = item.foodItems ? JSON.stringify(item.foodItems) : null;

      const itemUpdateQuery = `
        INSERT INTO invoice_items (
          invoice_id, location, description,
          check_in_date, check_out_date, days, rate, tax_amount, total_amount, food_items_json
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;

      await client.query(itemUpdateQuery, [
        id,
        item.location,
        item.guestName || '', // Store guest name in description field
        formatDate(item.checkInDate) || null,
        formatDate(item.checkOutDate) || null,
        toNum(item.days),
        toNum(item.tariff),
        toNum(item.tax),
        toNum(item.total),
        foodItemsJson
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

    // Fetch invoice details with client information
    const invoiceQuery = `
      SELECT i.*, 
             c.client_name, c.street_address, c.city as client_city, 
             c.state as client_state, c.zip_code as client_zip, 
             c.gst_no as client_gst, c.email_address as client_email
      FROM invoices i
      LEFT JOIN reservations r ON i.reservation_id = r.id
      LEFT JOIN clients c ON r.client_id = c.id
      WHERE i.id = $1
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
