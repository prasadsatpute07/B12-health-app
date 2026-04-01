import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routers import scoring, trends

load_dotenv()

app = FastAPI(
    title="B12 Health Tracker — Scoring Service",
    description="Rule-based B12 deficiency risk engine. Data stored for future ML training.",
    version="1.0.0",
)

# Allow requests from the Node.js service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Restrict to Node service URL in production
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ── Routers ──
app.include_router(scoring.router, tags=["Scoring"])
app.include_router(trends.router, tags=["Trends"])

@app.get("/health", tags=["Health"])
def health():
    return {
        "success": True,
        "service": "B12 Health Tracker — Python Scoring API",
        "version": "1.0.0",
        "status": "healthy",
    }
