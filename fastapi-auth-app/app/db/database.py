# app/db/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv


ssl_args = {
    "ssl": {
        "ca": os.path.join(os.getcwd(), "cert", "DigiCertGlobalRootG2.crt.pem")
    }
}


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args=ssl_args
)

SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()