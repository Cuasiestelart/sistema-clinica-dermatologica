import unicodedata
from pathlib import Path
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# Apunta a: clinica-derma/clinica.db (raíz del proyecto)
DB_PATH = Path(__file__).resolve().parent.parent.parent / "clinica.db"

SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Función para búsqueda insensible a acentos y mayúsculas
def normalizar_texto(texto):
    if texto is None:
        return ""
    nfkd = unicodedata.normalize('NFKD', str(texto))
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower()

@event.listens_for(engine, "connect")
def agregar_funcion_sqlite(dbapi_connection, connection_record):
    dbapi_connection.create_function("sin_acentos", 1, normalizar_texto)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()