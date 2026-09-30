import unicodedata
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.producto import Producto
from app.models.etiqueta import Etiqueta
from app.schemas.producto import ProductoOut, ProductoCreate, ProductoUpdate

router = APIRouter(prefix="/api/productos", tags=["Productos"])

def limpiar_termino(termino: str) -> str:
    nfkd = unicodedata.normalize('NFKD', termino)
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower()

@router.get("/", response_model=List[ProductoOut])
def listar_o_buscar(q: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Producto).filter(Producto.activo == True)
    if q and q.strip():
        termino = f"%{limpiar_termino(q.strip())}%"
        query = query.filter(
            func.sin_acentos(Producto.nombre).like(termino) | 
            func.sin_acentos(Producto.sku).like(termino) |
            func.sin_acentos(Producto.activo_dermatologico).like(termino)
        )
    return query.all()

@router.get("/{producto_id}/sustitutos", response_model=List[ProductoOut])
def obtener_sustitutos(producto_id: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    etiquetas_ids = [e.id for e in producto.etiquetas]
    if not etiquetas_ids:
        return []

    coincidencia_minima = 2 if len(etiquetas_ids) >= 2 else 1

    sustitutos = (
        db.query(Producto)
        .join(Producto.etiquetas)
        .filter(
            Producto.id != producto_id,
            Producto.stock_actual > 0,
            Etiqueta.id.in_(etiquetas_ids)
        )
        .group_by(Producto.id)
        .having(func.count(Etiqueta.id) >= coincidencia_minima)
        .order_by(func.count(Etiqueta.id).desc())
        .limit(4)
        .all()
    )
    return sustitutos

@router.post("/", response_model=ProductoOut, status_code=201)
def crear_producto(producto_in: ProductoCreate, db: Session = Depends(get_db)):
    # Extraemos etiquetas para manejarlas aparte y no romper la instanciación del modelo
    datos = producto_in.model_dump(exclude={"etiqueta_ids"})
    nuevo_producto = Producto(**datos)
    
    if producto_in.etiqueta_ids:
        etiquetas = db.query(Etiqueta).filter(Etiqueta.id.in_(producto_in.etiqueta_ids)).all()
        nuevo_producto.etiquetas = etiquetas

    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)
    return nuevo_producto

@router.put("/{producto_id}", response_model=ProductoOut)
def actualizar_producto(producto_id: int, producto_in: ProductoUpdate, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    datos_actualizar = producto_in.model_dump(exclude_unset=True)
    
    # Manejar actualización opcional de etiquetas si se envían
    if "etiqueta_ids" in datos_actualizar:
        etiquetas_ids = datos_actualizar.pop("etiqueta_ids")
        if etiquetas_ids is not None:
            etiquetas = db.query(Etiqueta).filter(Etiqueta.id.in_(etiquetas_ids)).all()
            producto.etiquetas = etiquetas

    for clave, valor in datos_actualizar.items():
        setattr(producto, clave, valor)

    db.commit()
    db.refresh(producto)
    return producto