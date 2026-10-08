from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.procedimiento import Procedimiento
from app.models.receta import RecetaProcedimiento
from app.schemas.procedimiento import (
    ProcedimientoCreate, 
    ProcedimientoUpdate, 
    ProcedimientoResponse
)

router = APIRouter(prefix="/api/procedimientos", tags=["Procedimientos"])

@router.get("/", response_model=List[ProcedimientoResponse])
def listar_procedimientos(
    q: Optional[str] = Query(None, description="Buscar procedimiento"),
    db: Session = Depends(get_db)
):
    query = db.query(Procedimiento)
    if q:
        termino = f"%{q.strip()}%"
        query = query.filter(
            (Procedimiento.nombre.ilike(termino)) | 
            (Procedimiento.descripcion.ilike(termino))
        )
    return query.order_by(Procedimiento.nombre.asc()).all()

@router.post("/", response_model=ProcedimientoResponse, status_code=201)
def crear_procedimiento(
    payload: ProcedimientoCreate,
    db: Session = Depends(get_db)
):
    existente = db.query(Procedimiento).filter(
        Procedimiento.nombre.ilike(payload.nombre.strip())
    ).first()
    
    if existente:
        raise HTTPException(
            status_code=400, 
            detail=f"Ya existe un procedimiento con el nombre '{payload.nombre}'."
        )

    nuevo = Procedimiento(
        nombre=payload.nombre.strip(),
        precio_base=payload.precio_base,
        descripcion=payload.descripcion.strip() if payload.descripcion else None
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.patch("/{procedimiento_id}", response_model=ProcedimientoResponse)
def actualizar_procedimiento(
    procedimiento_id: int,
    payload: ProcedimientoUpdate,
    db: Session = Depends(get_db)
):
    proc = db.query(Procedimiento).filter(Procedimiento.id == procedimiento_id).first()
    if not proc:
        raise HTTPException(status_code=404, detail="Procedimiento no encontrado.")

    if payload.nombre and payload.nombre.strip().lower() != proc.nombre.lower():
        nombre_repetido = db.query(Procedimiento).filter(
            Procedimiento.nombre.ilike(payload.nombre.strip()),
            Procedimiento.id != procedimiento_id
        ).first()
        if nombre_repetido:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe otro procedimiento con el nombre '{payload.nombre}'."
            )
        proc.nombre = payload.nombre.strip()

    if payload.precio_base is not None:
        proc.precio_base = payload.precio_base

    if payload.descripcion is not None:
        proc.descripcion = payload.descripcion.strip() if payload.descripcion else None

    db.commit()
    db.refresh(proc)
    return proc

@router.delete("/{procedimiento_id}")
def eliminar_procedimiento(
    procedimiento_id: int,
    db: Session = Depends(get_db)
):
    proc = db.query(Procedimiento).filter(Procedimiento.id == procedimiento_id).first()
    if not proc:
        raise HTTPException(status_code=404, detail="Procedimiento no encontrado.")

    # Protección de integridad: no borrar si ya fue registrado en consultas previas
    en_uso = db.query(RecetaProcedimiento).filter(
        RecetaProcedimiento.procedimiento_id == procedimiento_id
    ).first()
    if en_uso:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar este procedimiento porque ya tiene historial de recetas médicas asociadas. Puedes modificar su nombre o precio en su lugar."
        )

    db.delete(proc)
    db.commit()
    return {"mensaje": "Procedimiento eliminado exitosamente", "id": procedimiento_id}