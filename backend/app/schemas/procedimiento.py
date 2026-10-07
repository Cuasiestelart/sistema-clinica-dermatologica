from pydantic import BaseModel, ConfigDict
from typing import Optional

class ProcedimientoBase(BaseModel):
    nombre: str
    precio_base: float = 0.0
    descripcion: Optional[str] = None

class ProcedimientoCreate(ProcedimientoBase):
    pass

class ProcedimientoUpdate(BaseModel):
    nombre: Optional[str] = None
    precio_base: Optional[float] = None
    descripcion: Optional[str] = None

class ProcedimientoResponse(ProcedimientoBase):
    id: int

    model_config = ConfigDict(from_attributes=True)