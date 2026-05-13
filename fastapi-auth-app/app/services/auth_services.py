# app/services/auth_service.py
from app.crud.user import get_user_by_email, create_user
from app.core.security import hash_password, verify_password, create_token
from fastapi import HTTPException

def register_user(db, user_data):
    if get_user_by_email(db, user_data.email):
        raise HTTPException(status_code=400, detail="User exists")

    return create_user(db, user_data.email, hash_password(user_data.password), user_data.full_name )

def login_user(db, user_data):
    user = get_user_by_email(db, user_data.email)

    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return create_token({"sub": user.email})