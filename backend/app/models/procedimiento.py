from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class Procedimiento(Base):
    __tablename__ = "procedimientos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False, unique=True)
    precio_base = Column(Float, default=0.0, nullable=False)
    descripcion = Column(String(255), nullable=True)