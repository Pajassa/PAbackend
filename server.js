import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import crypto from "crypto";
import pool from "./client.js";
import rout from "./route.js";
import { startDailyReportScheduler } from "./api/ReservationManagement/bookingReportScheduler.js";

dotenv.config();

// Initialize DB schema & populate secure tokens for existing invoices
const initDb = async () => {
  try {
    await pool.query(`
      ALTER TABLE invoices 
      ADD COLUMN IF NOT EXISTS secure_token VARCHAR(64) UNIQUE;
    `);
    console.log("✅ Column secure_token verified/added to invoices");

    const emptyTokens = await pool.query(`
      SELECT id FROM invoices WHERE secure_token IS NULL
    `);
    if (emptyTokens.rows.length > 0) {
      console.log(`Populating secure_token for ${emptyTokens.rows.length} existing invoices...`);
      for (const row of emptyTokens.rows) {
        const token = crypto.randomBytes(32).toString('hex');
        await pool.query(`
          UPDATE invoices SET secure_token = $1 WHERE id = $2
        `, [token, row.id]);
      }
      console.log("✅ Done populating secure_token for old invoices");
    }
  } catch (err) {
    console.error("❌ Error initializing secure_token column:", err);
  }
};
initDb();

// 🔍 Debugging ENV variables
console.log("🔍 ENV:", process.env.DB_USERNAME, process.env.DB_NAME);

const app = express();

// ✅ Middlewares
// app.use(cors());
app.use(cors({ origin: "*" }));

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

app.use("/api", rout);

// ✅ Base route
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  startDailyReportScheduler();
});
