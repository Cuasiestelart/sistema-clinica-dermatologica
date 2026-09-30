from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

producto_etiquetas = Table(
    "producto_etiquetas",
    Base.metadata,
    Column("producto_id", Integer, ForeignKey("productos.id", ondelete="CASCADE"), primary_key=True),
    Column("etiqueta_id", Integer, ForeignKey("etiquetas.id", ondelete="CASCADE"), primary_key=True)
)

class Etiqueta(Base):
    __tablename__ = "etiquetas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(80), nullable=False)
    slug = Column(String(80), unique=True, index=True, nullable=False)

    productos = relationship("Producto", secondary=producto_etiquetas, back_populates="etiquetas")