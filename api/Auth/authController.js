import pool from "../../client.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "your_super_secret_key_change_me"; // Env var best practice

export const signup = async (req, res) => {
    const { username, email, password, role, modules, parentAdminId } = req.body;

    if (!username || !email || !password) {
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

        // Check if any Super Admin exists
        const superAdminCheck = await pool.query("SELECT * FROM users WHERE role = 'Super Admin' LIMIT 1");
        const hasSuperAdmin = superAdminCheck.rows.length > 0;

        // Public signup always creates Admin with pending status
        // EXCEPT if it's the first ever user (they become Super Admin)
        const assignedRole = hasSuperAdmin ? 'Admin' : 'Super Admin';
        const assignedStatus = hasSuperAdmin ? 'pending' : 'active';

        // Insert user with RBAC fields
        const newUser = await pool.query(
            "INSERT INTO users (username, email, password_hash, role, status, modules, parent_admin_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, email, role, status, modules, parent_admin_id",
            [
                username, 
                email, 
                passwordHash, 
                assignedRole, 
                assignedStatus,
                modules || [], 
                parentAdminId || null
            ]
        );

        const user = newUser.rows[0];

        // Create Token
        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: "24h" });

        res.status(201).json({
            success: true,
            message: user.status === 'pending' 
                ? "Registration successful! Your account is pending approval from the Super Admin."
                : "User registered successfully",
            token: user.status === 'active' ? token : null,
            user: { 
                id: user.id, 
                username: user.username, 
                email: user.email,
                role: user.role,
                status: user.status,
                modules: user.modules,
                parentAdminId: user.parent_admin_id
            }
        });

    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const signin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    try {
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const user = result.rows[0];

        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        // Check if user is active
        if (user.status !== 'active') {
            return res.status(403).json({ 
                success: false, 
                message: user.status === 'pending' 
                    ? "Your account is pending approval by the Super Admin." 
                    : "Your account is inactive or has been rejected." 
            });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: "24h" });

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: { 
                id: user.id, 
                username: user.username, 
                email: user.email,
                role: user.role,
                status: user.status,
                modules: user.modules,
                parentAdminId: user.parent_admin_id
            }
        });

    } catch (error) {
        console.error("Signin error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const logout = (req, res) => {
    // Since we are using stateless JWTs on client side (localStorage), 
    // server-side logout is mostly just confirming the request.
    // Real logout is handling on client by deleting token.
    res.status(200).json({ success: true, message: "Logged out successfully" });
};
