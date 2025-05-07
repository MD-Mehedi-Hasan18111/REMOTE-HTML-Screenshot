const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server Running...");
});

app.post("/screenshot", async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== "string") {
    return res
      .status(400)
      .json({ success: false, error: "Please provide a valid URL." });
  }

  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });
    const screenshotBuffer = await page.screenshot({
      type: "png",
      fullPage: true,
    });
    await browser.close();

    const base64Image = screenshotBuffer.toString("base64");
    res
      .status(200)
      .json({ success: true, contentType: "image/png", base64: base64Image });
  } catch (error) {
    console.error("Screenshot error:", error.message);
    res.status(500).json({ success: false, error: "Screenshot failed." });
  }
});

module.exports = app;
