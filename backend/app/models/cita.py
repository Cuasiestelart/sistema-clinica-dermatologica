from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Cita(Base):
    __tablename__ = "citas"

    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False)
    profesional = Column(String(50), nullable=False)
    fecha_hora = Column(DateTime, nullable=False, index=True)
    motivo = Column(String(200), nullable=True)
    estado = Column(String(30), nullable=False, default="agendada")
    notas = Column(Text, nullable=True)

    paciente = relationship("Paciente")