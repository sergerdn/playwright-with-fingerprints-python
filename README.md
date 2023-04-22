# Proof of Concept: Working with Playwright and BAS Fingerprints

## About

This project aims to utilize BAS remote fingerprinting capabilities with BAS Fingerprints (via Playwright) and Python.

The core idea of this project is to control a browser using the remote debugging protocol from a Python script. The
browser instance is launched with a remote debugging port, which allows us to connect to it using a Python client and
perform various actions such as navigating to a URL, interacting with elements on the page, and retrieving information
about the browser state.

Although there is no official API available to directly use BAS with Python, we can leverage the experimental features
in the BAS JavaScript libraries to remotely control the browser via the remote debugging protocol.

This approach enables us to connect to a BAS browser instance using the remote debugging protocol like any other browser
and execute the same set of actions that we would on a regular browser using Python or any other language of our choice.

## Notes

As this is a proof of concept project, there are no features available yet to start a browser from Python code and
provide custom parameters such as profile directory, fingerprinting key, and others.

## Project Structure

- `remote` - Source code of a JavaScript application that runs a browser with a remote debugging port
- `local` - Source code of a Python application that connects to a remote browser and performs some actions

### Prepare

1. Install Node.js(with yarn), Python 3.8+(with poetry)
2. Install javascript dependencies:
    ```bash
    cd remote && yarn install
    ```
3. Install javascript dependencies:
     ```bash
    cd remote && poetry install
    ```
4. Copy `remote/.env.example` to `remote/.env` and fill in the values for the BAS fingerprinting key.

### Usage

To use this project, follow these steps:

1. Run the remote script to launch a browser instance with a remote debugging port. Do not close the console window.
   ```bash
   cd remote && yarn run remote
   ```

2. In another console, run the Python script to connect to the remote browser and perform some actions.
   ```bash
   cd local && poetry run python remote_cdp.py
   ```

## References:

- https://github.com/CheshireCaat/playwright-with-fingerprints
- https://python-poetry.org/docs/