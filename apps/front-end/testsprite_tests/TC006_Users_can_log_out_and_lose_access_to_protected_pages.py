import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:3000")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Open the 'Log in' page (navigate to /login).
        await page.goto("http://localhost:3000/login")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Fill the 'Email' field with tester@example.com.
        # email field
        elem = page.get_by_label('Email', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("tester@example.com")
        
        # -> Fill the 'Email' field with tester@example.com.
        # password field
        elem = page.get_by_label('Password', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("supersecret123")
        
        # -> Fill the 'Email' field with tester@example.com.
        # Log in button
        elem = page.get_by_role('button', name='Log in', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Log out' button in the page header to sign out.
        # Log out button
        elem = page.get_by_role('button', name='Log out', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the 'Arena' page and verify that the app shows the login page or a 'Log in' link (i.e., access is redirected to login).
        await page.goto("http://localhost:3000/arena")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # --> Assertions to verify final state
        
        # --> Verify the user is redirected to the login page
        # Assert: The current URL contains '/login', confirming the user is on the login page.
        await expect(page).to_have_url(re.compile("/login"), timeout=15000), "The current URL contains '/login', confirming the user is on the login page."
        # Assert: The login form's 'Email' label is present on the page.
        await expect(page.locator("xpath=/html/body/div[2]/form/label[1]").nth(0)).to_have_text("Email", timeout=15000), "The login form's 'Email' label is present on the page."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    