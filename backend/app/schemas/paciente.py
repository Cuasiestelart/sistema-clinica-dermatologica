from typing import Optional
from pydantic import BaseModel

class PacienteBase(BaseModel):
    nombre_completo: str
    telefono: Optional[str] = None
    email: Optional[str] = None
    nota_fija: Optional[str] = None

class PacienteUpdate(BaseModel):
    nombre_completo: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    nota_fija: Optional[str] = None

class PacienteCreate(PacienteBase):
    pass

class PacienteNotaUpdate(BaseModel):
    nota_fija: Optional[str] = None

class PacienteOut(PacienteBase):
    id: int

    class Config:
        from_attributes = True