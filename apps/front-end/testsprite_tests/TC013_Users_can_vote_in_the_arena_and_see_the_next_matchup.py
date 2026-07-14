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
        
        # -> Fill the 'Email' field with tester@example.com, fill the 'Password' field with supersecret123, then click the 'Log in' button to submit the form.
        # email field
        elem = page.get_by_label('Email', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("tester@example.com")
        
        # -> Fill the 'Email' field with tester@example.com, fill the 'Password' field with supersecret123, then click the 'Log in' button to submit the form.
        # password field
        elem = page.get_by_label('Password', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("supersecret123")
        
        # -> Fill the 'Email' field with tester@example.com, fill the 'Password' field with supersecret123, then click the 'Log in' button to submit the form.
        # Log in button
        elem = page.get_by_role('button', name='Log in', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Arena' link in the top navigation to open the Arena page.
        # Arena link
        elem = page.get_by_role('link', name='Arena', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Meme Three' vote button to cast a vote in the current matchup.
        # Meme Three 0 W – 0 L 1200 button
        elem = page.get_by_role('button', name='Vote for Meme Three', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Meme Three' vote button to cast a vote in the current matchup.
        # Meme Three 1 W – 0 L 1215 button
        elem = page.get_by_role('button', name='Vote for Meme Three', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Meme Three' vote button to cast a vote in the current matchup.
        # Meme Three 2 W – 0 L 1229 button
        elem = page.get_by_role('button', name='Vote for Meme Three', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Meme Three' vote button to select the winner in the current matchup.
        # Meme Three 3 W – 0 L 1242 button
        elem = page.get_by_role('button', name='Vote for Meme Three', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the chosen meme is highlighted and the reveal is shown
        # Assert: Expected the chosen meme (Meme Three) to be highlighted.
        await expect(page.locator("xpath=/html/body/div[2]/div[2]/div/div[1]/button").nth(0)).to_have_attribute("aria-pressed", "true", timeout=15000), "Expected the chosen meme (Meme Three) to be highlighted."
        # Assert: Expected the reveal to be shown for the matchup.
        await expect(page.locator("xpath=/html/body/div[2]/div[2]/div/div[2]/button").nth(0)).to_have_attribute("data-revealed", "true", timeout=15000), "Expected the reveal to be shown for the matchup."
        
        # --> Verify the next matchup is displayed
        # Assert: Expected 'Meme Three' button to be not visible after advancing to the next matchup.
        await expect(page.locator("xpath=/html/body/div[2]/div[2]/div/div[1]/button").nth(0)).not_to_be_visible(timeout=15000), "Expected 'Meme Three' button to be not visible after advancing to the next matchup."
        # Assert: Expected 'Meme One' button to be not visible after advancing to the next matchup.
        await expect(page.locator("xpath=/html/body/div[2]/div[2]/div/div[2]/button").nth(0)).not_to_be_visible(timeout=15000), "Expected 'Meme One' button to be not visible after advancing to the next matchup."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    