import asyncio
import os.path
import logging

from playwright.async_api import async_playwright

ABS_PATH = os.path.dirname(os.path.abspath(__file__))
logging.basicConfig(level=logging.DEBUG)


async def start_local_playwright(port=9222):
    async with async_playwright() as pw:
        # Connect to an existing browser instance
        browser = await pw.chromium.connect_over_cdp(f"http://localhost:{port}")
        print(f"browser: {browser}")

        # Get the existing pages in the connected browser instance
        page = browser.contexts[0].pages[0]

        # Navigate to the specified URL
        await page.goto("https://playwright.dev/")
        print(f"page: {page}")

        # Take a screenshot and save it to the specified file
        screenshot_filename = os.path.join(ABS_PATH, "screenshot.png")
        await page.screenshot(path=screenshot_filename)


async def close_browser(port=9222):
    async with async_playwright() as pw:
        # Connect to an existing browser instance
        browser = await pw.chromium.connect_over_cdp(f"http://localhost:{port}")
        print(f"Connected to browser: {browser}")

        # Close all open browser pages to close the browser
        for context in browser.contexts:
            for page in context.pages:
                await page.close()

    # Print the status of the browser
    print("Browser context closed")


if __name__ == "__main__":
    asyncio.run(start_local_playwright())
    asyncio.run(close_browser())
