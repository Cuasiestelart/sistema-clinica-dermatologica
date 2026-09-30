from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    marca_id = Column(Integer, ForeignKey("marcas.id"), nullable=True)
    sku = Column(String(50), unique=True, index=True, nullable=True)
    nombre = Column(String(150), nullable=False, index=True)
    activo_dermatologico = Column(String(100), nullable=True)
    precio_base = Column(Float, nullable=False)
    stock_actual = Column(Integer, default=0)
    stock_minimo = Column(Integer, default=2)
    activo = Column(Boolean, default=True)
    ubicacion = Column(String, nullable=True)

    marca = relationship("Marca", back_populates="productos")
    etiquetas = relationship("Etiqueta", secondary="producto_etiquetas", back_populates="productos")