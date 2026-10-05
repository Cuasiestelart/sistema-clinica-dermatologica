import re
from app.database import engine, SessionLocal, Base
import app.models
from app.models.marca import Marca
from app.models.etiqueta import Etiqueta
from app.models.producto import Producto
from app.models.paciente import Paciente

def normalizar_slug(texto: str) -> str:
    texto_limpio = re.sub(r'\s+', ' ', texto.strip().lower())
    reemplazos = (("á", "a"), ("é", "e"), ("í", "i"), ("ó", "o"), ("ú", "u"), ("ñ", "n"))
    for origen, destino in reemplazos:
        texto_limpio = texto_limpio.replace(origen, destino)
    return texto_limpio.replace(" ", "-")

def poblar_base_datos():
    print("-> Creando tablas en base de datos local...")
    Base.metadata.drop_all(bind=engine) # reiniciar para pruebas limpias
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("-> Instertando marcas...")
        marcas_data= [
            Marca(nombre="PBT PureSkin", descuento_porcentaje=10.0),
            Marca(nombre="ISDIN", descuento_porcentaje=15.0),
            Marca(nombre="Eucerin", descuento_porcentaje=0.0),
            Marca(nombre="La Roche-Posay", descuento_porcentaje=5.0),
            Marca(nombre="CeraVe", descuento_porcentaje=0.0)
        ]
        db.add_all(marcas_data)
        db.commit()

        #Diccionario para acceder a marcas por nombre
        marcas_map = {m.nombre: m for m in marcas_data}

        print("-> Insertando etiquetas clínicas...")
        etiquetas_raw = [
            "Protector solar",
            "Tónico exfoliante",
            "Limpiador facial",
            "Piel grasa / acné",
            "Piel seca",
            "Piel sensible",
            "Toque seco / matificante",
            "Gel",
            "Locion"
        ]

        etiquetas_map = {}
        for nombre in etiquetas_raw:
            etq = Etiqueta(nombre=nombre, slug=normalizar_slug(nombre))
            db.add(etq)
            etiquetas_map[nombre] = etq

        db.commit()

        print("-> Insertando productos muestra...")
        #1. Prueba producto
        pureskin_tonico = Producto(
            marca_id=marcas_map["PBT PureSkin"].id,
            sku="8424561081896",
            nombre="PBT PureSkin Tónico Exfoliante",
            activo_dermatologico="Ácido Salicílico / Glicólico",
            precio_base=420.00,
            stock_actual=5,
            etiquetas=[
                etiquetas_map["Tónico exfoliante"],
                etiquetas_map["Piel grasa / acné"]
            ]
        )

        #2. Protector ISDIN (Agorado a propósito para probar sustituto)
        isdin_fusion = Producto(
            marca_id=marcas_map["ISDIN"].id,
            sku="ISD-FUS-02",
            nombre="ISDIN Fusion Water Magic fps 50",
            activo_dermatologico="Filtros UV / Ácido Hialurónico",
            precio_base=680.00,
            stock_actual=0, #Agotado
            etiquetas=[
                etiquetas_map["Protector solar"],
                etiquetas_map["Piel grasa / acné"],
                etiquetas_map["Toque seco / matificante"]
            ]
        )

        #3. Protecto Eucerin (Sustituto directo con stock)
        eucerin_oil_control = Producto(
            marca_id=marcas_map["Eucerin"].id,
            sku="EUC-OIL-03",
            nombre="Eucerin Sun Gel-Cream Oil Control FPS 50+",
            activo_dermatologico="L-Carnitina / Filtros UV",
            precio_base=620.00,
            stock_actual=8, # DISPONIBLE
            etiquetas=[
                etiquetas_map["Protector solar"],
                etiquetas_map["Piel grasa / acné"],
                etiquetas_map["Toque seco / matificante"],
                etiquetas_map["Gel"]
            ]
        )

        #4. Limpiador CeraVe
        cerave_foaing = Producto(
            marca_id=marcas_map["CeraVe"].id,
            sku="CER-FOA-04",
            nombre="CeraVe Gel Limpiador Espumoso 473ml",
            activo_dermatologico="Ceramidas / Niacinamida",
            precio_base=390.00,
            stock_actual=12,
            etiquetas=[
                etiquetas_map["Limpiador facial"],
                etiquetas_map["Piel grasa / acné"],
                etiquetas_map["Gel"]
            ]
        )

        db.add_all([pureskin_tonico, isdin_fusion, eucerin_oil_control, cerave_foaing])
        db.commit()

        print("-> Insertando paciente muestra...")
        paciente_demo = Paciente(
            nombre_completo="Roberto Tapia Torres",
            telefono="3121317624",
            nota_fija="Paciente con piel mixta y tendencia a brillo en zona T. Alérgico a sulfas. Prefiere presentaciones ligeras en gel.",
            saldo_monedero=85.00
        )

        db.add(paciente_demo)
        db.commit()

        print("-> !Semilla completada exitosamente! Base de datos lista.")

    except Exception as e:
        print (f"Error al poblar la base de datos: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    poblar_base_datos()