require('dotenv').config();

import { createVacationRequest } from "../src/lib/vacation-requests.server";

async function seedVacation() {
  try {
    console.log("Attempting to create vacation request with ID '1'...");
    const vacation = await createVacationRequest({
      userId: "user-1", // Replace with an existing user ID if necessary
      startDate: "2025-12-01",
      endDate: "2025-12-05",
      status: "Aprovado",
      totalDays: 5,
    });
    console.log("Vacation request created:", vacation);
  } catch (error) {
    console.error("An error occurred during vacation creation:", error);
  }
}

seedVacation();