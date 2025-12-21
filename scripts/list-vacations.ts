require('dotenv').config();

import pool from "../src/lib/db";

async function listVacations() {
  try {
    const res = await pool.query("SELECT id, user_id, start_date, end_date, status FROM vacation_requests ORDER BY id ASC;");
    // Only print output on first-run (no rows) or when explicitly requested.
    if (res.rows.length === 0) {
      console.log('No vacation requests found');
    } else if (process.env.SHOW_VACATION_LIST === 'true') {
      console.log(`Found ${res.rows.length} vacation request(s)`);
    }
  } catch (error) {
    console.error('Vacation listing error:', error);
  }
}

listVacations();
