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
        
        # -> Click the 'Log in' link to open the login page.
        # Log in link
        elem = page.get_by_role('link', name='Log in', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the 'Email' field with tester@example.com and the 'Password' field with supersecret123, then click the 'Log in' button.
        # email field
        elem = page.get_by_label('Email', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("tester@example.com")
        
        # -> Fill the 'Email' field with tester@example.com and the 'Password' field with supersecret123, then click the 'Log in' button.
        # password field
        elem = page.get_by_label('Password', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("supersecret123")
        
        # -> Fill the 'Email' field with tester@example.com and the 'Password' field with supersecret123, then click the 'Log in' button.
        # Log in button
        elem = page.get_by_role('button', name='Log in', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Log out' button to end the session.
        # Log out button
        elem = page.get_by_role('button', name='Log out', exact=True)
        await elem.click(timeout=10000)
        
        # -> From the home page, click the 'My Memes' button to attempt to open the protected page and verify the login page is shown.
        # 🗂️ My Memes button
        elem = page.get_by_role('button', name='My Memes', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'My Memes' button on the homepage to open the protected page and trigger the login redirect if not signed in.
        # 🗂️ My Memes button
        elem = page.get_by_role('button', name='My Memes', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '🗂️ My Memes' button on the homepage to attempt to open the protected page and trigger the login redirect.
        # 🗂️ My Memes button
        elem = page.get_by_role('button', name='My Memes', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '🗂️ My Memes' button on the homepage to open the protected page and trigger the login redirect if not signed in.
        # 🗂️ My Memes button
        elem = page.get_by_role('button', name='My Memes', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the 'My Memes' protected page and verify the login page is shown (confirm that protected content is not accessible while signed out).
        # Open URL in new tab
        page = await context.new_page()
        await page.goto("http://localhost:3000/my-memes")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # --> Assertions to verify final state
        
        # --> Verify the login page is shown
        # Assert: The URL contains 'login', indicating the login page is shown.
        await expect(page).to_have_url(re.compile("login"), timeout=15000), "The URL contains 'login', indicating the login page is shown."
        await page.locator("xpath=/html/body/div[2]/form/label[1]/input").nth(0).scroll_into_view_if_needed()
        # Assert: The Email input is visible on the login page.
        await expect(page.locator("xpath=/html/body/div[2]/form/label[1]/input").nth(0)).to_be_visible(timeout=15000), "The Email input is visible on the login page."
        await page.locator("xpath=/html/body/div[2]/form/label[2]/input").nth(0).scroll_into_view_if_needed()
        # Assert: The Password input is visible on the login page.
        await expect(page.locator("xpath=/html/body/div[2]/form/label[2]/input").nth(0)).to_be_visible(timeout=15000), "The Password input is visible on the login page."
        await page.locator("xpath=/html/body/div[2]/form/button").nth(0).scroll_into_view_if_needed()
        # Assert: The Log in submit button is visible on the login page.
        await expect(page.locator("xpath=/html/body/div[2]/form/button").nth(0)).to_be_visible(timeout=15000), "The Log in submit button is visible on the login page."
        
        # --> Verify protected content is not accessible
        # Assert: The Email label is visible on the login page, showing protected content is not accessible.
        await expect(page.locator("xpath=/html/body/div[2]/form/label[1]").nth(0)).to_have_text("Email", timeout=15000), "The Email label is visible on the login page, showing protected content is not accessible."
        # Assert: The Password label is visible on the login page, showing protected content is not accessible.
        await expect(page.locator("xpath=/html/body/div[2]/form/label[2]").nth(0)).to_have_text("Password", timeout=15000), "The Password label is visible on the login page, showing protected content is not accessible."
        # Assert: The Log in button is visible on the login page, showing protected content is not accessible.
        await expect(page.locator("xpath=/html/body/div[2]/form/button").nth(0)).to_have_text("Log in", timeout=15000), "The Log in button is visible on the login page, showing protected content is not accessible."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    