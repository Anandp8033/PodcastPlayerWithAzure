# app/models/podcast.py

from sqlalchemy import Column, Integer, String, JSON
from app.db.database import Base

class Podcast(Base):
    __tablename__ = "podcasts"

    id = Column(Integer, primary_key=True, index=True)
    episode_number = Column(Integer)
    title = Column(String(255))
    subtitle = Column(String(255))
    image = Column(String(500))
    duration = Column(String(50))
    date = Column(String(50))
    audio_src = Column(String(500))
    subtitles = Column(JSON)  # { "en": "...", "de": "..." }