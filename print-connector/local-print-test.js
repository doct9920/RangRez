const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { print } = require("pdf-to-printer");

const customer = {
  name: "Test Customer",
  address: "H.No. 123, Main Street",
  city: "Rewari",
  state: "Haryana",
  pincode: "123401",
  phone: "9876543210",
};

const output = path.join(__dirname, "local-order-label.pdf");

function createLabel() {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [288, 432],
      margin: 20,
    });

    const stream = fs.createWriteStream(output);

    stream.on("finish", resolve);
    stream.on("error", reject);

    doc.pipe(stream);

    doc.fontSize(18).text("TO:", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12)
      .text(customer.name)
      .text(customer.address)
      .text(`${customer.city}, ${customer.state} - ${customer.pincode}`)
      .text(`Mob. ${customer.phone}`);

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

async function main() {
  try {
    await createLabel();

    console.log("Label PDF created:");
    console.log(output);

    await print(output, {
      printer: "Microsoft Print to PDF",
    });

    console.log("Print job sent successfully.");
  } catch (error) {
    console.error("Local print test failed:", error);
  }
}

main();