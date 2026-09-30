from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Paciente(Base):
    __tablename__ = "pacientes"

    id = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(150), nullable=False, index=True)
    telefono = Column(String(20), index=True, nullable=True)
    email = Column(String(120), nullable=True)
    nota_fija = Column(Text, nullable=True)
    saldo_monedero = Column(Float, default=0.0)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

    recetas = relationship("Receta", back_populates="paciente")
    