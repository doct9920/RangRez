const axios = require("axios");

const API_URL = "https://rangrez.club";
const PRINT_TOKEN = process.env.PRINT_CONNECTOR_TOKEN;

async function claimPrintJob() {
  try {
    if (!PRINT_TOKEN) {
      console.error("PRINT_CONNECTOR_TOKEN is not set.");
      return;
    }

    const response = await axios.post(
      `${API_URL}/api/print-jobs/claim`,
      {},
      {
        headers: {
          "x-print-connector-token": PRINT_TOKEN,
        },
        timeout: 15000,
      }
    );

    if (!response.data.job) {
      console.log("No pending print job.");
      return;
    }

    const job = response.data.job;

    console.log("Print job received:", job.id);
    console.log("Order ID:", job.orderId);
    console.log("Shipping address:", job.order.shippingAddress);

  } catch (error) {
    if (error.response) {
      console.error(
        "API error:",
        error.response.status,
        error.response.data
      );
    } else {
      console.error("Connector error:", error.message);
    }
  }
}

claimPrintJob();