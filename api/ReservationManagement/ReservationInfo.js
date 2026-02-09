import pool from "../../client.js";

export async function ClientList(req, res) {
  try {
    const clientName = req.query.clientname;

    const query = `
      SELECT * FROM clients WHERE client_name ILIKE $1
    `;
    const result = await pool.query(query, [`%${clientName}%`]);

    console.log("result", result.rows);


    res.status(200).json({
      success: true,
      message: "Client fetched successfully",
      data: result.rows,
    });
  } catch (error) {
    console.error("Error get client:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
}







export async function getProperty(req, res) {
  try {
    const Address = req.query.Address;

    const query = `
      SELECT p.* ,
        p.master_bedroom,
        p.common_bedroom,
        p.check_in_time,
        p.check_out_time,
        h.host_name,
        h.host_email,
        h.host_contact_number
      FROM properties p
      LEFT JOIN host_information h ON p.host_id = h.host_id
      WHERE p.address1 ILIKE $1 
         OR p.address2 ILIKE $1 
         OR p.address3 ILIKE $1
    `;

    const result = await pool.query(query, [`%${Address}%`]);
    console.log("property data", result);


    res.json({
      data: result.rows   // or result.rows[0] if you need just one
    });

  } catch (error) {
    console.error('Error Fetching property:', error);
    res.status(500).json({
      error: 'Internal server error while fetching property'
    });
  }
}






// // checkAvailability.js
export async function checkRoomAvailability(req, res) {
  try {
    const { propertyId, checkInDate, checkOutDate, roomTypes, excludeReservationId } = req.body;

    if (!propertyId || !checkInDate || !checkOutDate || !roomTypes) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    let conflictQuery = `
    SELECT DISTINCT
        rb.room_type,
        r.reservation_no,
        r.guest_name,
        r.check_in_date,
        r.check_out_date
    FROM room_bookings rb
    JOIN reservations r ON rb.reservation_id = r.id
    WHERE rb.property_id = $1
        AND rb.status = 'active'
        AND rb.room_type = ANY($2::text[])
        AND rb.check_in_date <= $4 
        AND rb.check_out_date >= $3
    `;

    const queryParams = [
      propertyId,
      roomTypes,
      checkInDate,
      checkOutDate,
    ];

    if (excludeReservationId) {
      conflictQuery += ` AND r.id != $5`;
      queryParams.push(excludeReservationId);
    }


    const conflicts = await pool.query(conflictQuery, queryParams);

    const conflictsByRoom = {};
    conflicts.rows.forEach(conflict => {
      if (!conflictsByRoom[conflict.room_type]) {
        conflictsByRoom[conflict.room_type] = [];
      }
      conflictsByRoom[conflict.room_type].push({
        id: conflict.reservation_no,
        reservationNo: conflict.reservation_no,
        guestName: conflict.guest_name,
        checkIn: conflict.check_in_date,
        checkOut: conflict.check_out_date,
        roomType: conflict.room_type,
      });
    });

    const availability = roomTypes.map(roomType => ({
      roomType,
      isAvailable: !conflictsByRoom[roomType],
      conflictingReservations: conflictsByRoom[roomType] || [],
    }));

    res.json({ success: true, availability });

  } catch (error) {
    console.error("Error checking availability:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}








// Utility functions
function toInt(value, defaultValue = 0) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? defaultValue : n;
}

function toFloat(value, defaultValue = 0) {
  const n = parseFloat(value);
  return Number.isNaN(n) ? defaultValue : n;
}

export async function saveReservation(req, res) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      clientId,
      propertyId,
      guestInfo,
      apartmentInfo,
      pajasaInfo,
      roomSelection: rawRoomSelection,
      createdAt,
    } = req.body;

    const roomSelection = rawRoomSelection ? [...new Set(rawRoomSelection)] : [];

    // Generate reservation number
    // Generate reservation number
    // Format: PAR-YY-MM-XXXX
    const dateObj = new Date();
    const yy = String(dateObj.getFullYear()).slice(-2);
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");

    // Lock table to prevent concurrent inserts and ensure sequential numbering
    // SHARE ROW EXCLUSIVE mode protects against concurrent data changes (inserts/updates)
    await client.query("LOCK TABLE reservations IN SHARE ROW EXCLUSIVE MODE");

    // Calculate global sequence number
    // Find the maximum sequence number from ALL reservations starting with PAR-
    // regardless of year/month, to ensure global continuity.
    const maxSeqQuery = `
      SELECT MAX(CAST(substring(reservation_no FROM 'PAR-\\d{2}-\\d{2}-(\\d+)') AS INTEGER)) as max_seq 
      FROM reservations 
      WHERE reservation_no ~ '^PAR-\\d{2}-\\d{2}-\\d+$'
    `;
    const maxSeqResult = await client.query(maxSeqQuery);

    let nextNum = 1;
    if (maxSeqResult.rows.length > 0 && maxSeqResult.rows[0].max_seq !== null) {
      nextNum = maxSeqResult.rows[0].max_seq + 1;
    }

    // Ensure 4-digit sequence as per "XXXX" requirement
    const reservationNo = `PAR-${yy}-${mm}-${String(nextNum).padStart(4, "0")}`;

    console.log("guestInfo received:", guestInfo);

    // Extract dates
    const checkInDate = guestInfo?.checkInDate || null;
    const checkOutDate = guestInfo?.checkOutDate || null;

    // Validation
    if (!checkInDate) {
      throw new Error("checkInDate is required");
    }
    if (!checkOutDate) {
      throw new Error("checkOutDate is required");
    }

    /**
     * INSERT INTO reservations
     */
    const reservationValues = [
      reservationNo,
      clientId,
      propertyId,
      guestInfo.guestName || "",
      guestInfo.guestEmail || "",
      guestInfo.contactNumber || "",
      checkInDate,
      checkOutDate,
      guestInfo.checkInTime || "",
      guestInfo.checkOutTime || "",
      guestInfo.occupancy,
      toFloat(guestInfo.baseRate),
      toFloat(guestInfo.taxes),
      toFloat(guestInfo.totalTariff),
      guestInfo.paymentMode || "",
      guestInfo.tariffType || "",
      toInt(guestInfo.chargeableDays),
      guestInfo.adminEmail || "",
      createdAt || new Date(),
      "Confirmed"
    ];

    const reservationQuery = `
      INSERT INTO reservations (
        reservation_no, client_id, property_id, guest_name, guest_email,
        contact_number, check_in_date, check_out_date, check_in_time,
        check_out_time, occupancy, base_rate, taxes, total_tariff,
        payment_mode, tariff_type, chargeable_days, admin_email, created_at,status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      RETURNING id
    `;

    const reservationResult = await client.query(reservationQuery, reservationValues);
    const reservationId = reservationResult.rows[0].id;



    // Corrected room booking insertion
    const roomBookingQuery = `
  INSERT INTO room_bookings (
    reservation_id,
    room_type,
    check_in_date,
    check_out_date,
    status
  )
  VALUES ($1,$2,$3,$4,$5)
`;

    if (roomSelection && roomSelection.length > 0) {
      for (const room of roomSelection) {
        await client.query(roomBookingQuery, [
          reservationId,
          room,
          checkInDate,
          checkOutDate,
          "Confirmed",
        ]);
      }
    }


    /**
     * INSERT ADDITIONAL INFO
     */
    const additionalInfoQuery = `
      INSERT INTO reservation_additional_info(
      reservation_id, host_name, host_email, host_base_rate,
      host_taxes, host_total_amount, contact_person, contact_number,
      comments, services, note, apartment_type, host_payment_mode
      ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    `;

    await client.query(additionalInfoQuery, [
      reservationId,
      apartmentInfo.hostName || "",
      apartmentInfo.hostEmail || "",
      toFloat(apartmentInfo.hostBaseRate),
      toFloat(apartmentInfo.hostTaxes),
      toFloat(apartmentInfo.hostTotalAmount),
      apartmentInfo.contactPerson || "",
      apartmentInfo.contactNumber || "",
      pajasaInfo.comments || "",
      JSON.stringify(pajasaInfo.services || []),
      pajasaInfo.note || "",
      apartmentInfo.hostTariffType || "",
      apartmentInfo.hostPaymentMethod || ""
    ]);

    /**
     * INSERT ADDITIONAL GUESTS
     */
    if (guestInfo.additionalGuests && guestInfo.additionalGuests.length > 0) {
      const additionalGuestsQuery = `
          INSERT INTO reservation_additional_guests(
        reservation_id, guest_name, cid, cod, room_type, occupancy, address, email, contact_number
      ) VALUES ${guestInfo.additionalGuests.map((_, i) => `($1, $${i * 8 + 2}, $${i * 8 + 3}, $${i * 8 + 4}, $${i * 8 + 5}, $${i * 8 + 6}, $${i * 8 + 7}, $${i * 8 + 8}, $${i * 8 + 9})`).join(", ")}
    `;

      const additionalGuestsValues = [reservationId, ...guestInfo.additionalGuests.flatMap(guest => [
        guest.guestName || null,
        guest.cid || null,
        guest.cod || null,
        guest.roomType || null,
        guest.occupancy || null,
        guest.address || null,
        guest.email || null,
        guest.contactNumber || null
      ])];

      await client.query(additionalGuestsQuery, additionalGuestsValues);
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Reservation saved successfully",
      reservationNo,
      reservationId,
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error saving reservation:", error);
    return res.status(500).json({
      success: false,
      message: "Error saving reservation",
      error: error.message,
    });
  } finally {
    client.release();
  }
}



// Helper to fetch full reservation data
async function fetchReservationData(id) {
  const query = `
    SELECT
    r.*,
      to_char(r.check_in_date, 'YYYY-MM-DD') as check_in_date_str,
      to_char(r.check_out_date, 'YYYY-MM-DD') as check_out_date_str,
      c.client_name,
      p.address1, p.address2, p.address3, p.city, p.location, p.property_type, p.thumbnail, p.property_url,
      p.master_bedroom, p.common_bedroom, p.host_id,
      hi.host_name, hi.host_email,
      p.contact_person, p.contact_number,
      rai.host_base_rate, rai.host_taxes,
      rai.host_total_amount, rai.apartment_type, rai.host_payment_mode,
      rai.comments, rai.services, rai.note,
      (
        SELECT json_agg(room_type)
          FROM room_bookings rb
          WHERE rb.reservation_id = r.id
        ) as "roomSelection",
      (
        SELECT json_agg(json_build_object(
          'id', rag.id,
          'guestName', rag.guest_name,
          'cid', rag.cid,
          'cod', rag.cod,
          'roomType', rag.room_type,
          'occupancy', rag.occupancy,
          'address', rag.address,
          'email', rag.email,
          'contactNumber', rag.contact_number
        ))
          FROM reservation_additional_guests rag
          WHERE rag.reservation_id = r.id
        ) as "additionalGuests"
      FROM reservations r
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN properties p ON r.property_id = p.property_id
      LEFT JOIN host_information hi ON p.host_id = hi.host_id
      LEFT JOIN reservation_additional_info rai ON r.id = rai.reservation_id
      WHERE r.id = $1
      `;

  const result = await pool.query(query, [id]);
  if (result.rows.length === 0) return null;

  const data = result.rows[0];

  // Use the formatted string dates instead of Date objects
  if (data.check_in_date_str) {
    data.check_in_date = data.check_in_date_str;
  }
  if (data.check_out_date_str) {
    data.check_out_date = data.check_out_date_str;
  }

  // Parse services if it's a string
  if (typeof data.services === 'string') {
    try { data.services = JSON.parse(data.services); } catch (e) { data.services = {}; }
  }

  // Fetch Booking History
  const historyQuery = `
    SELECT 
      to_char(check_in_date, 'YYYY-MM-DD') as check_in_date,
      to_char(check_out_date, 'YYYY-MM-DD') as check_out_date,
      status, 
      modification_tags, 
      total_tariff, 
      changed_at,
      snapshot_data
    FROM booking_history 
    WHERE reservation_id = $1 
    ORDER BY changed_at DESC
  `;
  const historyResult = await pool.query(historyQuery, [id]);
  data.history = historyResult.rows;

  return data;
}

export async function getReservationById(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, message: "Reservation ID is required" });

    const data = await fetchReservationData(id);

    if (!data) return res.status(404).json({ success: false, message: "Reservation not found" });

    res.json({ success: true, data });

  } catch (error) {
    console.error("Error fetching reservation:", error);
    res.status(500).json({ success: false, message: "Error fetching reservation details", error: error.message });
  }
}



