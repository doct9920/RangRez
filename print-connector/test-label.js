const PDFDocument = require("pdfkit");
const fs = require("fs");

const customer = {
  name: "Customer Name",
  address: "H.No. 123, Main Street",
  city: "Rewari",
  state: "Haryana",
  pincode: "123401",
  phone: "9876543210",
};

const output = "customer-label.pdf";

const doc = new PDFDocument({
  size: [288, 432],
  margin: 20,
});

doc.pipe(fs.createWriteStream(output));

doc.fontSize(16).text("TO:", { underline: true });
doc.moveDown(0.5);

doc.fontSize(12)
  .text(customer.name)
  .text(customer.address)
  .text(`${customer.city}, ${customer.state} - ${customer.pincode}`)
  .text(`Mob. ${customer.phone}`);

doc.moveDown(1);

doc.fontSize(16).text("FROM:", { underline: true });
doc.moveDown(0.5);

doc.fontSize(12)
  .text("Rangrez.club")
  .text("H.No. 496, H. Sec. 4")
  .text("Rewari, Haryana")
  .text("Mob. 9466371290");

doc.end();

console.log(`Created ${output}`);