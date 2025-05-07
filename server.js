const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = 5000;

app.use(express.json());

// Log incoming requests to ensure proper parsing
app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  console.log("Request body:", req.body);
  next();
});

// Run server and database connection
async function run() {
  try {
    // POST route to capture screenshot from the given URL
    app.post("/screenshot", async (req, res) => {
      const { url } = req.body;

      // Validate that the URL is provided and is a string
      if (!url || typeof url !== "string") {
        return res
          .status(400)
          .json({ success: false, error: "Please provide a valid URL." });
      }

      try {
        // Launch Puppeteer to take a screenshot
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Open the URL and wait for the page to load
        await page.goto(url, { waitUntil: "networkidle2" });

        // Capture the screenshot as a PNG buffer
        const screenshotBuffer = await page.screenshot({
          type: "png",
          fullPage: true,
        });
        await browser.close();

        // Convert the buffer to a base64-encoded string
        const base64Image = screenshotBuffer.toString("base64");

        // Respond with the base64 image string
        res.status(200).json({
          success: true,
          contentType: "image/png",
          base64: base64Image,
        });
      } catch (error) {
        console.error("Screenshot error:", error.message);
        res.status(500).json({ success: false, error: "Screenshot failed." });
      }
    });
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at port:${PORT}`);
});

// Default route
app.get("/", (req, res) => {
  res.send("Server Running...");
});
