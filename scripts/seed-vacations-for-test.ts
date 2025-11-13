require('dotenv').config();

import pool from "../src/lib/db";

async function seedVacationsForTest() {
  try {
    console.log("Ensuring vacation request with ID '1' exists...");
    const res = await pool.query(
      "INSERT INTO vacation_requests (id, user_id, start_date, end_date, status, total_days, requested_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id, start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date, status = EXCLUDED.status, total_days = EXCLUDED.total_days RETURNING *;",
      ['1', 'user-1', '2025-12-01', '2025-12-05', 'Aprovado', 5]
    );
    console.log("Vacation request with ID '1' ensured:", res.rows[0]);
  } catch (error) {
    console.error("An error occurred during vacation seeding:", error);
  }
}

seedVacationsForTest();
