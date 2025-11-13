require('dotenv').config();

import pool from "../src/lib/db";

async function listVacations() {
  try {
    console.log("Listing all vacation requests...");
    const res = await pool.query("SELECT id, user_id, start_date, end_date, status FROM vacation_requests ORDER BY id ASC;");
    if (res.rows.length > 0) {
      console.log("Found vacation requests:", res.rows);
    } else {
      console.log("No vacation requests found.");
    }
  } catch (error) {
    console.error("An error occurred while listing vacations:", error);
  }
}

listVacations();
