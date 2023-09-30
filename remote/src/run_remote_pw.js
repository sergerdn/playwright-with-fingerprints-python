require("dotenv").config()
const { plugin } = require("playwright-with-fingerprints")

const os = require("os")
const fs = require("fs").promises
//const { chromium } = require("playwright")
const { randomUUID } = require("crypto")
const path = require("path")

async function runContext(fingerprintKey, userDataDir, port) {
  console.log(
    `Running with:
       fingerprintKey: ${fingerprintKey}, 
       userDataDir: ${userDataDir},
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

  plugin.useFingerprint(fingerprint)
  // https://peter.sh/experiments/chromium-command-line-switches/

  // Launch the browser instance:
  const browserContext = await plugin.launchPersistentContext(userDataDir, {
    headless: false,
    logger: {
      isEnabled: (name, severity) => true,
      log: (name, severity, message, args) => console.log(`${name} ${message}`)
    },
    args: [`--remote-debugging-port=${port}`]
  })

  console.log(`Browser launched and can be controlled remotely via http://localhost:${port}`)
  //await browserContext.close()
}

;(async () => {
  const fingerprintKey = process.env.FINGERPRINT_KEY
  if (fingerprintKey === undefined) {
    console.log("Please set the FINGERPRINT_KEY environment variable.")
    process.exit(1)
  }

  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "chrome-profile-"))
  const profileName = `profile-${randomUUID()}`
  console.log(`Using profile name: ${profileName}`)

  await runContext(fingerprintKey, userDataDir, 9222)
})()
