// A temporary build-time visual proof for the featured AURELIS card.
// Captures the public, real 3D experience, not an AI-generated watch.
import { chromium } from "playwright";
import sharp from "sharp";

const browser = await chromium.launch({
  headless: true,
  args: ["--enable-webgl", "--use-gl=angle", "--use-angle=swiftshader", "--disable-gpu-sandbox"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
    isMobile: true,
    hasTouch: true,
  });
  await page.goto("https://aurelis-atelier-omega.vercel.app/", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.locator(".is-ready").first().waitFor({ timeout: 40000 });
  await page.waitForTimeout(2300);
  const buffer = await page.screenshot({ type: "png" });
  // Keep the actual full watch, remove browser/CTA framing from the still.
  await sharp(buffer)
    .extract({ left: 18, top: 185, width: 744, height: 750 })
    .resize({ width: 720, height: 726, fit: "fill" })
    .webp({ quality: 82, effort: 6 })
    .toFile("images/aurelis-watch.webp");
  console.log("Authentic AURELIS screenshot ready");
} finally {
  await browser.close();
}
