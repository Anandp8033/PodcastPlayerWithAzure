# app/schemas/podcast.py

from pydantic import BaseModel
from typing import Dict

class PodcastCreate(BaseModel):
    title: str
    episode_number: int
    subtitle: str
    subtitles: Dict[str, str]

class PodcastResponse(PodcastCreate):
    id: int
    image: str
    duration: str
    date: str
    audio_src: str

    class Config:
        from_attributes = True