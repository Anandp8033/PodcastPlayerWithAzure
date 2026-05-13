# app/api/podcast.py

from fastapi import APIRouter, UploadFile, File, Form, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.services.podcast_service import handle_podcast_upload
from app.models.podcast import Podcast

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def serialize_podcast(p: Podcast) -> dict:
    """Serialize podcast model to dict"""
    return {
        "id": p.id,
        "episodeNumber": p.episode_number,
        "title": p.title,
        "subtitle": p.subtitle,
        "image": p.image,
        "audioSrc": p.audio_src,
        "duration": p.duration,
        "date": p.date,
        "subtitles": p.subtitles
    }


@router.get("")
async def get_podcasts(
    page: int = Query(0, description="Page number (0-based)"),
    size: int = Query(7, description="Number of items per page")
):
    """Get podcasts with pagination (0-based indexing)"""
    db = next(get_db())
    try:
        total = db.query(Podcast).count()
        offset = page * size
        podcasts = db.query(Podcast).order_by(Podcast.id).offset(offset).limit(size).all()
        
        return {
            "podcasts": [serialize_podcast(p) for p in podcasts],
            "total": total,
            "page": page,
            "size": size,
            "totalPages": (total + size - 1) // size
        }
    finally:
        db.close()


@router.get("/latest")
async def get_latest_podcasts():
    """Get the latest podcasts (most recent by id) - no parameters required"""
    db = next(get_db())
    try:
        # Get most recent podcasts (highest id first = latest), default 7
        podcasts = db.query(Podcast).order_by(Podcast.id.desc()).limit(7).all()
        
        return {
            "podcasts": [serialize_podcast(p) for p in podcasts],
            "count": len(podcasts)
        }
    finally:
        db.close()


@router.post("/upload")
async def upload_podcast(
    # files
    audio: UploadFile = File(...),
    image: UploadFile = File(...),

    subtitle_en: UploadFile = File(None),
    subtitle_de: UploadFile = File(None),
    subtitle_es: UploadFile = File(None),
    subtitle_fr: UploadFile = File(None),

    # fields
    title: str = Form(...),
    episode_number: int = Form(...),
    subtitle: str = Form(...),

    db: Session = Depends(get_db)
):
    # Build form dict for service
    form = {
        "title": title,
        "episode_number": episode_number,
        "subtitle": subtitle
    }

    # Build files dict with audio and image
    class FilesDict:
        def __init__(self):
            self._files = {"audio": audio, "image": image}
            self._subtitles = []
            if subtitle_en: self._subtitles.append(subtitle_en)
            if subtitle_de: self._subtitles.append(subtitle_de)
            if subtitle_es: self._subtitles.append(subtitle_es)
            if subtitle_fr: self._subtitles.append(subtitle_fr)
        
        def __getitem__(self, key):
            return self._files.get(key)
        
        def getlist(self, key):
            if key == "subtitle_files":
                return self._subtitles
            return []

    files = FilesDict()

    # Call the service function
    return handle_podcast_upload(db, form, files)

   