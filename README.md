# Sistema de Gestión Clínica Dermatológica

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-ORM-red)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)

Sistema web integral diseñado para consultorios dermatológicos, enfocado en optimizar la prescripción médica, el control de procedimientos clínicos en consulta y la liquidación contable automatizada de honorarios.

---

## Características Principales

* **Gestión de Consulta y Recetas Digitales:**
  * Emisión de recetas médicas con búsqueda rápida de fórmulas comerciales y magistrales.
  * Motor de sugerencia automática de sustitutos terapéuticos ante desabasto o inventario agotado.
  * Libreta de notas clínicas evolutivas y antecedentes médicos por paciente.
* **Control de Procedimientos Médicos:**
  * Registro ágil de intervenciones en consultorio (crioterapia, biopsias por sacabocado, electrofulguración, infiltraciones).
  * Cálculo automático e integración directa en el desglose de cobro de la consulta.
* **Liquidación de Honorarios y Contabilidad:**
  * Selector segmentado de tabuladores (tarifas estándar, convenios médicos, descuentos INAPAM y cortesías).
  * Ajustes manuales auditables con registro obligatorio de motivo.
  * Generación de reportes y cierres mensuales exportables en formato **CSV** para contabilidad.
* **Expediente e Historial Clínico:**
  * Búsqueda y filtrado interactivo en tiempo real por fecha, medicamento prescrito, procedimiento realizado o diagnóstico.

---

## Stack Tecnológico

* **Backend:** Python 3.12, FastAPI, SQLAlchemy (ORM), Pydantic (validación de esquemas), SQLite / PostgreSQL.
* **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons.
* **Infraestructura & Control de Versiones:** Git, GitHub, Docker *(en integración)*.

---

## Instalación y Ejecución Local

### 1. Backend (FastAPI)

    cd backend
    python -m venv venv
    .\venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn app.main:app --reload

> **Documentación interactiva de la API (Swagger UI):** Disponible en `http://127.0.0.1:8000/docs` una vez iniciado el servidor.

### 2. Frontend (React + Vite)

    cd frontend
    npm install
    npm run dev

---

## Arquitectura del Proyecto

    sistema-clinica-dermatologica/
    ├── backend/          # API REST modular (FastAPI, modelos SQLAlchemy, esquemas Pydantic)
    ├── frontend/         # Interfaz SPA responsiva (React 18, Vite, Tailwind CSS)
    └── README.md         # Documentación técnica del proyecto