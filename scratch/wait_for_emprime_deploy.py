import urllib.request
import time
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://emprime.site/"
marker = "260 TL"

print(f"Waiting for live deployment with marker '{marker}' on emprime.site...")
for attempt in range(1, 45):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (DeploymentChecker)", "Cache-Control": "no-cache"})
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            content = resp.read().decode('utf-8', errors='ignore')
            if marker in content and "A0 Asetat Film" in content:
                print(f"DEPLOYMENT ACTIVE on attempt {attempt}! (Found marker '260 TL' and 'A0 Asetat Film')")
                break
            else:
                print(f"Attempt {attempt}: New commit not yet live. Waiting 10s...")
    except Exception as e:
        print(f"Attempt {attempt}: Request error: {e}")
    time.sleep(10)
