from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import productos, pacientes, recetas
from app.routers import reportes

app = FastAPI(
    title="Clínica Dermatológica & Farmacia API",
    version="1.0.0"
)

# Configuración de CORS para aceptar peticiones tanto locales como de Render
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusión de routers
app.include_router(productos.router, tags=["Productos"])
app.include_router(pacientes.router, tags=["Pacientes"])
app.include_router(recetas.router, tags=["Recetas"])
app.include_router(reportes.router)

@app.get("/")
def read_root():
    return {"status": "online", "message": "API de Clínica Dermatológica activa"}