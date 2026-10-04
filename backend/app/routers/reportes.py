import csv
import io
from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import extract
from app.database import get_db
from app.models.receta import Receta
from app.models.paciente import Paciente
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/api/reportes", tags=["Reportes"])

TZ_MEXICO = timezone(timedelta(hours=-6))

def anio_maximo() -> int:
    return datetime.now(TZ_MEXICO).year + 5

def convertir_a_hora_local(dt: datetime | None) -> tuple[str, str]:
    if not dt:
        return "N/A", "N/A"
    # La fecha ya está en hora de México, solo se formatea directo:
    return dt.strftime("%d/%m/%Y"), dt.strftime("%H:%M")
 
@router.get("/resumen-mensual")
def resumen_mensual(
    anio: int = Query(..., ge=2020),
    mes: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db)
):
    if anio > anio_maximo():
        anio = anio_maximo()

    recetas = (
        db.query(Receta)
        .join(Paciente)
        .filter(
            extract("year", Receta.fecha) == anio,
            extract("month", Receta.fecha) == mes
        )
        .all()
    )

    total_consultas = len(recetas)
    total_base = sum(r.costo_consulta or 0.0 for r in recetas)
    total_cobrado = sum(r.total_consulta or 0.0 for r in recetas)
    total_descuentos = total_base - total_cobrado

    return {
        "anio": anio,
        "mes": mes,
        "total_consultas": total_consultas,
        "total_base": round(total_base, 2),
        "total_cobrado": round(total_cobrado, 2),
        "total_descuentos": round(max(0.0, total_descuentos), 2)
    }

@router.get("/exportar-mensual")
def exportar_reporte_mensual(
    anio: int = Query(..., ge=2020),
    mes: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db)
):
    if anio > anio_maximo():
        anio = anio_maximo()

    recetas = (
        db.query(Receta)
        .join(Paciente)
        .filter(
            extract("year", Receta.fecha) == anio,
            extract("month", Receta.fecha) == mes
        )
        .order_by(Receta.fecha.asc())
        .all()
    )

    output = io.StringIO()
    # BOM UTF-8 para apertura limpia directa en Excel (Windows y Mac)
    output.write("\ufeff")

    writer = csv.writer(output, delimiter=",", quoting=csv.QUOTE_MINIMAL)
    writer.writerow([
        "Folio Consulta",
        "Fecha",
        "Hora",
        "Paciente",
        "Telefono",
        "Honorarios Base (MXN)",
        "Descuento (%)",
        "Motivo Descuento",
        "Total Cobrado (MXN)"
    ])

    for r in recetas:
        fecha_str, hora_str = convertir_a_hora_local(r.fecha)
        paciente_nom = r.paciente.nombre_completo if r.paciente else "Sin Nombre"
        paciente_tel = r.paciente.telefono if r.paciente else ""
        costo_base = f"{float(r.costo_consulta or 0.0):.2f}"
        desc_pct = f"{float(r.descuento_porcentaje or 0.0):.2f}%"
        motivo = r.descuento_motivo or "Tarifa estándar"
        total = f"{float(r.total_consulta or 0.0):.2f}"

        writer.writerow([
            f"#{r.id}",
            fecha_str,
            hora_str,
            paciente_nom,
            paciente_tel,
            costo_base,
            desc_pct,
            motivo,
            total
        ])

    output.seek(0)
    nombre_archivo = f"Reporte_Honorarios_{anio}_{str(mes).zfill(2)}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={nombre_archivo}"}
    )