export async function updateReservation(req, res) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      id,
      clientId,
      propertyId,
      guestInfo,
      apartmentInfo,
      pajasaInfo,
      roomSelection: rawRoomSelection,
      additionalGuests
    } = req.body;

    const roomSelection = rawRoomSelection ? [...new Set(rawRoomSelection)] : [];

    if (!id) {
      throw new Error("Reservation ID is required for update");
    }

    // 0. Fetch current state for history (Full Snapshot)
    const oldDataQuery = `
      SELECT r.*,
      to_char(r.check_in_date, 'YYYY-MM-DD') as check_in_str,
      to_char(r.check_out_date, 'YYYY-MM-DD') as check_out_str,
      (SELECT json_agg(room_type) FROM room_bookings rb WHERE rb.reservation_id = r.id) as "roomSelection",
      (SELECT json_agg(json_build_object(
        'id', rag.id, 'guestName', rag.guest_name, 'cid', rag.cid, 'cod', rag.cod,
        'roomType', rag.room_type, 'occupancy', rag.occupancy, 'address', rag.address,
        'email', rag.email, 'contactNumber', rag.contact_number
      )) FROM reservation_additional_guests rag WHERE rag.reservation_id = r.id) as "additionalGuests"
      FROM reservations r WHERE r.id = $1
    `;
    const oldDataResult = await client.query(oldDataQuery, [id]);

    // ✅ Ensure date fields come from guestInfo
    const checkInDate =
      guestInfo.checkInDate && guestInfo.checkInDate !== ""
        ? guestInfo.checkInDate
        : null;
    const checkOutDate =
      guestInfo.checkOutDate && guestInfo.checkOutDate !== ""
        ? guestInfo.checkOutDate
        : null;

    let modificationTags = [];
    let newStatus = "Modified";

    if (oldDataResult.rows.length > 0) {
      const oldData = oldDataResult.rows[0];

      // Use DB-formatted strings for old dates
      const oldInStr = oldData.check_in_str; // "YYYY-MM-DD"
      const oldOutStr = oldData.check_out_str; // "YYYY-MM-DD"

      // New dates are already "YYYY-MM-DD" from frontend
      const newInStr = checkInDate;
      const newOutStr = checkOutDate;

      console.log(`Date Comparison: OldIn=${oldInStr}, NewIn=${newInStr}, OldOut=${oldOutStr}, NewOut=${newOutStr}`);

      // Logic:
      // Check-in: Increased (Later) -> Postponed, Decreased (Earlier) -> Preponed
      if (oldInStr && newInStr && oldInStr !== newInStr) {
        if (newInStr < oldInStr) modificationTags.push("Preponed");
        else modificationTags.push("Postponed");
      }

      // Check-out: Increased (Later) -> Extended, Decreased (Earlier) -> Shortened
      if (oldOutStr && newOutStr && oldOutStr !== newOutStr) {
        if (newOutStr < oldOutStr) modificationTags.push("Shortened");
        else modificationTags.push("Extended");
      }

      // If no date change, keep old status (unless it was already Modified)
      if (modificationTags.length === 0) {
        newStatus = oldData.status === 'Cancelled' ? 'Cancelled' : oldData.status;
      }

      // Save to History with FULL SNAPSHOT
      await client.query(
        `INSERT INTO booking_history (reservation_id, check_in_date, check_out_date, status, total_tariff, modification_tags, snapshot_data)
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          id,
          oldData.check_in_date,
          oldData.check_out_date,
          oldData.status,
          oldData.total_tariff,
          oldData.modification_tags,
          JSON.stringify(oldData) // Save the entire old record
        ]
      );
    }

    // Convert tags array to string for DB
    const tagsString = modificationTags.join(', ');

    // 1. Update main reservation table
    const updateReservationQuery = `
      UPDATE reservations
    SET
    client_id = $1, property_id = $2, guest_name = $3, guest_email = $4,
      contact_number = $5, check_in_date = $6, check_out_date = $7, check_in_time = $8,
      check_out_time = $9, occupancy = $10, base_rate = $11, taxes = $12, total_tariff = $13,
      payment_mode = $14, tariff_type = $15, chargeable_days = $16, admin_email = $17, 
      status = $18, modification_tags = $19
      WHERE id = $20
      `;

    const reservationValues = [
      clientId,
      propertyId,
      guestInfo.guestName || "",
      guestInfo.guestEmail || "",
      guestInfo.contactNumber || "",
      checkInDate,
      checkOutDate,
      guestInfo.checkInTime || "",
      guestInfo.checkOutTime || "",
      guestInfo.occupancy,
      toFloat(guestInfo.baseRate),
      toFloat(guestInfo.taxes),
      toFloat(guestInfo.totalTariff),
      guestInfo.paymentMode || "",
      guestInfo.tariffType || "",
      toInt(guestInfo.chargeableDays),
      guestInfo.adminEmail || "",
      newStatus,
      tagsString,
      id
    ];

    await client.query(updateReservationQuery, reservationValues);

    // 2. Update Room Bookings
    // Strategy: Delete existing bookings for this reservation and insert new ones
    // This handles changes in room types, dates, or number of rooms easily

    await client.query("DELETE FROM room_bookings WHERE reservation_id = $1", [id]);

    const roomBookingQuery = `
      INSERT INTO room_bookings(
        reservation_id, room_type, property_id, check_in_date, check_out_date
      ) VALUES($1, $2, $3, $4, $5)
        `;

    for (const roomType of roomSelection) {
      await client.query(roomBookingQuery, [
        id,
        roomType,
        propertyId,
        checkInDate,
        checkOutDate,
      ]);
    }

    // 3. Update Additional Info
    // Check if additional info exists first
    const checkInfoQuery = "SELECT id FROM reservation_additional_info WHERE reservation_id = $1";
    const infoResult = await client.query(checkInfoQuery, [id]);

    if (infoResult.rows.length > 0) {
      const updateInfoQuery = `
        UPDATE reservation_additional_info
    SET
    host_name = $1, host_email = $2, host_base_rate = $3,
      host_taxes = $4, host_total_amount = $5, contact_person = $6, contact_number = $7,
      comments = $8, services = $9, note = $10, apartment_type = $11, host_payment_mode = $12
        WHERE reservation_id = $13
      `;

      await client.query(updateInfoQuery, [
        apartmentInfo.hostName || "",
        apartmentInfo.hostEmail || "",
        toFloat(apartmentInfo.hostBaseRate),
        toFloat(apartmentInfo.hostTaxes),
        toFloat(apartmentInfo.hostTotalAmount),
        apartmentInfo.contactPerson || "",
        apartmentInfo.contactNumber || "",
        pajasaInfo.comments || "",
        JSON.stringify(pajasaInfo.services || []),
        pajasaInfo.note || "",
        apartmentInfo.hostTariffType || "",
        apartmentInfo.hostPaymentMethod || "",
        id
      ]);
    } else {
      // Insert if it doesn't exist (handling legacy data or partial saves)
      const insertInfoQuery = `
        INSERT INTO reservation_additional_info(
        reservation_id, host_name, host_email, host_base_rate,
        host_taxes, host_total_amount, contact_person, contact_number,
        comments, services, note, apartment_type, host_payment_mode
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `;

      await client.query(insertInfoQuery, [
        id,
        apartmentInfo.hostName || "",
        apartmentInfo.hostEmail || "",
        toFloat(apartmentInfo.hostBaseRate),
        toFloat(apartmentInfo.hostTaxes),
        toFloat(apartmentInfo.hostTotalAmount),
        apartmentInfo.contactPerson || "",
        apartmentInfo.contactNumber || "",
        pajasaInfo.comments || "",
        JSON.stringify(pajasaInfo.services || []),
        pajasaInfo.note || "",
        apartmentInfo.hostTariffType || "",
        apartmentInfo.hostPaymentMethod || ""
      ]);
    }

    // 4. Update Additional Guests
    await client.query("DELETE FROM reservation_additional_guests WHERE reservation_id = $1", [id]);

    if (additionalGuests && additionalGuests.length > 0) {
      const additionalGuestsQuery = `
        INSERT INTO reservation_additional_guests(
          reservation_id, guest_name, cid, cod, room_type, occupancy, address, email, contact_number
        ) VALUES ${additionalGuests.map((_, i) => `($1, $${i * 8 + 2}, $${i * 8 + 3}, $${i * 8 + 4}, $${i * 8 + 5}, $${i * 8 + 6}, $${i * 8 + 7}, $${i * 8 + 8}, $${i * 8 + 9})`).join(", ")}
    `;

      const additionalGuestsValues = [id, ...additionalGuests.flatMap(guest => [
        guest.guestName || null,
        guest.cid || null,
        guest.cod || null,
        guest.roomType || null,
        guest.occupancy || null,
        guest.address || null,
        guest.email || null,
        guest.contactNumber || null
      ])];

      await client.query(additionalGuestsQuery, additionalGuestsValues);
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Reservation updated successfully",
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating reservation:", error);
    res.status(500).json({
      success: false,
      message: "Error updating reservation",
      error: error.message,
    });
  } finally {
    client.release();
  }
}
