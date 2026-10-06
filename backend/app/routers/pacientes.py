import unicodedata
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.paciente import Paciente
from app.schemas.paciente import (
    PacienteCreate, 
    PacienteOut, 
    PacienteNotaUpdate, 
    PacienteUpdate
)

router = APIRouter(prefix="/api/pacientes", tags=["Pacientes"])

def limpiar_termino(termino: str) -> str:
    nfkd = unicodedata.normalize('NFKD', termino)
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower()

@router.get("/", response_model=List[PacienteOut])
def listar_o_buscar_pacientes(q: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Paciente)
    if q and q.strip():
        termino = f"%{limpiar_termino(q.strip())}%"
        query = query.filter(
            func.sin_acentos(Paciente.nombre_completo).like(termino) |
            func.sin_acentos(Paciente.telefono).like(termino)
        )
    return query.all()

@router.post("/", response_model=PacienteOut, status_code=201)
def crear_paciente(paciente_in: PacienteCreate, db: Session = Depends(get_db)):
    # 1. Normalizar espacios en el nombre
    datos = paciente_in.model_dump()
    datos["nombre_completo"] = " ".join(datos["nombre_completo"].strip().split())

    # 2. Si trae teléfono, validar que no esté repetido
    tel = datos.get("telefono")
    if tel and tel.strip():
        tel_limpio = tel.strip()
        datos["telefono"] = tel_limpio
        duplicado = db.query(Paciente).filter(Paciente.telefono == tel_limpio).first()
        if duplicado:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"El teléfono {tel_limpio} ya pertenece a {duplicado.nombre_completo}."
            )
    else:
        datos["telefono"] = None

    # 3. Crear el nuevo registro
    nuevo_paciente = Paciente(**datos)
    db.add(nuevo_paciente)
    db.commit()
    db.refresh(nuevo_paciente)
    return nuevo_paciente

@router.get("/{paciente_id}", response_model=PacienteOut)
def obtener_paciente(paciente_id: int, db: Session = Depends(get_db)):
    paciente = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    return paciente

@router.patch("/{paciente_id}", response_model=PacienteOut)
def actualizar_paciente_parcial(
    paciente_id: int, 
    payload: PacienteUpdate, 
    db: Session = Depends(get_db)
):
    paciente = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    # exclude_unset=True solo toma los campos que realmente se enviaron en el request
    datos_recibidos = payload.model_dump(exclude_unset=True)

    # 1. Si enviaron nombre_completo, normalizarlo
    if "nombre_completo" in datos_recibidos:
        nuevo_nom = datos_recibidos["nombre_completo"]
        if nuevo_nom and nuevo_nom.strip():
            paciente.nombre_completo = " ".join(nuevo_nom.strip().split())

    # 2. Si enviaron telefono, validar colisión con OTRO paciente
    if "telefono" in datos_recibidos:
        tel = datos_recibidos["telefono"]
        if tel and tel.strip():
            tel_limpio = tel.strip()
            duplicado = db.query(Paciente).filter(
                Paciente.telefono == tel_limpio,
                Paciente.id != paciente_id
            ).first()
            if duplicado:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"El teléfono {tel_limpio} ya pertenece a {duplicado.nombre_completo}."
                )
            paciente.telefono = tel_limpio
        else:
            paciente.telefono = None

    # 3. Si enviaron email
    if "email" in datos_recibidos:
        mail = datos_recibidos["email"]
        paciente.email = mail.strip() if mail and mail.strip() else None

    # 4. Si enviaron nota_fija
    if "nota_fija" in datos_recibidos:
        paciente.nota_fija = datos_recibidos["nota_fija"]

    db.commit()
    db.refresh(paciente)
    return paciente

@router.patch("/{paciente_id}/nota", response_model=PacienteOut)
def actualizar_nota_paciente(
    paciente_id: int, 
    payload: PacienteNotaUpdate, 
    db: Session = Depends(get_db)
):
    paciente = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    
    paciente.nota_fija = payload.nota_fija
    db.commit()
    db.refresh(paciente)
    return paciente