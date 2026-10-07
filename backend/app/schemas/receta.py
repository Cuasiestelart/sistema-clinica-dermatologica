from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.producto import ProductoOut
from app.schemas.paciente import PacienteOut
from app.schemas.procedimiento import ProcedimientoResponse

# Detalle de medicamentos
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

    model_config = ConfigDict(from_attributes=True)

# Detalle de procedimientos realizados
class RecetaProcedimientoCreate(BaseModel):
    procedimiento_id: int
    precio_cobrado: Optional[float] = None  # Si viene None, toma el precio_base del catálogo
    notas: Optional[str] = None

class RecetaProcedimientoOut(BaseModel):
    id: int
    procedimiento_id: int
    precio_cobrado: float
    notas: Optional[str] = None
    procedimiento: ProcedimientoResponse

    model_config = ConfigDict(from_attributes=True)

# Receta general
class RecetaBase(BaseModel):
    paciente_id: int
    diagnostico: Optional[str] = None
    proxima_cita: Optional[str] = None
    costo_consulta: Optional[float] = 800.0
    descuento_porcentaje: Optional[float] = 0.0
    descuento_motivo: Optional[str] = None
    total_consulta: Optional[float] = None

class RecetaCreate(RecetaBase):
    detalles: List[RecetaDetalleCreate] = []
    procedimientos: List[RecetaProcedimientoCreate] = []

class RecetaOut(RecetaBase):
    id: int
    fecha: datetime
    paciente: PacienteOut
    detalles: List[RecetaDetalleOut] = []
    procedimientos: List[RecetaProcedimientoOut] = []

    model_config = ConfigDict(from_attributes=True)