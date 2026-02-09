import pool from "../../client.js";
import { sendCancellationEmail } from "../email/resend.js";

export const getAllReservations = async (req, res) => {
  try {

    const query = `
    SELECT
    r.*,
      STRING_AGG(DISTINCT rb.room_type, ', ') AS room_type,
        p.property_type, p.address1, p.address2, p.address3,
        p.Location, p.city, p.Landmark, p.contact_person,
        p.contact_number AS contact_person_number,
          p.caretaker_name, p.caretaker_number, p.property_url,
          c.client_name, c.state, c.zip_code,
          rai.apartment_type, rai.host_payment_mode, rai.host_email,
          rai.host_base_rate, rai.host_taxes, rai.host_total_amount,
          COALESCE(
            (
              SELECT JSON_AGG(rag.*) 
            FROM reservation_additional_guests rag 
            WHERE rag.reservation_id = r.id
          ),
          '[]'
        ) AS "additionalGuests",
  COALESCE(rai.services, '{}':: jsonb) AS services,
    (
      SELECT JSON_AGG(t) FROM(
        SELECT * FROM booking_history WHERE reservation_id = r.id ORDER BY changed_at DESC LIMIT 1
      ) t
        ) AS history
      FROM reservations r
      LEFT JOIN room_bookings rb ON r.id = rb.reservation_id
      JOIN properties p ON r.property_id = p.property_id
      JOIN clients c ON r.client_id = c.id
      LEFT JOIN reservation_additional_info rai ON r.id = rai.reservation_id
      GROUP BY
r.id,
  p.property_type, p.address1, p.address2, p.address3,
  p.Location, p.city, p.Landmark, p.contact_person,
  p.contact_number,
  p.caretaker_name, p.caretaker_number, p.property_url,
  c.client_name, c.state, c.zip_code,
  rai.apartment_type, rai.host_payment_mode, rai.host_email,
  rai.host_base_rate,rai.host_taxes,rai.host_total_amount,
  rai.services
      ORDER BY r.created_at DESC
    `;

    const result = await pool.query(query);


    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export async function deleteReservation(req, res) {
  try {
    await pool.query("BEGIN"); // ✅ Start transaction

    const reservationId = parseInt(req.query.id);



    if (isNaN(reservationId)) {
      return res.status(400).json({
        error: "Invalid reservation ID",
      });
    }

    // ✅ Check if reservation exists
    const existsQuery = `SELECT * FROM reservations WHERE id = $1`;
    const existsResult = await pool.query(existsQuery, [reservationId]);

    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        error: "Reservation not found",
      });
    }

    // ✅ Delete from main reservations table
    const deleteReservationQuery = `
    UPDATE reservations
    SET status = 'Cancelled',
        modification_status = NULL,
        modification_tag = NULL,
        modification_tags = NULL
    WHERE id = $1
  `;
    await pool.query(deleteReservationQuery, [reservationId]);

    await pool.query("COMMIT"); // ✅ Commit transaction

    // ✅ Send cancellation email AFTER successful commit
    try {
      const reservation = existsResult.rows[0];
      await sendCancellationEmail(reservation);
    } catch (emailError) {
      console.error("Error sending cancellation email:", emailError);
      // We don't fail the request here because the cancellation was successful
    }

    return res.status(200).json({
      success: true,
      message: `Reservation ID ${reservationId} deleted successfully`,
    });

  } catch (error) {
    await pool.query("ROLLBACK"); // ✅ Rollback on error
    console.error("Error deleting reservation:", error);
    res.status(500).json({
      error: "Internal server error while deleting reservation",
    });
  }
}
