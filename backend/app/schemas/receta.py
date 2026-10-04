from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.schemas.producto import ProductoOut
from app.schemas.paciente import PacienteOut

class RecetaDetalleCreate(BaseModel):
    producto_id: int
    cantidad: int = 1
    indicaciones: str

class RecetaDetalleOut(BaseModel):
    id: int
    producto_id: int
    cantidad: int
    indicaciones: str
    producto: ProductoOut

    class Config:
        from_attributes = True

class RecetaBase(BaseModel):
    paciente_id: int
    diagnostico: Optional[str] = None
    proxima_cita: Optional[str] = None
    costo_consulta: Optional[float] = 800.0
    descuento_porcentaje: Optional[float] = 0.0
    descuento_motivo: Optional[str] = None
    total_consulta: Optional[float] = 800.0

class RecetaCreate(RecetaBase):
    detalles: List[RecetaDetalleCreate] = []

class RecetaOut(RecetaBase):
    id: int
    fecha: datetime
    paciente: PacienteOut
    detalles: List[RecetaDetalleOut] = []

    class Config:
        from_attributes = True