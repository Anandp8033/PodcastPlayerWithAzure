from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.schemas.admin import AdminCreate, AdminLogin
from app.services.admin_services import register_admin, login_admin

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
def register(admin: AdminCreate, db: Session = Depends(get_db)):
    return register_admin(db, admin)

@router.post("/login")
def login(admin: AdminLogin, db: Session = Depends(get_db)):
    return {"access_token": login_admin(db, admin)}