from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from app.database import get_db
from app.models.receta import Receta, RecetaDetalle, RecetaProcedimiento
from app.models.paciente import Paciente
from app.models.producto import Producto
from app.models.procedimiento import Procedimiento
from app.schemas.receta import RecetaCreate, RecetaOut

router = APIRouter(prefix="/api/recetas", tags=["Recetas"])

@router.post("/", response_model=RecetaOut, status_code=201)
def crear_receta(receta_in: RecetaCreate, db: Session = Depends(get_db)):
    # 1. Validar que el paciente exista
    paciente = db.query(Paciente).filter(Paciente.id == receta_in.paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    # 2. Validar procedimientos y calcular suma de tratamientos
    procedimientos_para_crear = []
    subtotal_procedimientos = 0.0

    for proc_in in receta_in.procedimientos:
        proc_db = db.query(Procedimiento).filter(Procedimiento.id == proc_in.procedimiento_id).first()
        if not proc_db:
            raise HTTPException(status_code=404, detail=f"Procedimiento ID {proc_in.procedimiento_id} no encontrado")
        
        precio_final = float(proc_in.precio_cobrado if proc_in.precio_cobrado is not None else proc_db.precio_base)
        subtotal_procedimientos += precio_final

        procedimientos_para_crear.append({
            "procedimiento_id": proc_db.id,
            "precio_cobrado": precio_final,
            "notas": proc_in.notas
        })

    # 3. Calcular cobros y descuentos de la consulta
    costo_consulta = float(receta_in.costo_consulta if receta_in.costo_consulta is not None else 800.0)
    pct = float(receta_in.descuento_porcentaje or 0.0)
    subtotal_bruto = costo_consulta + subtotal_procedimientos

    if receta_in.total_consulta is not None:
        total_final = float(receta_in.total_consulta)
    else:
        descuento_monto = subtotal_bruto * (pct / 100.0)
        total_final = max(0.0, subtotal_bruto - descuento_monto)

    # 4. Registrar cabecera de la receta
    TZ_MEXICO = timezone(timedelta(hours=-6))
    hora_actual = datetime.now(TZ_MEXICO).replace(tzinfo=None)

    nueva_receta = Receta(
        paciente_id=receta_in.paciente_id,
        diagnostico=receta_in.diagnostico,
        proxima_cita=receta_in.proxima_cita,
        costo_consulta=round(costo_consulta, 2),
        descuento_porcentaje=round(pct, 2),
        descuento_motivo=receta_in.descuento_motivo,
        total_consulta=round(total_final, 2),
        fecha=hora_actual
    )
    db.add(nueva_receta)
    db.flush()

    # 5. Insertar medicamentos prescritos
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

    # 6. Insertar procedimientos realizados
    for p_data in procedimientos_para_crear:
        receta_proc = RecetaProcedimiento(
            receta_id=nueva_receta.id,
            procedimiento_id=p_data["procedimiento_id"],
            precio_cobrado=round(p_data["precio_cobrado"], 2),
            notas=p_data["notas"]
        )
        db.add(receta_proc)

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