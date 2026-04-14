
import pool from "../../client.js"; 

export async function getPinCode(req, res) {
  try {
    const pincode = req.query.pincode;

    if (!pincode) {
      return res.status(400).json({ error: "Pincode query is required" });
    }

    const query = `
      SELECT * FROM pincodes
      WHERE CAST(pincode AS TEXT) LIKE $1
    `;

    const result = await pool.query(query, [`%${pincode}%`]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No pincodes found" });
    }

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching pincodes:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}





export async function getHost(req, res) {
  try {
    const hostname = req.query.hostname;

    if (!hostname) {
      return res.status(400).json({ error: "hostname query is required" });
    }

    const hostQuery = `
      SELECT host_id, host_name,host_owner_name, host_pan_number, rating, host_email, 
             host_contact_number, created_at
      FROM host_information 
      WHERE host_name ILIKE $1
    `;

    const result = await pool.query(hostQuery, [`%${hostname}%`]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Host not found" });
    }

    res.json(result.rows); // return all matches
  } catch (error) {
    console.error("Error fetching host:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}




// export async function createProperty(req, res) {
//   try {
//     const {
//       property_status,
//       host_id,
//       ivr_number,
//       pincode_id,
//       city,
//       location,
//       post_id,
//       property_type,
//       contact_person,
//       contact_number,
//       email_id,
//       caretaker_name,
//       caretaker_number,
//       note,
//       check_in_time,
//       check_out_time,
//       master_bedroom,
//       common_bedroom,
//       landmark,
//       address1,
//       address2,
//       address3,
//       thumbnail,
//       property_url,
//     } = req.body;

//     // Basic validation
//     if (!property_status || !host_id || !pincode_id) {
//       return res.status(400).json({
//         error: "property_status, host_id, and pincode_id are required fields",
//       });
//     }

//     const insertQuery = `
//       INSERT INTO properties (
//         property_status, host_id, ivr_number, pincode_id, city, location,
//         post_id, property_type, contact_person, contact_number, email_id,
//         caretaker_name, caretaker_number, note, check_in_time, check_out_time,
//         master_bedroom, common_bedroom, landmark, address1, address2, address3,
//         thumbnail, property_url
//       )
//       VALUES (
//         $1, $2, $3, $4, $5, $6,
//         $7, $8, $9, $10, $11,
//         $12, $13, $14, $15, $16,
//         $17, $18, $19, $20, $21, $22,
//         $23, $24
//       )
//       RETURNING property_id, property_status, host_id, pincode_id
//     `;

//     const values = [
//       property_status,
//       host_id,
//       ivr_number,
//       pincode_id,
//       city,
//       location,
//       post_id,
//       property_type,
//       contact_person,
//       contact_number,
//       email_id,
//       caretaker_name,
//       caretaker_number,
//       note,
//       check_in_time,
//       check_out_time,
//       master_bedroom,
//       common_bedroom,
//       landmark,
//       address1,
//       address2,
//       address3,
//       thumbnail,
//       property_url,
//     ];

//     const result = await pool.query(insertQuery, values);

//     return res.status(201).json({
//       message: "Property created successfully",
//       property: result.rows[0],
//     });
//   } catch (error) {
//     console.error("Error inserting property:", error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// }




export async function createProperty(req, res) {
  try {
    const {
      property_status,
      host_id,
      ivr_number,
      pincode_id,
      city,
      location,
      post_id,
      property_type,
      contact_person,
      contact_number,
      email_id,
      caretaker_name,
      caretaker_number,
      note,
      check_in_time,
      check_out_time,
      master_bedroom,
      common_bedroom,
      landmark,
      address1,
      address2,
      address3,
      thumbnail,
      property_url,
    } = req.body;

    // Basic validation
    if (!property_status || !host_id || !pincode_id) {
      return res.status(400).json({
        error: "property_status, host_id, and pincode_id are required fields",
      });
    }

    // 🔥 Fix: Convert empty string to null for time fields
    const safeCheckInTime =
      check_in_time && check_in_time.trim() !== "" ? check_in_time : null;
    const safeCheckOutTime =
      check_out_time && check_out_time.trim() !== "" ? check_out_time : null;

    const insertQuery = `
      INSERT INTO properties (
        property_status, host_id, ivr_number, pincode_id, city, location,
        post_id, property_type, contact_person, contact_number, email_id,
        caretaker_name, caretaker_number, note, check_in_time, check_out_time,
        master_bedroom, common_bedroom, landmark, address1, address2, address3,
        thumbnail, property_url, created_by
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22,
        $23, $24, $25
      )
      RETURNING property_id, property_status, host_id, pincode_id
    `;

    const values = [
      property_status,
      host_id,
      ivr_number,
      pincode_id,
      city,
      location,
      post_id,
      property_type,
      contact_person,
      contact_number,
      email_id,
      caretaker_name,
      caretaker_number,
      note,
      safeCheckInTime,
      safeCheckOutTime,
      master_bedroom,
      common_bedroom,
      landmark,
      address1,
      address2,
      address3,
      thumbnail,
      property_url,
      req.user.id
    ];

    const result = await pool.query(insertQuery, values);

    return res.status(201).json({
      message: "Property created successfully",
      property: result.rows[0],
    });
  } catch (error) {
    console.error("Error inserting property:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
