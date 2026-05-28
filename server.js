import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import rout from "./route.js";
import { startDailyReportScheduler } from "./api/ReservationManagement/bookingReportScheduler.js";

dotenv.config();

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
