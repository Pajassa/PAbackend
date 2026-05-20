import pool from "../../client.js";
import bcrypt from "bcrypt";

// Get all users (Super Admin or Admin)
export const getAllUsers = async (req, res) => {
    try {
        let queryStr = `
            SELECT id, username, email, role, status, modules, parent_admin_id, created_at 
            FROM users 
        `;
        let params = [];

        // Hide users with 'deleted' status
        queryStr += ` WHERE status != 'deleted' `;
        
        // If not Super Admin, only return users created by this admin or the admin themselves
        if (req.user.role !== 'Super Admin') {
            queryStr += ` AND (parent_admin_id = $1 OR id = $1) `;
            params.push(req.user.id);
        }

        queryStr += ` ORDER BY created_at DESC `;

        const result = await pool.query(queryStr, params);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error("Get All Users error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Get pending users (Super Admin only)
export const getPendingUsers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, username, email, role, status, modules, parent_admin_id, created_at 
             FROM users 
             WHERE status = 'pending'
             ORDER BY created_at DESC`
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error("Get Pending Users error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Approve user (Super Admin only)
export const approveUser = async (req, res) => {
    const { id } = req.params;
    const { action, role, modules } = req.body; // 'approve' or 'reject', optional role and modules

    try {
        const status = action === 'approve' ? 'active' : 'rejected';
        
        let queryStr = "UPDATE users SET status = $1";
        let params = [status];

        // If approving, also set the role and modules if provided
        if (action === 'approve') {
            if (role) {
                queryStr += `, role = $${params.length + 1}`;
                params.push(role);
            }
            if (modules) {
                queryStr += `, modules = $${params.length + 1}`;
                params.push(modules);
            }
        }

        queryStr += ` WHERE id = $${params.length + 1} RETURNING id, username, email, role, status, modules`;
        params.push(id);

        const result = await pool.query(queryStr, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ 
            success: true, 
            message: `User ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Approve User error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Create a new user/admin
export const createUser = async (req, res) => {
    let { username, email, password, role, modules, parentAdminId } = req.body;

    if (!username || !email || !password || !role) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Role Enforcement
    if (req.user.role === 'Admin') {
        // Admins can ONLY create 'User' role
        role = 'User';
        parentAdminId = req.user.id;
    } else if (req.user.role === 'Super Admin') {
        // Super Admin can set parentAdminId or default to null
        parentAdminId = parentAdminId || null;
    }

    try {
        // Check if user exists
        const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userCheck.rows.length > 0) {
            return res.status(409).json({ success: false, message: "Email already registered" });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert user
        // If Admin creates user, status is 'pending' (needs Super Admin approval)
        // If Super Admin creates user, status is 'active'
        const status = req.user.role === 'Admin' ? 'pending' : 'active';

        const newUser = await pool.query(
            `INSERT INTO users (username, email, password_hash, role, status, modules, parent_admin_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING id, username, email, role, status, modules, parent_admin_id, created_at`,
            [username, email, passwordHash, role, status, modules || [], parentAdminId]
        );

        res.status(201).json({
            success: true,
            message: status === 'pending' 
                ? "User created successfully and is pending approval from the Super Admin." 
                : "User created successfully",
            data: newUser.rows[0]
        });

    } catch (error) {
        console.error("Create User error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Update user details (Super Admin only)
export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, email, role, modules, parentAdminId, password } = req.body;

    try {
        let updateQuery = `
            UPDATE users 
            SET username = $1, email = $2, role = $3, modules = $4, parent_admin_id = $5 
        `;
        let params = [username, email, role, modules || [], parentAdminId || null];

        // Permission Check for Admins
        if (req.user.role !== 'Super Admin') {
            const permissionCheck = await pool.query(
                "SELECT role, parent_admin_id FROM users WHERE id = $1", 
                [id]
            );

            if (permissionCheck.rows.length === 0) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            const targetUser = permissionCheck.rows[0];

            // Admin can only update themselves or users they created
            if (targetUser.parent_admin_id !== req.user.id && parseInt(id) !== req.user.id) {
                return res.status(403).json({ 
                    success: false, 
                    message: "Access denied. You can only update your own users." 
                });
            }

            // Prevent Admin from changing their own role or parent_admin_id
            params[2] = targetUser.role; 
            params[4] = targetUser.parent_admin_id;
        }

        // If password is provided, hash it and update as well
        if (password && password.trim() !== "") {
            const passwordHash = await bcrypt.hash(password, 10);
            updateQuery += `, password_hash = $6 `;
            params.push(passwordHash);
        }

        updateQuery += ` WHERE id = $${params.length + 1} RETURNING id, username, email, role, modules, parent_admin_id`;
        params.push(id);

        const result = await pool.query(updateQuery, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Update User error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Delete user (Super Admin only)
export const deleteUser = async (req, res) => {
    const { id } = req.params;

    // Prevent Super Admin from deleting themselves (optional but recommended)
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ success: false, message: "You cannot delete your own account." });
    }

    try {
        // Permission Check for Admins
        if (req.user.role !== 'Super Admin') {
            const permissionCheck = await pool.query(
                "SELECT parent_admin_id FROM users WHERE id = $1", 
                [id]
            );

            if (permissionCheck.rows.length === 0) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            if (permissionCheck.rows[0].parent_admin_id !== req.user.id) {
                return res.status(403).json({ 
                    success: false, 
                    message: "Access denied. You can only delete your own users." 
                });
            }
        }

        const result = await pool.query(
            "UPDATE users SET status = 'deleted' WHERE id = $1 RETURNING *", 
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error("Delete User error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
