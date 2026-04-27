import pool from "../client.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigration = async () => {
    try {
        const migrationPath = path.join(__dirname, "../migrations/add_status_to_users.sql");
        const sql = fs.readFileSync(migrationPath, "utf8");
        
        console.log("Running migration...");
        await pool.query(sql);
        console.log("Migration completed successfully!");
        
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

runMigration();
