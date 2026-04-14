import pool from "../../client.js";

export async function getallProperty(req, res) {
    try {
        await pool.query('BEGIN');
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 30;
        const offset = (page - 1) * limit;

        const { id: userId, role } = req.user;

        let filterQuery = "";
        let filterParams = [];

        if (role === "Super Admin") {
            filterQuery = "1=1";
        } else if (role === "Admin") {
            filterQuery = "(p.created_by = $1 OR p.created_by IN (SELECT id FROM users WHERE parent_admin_id = $1))";
            filterParams.push(userId);
        } else {
            filterQuery = "p.created_by = $1";
            filterParams.push(userId);
        }

        const countQuery = `SELECT COUNT(*) FROM properties p WHERE ${filterQuery}`;
        const countResult = await pool.query(countQuery, filterParams);
        const totalItems = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalItems / limit);

        // TODO: Add joins for host_name and pincode if needed
        const propQuery = `
            SELECT p.*, h.host_name, pc.pincode, pc.city as pincode_city
            FROM properties p
            LEFT JOIN host_information h ON p.host_id = h.host_id
            LEFT JOIN pincodes pc ON p.pincode_id = pc.pincode_id
            WHERE ${filterQuery}
            ORDER BY p.property_id DESC
            LIMIT $${filterParams.length + 1} OFFSET $${filterParams.length + 2}
        `;

        const propResult = await pool.query(propQuery, [...filterParams, limit, offset]);

        await pool.query('COMMIT');
        res.json({
            data: propResult.rows,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                count: totalItems,
                itemsPerPage: limit,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error Fetching property : ', error);
        res.status(500).json({
            error: 'internal server error while fetching property'
        })
    }
}

export async function deleteProperty(req, res) {
    try {
        const property_Id = parseInt(req.params.id);
        if (isNaN(property_Id)) {
            return res.status(400).json({
                error: 'Invalid property ID'
            });
        }
        const existsQuery = 'SELECT COUNT(*) FROM properties WHERE property_id = $1'
        const existsResult = await pool.query(existsQuery, [property_Id]);
        if (existsResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Property not found'
            });
        }
        const deleteQuery = `DELETE FROM properties WHERE property_id = $1`;
        await pool.query(deleteQuery, [property_Id]);

        res.json({
            message: `Property ${property_Id} deleted successfully`
        });
    } catch (error) {
        console.error('Error deleting property:', error);
        res.status(500).json({
            error: 'Internal server error while deleting property'
        });
    }
}

export async function getPropertyById(req, res) {
    try {
        const property_Id = parseInt(req.params.id);
        if (isNaN(property_Id)) {
            return res.status(400).json({
                error: 'Invalid property ID'
            });
        }

        const query = `
            SELECT p.*, h.host_name, h.host_email, h.host_contact_number, h.host_owner_name, pc.pincode, pc.city as pincode_city
            FROM properties p
            LEFT JOIN host_information h ON p.host_id = h.host_id
            LEFT JOIN pincodes pc ON p.pincode_id = pc.pincode_id
            WHERE p.property_id = $1
        `;

        const result = await pool.query(query, [property_Id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Property not found'
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching property by ID:', error);
        res.status(500).json({
            error: 'Internal server error while fetching property'
        });
    }
}

export async function UpdateProperty(req, res) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const property_Id = parseInt(req.params.id);

        if (isNaN(property_Id)) {
            return res.status(400).json({
                error: 'Invalid property ID'
            });
        }

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
            property_url
        } = req.body;

        // Basic validation
        if (!property_status) {
            return res.status(400).json({
                error: "property_status is required",
            });
        }

        const safeCheckInTime = check_in_time && check_in_time.trim() !== "" ? check_in_time : null;
        const safeCheckOutTime = check_out_time && check_out_time.trim() !== "" ? check_out_time : null;

        const updateQuery = `
            UPDATE properties 
            SET 
                property_status = $1, host_id = $2, ivr_number = $3, pincode_id = $4, city = $5, location = $6,
                post_id = $7, property_type = $8, contact_person = $9, contact_number = $10, email_id = $11,
                caretaker_name = $12, caretaker_number = $13, note = $14, check_in_time = $15, check_out_time = $16,
                master_bedroom = $17, common_bedroom = $18, landmark = $19, address1 = $20, address2 = $21, address3 = $22,
                thumbnail = $23, property_url = $24, updated_at = CURRENT_TIMESTAMP
            WHERE property_id = $25
            RETURNING *
        `;

        const values = [
            property_status, host_id, ivr_number, pincode_id, city, location,
            post_id, property_type, contact_person, contact_number, email_id,
            caretaker_name, caretaker_number, note, safeCheckInTime, safeCheckOutTime,
            master_bedroom, common_bedroom, landmark, address1, address2, address3,
            thumbnail, property_url, property_Id
        ];

        const result = await client.query(updateQuery, values);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                error: 'Property not found'
            });
        }

        await client.query('COMMIT');
        res.json({
            message: 'Property updated successfully',
            property: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating property:', error);
        res.status(500).json({
            error: 'Internal server error while updating property'
        });
    } finally {
        client.release();
    }
}