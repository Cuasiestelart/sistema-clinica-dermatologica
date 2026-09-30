from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.receta import Receta, RecetaDetalle
from app.models.paciente import Paciente
from app.models.producto import Producto
from app.schemas.receta import RecetaCreate, RecetaOut

router = APIRouter(prefix="/api/recetas", tags=["Recetas"])

@router.post("/", response_model=RecetaOut, status_code=201)
def crear_receta(receta_in: RecetaCreate, db: Session = Depends(get_db)):
    # 1. Validar que el paciente exista
    paciente = db.query(Paciente).filter(Paciente.id == receta_in.paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    if not receta_in.detalles:
        raise HTTPException(status_code=400, detail="La receta debe incluir al menos un producto")

    # 2. Calcular valores seguros de honorarios
    costo = float(receta_in.costo_consulta if receta_in.costo_consulta is not None else 800.0)
    total = float(receta_in.total_consulta if receta_in.total_consulta is not None else costo)
    pct = float(receta_in.descuento_porcentaje or 0.0)

    # 3. Instanciar la receta con todos sus datos clínicos y de honorarios
    nueva_receta = Receta(
        paciente_id=receta_in.paciente_id,
        diagnostico=receta_in.diagnostico,
        proxima_cita=receta_in.proxima_cita,
        costo_consulta=round(costo, 2),
        descuento_porcentaje=round(pct, 2),
        descuento_motivo=receta_in.descuento_motivo,
        total_consulta=round(total, 2)
    )
    db.add(nueva_receta)
    db.flush()

    # 4. Insertar los detalles
    for item in receta_in.detalles:
        prod = db.query(Producto).filter(Producto.id == item.producto_id).first()
        if not prod:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Producto ID {item.producto_id} no encontrado")

        detalle = RecetaDetalle(
            receta_id=nueva_receta.id,
            producto_id=item.producto_id,
            cantidad=item.cantidad,
            indicaciones=item.indicaciones
        )
        db.add(detalle)

    db.commit()
    db.refresh(nueva_receta)
    return nueva_receta

@router.get("/paciente/{paciente_id}", response_model=List[RecetaOut])
def obtener_recetas_por_paciente(paciente_id: int, db: Session = Depends(get_db)):
    recetas = (
        db.query(Receta)
        .filter(Receta.paciente_id == paciente_id)
        .order_by(Receta.id.desc())
        .all()
    )
    return recetas

@router.get("/{receta_id}", response_model=RecetaOut)
def obtener_receta(receta_id: int, db: Session = Depends(get_db)):
    receta = db.query(Receta).filter(Receta.id == receta_id).first()
    if not receta:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    return receta