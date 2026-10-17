import asyncio
from playwright.async_api import async_playwright

async def verify():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        
        # 1. Desktop Verification
        page = await b.new_page(viewport={"width": 1280, "height": 900})
        await page.goto("https://emprime.site/#fiyat-tablosu", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        
        table_el = page.locator("#fiyat-tablosu")
        live_desktop_shot = "C:/Users/user/.gemini/antigravity/brain/776a1e7f-45ba-411e-a13d-a67503f8911b/live_emprime_pricing_desktop.png"
        await table_el.screenshot(path=live_desktop_shot)
        print("Live desktop table saved:", live_desktop_shot)
        
        # 2. Mobile Verification (iPhone 14)
        mob_page = await b.new_page(viewport={"width": 390, "height": 844})
        await mob_page.goto("https://emprime.site/#fiyat-tablosu", wait_until="networkidle")
        await mob_page.wait_for_timeout(1000)
        
        live_mobile_shot = "C:/Users/user/.gemini/antigravity/brain/776a1e7f-45ba-411e-a13d-a67503f8911b/live_emprime_pricing_mobile.png"
        await mob_page.locator("#fiyat-tablosu").screenshot(path=live_mobile_shot)
        print("Live mobile table saved:", live_mobile_shot)
        
        # 3. Live Calculator
        await page.goto("https://emprime.site/#hesaplayici", wait_until="networkidle")
        await page.wait_for_timeout(800)
        await page.locator('label:has(input[value="film_cargo"])').click()
        await page.wait_for_timeout(500)
        await page.locator('label:has(input[value="A3"])').click()
        await page.wait_for_timeout(400)
        
        calc_shot = "C:/Users/user/.gemini/antigravity/brain/776a1e7f-45ba-411e-a13d-a67503f8911b/live_emprime_calculator.png"
        await page.locator(".bg-slate-900.rounded-3xl").first.screenshot(path=calc_shot)
        print("Live calculator saved:", calc_shot)
        
        await b.close()
        print("LIVE VERIFICATION COMPLETE!")

if __name__ == "__main__":
    asyncio.run(verify())
