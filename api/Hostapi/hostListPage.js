

import pool from "../../client.js"; 

// Helper function to get host with GST numbers
const getHostWithGST = async (hostId) => {
  try {
    // Get host information
    const hostQuery = `
      SELECT host_id, host_name, host_owner_name, host_pan_number, rating, host_email, 
             host_contact_number, created_at
      FROM host_information 
      WHERE host_id = $1
    `;
    const hostResult = await pool.query(hostQuery, [hostId]);
    
    if (hostResult.rows.length === 0) {
      return null;
    }
    
    const host = hostResult.rows[0];
    
    // Get GST numbers for this host
    const gstQuery = `
      SELECT gst_number 
      FROM host_gst_numbers 
      WHERE host_id = $1 
      ORDER BY created_at ASC
    `;
    const gstResult = await pool.query(gstQuery, [hostId]);
    
    return {
      ...host,
      gst_numbers: gstResult.rows.map(row => row.gst_number)
    };
  } catch (error) {
    throw error;
  }
};

// 1. CREATE HOST - POST /api/hosts
// const createHost = async (req, res) => {
//   const client = await pool.connect();
  
//   try {
//     await client.query('BEGIN');
    
//     const {
//       host_name,
//       host_pan_number,
//       rating,
//       host_email,
//       host_contact_number,
//       host_gst_numbers = []
//     } = req.body;

//     // Validation
//     if (!host_name || !host_pan_number || !host_email || !host_contact_number) {
//       return res.status(400).json({
//         error: 'Missing required fields: host_name, host_pan_number, host_email, host_contact_number'
//       });
//     }

//     // Insert host information
//     const insertHostQuery = `
//       INSERT INTO host_information (
//         host_name, host_pan_number, rating, host_email, host_contact_number
//       ) VALUES ($1, $2, $3, $4, $5)
//       RETURNING *
//     `;
    
//     const hostResult = await client.query(insertHostQuery, [
//       host_name.trim(),
//       host_pan_number.toUpperCase().trim(),
//       rating || 0,
//       host_email.toLowerCase().trim(),
//       host_contact_number.trim()
//     ]);

//     const newHost = hostResult.rows[0];
//     const insertedGSTNumbers = [];

//     // Insert GST numbers if provided
//     if (host_gst_numbers && host_gst_numbers.length > 0) {
//       for (const gstNumber of host_gst_numbers) {
//         if (gstNumber && gstNumber.trim()) {
//           const insertGSTQuery = `
//             INSERT INTO host_gst_numbers (host_id, gst_number)
//             VALUES ($1, $2)
//             RETURNING gst_number
//           `;
//           const gstResult = await client.query(insertGSTQuery, [
//             newHost.host_id,
//             gstNumber.toUpperCase().trim()
//           ]);
//           insertedGSTNumbers.push(gstResult.rows[0].gst_number);
//         }
//       }
//     }

//     await client.query('COMMIT');

//     res.status(201).json({
//       message: 'Host created successfully',
//       host: newHost,
//       gst_numbers: insertedGSTNumbers
//     });

//   } catch (error) {
//     await client.query('ROLLBACK');
    
//     // Handle unique constraint violations
//     if (error.code === '23505') {
//       let field = 'field';
//       if (error.constraint?.includes('pan')) field = 'PAN number';
//       else if (error.constraint?.includes('email')) field = 'email';
//       else if (error.constraint?.includes('contact')) field = 'contact number';
//       else if (error.constraint?.includes('gst')) field = 'GST number';
      
//       return res.status(400).json({
//         error: `This ${field} already exists in the system`
//       });
//     }

//     console.error('Error creating host:', error);
//     res.status(500).json({
//       error: 'Internal server error while creating host'
//     });
//   } finally {
//     client.release();
//   }
// };













