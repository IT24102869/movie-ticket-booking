from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .settings import settings
from .db import engine, Base
from .routers.movies import router as movies_router
from .routers.showtimes import router as showtimes_router
from .routers.bookings import router as bookings_router
from .routers.admin import router as admin_router
from .routers.uploads import router as uploads_router

app = FastAPI(title="Movie Ticket Booking API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables automatically (MVP)
Base.metadata.create_all(bind=engine)

# Serve uploaded images as static files
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.include_router(movies_router)
app.include_router(showtimes_router)
app.include_router(bookings_router)
app.include_router(admin_router)
app.include_router(uploads_router)

@app.get("/health")
def health():
    return {"ok": True}
