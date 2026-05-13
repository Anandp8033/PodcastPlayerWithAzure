from azure.core.exceptions import ResourceExistsError
from azure.storage.blob import BlobServiceClient
import os
from fastapi import UploadFile
import uuid

connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
if not connection_string:
    raise ValueError("AZURE_STORAGE_CONNECTION_STRING is not set")

blob_service_client = BlobServiceClient.from_connection_string(connection_string)


def get_container_client(container_name: str):
    if not container_name:
        raise ValueError("Azure container name is required")

    container_client = blob_service_client.get_container_client(container_name)
    try:
        container_client.create_container()
    except ResourceExistsError:
        pass
    return container_client


def upload_file(file: UploadFile, container_name: str):
    if file is None or file.filename is None:
        raise ValueError("Upload file and filename are required")

    file_extension = file.filename.split(".")[-1]
    file_name_without_ext = file.filename.rsplit(".", 1)[0]
    unique_name = f"{file_name_without_ext}_{uuid.uuid4()}.{file_extension}"

    container_client = get_container_client(container_name)
    blob_client = container_client.get_blob_client(unique_name)

    file.file.seek(0)
    blob_client.upload_blob(file.file, overwrite=True)

    return blob_client.url

def upload_subtitle_file(file: UploadFile, container_name: str, folder: str = None):
    if file is None or file.filename is None:
        raise ValueError("Upload file and filename are required")

    file_extension = file.filename.split(".")[-1]
    file_name_without_ext = file.filename.rsplit(".", 1)[0]

    # ✅ keep original lang filename OR randomize based on your need
    if folder:
        blob_name = f"{folder}/{file_name_without_ext}.{file_extension}"
    else:
        unique_name = f"{file_name_without_ext}_{uuid.uuid4()}.{file_extension}"
        blob_name = unique_name

    container_client = get_container_client(container_name)
    blob_client = container_client.get_blob_client(blob_name)

    file.file.seek(0)
    blob_client.upload_blob(file.file, overwrite=True)

    return blob_client.url