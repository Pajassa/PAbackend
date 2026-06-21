import pool from "../../client.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Resend } from "resend";

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

export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    try {
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Email address not found" });
        }

        const user = result.rows[0];

        // Generate a secure token signed with SECRET_KEY + user's current password_hash
        // This ensures the token is one-time use (changing the password invalidates it).
        const tokenKey = SECRET_KEY + user.password_hash;
        const resetToken = jwt.sign({ id: user.id, email: user.email }, tokenKey, { expiresIn: "1h" });

        // Determine frontend URL: use FRONTEND_URL env var, or fallback to Origin header, or fallback to Referer, or fallback to localhost
        let frontendUrl = process.env.FRONTEND_URL;
        if (!frontendUrl && req.headers.origin) {
            frontendUrl = req.headers.origin;
        }
        if (!frontendUrl && req.headers.referer) {
            try {
                const refererUrl = new URL(req.headers.referer);
                frontendUrl = refererUrl.origin;
            } catch (e) {
                // Ignore URL parsing errors
            }
        }
        if (!frontendUrl) {
            frontendUrl = "http://localhost:5173";
        }

        const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

        const resend = new Resend(process.env.RESEND_API_KEY);
        
        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Password Reset Request</title>
                <style>
                    body {
                        font-family: 'Inter', Arial, sans-serif;
                        background-color: #f4f5f7;
                        color: #1e293b;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 40px auto;
                        background: #ffffff;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                        border: 1px solid #e2e8f0;
                    }
                    .header {
                        background-color: #2563eb;
                        padding: 30px;
                        text-align: center;
                        color: #ffffff;
                    }
                    .logo {
                        font-size: 24px;
                        font-weight: 800;
                        letter-spacing: -0.02em;
                        margin-bottom: 5px;
                    }
                    .content {
                        padding: 40px 30px;
                        line-height: 1.6;
                    }
                    .btn {
                        display: inline-block;
                        background-color: #2563eb;
                        color: #ffffff !important;
                        text-decoration: none;
                        padding: 12px 30px;
                        border-radius: 8px;
                        font-weight: 600;
                        margin: 25px 0;
                        box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
                    }
                    .footer {
                        background-color: #f8fafc;
                        padding: 20px;
                        text-align: center;
                        font-size: 12px;
                        color: #64748b;
                        border-top: 1px solid #f1f5f9;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">PAJASA APARTMENTS</div>
                        <div style="font-size: 14px; opacity: 0.9;">Password Recovery System</div>
                    </div>
                    <div class="content">
                        <h3>Hello ${user.username},</h3>
                        <p>We received a request to reset the password for your account. You can reset your password by clicking the button below:</p>
                        <div style="text-align: center;">
                            <a href="${resetLink}" class="btn" target="_blank">Reset Password</a>
                        </div>
                        <p>If the button doesn't work, copy and paste the following link into your browser:</p>
                        <p style="word-break: break-all; font-size: 13px; color: #64748b;">${resetLink}</p>
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                        <p style="font-size: 13px; color: #64748b;">This link is valid for 1 hour. If you did not request a password reset, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        &copy; 2026 Pajasa Apartments. All rights reserved.
                    </div>
                </div>
            </body>
            </html>
        `;

        await resend.emails.send({
            from: "booking@pajasaapartments.com",
            to: user.email,
            subject: "Reset your Pajasa Apartments Password",
            html: emailHtml
        });

        res.status(200).json({ success: true, message: "Password reset email sent successfully." });

    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ success: false, message: "Token and new password are required" });
    }

    try {
        // Decode token to get user ID
        const decodedToken = jwt.decode(token);
        if (!decodedToken || !decodedToken.id) {
            return res.status(400).json({ success: false, message: "Invalid token structure" });
        }

        // Fetch user
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [decodedToken.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const user = result.rows[0];

        // Verify token signature using SECRET_KEY + user.password_hash
        const tokenKey = SECRET_KEY + user.password_hash;
        try {
            jwt.verify(token, tokenKey);
        } catch (err) {
            return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
        }

        // Hash new password and update in DB
        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        await pool.query(
            "UPDATE users SET password_hash = $1 WHERE id = $2",
            [newPasswordHash, user.id]
        );

        res.status(200).json({ success: true, message: "Password reset successfully. You can now login with your new password." });

    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

