require('dotenv').config();

import pool from "../src/lib/db";

async function seedVacationsForTest() {
  try {
    // Check if the specific seed record already exists. If it doesn't,
    // insert and log the creation (first-run behavior). Otherwise perform
    // a silent upsert.
    const check = await pool.query("SELECT id FROM vacation_requests WHERE id = $1", ['1']);
    if (check.rows.length === 0) {
      const res = await pool.query(
        "INSERT INTO vacation_requests (id, user_id, start_date, end_date, status, total_days, requested_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *;",
        ['1', 'user-1', '2025-12-01', '2025-12-05', 'Aprovado', 5]
      );
      if (res && res.rows && res.rows[0] && res.rows[0].id) {
        console.log(`Vacation created: id=${res.rows[0].id}`);
      }
    } else {
      // Existing record: perform silent update
      await pool.query(
        "UPDATE vacation_requests SET user_id = $2, start_date = $3, end_date = $4, status = $5, total_days = $6 WHERE id = $1;",
        ['1', 'user-1', '2025-12-01', '2025-12-05', 'Aprovado', 5]
      );
    }
  } catch (error) {
    console.error('Vacation seeding error:', error);
  }
}

seedVacationsForTest();
