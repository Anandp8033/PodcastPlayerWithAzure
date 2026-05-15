# app/services/podcast_service.py
import os
import uuid

from app.services.azure_blob_service import upload_file, upload_subtitle_file
from datetime import datetime
from mutagen.mp3 import MP3
from app.crud.podcast import create_podcast

# UPLOAD_DIR = "uploads"

# def save_file(file: UploadFile, folder: str):
#     os.makedirs(f"{UPLOAD_DIR}/{folder}", exist_ok=True)

#     file_path = f"{UPLOAD_DIR}/{folder}/{file.filename}"

#     with open(file_path, "wb") as f:
#         shutil.copyfileobj(file.file, f)

#     return file_path


# def get_audio_duration(path):
#     print(f"DEBUG: Getting audio duration for: {path}", flush=True)
#     try:
#         audio = MP3(path)
#         seconds = int(audio.info.length)
#         print(f"Audio duration: {seconds} seconds", flush=True)
#         return f"{seconds//60}m {seconds%60}s"
#     except Exception as e:
#         print(f"ERROR getting audio duration: {e}", flush=True)
#         return "0m"

def get_audio_duration_from_stream(file_stream):
    """Get audio duration from file stream (not path)"""
    print(f"DEBUG: Getting audio duration from stream", flush=True)
    try:
        audio = MP3(file_stream)
        seconds = int(audio.info.length)
        print(f"Audio duration: {seconds} seconds", flush=True)
        return f"{seconds//60}m {seconds%60}s"
    except Exception as e:
        print(f"ERROR getting audio duration: {e}", flush=True)
        return "0m"

# def handle_podcast_upload(db, form, files):
#     # save files
#     audio_path = save_file(files["audio"], "audio")
#     image_path = save_file(files["image"], "images")

#     # subtitles
#     saved_subtitles = {}

#     for file in files.getlist("subtitle_files"):
#         path = save_file(file, "subtitles")
#         lang = file.filename.split("_")[-1].split(".")[0]
#         saved_subtitles[lang] = path

#     # auto fields
#     duration = get_audio_duration(audio_path)
#     print(f"Audio duration: {duration}", flush=True)
#     date = datetime.utcnow().strftime("%Y-%m-%d")

#     # final data
#     data = {
#         "title": form["title"],
#         "episode_number": int(form["episode_number"]),
#         "subtitle": form["subtitle"],
#         "image": image_path,
#         "audio_src": audio_path,
#         "duration": duration,
#         "date": date,
#         "subtitles": saved_subtitles
#     }

#     return create_podcast(db, data)


def handle_podcast_upload(db, form, files):

     # Get duration BEFORE uploading (while file stream is available)
    duration = get_audio_duration_from_stream(files["audio"].file)
    files["audio"].file.seek(0)  # Reset stream for upload

    audio_url = upload_file(
        files["audio"],
        os.getenv("AZURE_CONTAINER_AUDIO")
    )

    image_url = upload_file(
        files["image"],
        os.getenv("AZURE_CONTAINER_IMAGE")
    )
    Sub_folder_name = f"podcast_{uuid.uuid4()}"
    subtitle_urls = {}
    for subtitle_file in files.getlist("subtitle_files"):
        lang = subtitle_file.filename.split("_")[-1].split(".")[0]
        subtitle_urls[lang] = upload_subtitle_file(
            subtitle_file,
            os.getenv("AZURE_CONTAINER_SUBTITLE"),
            folder=Sub_folder_name + "_" + f"{form['episode_number']}"
        )
     
    date = datetime.utcnow().strftime("%Y-%m-%d")


    # save in DB (IMPORTANT)
    return create_podcast(
        db,
        audio_src=audio_url,
        image=image_url,
        subtitles=subtitle_urls or None,
        title=form["title"],
        episode_number=form["episode_number"],
        duration=duration,
        date=date,
        subtitle=form["subtitle"]
    )
