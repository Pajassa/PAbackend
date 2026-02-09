import pool from "../../client.js";

export const createInvoice = async (req, res) => {
  const client = await pool.connect(); // FIX: use client instead of pool

  // Helper: convert empty strings to number
  const toNum = (v) => {
    if (v === "" || v === null || v === undefined) return 0;
    return Number(v);
  };

  // Helper: convert MM/DD/YYYY → YYYY-MM-DD
  const formatDate = (dateString) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return null; // prevents crash
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  try {
    await client.query("BEGIN");

    const {
      stateForBilling,
      displayFoodCharge,
      extraServices,
      servicesName,
      servicesAmount,
      date,
      pan,
      roundOffValue,
      guestNameWidth,
      displayCurrencyConversion,
      status,
      paymentMethod,
      pdfPassword,
      invoiceTo,
      pageBreak,
      displayTaxes,
      apartmentBillNo,
      currency,
      conversionRate,
      reservationIds, // Array expected
      lineItems
    } = req.body;

    // ====================================
    // 0️⃣ CHECK FOR DUPLICATES
    // ====================================
    // ====================================
    // 0️⃣ CHECK FOR DUPLICATES & AUTO-GENERATE SUFFIX
    // ====================================
    let finalInvoiceNumber = apartmentBillNo;

    if (finalInvoiceNumber) {
      const checkQuery = `SELECT id FROM invoices WHERE invoice_number = $1`;
      const checkResult = await client.query(checkQuery, [finalInvoiceNumber]);

      if (checkResult.rows.length > 0) {
        // Invoice number exists. Let's find a unique suffix.
        let suffix = 1;
        let foundUnique = false;

        while (suffix <= 50) { // Limit attempts to prevent infinite loops
          const candidateNumber = `${apartmentBillNo}-${suffix}`;
          const suffixCheck = await client.query(checkQuery, [candidateNumber]);

          if (suffixCheck.rows.length === 0) {
            finalInvoiceNumber = candidateNumber;
            foundUnique = true;
            break;
          }
          suffix++;
        }

        if (!foundUnique) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: `Invoice number ${apartmentBillNo} already exists and could not auto-generate a unique suffix.`
          });
        }
      }
    }

    // ====================================
    // 1️⃣ CALCULATE TOTALS
    // ====================================
    let subTotal = 0;
    let taxTotal = 0;
    let grandTotal = 0;

    lineItems.forEach(item => {
      subTotal += toNum(item.tariff);
      taxTotal += toNum(item.tax);
      grandTotal += toNum(item.total);
    });

    // ====================================
    // 2️⃣ INSERT INVOICE
    // ====================================
    // Use the first reservation ID as the "primary" for backward compatibility if needed, or null
    const primaryReservationId = reservationIds && reservationIds.length > 0 ? reservationIds[0] : null;

    const invoiceQuery = `
      INSERT INTO invoices (
        invoice_number, reservation_id, invoice_date, invoice_to,
        state_for_billing, pan_number, status, payment_method, currency,
        conversion_rate, sub_total, tax_total, grand_total,
        display_taxes, display_food_charge, extra_services,
        services_name, services_amount, pdf_password, page_break,
        guest_name_width, round_off_value
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22
      )
      RETURNING id
    `;

    const invoiceValues = [
      finalInvoiceNumber,
      primaryReservationId,
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
      toNum(roundOffValue)
    ];

    const invoiceResult = await client.query(invoiceQuery, invoiceValues);
    const invoiceId = invoiceResult.rows[0].id;

    // ====================================
    // 2.5️⃣ INSERT INVOICE RESERVATIONS
    // ====================================
    // Create connection table if not exists (Best effort, usually done in migration)
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoice_reservations (
        invoice_id INT, 
        reservation_id INT, 
        PRIMARY KEY (invoice_id, reservation_id)
      );
    `);

    if (reservationIds && Array.isArray(reservationIds)) {
      for (const resId of reservationIds) {
        await client.query(
          `INSERT INTO invoice_reservations (invoice_id, reservation_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [invoiceId, resId]
        );
      }
    }

    // ====================================
    // 3️⃣ INSERT LINE ITEMS
    // ====================================
    // First, ensure the food_items_json column exists (for backward compatibility)
    await client.query(`
      ALTER TABLE invoice_items 
      ADD COLUMN IF NOT EXISTS food_items_json JSONB;
    `);

    const itemQuery = `
      INSERT INTO invoice_items (
        invoice_id, location, description,
        check_in_date, check_out_date, days, rate, tax_amount, total_amount, food_items_json
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    `;

    for (const item of lineItems) {
      // Convert foodItems array to JSON string for storage
      const foodItemsJson = item.foodItems ? JSON.stringify(item.foodItems) : null;

      await client.query(itemQuery, [
        invoiceId,
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

    res.status(201).json({
      message: "Invoice created successfully",
      invoiceId,
      invoiceNumber: finalInvoiceNumber,
      totals: { subTotal, taxTotal, grandTotal }
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating invoice:", error);
    res.status(500).json({ error: "Failed to create invoice" });
  } finally {
    client.release(); // FIX: release client
  }
};
