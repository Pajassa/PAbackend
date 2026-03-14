

import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  // connectionString: `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@localhost:5432/${process.env.DB_NAME}`,
  // Remote with SSL support:
  // connectionString: `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@13.61.236.213:5432/${process.env.DB_NAME}?sslmode=require`,
  
  // Alternative: Configure SSL separately
  host: '3.6.44.252',
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

// Helper function
const query = async (text, params = []) => {
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("executed query", JSON.stringify({ text, duration, rows: res.rowCount }));
    return res;
  } catch (err) {
    console.error("❌ Error encountered in DB query");
    console.error(err);
    throw err;
  }
};

// ✅ Export in ESM way
export default pool;
export { query };