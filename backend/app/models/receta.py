from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
from zoneinfo import ZoneInfo

def obtener_hora_mexico():
    return datetime.now(ZoneInfo("America/Mexico_City"))

class Receta(Base):
    __tablename__ = "recetas"
    
    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False)
    # Cambiamos server_default por default=obtener_hora_mexico:
    fecha = Column(DateTime, default=obtener_hora_mexico)
    diagnostico = Column(Text, nullable=True)
    proxima_cita = Column(String(50), nullable=True)

    # Honorarios y descuentos de la consulta médica
    costo_consulta = Column(Float, default=800.0)
    descuento_porcentaje = Column(Float, default=0.0)
    descuento_motivo = Column(String(100), nullable=True)
    total_consulta = Column(Float, default=800.0)

    paciente = relationship("Paciente", back_populates="recetas")
    detalles = relationship("RecetaDetalle", back_populates="receta", cascade="all, delete-orphan")

class RecetaDetalle(Base):
    __tablename__ = "receta_detalles"

    id = Column(Integer, primary_key=True, index=True)
    receta_id = Column(Integer, ForeignKey("recetas.id", ondelete="CASCADE"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad = Column(Integer, default=1)
    indicaciones = Column(Text, nullable=False)

    receta = relationship("Receta", back_populates="detalles")
    producto = relationship("Producto")