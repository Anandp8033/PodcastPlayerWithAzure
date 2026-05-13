from pydantic import BaseModel, EmailStr

class AdminCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class AdminLogin(BaseModel):
    email: EmailStr
    password: str