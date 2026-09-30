from app.models.marca import Marca
from app.models.etiqueta import Etiqueta, producto_etiquetas
from app.models.producto import Producto
from app.models.paciente import Paciente
from app.models.receta import Receta, RecetaDetalle

__all__ = [
    "Marca",
    "Etiqueta",
    "producto_etiquetas",
    "Producto",
    "Paciente",
    "Receta",
    "RecetaDetalle",
]