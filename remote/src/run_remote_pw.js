require("dotenv").config()
const { plugin } = require("playwright-with-fingerprints")

const os = require("os")
const fs = require("fs").promises
//const { chromium } = require("playwright")
const { FingerprintOptions } = require("browser-with-fingerprints")
const { randomUUID } = require("crypto")
const path = require("path")

async function runContext(fingerprintKey, workingFolder, userDataDir, port) {
  console.log(
    `Running with:
       fingerprintKey: ${fingerprintKey}, 
       workingFolder: ${workingFolder},
       userDataDir: ${userDataDir},
       port: ${port}`
  )

  plugin.setWorkingFolder(workingFolder)

  const fingerprint = await plugin.fetch(fingerprintKey, {
    tags: ["Microsoft Windows", "Chrome"],
    minBrowserVersion: 117,
    minWidth: 1366,
    minHeight: 768,
    maxWidth: 1920,
    maxHeight: 1080
  })

  // Save the fingerprint to a file
  await fs.writeFile(path.join(userDataDir, "fingerprint.json"), JSON.stringify(fingerprint))

  const fingerprintOptions = {
    emulateDeviceScaleFactor: false,
    usePerfectCanvas: true,
    useFontPack: true
  }

  plugin.useFingerprint(fingerprint, fingerprintOptions)
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
  if (!fingerprintKey) {
    console.log("Please set the FINGERPRINT_KEY environment variable.")
    process.exit(1)
  }

  let workingFolder = process.env.WORKING_FOLDER
  if (!workingFolder) {
    console.log("Please set the WORKING_FOLDER environment variable.")
    process.exit(1)
  }

  workingFolder = path.resolve(workingFolder)

  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "chrome-profile-"))
  const profileName = `profile-${randomUUID()}`
  console.log(`Using profile name: ${profileName}`)

  await runContext(fingerprintKey, workingFolder, userDataDir, 9222)
})()
