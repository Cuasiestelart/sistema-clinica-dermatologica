from sqlalchemy import Column, Integer, String, Float, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Marca(Base):
    __tablename__ = "marcas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, nullable=False)
    descuento_porcentaje = Column(Float, default=0.0)
    activo = Column(Boolean, default=True)

    productos = relationship("Producto", back_populates="marca")