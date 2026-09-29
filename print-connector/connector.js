const axios = require("axios");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { print } = require("pdf-to-printer");

const API_URL = "https://rangrez.club";
const PRINT_TOKEN = process.env.PRINT_CONNECTOR_TOKEN;

function createLabel(shippingAddress, jobId) {
  return new Promise((resolve, reject) => {
    const output = path.join(__dirname, `order-${jobId}.pdf`);

    const doc = new PDFDocument({
      size: [288, 432],
      margin: 20,
    });

    const stream = fs.createWriteStream(output);

    stream.on("finish", () => resolve(output));
    stream.on("error", reject);

    doc.pipe(stream);

    const customer = shippingAddress || {};

    doc.fontSize(18).text("TO:", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12)
      .text(
        `${customer.firstName || ""} ${customer.lastName || ""}`.trim()
      )
      .text(customer.address || "")
      .text(
        `${customer.city || ""}, ${customer.state || ""} - ${
          customer.pincode || ""
        }`
      )
      .text(`Mob. ${customer.phone || ""}`);

    doc.moveDown(1);

    doc.fontSize(18).text("FROM:", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12)
      .text("Rangrez.club")
      .text("H.No. 496, H. Sec. 4")
      .text("Rewari, Haryana")
      .text("Mob. 9466371290");

    doc.end();
  });
}

async function completePrintJob(jobId, success, errorMessage) {
  await axios.post(
    `${API_URL}/api/print-jobs/complete`,
    {
      jobId,
      success,
      error: errorMessage || undefined,
    },
    {
      headers: {
        "x-print-connector-token": PRINT_TOKEN,
      },
      timeout: 15000,
    }
  );
}

async function claimAndPrint() {
  try {
    if (!PRINT_TOKEN) {
      throw new Error("PRINT_CONNECTOR_TOKEN is not set.");
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

    const pdfPath = await createLabel(
      job.order.shippingAddress,
      job.id
    );

    console.log("Label created:", pdfPath);

    await print(pdfPath, {
      printer: "Microsoft Print to PDF",
    });

    console.log("Print job sent successfully.");

    await completePrintJob(job.id, true);

    console.log("Print job marked as printed.");
  } catch (error) {
    console.error("Printing failed:", error.message);

    if (error.response) {
      console.error(
        "API:",
        error.response.status,
        error.response.data
      );
    }
  }
}

claimAndPrint();