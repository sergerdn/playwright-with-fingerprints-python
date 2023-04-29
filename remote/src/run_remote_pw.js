require("dotenv").config()
const { plugin } = require("playwright-with-fingerprints")

const os = require("os")
const fs = require("fs").promises
const { chromium } = require("playwright")
const { randomUUID } = require("crypto")
const path = require("path")

async function runContext(fingerprintKey, userDataDir, profileName, port) {
  console.log(
    `Running with:
       fingerprintKey: ${fingerprintKey}, 
       userDataDir: ${userDataDir},
       profileName: ${profileName},
       port: ${port}`
  )
  const fingerprint = await plugin.fetch(fingerprintKey, {
    tags: ["Microsoft Windows", "Chrome"],
    minBrowserVersion: 112,
    minWidth: 1366,
    minHeight: 768,
    maxWidth: 1920,
    maxHeight: 1080
  })
  // Save the fingerprint to a file
  await fs.writeFile(path.join(userDataDir, "fingerprint.json"), JSON.stringify(fingerprint))
  await fs.writeFile(path.join(userDataDir, "fingerprint_1.json"), fingerprint)

  plugin.useFingerprint(fingerprint)
  // https://peter.sh/experiments/chromium-command-line-switches/

  // Launch the browser instance:
  const browserContext = await plugin.launchPersistentContext(userDataDir, {
    headless: false,
    args: [`--remote-debugging-port=${port}`, `--profile-directory=${profileName}`]
  })

  console.log("Browser headless launched")
  //await browserContext.close()
}

;(async () => {
  const fingerprintKey = process.env.FINGERPRINT_KEY
  if (fingerprintKey === undefined) {
    console.log("Please set the FINGERPRINT_KEY environment variable")
    process.exit(1)
  }
  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "chrome-profile-"))
  const profileName = randomUUID()
  await runContext(fingerprintKey, userDataDir, profileName, 9222)
})()
