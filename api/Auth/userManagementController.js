import pool from "../../client.js";
import bcrypt from "bcrypt";

// Get all users (Super Admin only)
export const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, username, email, role, modules, parent_admin_id, created_at 
             FROM users 
             ORDER BY created_at DESC`
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error("Get All Users error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Create a new user/admin (Super Admin only)
export const createUser = async (req, res) => {
    const { username, email, password, role, modules, parentAdminId } = req.body;

    if (!username || !email || !password || !role) {
        return res.status(400).json({ success: false, message: "All fields are required" });
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
        const newUser = await pool.query(
            `INSERT INTO users (username, email, password_hash, role, modules, parent_admin_id) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING id, username, email, role, modules, parent_admin_id, created_at`,
            [username, email, passwordHash, role, modules || [], parentAdminId || null]
        );

        res.status(201).json({
            success: true,
            message: "User created successfully",
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
        const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING *", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error("Delete User error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
