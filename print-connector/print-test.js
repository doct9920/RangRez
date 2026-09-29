const { print } = require("pdf-to-printer");

async function printTest() {
  try {
    await print("test-label.pdf", {
      printer: "Microsoft Print to PDF",
    });

    console.log("Print job sent successfully.");
  } catch (error) {
    console.error("Print failed:", error);
  }
}

printTest();