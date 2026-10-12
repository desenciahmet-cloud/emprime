import os
import json
import uuid
from typing import Optional
from fastapi import FastAPI, Request, Form, File, UploadFile, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware

app = FastAPI(title="Emprime Baskı & Renk Ayrımı Stüdyosu")

# 1. High-speed GZIP compression
app.add_middleware(GZipMiddleware, minimum_size=800)

# 2. Performance Caching
@app.middleware("http")
async def add_cache_headers(request, call_next):
    response = await call_next(request)
    path = request.url.path
    if path.startswith("/static"):
        response.headers["Cache-Control"] = "public, max-age=604800, stale-while-revalidate=86400"
    elif path == "/" or path.endswith(".html"):
        response.headers["Cache-Control"] = "no-cache, must-revalidate"
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
UPLOAD_DIR = os.path.join(BASE_DIR, "static", "uploads", "emprime")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    ico_path = os.path.join(BASE_DIR, "static", "img", "favicon.ico")
    if os.path.exists(ico_path):
        return FileResponse(ico_path, media_type="image/x-icon")
    fav_path = os.path.join(BASE_DIR, "static", "img", "favicon.svg")
    return FileResponse(fav_path, media_type="image/svg+xml")

# --- Web Pages ---

@app.get("/", response_class=HTMLResponse)
async def home_page(request: Request):
    return templates.TemplateResponse("index.html", {
        "request": request,
        "active_page": "home"
    })

@app.get("/hakkimizda", response_class=HTMLResponse)
async def about_page(request: Request):
    return templates.TemplateResponse("hakkimizda.html", {
        "request": request,
        "active_page": "about"
    })

# --- API Endpoints ---

@app.post("/api/upload-emprime")
async def upload_emprime_design(file: UploadFile = File(...)):
    try:
        allowed_extensions = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".psd", ".ai", ".pdf"}
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in allowed_extensions:
            return JSONResponse(status_code=400, content={"success": False, "error": f"Desteklenmeyen dosya türü ({ext})."})
        
        file_id = str(uuid.uuid4())[:8]
        safe_name = f"emp_{file_id}_{file.filename.replace(' ', '_')}"
        save_path = os.path.join(UPLOAD_DIR, safe_name)
        
        with open(save_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
            
        return {
            "success": True,
            "filename": safe_name,
            "file_url": f"/static/uploads/emprime/{safe_name}",
            "file_size": len(content)
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

@app.post("/api/quote")
async def calculate_quote(
    color_count: int = Form(...),
    delivery_type: str = Form(...), # "digital" or "film"
    film_size: Optional[str] = Form("A3"), # "A4", "A3", "A2"
    technique: Optional[str] = Form("su-bazli")
):
    # Pricing formula
    base_digital_per_color = 120
    film_rates = {"A4": 80, "A3": 140, "A2": 260}
    
    separation_price = color_count * base_digital_per_color
    film_price = (color_count * film_rates.get(film_size, 140)) if delivery_type == "film" else 0
    total = separation_price + film_price
    
    return {
        "color_count": color_count,
        "delivery_type": delivery_type,
        "film_size": film_size,
        "separation_price": separation_price,
        "film_price": film_price,
        "total_price": total
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8002, reload=True)
