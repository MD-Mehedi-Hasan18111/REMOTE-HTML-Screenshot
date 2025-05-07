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
const isProduction = process.env.NODE_ENV === "production";
const executablePath = isProduction
  ? await chromium.executablePath()
  : puppeteer.executablePath();

// Run server
async function run() {
  try {
    app.listen(port, () => {
      console.log(`Server running on port: ${port}`);
    });

    app.post("/screenshot", async (req, res) => {
      const { url } = req.body;

      if (!url || typeof url !== "string") {
        return res.status(400).json({
          success: false,
          error: "Please provide a valid URL.",
        });
      }

      let browser;
      try {
        // Launch options
        const launchOptions = {
          args: chromium.args,
          headless: chromium.headless,
          ignoreHTTPSErrors: true,
        };

        // Only set executablePath in production
        if (isProduction) {
          launchOptions.executablePath = executablePath;
        }

        browser = await puppeteer.launch(launchOptions);

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        await page.setDefaultNavigationTimeout(15000);

        await page.goto(url, {
          waitUntil: "networkidle2",
          timeout: 15000,
        });

        const screenshotBuffer = await page.screenshot({
          type: "png",
          fullPage: true,
          encoding: "base64",
        });

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

app.get("/", (req, res) => {
  res.send("Server Running...");
});

module.exports = app;
