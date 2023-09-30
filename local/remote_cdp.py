import asyncio
import json
import os.path
import logging
import re
from typing import Dict

import websockets
import requests
from playwright.async_api import async_playwright, Page, Request

ABS_PATH = os.path.dirname(os.path.abspath(__file__))
logging.basicConfig(level=logging.DEBUG)


def url_to_ws_endpoint(endpoint_url: str) -> str:
    if endpoint_url.startswith("ws"):
        return endpoint_url

    print(f"<ws preparing> retrieving websocket url from {endpoint_url}")

    http_url = endpoint_url if endpoint_url.endswith("/") else f"{endpoint_url}/"
    http_url += "json/version/"

    response = requests.get(http_url)

    if not (200 <= response.status_code < 400):
        raise ValueError(
            f"Unexpected status {response.status_code} when connecting to {http_url}.\n"
            "This does not look like a DevTools server, try connecting via ws://."
        )
    print(f"<ws preparing> response: {response.text}")

    json_data = json.loads(response.text)

    return str(json_data["webSocketDebuggerUrl"])


async def get_browser_version(ws_url: str) -> Dict:
    async with websockets.connect(ws_url) as ws:  # type: ignore
        # Send a command to get browser version
        payload = json.dumps({"id": 1, "method": "Browser.getVersion"})
        await ws.send(payload)
        response = await ws.recv()
        return dict(json.loads(response))


async def get_browser_http_headers(page: Page) -> Dict:
    await page.goto("https://lumtest.com/echo.json")
    page_source = await page.content()

    # Using a non-greedy match (.*?) to capture the content inside <pre> tags
    match = re.search(r"<pre[^>]*>(.*?)</pre>", page_source, re.DOTALL)
    if not match:
        raise ValueError("Could not find <pre> tag in page source")

    extracted_text = match.group(1).strip()
    return dict(json.loads(extracted_text))


async def start_local_playwright(port: int = 9222) -> None:
    def log_request(intercepted_request: Request) -> None:
        print("a request was made:", intercepted_request)

    async with async_playwright() as pw:
        url = f"http://localhost:{port}"
        ws_url = url_to_ws_endpoint(url)
        browser_version = await get_browser_version(ws_url)
        print(f"browser_version: {browser_version}")

        # Connect to an existing browser instance

        browser = await pw.chromium.connect_over_cdp(ws_url)
        print(f"browser: {browser}")

        # Get the existing pages in the connected browser instance
        page = browser.contexts[0].pages[0]
        page.on("request", log_request)

        browser_http_headers_json = await get_browser_http_headers(page)
        print(f"browser http headers: {json.dumps(browser_http_headers_json, indent=4)}")

        # Navigate to the specified URL
        await page.goto("https://playwright.dev/")
        print(f"page: {page}")

        # Take a screenshot and save it to the specified file
        screenshot_filename = os.path.join(ABS_PATH, "screenshot.png")
        await page.screenshot(path=screenshot_filename)


async def close_browser(port: int = 9222) -> None:
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


async def sleep() -> None:
    await asyncio.sleep(5)


if __name__ == "__main__":
    asyncio.run(start_local_playwright())
    asyncio.run(sleep())
    asyncio.run(close_browser())
