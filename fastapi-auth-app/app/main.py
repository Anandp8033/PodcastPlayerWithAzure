# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# from fastapi.staticfiles import StaticFiles
from app.api import auth, admin
from app.db.database import Base, engine
from app.api import podcast
import os

# Import models so Base.metadata knows about them
from app.models import User, Admin, Podcast

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI()


# ✅ Serve uploads folder
# app.mount(
#     "/uploads",
#     StaticFiles(directory="uploads"),
#     name="uploads"
# )


# Configure CORS to allow requests from frontend
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS", 
    "http://localhost:3000,http://localhost:3001,http://localhost:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(podcast.router, prefix="/podcast", tags=["podcast"])