from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Propiedades base compartidas
class CitaBase(BaseModel):
    paciente_id: int
    profesional: str  # Obligatorio: debe ser "Dermatología" o "Cosmetología"
    fecha_hora: datetime
    motivo: Optional[str] = None
    notas: Optional[str] = None

# Payload recibido para crear una cita (POST /api/citas/)
class CitaCreate(CitaBase):
    pass

# Payload recibido para actualizar estado o detalles (PATCH /api/citas/{id})
class CitaUpdate(BaseModel):
    profesional: Optional[str] = None
    fecha_hora: Optional[datetime] = None
    motivo: Optional[str] = None
    estado: Optional[str] = None
    notas: Optional[str] = None

# Esquema para embeber datos básicos del paciente en la respuesta
class PacienteSimple(BaseModel):
    id: int
    nombre_completo: str
    telefono: Optional[str] = None

    class Config:
        from_attributes = True

# Respuesta devuelta por la API (GET /api/citas/)
class CitaResponse(CitaBase):
    id: int
    estado: str
    paciente: Optional[PacienteSimple] = None

    class Config:
        from_attributes = True