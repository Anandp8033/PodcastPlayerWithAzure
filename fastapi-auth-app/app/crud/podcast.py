# app/crud/podcast.py

from sqlalchemy.orm import Session
from app.models.podcast import Podcast

def create_podcast(db: Session, data: dict = None, **kwargs):
    if data is None:
        data = kwargs
    else:
        data = {**data, **kwargs}

    podcast = Podcast(**data)
    db.add(podcast)
    db.commit()
    db.refresh(podcast)
    return podcast