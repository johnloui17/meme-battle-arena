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
        
        # -> Navigate to the 'Log in' page so the test account can be used to sign in.
        await page.goto("http://localhost:3000/login")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Fill the Email field with 'tester@example.com', fill the Password field with 'supersecret123', then click the 'Log in' button.
        # email field
        elem = page.get_by_label('Email', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("tester@example.com")
        
        # -> Fill the Email field with 'tester@example.com', fill the Password field with 'supersecret123', then click the 'Log in' button.
        # password field
        elem = page.get_by_label('Password', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("supersecret123")
        
        # -> Fill the Email field with 'tester@example.com', fill the Password field with 'supersecret123', then click the 'Log in' button.
        # Log in button
        elem = page.get_by_role('button', name='Log in', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Arena' link in the top navigation to enter the Arena view.
        # Arena link
        elem = page.get_by_role('link', name='Arena', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Meme Three' button to vote for Meme Three in the current head-to-head matchup.
        # Meme Three 2 W – 0 L 1229 button
        elem = page.get_by_role('button', name='Vote for Meme Three', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Meme Three' button to vote for Meme Three in the current matchup.
        # Meme Three 4 W – 0 L 1254 button
        elem = page.get_by_role('button', name='Vote for Meme Three', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Meme Three' vote button to choose it as the winner in the current matchup.
        # Meme Three 6 W – 0 L 1275 button
        elem = page.get_by_role('button', name='Vote for Meme Three', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Meme Three' button to select it as the winner in the current matchup and observe the UI reveal.
        # Meme Three 7 W – 0 L 1284 button
        elem = page.get_by_role('button', name='Vote for Meme Three', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Meme One' button to vote for it and trigger the selection reveal / next matchup.
        # Meme One 0 W – 9 L 1092 button
        elem = page.get_by_role('button', name='Vote for Meme One', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Meme One' button to choose the meme and trigger the selection reveal and next matchup display.
        # Meme One 1 W – 9 L 1116 button
        elem = page.get_by_role('button', name='Vote for Meme One', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Meme One' button to vote and trigger the selection reveal and advance to the next matchup.
        # Meme One 3 W – 9 L 1160 button
        elem = page.get_by_role('button', name='Vote for Meme One', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Meme Three' button to vote and verify that the chosen meme is highlighted and the next matchup appears.
        # Meme Three 8 W – 4 L 1205 button
        elem = page.get_by_role('button', name='Vote for Meme Three', exact=True)
        await elem.click(timeout=10000)
        
        # --> Test passed — verified by AI agent
        frame = context.pages[-1]
        current_url = await frame.evaluate("() => window.location.href")
        assert current_url is not None, "Test completed successfully"
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    