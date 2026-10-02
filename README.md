# Sistema de Gestión Clínica Dermatológica 

Sistema integral para consultorios dermatológicos enfocado en agilizar la prescripción médica, el control de procedimientos clínicos en consultorio y la liquidación contable de honorarios.

---

## Características Principales

- **Gestión de Consulta y Recetas:**
  - Emisión de recetas médicas digitales con búsqueda rápida de fórmulas comerciales y magistrales.
  - Sugerencia automática de sustitutos terapéuticos en caso de desabasto o stock agotado.
  - Libreta de notas clínicas permanentes y antecedentes por paciente.

- **Procedimientos Médicos en Consultorio:**
  - Registro ágil de intervenciones (crioterapia, biopsias por sacabocado, electrofulguración, infiltraciones).
  - Cálculo automático e integrado en la liquidación total de la consulta.

- **Liquidación de Honorarios y Facturación:**
  - Selector segmentado para tarifas estándar, convenios, INAPAM y cortesías.
  - Opción de ajuste manual con registro de motivo.
  - Módulo de reportes y cierres mensuales exportables en CSV para contabilidad.

- **Expediente e Historial Clínico:**
  - Filtro interactivo en tiempo real por fecha, medicamento prescrito, procedimiento realizado o diagnóstico.

---

## Stack Tecnológico

- **Backend:** Python 3.12, FastAPI, SQLAlchemy, Pydantic, SQLite.
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons.
- **DevOps / Despliegue:** Git, GitHub, Docker (en progreso).

---

## Instalación y Ejecución Local

### 1. Backend (FastAPI)
```bash
# Entrar a la carpeta del backend
cd backend

# Activar entorno virtual (Windows)
..\venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor de desarrollo
uvicorn app.main:app --reload

# Entrar a la carpeta del frontend
cd frontend

# Instalar dependencias de Node
npm install

# Iniciar servidor local
npm run dev