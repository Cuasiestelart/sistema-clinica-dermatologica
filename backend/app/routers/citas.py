from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, time

from app.database import get_db
from app.models.cita import Cita
from app.schemas.cita import CitaCreate, CitaResponse

router = APIRouter(prefix="/api/citas", tags=["Citas"])

# Estados que consideramos como "activos" u ocupando un espacio en agenda
ESTADOS_ACTIVOS = ["agendada", "confirmada", "en_espera", "en_atencion"]

# 1. Agendar nueva cita con validación anti-colisión
@router.post("/", response_model=CitaResponse, status_code=status.HTTP_201_CREATED)
def crear_cita(cita_in: CitaCreate, db: Session = Depends(get_db)):
    # Regla 1: Validar si el especialista ya tiene una cita activa en ese mismo horario
    cita_especialista = db.query(Cita).filter(
        Cita.profesional == cita_in.profesional,
        Cita.fecha_hora == cita_in.fecha_hora,
        Cita.estado.in_(ESTADOS_ACTIVOS)
    ).first()

    if cita_especialista:
        nombre_ocupado = cita_especialista.paciente.nombre_completo if cita_especialista.paciente else "otro paciente"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Horario ocupado: {cita_in.profesional} ya tiene una cita agendada a las {cita_in.fecha_hora.strftime('%H:%M')} con {nombre_ocupado}."
        )

    # Regla 2: Validar si el paciente ya tiene alguna otra cita activa en ese mismo horario (con cualquier profesional)
    cita_paciente = db.query(Cita).filter(
        Cita.paciente_id == cita_in.paciente_id,
        Cita.fecha_hora == cita_in.fecha_hora,
        Cita.estado.in_(ESTADOS_ACTIVOS)
    ).first()

    if cita_paciente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Conflicto de paciente: El paciente ya cuenta con una cita en {cita_paciente.profesional} a las {cita_in.fecha_hora.strftime('%H:%M')}."
        )

    # Si pasa las dos validaciones, se procede a guardar
    nueva_cita = Cita(
        paciente_id=cita_in.paciente_id,
        profesional=cita_in.profesional,
        fecha_hora=cita_in.fecha_hora,
        motivo=cita_in.motivo,
        notas=cita_in.notas,
        estado="agendada"
    )
    db.add(nueva_cita)
    db.commit()
    db.refresh(nueva_cita)
    return nueva_cita

# 2. Listar citas por fecha y/o profesional
@router.get("/", response_model=List[CitaResponse])
def listar_citas(
    fecha: Optional[date] = Query(None, description="Filtrar por fecha específica YYYY-MM-DD"),
    profesional: Optional[str] = Query(None, description="Filtrar por Dermatología o Cosmetología"),
    db: Session = Depends(get_db)
):
    query = db.query(Cita)
    
    if fecha:
        inicio_dia = datetime.combine(fecha, time.min)
        fin_dia = datetime.combine(fecha, time.max)
        query = query.filter(Cita.fecha_hora >= inicio_dia, Cita.fecha_hora <= fin_dia)
        
    if profesional:
        query = query.filter(Cita.profesional == profesional)
        
    return query.order_by(Cita.fecha_hora.asc()).all()

# 3. Actualizar estado de la cita
@router.patch("/{cita_id}/estado", response_model=CitaResponse)
def actualizar_estado_cita(
    cita_id: int, 
    estado: str = Query(..., description="Nuevo estado"), 
    db: Session = Depends(get_db)
):
    estados_validos = ["agendada", "confirmada", "en_espera", "en_atencion", "completada", "cancelada", "no_asistio"]
    if estado not in estados_validos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Estado inválido. Opciones permitidas: {estados_validos}"
        )
        
    cita = db.query(Cita).filter(Cita.id == cita_id).first()
    if not cita:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cita no encontrada")
        
    cita.estado = estado
    db.commit()
    db.refresh(cita)
    return cita