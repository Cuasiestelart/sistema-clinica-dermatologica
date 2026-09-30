from typing import List, Optional
from pydantic import BaseModel

class EtiquetaOut(BaseModel):
    id: int
    nombre: str
    slug: str

    class Config:
        from_attributes = True

class MarcaOut(BaseModel):
    id: int
    nombre: str
    descuento_porcentaje: float

    class Config:
        from_attributes = True

# Schema para CREAR producto
class ProductoCreate(BaseModel):
    sku: Optional[str] = None
    nombre: str
    activo_dermatologico: Optional[str] = None
    precio_base: float
    stock_actual: int = 0
    stock_minimo: int = 2
    activo: bool = True
    ubicacion: Optional[str] = None
    marca_id: Optional[int] = None
    etiqueta_ids: List[int] = []

# Schema para ACTUALIZAR (todos opcionales para permitir cambios parciales)
class ProductoUpdate(BaseModel):
    sku: Optional[str] = None
    nombre: Optional[str] = None
    activo_dermatologico: Optional[str] = None
    precio_base: Optional[float] = None
    stock_actual: Optional[int] = None
    stock_minimo: Optional[int] = None
    activo: Optional[bool] = None
    ubicacion: Optional[str] = None
    marca_id: Optional[int] = None
    etiqueta_ids: Optional[List[int]] = None

class ProductoOut(BaseModel):
    id: int
    sku: Optional[str]
    nombre: str
    activo_dermatologico: Optional[str]
    precio_base: float
    stock_actual: int
    marca: Optional[MarcaOut]
    etiquetas: List[EtiquetaOut] = []
    ubicacion: Optional[str] = None

    class Config:
        from_attributes = True