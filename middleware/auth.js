import jwt from "jsonwebtoken";
import pool from "../client.js";

const SECRET_KEY = process.env.JWT_SECRET || "your_super_secret_key_change_me";

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authorization token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    
    // Fetch full user details from DB to ensure we have latest role/modules
    const result = await pool.query(
      "SELECT id, username, email, role, modules, parent_admin_id FROM users WHERE id = $1",
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: "User no longer exists" });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export const checkSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "Super Admin") {
    return res.status(403).json({ 
      success: false, 
      message: "Access denied. Only Super Admins can perform this action." 
    });
  }
  next();
};

export const checkModuleAccess = (moduleName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { role, modules } = req.user;

    // Super Admin has full access to everything
    if (role === "Super Admin") {
      return next();
    }

    // Admins and Users check modules field
    if (modules && Array.isArray(modules) && modules.some(m => m.toLowerCase() === moduleName.toLowerCase())) {
      return next();
    }

    return res.status(403).json({ 
      success: false, 
      message: `Access denied. You do not have permission for the ${moduleName} module.` 
    });
  };
};