// 2. GET ALL HOSTS - GET /api/hosts
export async function  getAllHosts  (req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get user from request (attached by authMiddleware)
    const { id: userId, role } = req.user;

    // Build filter based on role
    let filterQuery = "";
    let filterParams = [];

    if (role === "Super Admin") {
      filterQuery = "1=1";
    } else if (role === "Admin") {
      filterQuery = "(created_by = $1 OR created_by IN (SELECT id FROM users WHERE parent_admin_id = $1))";
      filterParams.push(userId);
    } else {
      filterQuery = "created_by = $1";
      filterParams.push(userId);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM host_information WHERE ${filterQuery}`;
    const countResult = await pool.query(countQuery, filterParams);
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    // Get hosts with pagination and filtering
    const hostsQuery = `
      SELECT h.host_id, h.host_name, h.host_owner_name, h.host_pan_number, h.rating, 
             h.host_email, h.host_contact_number, h.created_at,
             COALESCE(
               JSON_AGG(
                 CASE WHEN g.gst_number IS NOT NULL 
                 THEN g.gst_number 
                 ELSE NULL END
               ) FILTER (WHERE g.gst_number IS NOT NULL), 
               '[]'::json
             ) as gst_numbers
      FROM host_information h
      LEFT JOIN host_gst_numbers g ON h.host_id = g.host_id
      WHERE ${filterQuery}
      GROUP BY h.host_id, h.host_name, h.host_pan_number, h.rating, 
               h.host_email, h.host_contact_number, h.created_at
      ORDER BY h.created_at DESC
      LIMIT $${filterParams.length + 1} OFFSET $${filterParams.length + 2}
    `;
    
    const hostsResult = await pool.query(hostsQuery, [...filterParams, limit, offset]);

    res.json({
      hosts: hostsResult.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching hosts:', error);
    res.status(500).json({
      error: 'Internal server error while fetching hosts'
    });
  }
};

// 3. GET SINGLE HOST - GET /api/hosts/:id
// const getHostById = async (req, res) => {
//   try {
//     const hostId = parseInt(req.params.id);
    
//     if (isNaN(hostId)) {
//       return res.status(400).json({
//         error: 'Invalid host ID'
//       });
//     }

//     const host = await getHostWithGST(hostId);
    
//     if (!host) {
//       return res.status(404).json({
//         error: 'Host not found'
//       });
//     }

//     res.json({
//       host
//     });

//   } catch (error) {
//     console.error('Error fetching host:', error);
//     res.status(500).json({
//       error: 'Internal server error while fetching host'
//     });
//   }
// };

// 4. UPDATE HOST - PUT /api/hosts/:id









export async function  updateHost (req, res) {  
  try {
    await pool.query('BEGIN');
    
    const hostId = parseInt(req.params.id);
    const {
      host_name,
      host_pan_number,
      rating,
      host_email,
      host_contact_number,
      host_gst_numbers = []
    } = req.body;

    if (isNaN(hostId)) {
      return res.status(400).json({
        error: 'Invalid host ID'
      });
    }

    // Check if host exists
    const existsQuery = 'SELECT host_id FROM host_information WHERE host_id = $1';
    const existsResult = await pool.query(existsQuery, [hostId]);
    
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Host not found'
      });
    }

    // Update host information
    const updateHostQuery = `
      UPDATE host_information 
      SET host_name = $1, host_pan_number = $2, rating = $3, 
          host_email = $4, host_contact_number = $5
      WHERE host_id = $6
      RETURNING *
    `;
    
    const hostResult = await pool.query(updateHostQuery, [
      host_name?.trim(),
      host_pan_number?.toUpperCase().trim(),
      rating || 0,
      host_email?.toLowerCase().trim(),
      host_contact_number?.trim(),
      hostId
    ]);

    // Delete existing GST numbers
    await pool.query('DELETE FROM host_gst_numbers WHERE host_id = $1', [hostId]);

    // Insert new GST numbers
    const insertedGSTNumbers = [];
    if (host_gst_numbers && host_gst_numbers.length > 0) {
      for (const gstNumber of host_gst_numbers) {
        if (gstNumber && gstNumber.trim()) {
          const insertGSTQuery = `
            INSERT INTO host_gst_numbers (host_id, gst_number)
            VALUES ($1, $2)
            RETURNING gst_number
          `;
          const gstResult = await pool.query(insertGSTQuery, [
            hostId,
            gstNumber.toUpperCase().trim()
          ]);
          insertedGSTNumbers.push(gstResult.rows[0].gst_number);
        }
      }
    }

    await pool.query('COMMIT');

    res.json({
      message: 'Host updated successfully',
      host: {
        ...hostResult.rows[0],
        gst_numbers: insertedGSTNumbers
      }
    });

  } catch (error) {
    await pool.query('ROLLBACK');
    
    // Handle unique constraint violations
    if (error.code === '23505') {
      let field = 'field';
      if (error.constraint?.includes('pan')) field = 'PAN number';
      else if (error.constraint?.includes('email')) field = 'email';
      else if (error.constraint?.includes('contact')) field = 'contact number';
      else if (error.constraint?.includes('gst')) field = 'GST number';
      
      return res.status(400).json({
        error: `This ${field} already exists in the system`
      });
    }

    console.error('Error updating host:', error);
    res.status(500).json({
      error: 'Internal server error while updating host'
    });
  } finally {
    pool.release();
  }
};




























// 5. DELETE HOST - DELETE /api/hosts/:id
export async function deleteHost  (req, res) {
  try {
    const hostId = parseInt(req.params.id);
    
    if (isNaN(hostId)) {
      return res.status(400).json({
        error: 'Invalid host ID'
      });
    }

    // Check if host exists
    const existsQuery = 'SELECT host_name FROM host_information WHERE host_id = $1';
    const existsResult = await pool.query(existsQuery, [hostId]);
    
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Host not found'
      });
    }

    const hostName = existsResult.rows[0].host_name;

    // Delete host (GST numbers will be deleted automatically due to CASCADE)
    const deleteQuery = 'DELETE FROM host_information WHERE host_id = $1';
    await pool.query(deleteQuery, [hostId]);

    res.json({
      message: `Host "${hostName}" deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting host:', error);
    res.status(500).json({
      error: 'Internal server error while deleting host'
    });
  }
};





