# 1. Imagen base ligera oficial de Python sobre Debian Linux
FROM python:3.12-slim

# 2. Buenas prácticas de Python en contenedores:
# - PYTHONDONTWRITEBYTECODE: Evita generar archivos .pyc dentro del contenedor
# - PYTHONUNBUFFERED: Asegura que los prints y logs salgan en tiempo real a la terminal
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 3. Directorio de trabajo dentro del contenedor
WORKDIR /app

# 4. Copiar e instalar dependencias primero (aprovecha la caché de capas de Docker)
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copiar el resto del código del backend
COPY . /app/

# 6. Exponer el puerto estándar de FastAPI
EXPOSE 8000

# 7. Comando para arrancar el servidor (0.0.0.0 es indispensable para que acepte conexiones fuera del contenedor)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]