require('dotenv').config();

import { deleteVacationRequest } from "../src/lib/vacation-requests.server";

async function testDelete() {
  try {
    console.log("Attempting to delete vacation request with ID '1'...");
    const success = await deleteVacationRequest("1");
    if (success) {
      console.log("Deletion successful!");
    } else {
      console.log("Deletion failed: Vacation request with ID '1' not found.");
    }
  } catch (error) {
    console.error("An error occurred during deletion:", error);
  }
}

testDelete();
