import csv
import io
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import extract
from app.database import get_db
from app.models.receta import Receta, RecetaProcedimiento
from app.models.paciente import Paciente

router = APIRouter(prefix="/api/reportes", tags=["Reportes"])

TZ_MEXICO = timezone(timedelta(hours=-6))

def anio_maximo() -> int:
    return datetime.now(TZ_MEXICO).year + 5

def convertir_a_hora_local(dt: datetime | None) -> tuple[str, str]:
    if not dt:
        return "N/A", "N/A"
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
        .options(
            selectinload(Receta.procedimientos).selectinload(RecetaProcedimiento.procedimiento)
        )
        .filter(
            extract("year", Receta.fecha) == anio,
            extract("month", Receta.fecha) == mes
        )
        .all()
    )

    total_consultas = len(recetas)
    
    total_base = 0.0
    total_cobrado = 0.0

    for r in recetas:
        costo_base = float(r.costo_consulta or 0.0)
        monto_procs = sum(float(p.precio_cobrado or 0.0) for p in (r.procedimientos or []))
        total_base += (costo_base + monto_procs)
        total_cobrado += float(r.total_consulta or 0.0)

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
        .options(
            selectinload(Receta.procedimientos).selectinload(RecetaProcedimiento.procedimiento)
        )
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
        "Tratamientos / Procedimientos",
        "Monto Tratamientos (MXN)",
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

        # Procesar los procedimientos clínicos realizados
        if r.procedimientos:
            lista_nombres = []
            monto_procedimientos = 0.0
            for item in r.procedimientos:
                nombre_proc = item.procedimiento.nombre if item.procedimiento else f"Procedimiento #{item.procedimiento_id}"
                precio_item = float(item.precio_cobrado or 0.0)
                monto_procedimientos += precio_item
                lista_nombres.append(f"{nombre_proc} (${precio_item:.2f})")

            texto_tratamientos = " + ".join(lista_nombres)
            monto_tratamientos_str = f"{monto_procedimientos:.2f}"
        else:
            texto_tratamientos = "Ninguno"
            monto_tratamientos_str = "0.00"

        writer.writerow([
            f"#{r.id}",
            fecha_str,
            hora_str,
            paciente_nom,
            paciente_tel,
            costo_base,
            texto_tratamientos,
            monto_tratamientos_str,
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