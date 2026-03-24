import dotenv from "dotenv";
dotenv.config();
import { z } from "zod";
import pool from "../../client.js"; 

// ✅ Validation schema
const hostSchema = z.object({
  host_name: z.string().min(3, "Name must be at least 3 characters"),
  host_owner_name: z.string().min(3,"Owner name must be at least 3 characters"),
  host_pan_number: z.string().length(10, "PAN must be 10 characters"),
  rating: z.number().min(0).max(5),
  host_email: z.string().email("Invalid email format"),
  host_contact_number: z.string().regex(/^[0-9]{10}$/, "Contact must be 10 digits"),
  host_gst_numbers: z.array(z.string()).optional() // ✅ multiple GSTs
});

const createHost = async (req, res) => {
  const client = await pool.connect();
  try {
    // 1️⃣ Validate input
    const validatedData = hostSchema.parse(req.body);
    const {
      host_name,
      host_owner_name, 
      host_pan_number,
      rating,
      host_email,
      host_contact_number,
      host_gst_numbers
    } = validatedData;

    await client.query("BEGIN");

    // 2️⃣ Insert into host_information
    const hostResult = await client.query(
      `INSERT INTO host_information 
       (host_name, host_owner_name, host_pan_number, rating, host_email, host_contact_number)
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING host_id, host_name, host_owner_name, host_pan_number, rating, host_email, host_contact_number`,
      [
        host_name.trim(),
        host_owner_name.trim(),
        host_pan_number.toUpperCase().trim(),
        rating,
        host_email.toLowerCase().trim(),
        host_contact_number.trim()
      ]
    );

    const newHost = hostResult.rows[0];

    // 3️⃣ Insert GST numbers (if any)
    const insertedGSTNumbers = [];
    if (host_gst_numbers && host_gst_numbers.length > 0) {
      for (const gst of host_gst_numbers) {
        if (gst && gst.trim()) {
          const gstResult = await client.query(
            `INSERT INTO host_gst_numbers (host_id, gst_number)
             VALUES ($1, $2)
             RETURNING gst_number`,
            [newHost.host_id, gst.toUpperCase().trim()]
          );
          insertedGSTNumbers.push(gstResult.rows[0].gst_number);
        }
      }
    }

    await client.query("COMMIT");

    // 4️⃣ Response
    return res.status(201).json({
      message: "Host created successfully",
      host: newHost,
      gst_numbers: insertedGSTNumbers
    });
  } catch (err) {
    await client.query("ROLLBACK");

    // Handle validation error from Zod
    if (err.errors) {
      return res.status(400).json({ error: err.errors });
    }

    // Handle unique constraint violations (Postgres error 23505)
    if (err.code === "23505") {
      let field = "field";
      if (err.constraint?.includes("contact")) field = "contact number";
      else if (err.constraint?.includes("gst")) field = "GST number";
      else if (err.constraint?.includes("pan")) field = "PAN number";
      else if (err.constraint?.includes("email")) field = "email";

      return res.status(400).json({
        error: `This ${field} already exists in the system`
      });
    }

    console.error("Error creating host:", err);
    return res.status(500).json({ error: "Database error" });
  } finally {
    client.release();
  }
};

export default createHost;


