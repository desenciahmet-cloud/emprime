import asyncio
import os
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        
        # 1. Desktop Check
        page = await b.new_page(viewport={"width": 1280, "height": 900})
        await page.goto("http://127.0.0.1:8016/#fiyat-tablosu", wait_until="networkidle")
        await page.wait_for_timeout(600)
        
        # Screenshot the price table
        table_el = page.locator("#fiyat-tablosu")
        desktop_shot = "C:/Users/user/.gemini/antigravity/brain/776a1e7f-45ba-411e-a13d-a67503f8911b/emprime_pricing_desktop.png"
        await table_el.screenshot(path=desktop_shot)
        print("Desktop price table screenshot saved:", desktop_shot)
        
        # Test calculator
        await page.goto("http://127.0.0.1:8016/#hesaplayici", wait_until="networkidle")
        await page.wait_for_timeout(500)
        
        # Initial price should be 260 TL
        price_text = await page.locator("#calculatedEmpPrice").text_content()
        print("Initial calculated price:", price_text)
        assert "260" in price_text
        
        # Select film cargo by clicking label
        await page.locator('label:has(input[value="film_cargo"])').click()
        await page.wait_for_timeout(400)
        price_with_a3 = await page.locator("#calculatedEmpPrice").text_content()
        print("Price with A3 film (260 + 340 = 600 TL):", price_with_a3)
        assert "600" in price_with_a3
        
        # Select A0 film by clicking label
        await page.locator('label:has(input[value="A0"])').click()
        await page.wait_for_timeout(400)
        price_with_a0 = await page.locator("#calculatedEmpPrice").text_content()
        print("Price with A0 film (260 + 900 = 1160 TL):", price_with_a0)
        assert "1.160" in price_with_a0 or "1160" in price_with_a0
        
        calc_shot = "C:/Users/user/.gemini/antigravity/brain/776a1e7f-45ba-411e-a13d-a67503f8911b/emprime_calculator.png"
        await page.locator(".bg-slate-900.rounded-3xl").first.screenshot(path=calc_shot)
        print("Calculator screenshot saved:", calc_shot)
        
        # 2. Mobile Check (iPhone 14)
        mob_page = await b.new_page(viewport={"width": 390, "height": 844})
        await mob_page.goto("http://127.0.0.1:8016/#fiyat-tablosu", wait_until="networkidle")
        await mob_page.wait_for_timeout(600)
        mob_shot = "C:/Users/user/.gemini/antigravity/brain/776a1e7f-45ba-411e-a13d-a67503f8911b/emprime_pricing_mobile.png"
        await mob_page.locator("#fiyat-tablosu").screenshot(path=mob_shot)
        print("Mobile price table screenshot saved:", mob_shot)
        
        await b.close()
        print("ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(run())