// // 6. SEARCH HOSTS - GET /api/hosts/search
// const searchHosts = async (req, res) => {
//   try {
//     const { query, page = 1, limit = 10 } = req.query;
//     const offset = (page - 1) * limit;

//     if (!query || query.trim().length === 0) {
//       return res.status(400).json({
//         error: 'Search query is required'
//       });
//     }

//     const searchTerm = `%${query.trim().toLowerCase()}%`;

//     // Get total count for search
//     const countQuery = `
//       SELECT COUNT(*) FROM host_information 
//       WHERE LOWER(host_name) LIKE $1 
//          OR LOWER(host_email) LIKE $1 
//          OR LOWER(host_pan_number) LIKE $1
//          OR LOWER(host_contact_number) LIKE $1
//     `;
//     const countResult = await pool.query(countQuery, [searchTerm]);
//     const totalItems = parseInt(countResult.rows[0].count);
//     const totalPages = Math.ceil(totalItems / limit);

//     // Search hosts
//     const searchQuery = `
//       SELECT h.host_id, h.host_name, h.host_pan_number, h.rating, 
//              h.host_email, h.host_contact_number, h.created_at,
//              COALESCE(
//                JSON_AGG(
//                  CASE WHEN g.gst_number IS NOT NULL 
//                  THEN g.gst_number 
//                  ELSE NULL END
//                ) FILTER (WHERE g.gst_number IS NOT NULL), 
//                '[]'::json
//              ) as gst_numbers
//       FROM host_information h
//       LEFT JOIN host_gst_numbers g ON h.host_id = g.host_id
//       WHERE LOWER(h.host_name) LIKE $1 
//          OR LOWER(h.host_email) LIKE $1 
//          OR LOWER(h.host_pan_number) LIKE $1
//          OR LOWER(h.host_contact_number) LIKE $1
//       GROUP BY h.host_id, h.host_name, h.host_pan_number, h.rating, 
//                h.host_email, h.host_contact_number, h.created_at
//       ORDER BY h.created_at DESC
//       LIMIT $2 OFFSET $3
//     `;
    
//     const searchResult = await pool.query(searchQuery, [searchTerm, limit, offset]);

//     res.json({
//       hosts: searchResult.rows,
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages,
//         totalItems,
//         itemsPerPage: parseInt(limit),
//         hasNext: page < totalPages,
//         hasPrev: page > 1
//       },
//       searchQuery: query
//     });

//   } catch (error) {
//     console.error('Error searching hosts:', error);
//     res.status(500).json({
//       error: 'Internal server error while searching hosts'
//     });
//   }
// };




// // 7. GET HOST STATISTICS - GET /api/hosts/stats
// const getHostStats = async (req, res) => {
//   try {
//     const statsQuery = `
//       SELECT 
//         COUNT(*) as total_hosts,
//         AVG(rating) as average_rating,
//         COUNT(CASE WHEN rating >= 4 THEN 1 END) as high_rated_hosts,
//         COUNT(CASE WHEN rating < 3 THEN 1 END) as low_rated_hosts,
//         (SELECT COUNT(*) FROM host_gst_numbers) as total_gst_numbers
//       FROM host_information
//     `;
    
//     const statsResult = await pool.query(statsQuery);
//     const stats = statsResult.rows[0];

//     // Get recent hosts (last 7 days)
//     const recentQuery = `
//       SELECT COUNT(*) as recent_hosts
//       FROM host_information 
//       WHERE created_at >= NOW() - INTERVAL '7 days'
//     `;
//     const recentResult = await pool.query(recentQuery);
    
//     res.json({
//       stats: {
//         total_hosts: parseInt(stats.total_hosts),
//         average_rating: parseFloat(stats.average_rating || 0).toFixed(1),
//         high_rated_hosts: parseInt(stats.high_rated_hosts),
//         low_rated_hosts: parseInt(stats.low_rated_hosts),
//         total_gst_numbers: parseInt(stats.total_gst_numbers),
//         recent_hosts: parseInt(recentResult.rows[0].recent_hosts)
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching host statistics:', error);
//     res.status(500).json({
//       error: 'Internal server error while fetching statistics'
//     });
//   }
// };



// module.exports = {
// //   createHost,
//   getAllHosts,
// //   getHostById,
//   updateHost,
//   // deleteHost,
// //   searchHosts,
// //   getHostStats
// };
