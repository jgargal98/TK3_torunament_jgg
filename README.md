# TK3 – KO Tournament Manager

Aplicación web para gestionar torneos de eliminación directa (KO).
Proyecto integrado de **Angular + Python (FastAPI) + MariaDB** · Optativa 2026–2027.

```
Angular (frontend)  →  HTTP/JSON  →  API Python (backend)  →  MariaDB
```

- **frontend/**: Angular 21 + Angular Material. Componentes para las vistas y un servicio (`ParticipantApi`) que centraliza las llamadas a la API.
- **backend/**: API REST con FastAPI, organizada por capas:
  - `api/`: rutas HTTP.
  - `services/`: reglas de negocio.
  - `repositories/`: acceso a datos con SQLAlchemy.
  - `schemas/`: contrato JSON con Pydantic.
  - `models/`: tablas.
- **database/schema.sql**: estructura de la base de datos. El backend crea las tablas al arrancar si no existen.

El frontend nunca accede a la base de datos: todo pasa por la API.

## Estado: Fase 1 · Participantes ✅

- Crear, consultar y editar participantes con **nick** y **logo** (un emoji).
- Activar y desactivar participantes. **Desactivar no borra**: el participante conserva su historial y no hay endpoint de borrado.
- La interfaz distingue los estados: etiqueta Activo/Inactivo, tarjeta apagada y filtros Todos/Activos/Inactivos.
- Los datos se guardan en MariaDB y se mantienen al reiniciar.
- Validaciones en el backend: nick obligatorio de 2 a 40 caracteres, nick único y logo obligatorio.

## Estado: Fase 2 · Torneos y cuadro KO ✅

- Asistente de 3 pasos para crear un torneo:
  1. Nombre.
  2. Selección de jugadores: solo aparecen los activos.
  3. Resumen con jugadores, rondas y BYE.
- Estados del torneo:
  - **Preparación**: se puede editar o eliminar.
  - **Cuadro generado**: ya no admite cambios.
- **Sorteo aleatorio** en el backend, con una animación de tragaperras en el frontend.
- **BYE**: si el número de jugadores no es potencia de 2, los huecos libres se convierten en pases directos a la segunda ronda. Se reparten a lo largo del cuadro: con 6 jugadores hay 2 BYE, uno en cada mitad.
- **Cuadro en árbol**: una columna por ronda, unida con líneas. Las rondas futuras aparecen como "???" y los jugadores con BYE ya figuran en la segunda ronda.
- **Reglas que comprueba el backend**:
  - Mínimo 2 jugadores.
  - Solo jugadores activos.
  - Sin duplicados.
  - El cuadro no se puede generar dos veces.
  - No se puede sortear si algún jugador se ha desactivado después de inscribirse.

Pendiente: fase 3 (combates y campeón) y fase 4 (informes).

## API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Comprueba la API y la conexión con MariaDB |
| GET | `/api/participants?active=true\|false` | Lista participantes, con filtro opcional por estado |
| GET | `/api/participants/{id}` | Detalle de un participante |
| POST | `/api/participants` | Crea `{ "nick": "...", "logo": "🦊" }` |
| PUT | `/api/participants/{id}` | Edita el nick y el logo |
| PATCH | `/api/participants/{id}/active` | Activa o desactiva `{ "active": false }` |
| GET | `/api/tournaments` | Lista de torneos |
| GET | `/api/tournaments/{id}` | Torneo con sus jugadores y combates |
| POST | `/api/tournaments` | Crea `{ "name": "...", "participant_ids": [1, 2, 3] }` en preparación |
| PUT | `/api/tournaments/{id}` | Edita nombre y jugadores (solo en preparación) |
| DELETE | `/api/tournaments/{id}` | Elimina el torneo (solo en preparación) |
| POST | `/api/tournaments/{id}/bracket` | Sorteo aleatorio de la primera ronda |

La documentación interactiva está en http://localhost:8000/docs.

## Puesta en marcha

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env      # rellenar DB_HOST, DB_PORT, DB_NAME, DB_USER y DB_PASSWORD
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm start                 # http://localhost:4200 (el proxy redirige /api al puerto 8000)
```

### Tests del backend

```bash
cd backend
python -m pytest
```

Los tests usan una base de datos SQLite temporal y no tocan los datos de MariaDB.
