const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium-min");
const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

// Run server
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
    // Configure launch options for Vercel
    const launchOptions = {
      args: [...chromium.args, "--disable-gpu", "--no-sandbox"],
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    };

    // Set executable path based on environment
    if (process.env.VERCEL) {
      launchOptions.executablePath = await chromium.executablePath();
    } else {
      launchOptions.executablePath =
        process.env.PUPPETEER_EXECUTABLE_PATH ||
        require("puppeteer").executablePath();
    }

    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.setDefaultNavigationTimeout(10000);

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 10000,
    });

    const screenshotBuffer = await page.screenshot({
      type: "png",
      fullPage: false, // Changed to false for better reliability
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

app.get("/", (req, res) => {
  res.send("Server Running...");
});

// Vercel requires module.exports for serverless functions
module.exports = app;
