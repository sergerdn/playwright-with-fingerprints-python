require("dotenv").config()
const { plugin } = require("playwright-with-fingerprints")

const os = require("os")
const fs = require("fs").promises
const { chromium } = require("playwright")
const path = require("path")

async function runContext(fingerprintKey, profileDirectory, port) {
  const fingerprint = await plugin.fetch(fingerprintKey, {
    tags: ["Microsoft Windows", "Chrome"],
    minBrowserVersion: 112,
    minWidth: 1366,
    minHeight: 768,
    maxWidth: 1920,
    maxHeight: 1080
  })

  plugin.useFingerprint(fingerprint)

  // Launch the browser instance:
  const browserContext = await plugin.launchPersistentContext(profileDirectory, {
    headless: false,
    args: [`--remote-debugging-port=${port}`]
  })

  console.log("Browser with context launched")

  //await browserContext.close()
}

;(async () => {
  const fingerprintKey = process.env.FINGERPRINT_KEY
  const profileDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "chrome-profile-"))
  await runContext(fingerprintKey, profileDirectory, 9222)
})()