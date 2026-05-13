from app.crud.admin import get_admin_by_email, create_admin
from app.core.security import hash_password, verify_password, create_token
from fastapi import HTTPException

def register_admin(db, admin_data):
    if get_admin_by_email(db, admin_data.email):
        raise HTTPException(status_code=400, detail="Admin already exists")

    return create_admin(db, admin_data.email, hash_password(admin_data.password), admin_data.full_name)

def login_admin(db, admin_data):
    admin = get_admin_by_email(db, admin_data.email)

    if not admin or not verify_password(admin_data.password, admin.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return create_token({"sub": admin.email, "role": "admin"})