const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium-min");
const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure Chromium
chromium.setGraphicsMode = false; // Disable GPU in serverless environment

// Run server
async function run() {
  try {
    app.listen(port, () => {
      console.log(`Server running on port: ${port}`);
    });

    // POST route to capture screenshot from the given URL
    app.post("/screenshot", async (req, res) => {
      const { url } = req.body;

      // Validate that the URL is provided and is a string
      if (!url || typeof url !== "string") {
        return res
          .status(400)
          .json({ success: false, error: "Please provide a valid URL." });
      }

      let browser;
      try {
        // Launch Puppeteer with Chromium
        browser = await puppeteer.launch({
          args: chromium.args,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
          ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();

        // Set a reasonable timeout for page operations
        page.setDefaultNavigationTimeout(15000);
        page.setDefaultTimeout(10000);

        // Open the URL and wait for the page to load
        await page.goto(url, {
          waitUntil: "networkidle2",
          timeout: 15000,
        });

        // Capture the screenshot as a PNG buffer
        const screenshotBuffer = await page.screenshot({
          type: "png",
          fullPage: true,
          encoding: "base64", // Directly get base64 output
        });

        // Respond with the base64 image string
        res.status(200).json({
          success: true,
          contentType: "image/png",
          base64: screenshotBuffer,
        });
      } catch (error) {
        console.error("Screenshot error:", error);
        res.status(500).json({
          success: false,
          error: error.message,
          url: url,
        });
      } finally {
        if (browser) {
          await browser
            .close()
            .catch((e) => console.error("Browser close error:", e));
        }
      }
    });
  } catch (error) {
    console.error("Server startup error:", error);
  }
}

run().catch(console.dir);

// Default route
app.get("/", (req, res) => {
  res.send("Server Running...");
});

// Export for Vercel
module.exports = app;
