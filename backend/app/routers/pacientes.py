import unicodedata
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.paciente import Paciente
from app.schemas.paciente import PacienteCreate, PacienteOut, PacienteNotaUpdate

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
    nuevo_paciente = Paciente(**paciente_in.model_dump())
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