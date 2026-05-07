
import pool from "../../client.js"

export async function ClientListPage(req, res) {
  try {

    const query = `
    SELECT * FROM clients
    `
    const result = await pool.query(query);

    res.status(201).json({
      success: true,
      message: "Clinet get successfully",
      data: result.rows,
    });

  } catch (error) {
    console.error("Error get client:", error),
      res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error"
      });
  }
}

export async function getClientById(req, res) {
  try {
    const clientId = parseInt(req.params.id);

    if (isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID"
      });
    }

    const query = `SELECT * FROM clients WHERE id = $1`;
    const result = await pool.query(query, [clientId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Client not found"
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error fetching client:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
}






export async function updateClient(req, res) {
  try {
    await pool.query("BEGIN");

    const clientId = parseInt(req.params.id);

    const {
      active,
      client_name,
      gst_no,
      street_address,
      street_address_2,
      city,
      state,
      zip_code,
      phone_number,
      fax_number,
      mobile_number,
      email_address,
      web_address,
      client_nick_name
    } = req.body;

    if (isNaN(clientId)) {
      return res.status(400).json({
        error: "Invalid client ID",
      });
    }

    // ✅ Check if client exists
    const existsQuery = `SELECT * FROM clients WHERE id = $1`;
    const existsResult = await pool.query(existsQuery, [clientId]);

    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        error: "Client not found",
      });
    }

    // ✅ Update query with correct param order
    const updateClientQuery = `
      UPDATE clients 
      SET 
        active = $1, 
        client_name = $2, 
        gst_no = $3,
        street_address = $4, 
        street_address_2 = $5,
        city = $6, 
        state = $7, 
        zip_code = $8,
        phone_number = $9, 
        fax_number = $10,
        mobile_number = $11, 
        email_address = $12,
        web_address = $13,
        client_nick_name = $14,
        updated_at = $15
      WHERE id = $16
      RETURNING *;
    `;

    const updatedAt = new Date(); // ✅ timestamp for updated_at

    const ClientResult = await pool.query(updateClientQuery, [
      active,
      client_name,
      gst_no,
      street_address,
      street_address_2,
      city,
      state,
      zip_code,
      phone_number,
      fax_number,
      mobile_number,
      email_address,
      web_address,
      client_nick_name,
      updatedAt,  // ✅ $15
      clientId,   // ✅ $16
    ]);

    await pool.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Client updated successfully",
      data: ClientResult.rows[0],
    });

  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error updating client:", error);
    res.status(500).json({
      error: "Internal server error while updating client",
    });
  }
}







export async function deleteClient(req, res) {
  try {
    const clientId = parseInt(req.params.id);

    if (isNaN(clientId)) {
      return res.status(400).json({
        error: "Invalid Client ID"
      })
    }
    const existsQuery = `SELECT * from clients where id  = $1`;
    const existsResult = await pool.query(existsQuery, [clientId]);

    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Client not found'
      });
    }

    const deleteQuery = `DELETE FROM clients where id = $1`;
    await pool.query(deleteQuery, [clientId]);
    res.json({
      message: `Client ${clientId} deleted Successfully`
    })

  } catch (error) {
    console.error('Error deleting Client:', error);
    res.status(500).json({
      error: 'Internal server error while deleting host'
    });
  }

}