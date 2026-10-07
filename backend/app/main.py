from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
# Importar modelos para que Base.metadata los reconozca al arrancar
from app.models.producto import Producto
from app.models.paciente import Paciente
from app.models.receta import Receta, RecetaDetalle
from app.models.cita import Cita
from app.routers import procedimientos

# Crear tablas en la base de datos si no existen
Base.metadata.create_all(bind=engine)

# Importar routers
from app.routers import productos, pacientes, recetas, reportes, citas

app = FastAPI(
    title="Sistema de Gestión Clínica Dermatológica",
    version="1.1.0"
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(productos.router, tags=["Productos"])
app.include_router(pacientes.router, tags=["Pacientes"])
app.include_router(recetas.router, tags=["Recetas"])
app.include_router(reportes.router)
app.include_router(citas.router)
app.include_router(procedimientos.router)

@app.get("/")
def root():
    return {"mensaje": "API de Clínica Dermatológica en funcionamiento"}