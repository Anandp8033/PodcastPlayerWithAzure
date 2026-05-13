from sqlalchemy.orm import Session
from app.models.admin import Admin

def get_admin_by_email(db: Session, email: str):
    return db.query(Admin).filter(Admin.email == email).first()

def create_admin(db: Session, email: str, hashed_password: str, full_name: str = None):
    admin = Admin(email=email, hashed_password=hashed_password, full_name=full_name)
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin