# PlenoEmprendo

Aplicación web para gestión de leads comerciales. Migración de una app de escritorio WinForms (C#) a stack web moderno.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Node.js · Express · TypeScript · Clean Architecture |
| Frontend | Vue 3 · Vite · Pinia · Vue Router · Tailwind CSS v4 |
| Auth | Google OAuth 2.0 + express-session |
| Datos | Google Sheets API v4 |

## Estructura del repositorio

```
PlenoEmprendoNodeJS/
├── src/                        # Backend (API)
│   ├── domain/                 # Entidades e interfaces
│   ├── application/use-cases/  # Lógica de negocio
│   ├── infrastructure/         # Google Sheets, OAuth, config
│   └── presentation/           # Rutas Express y middlewares
└── frontend/                   # Frontend (Vue 3)
    └── src/
        ├── api/                # Clientes HTTP (Axios)
        ├── stores/             # Estado global (Pinia)
        ├── views/              # LeadsView, MetricsView, LoginView
        ├── components/         # LeadEditPanel y secciones
        ├── router/             # Vue Router con auth guard
        └── types/              # Tipos TypeScript compartidos
```

## Requisitos previos

- Node.js 20+
- Una app configurada en [Google Cloud Console](https://console.cloud.google.com) con:
  - API de Google Sheets habilitada
  - OAuth 2.0 — tipo **Web application**
  - URI de redireccionamiento autorizado: `http://localhost:3001/api/auth/callback`

## Configuración

```bash
cp .env.example .env
```

Completar en `.env`:

| Variable | Descripción |
|---|---|
| `SESSION_SECRET` | String aleatorio seguro (mínimo 32 caracteres) |
| `GOOGLE_CLIENT_ID` | Client ID de la app OAuth |
| `GOOGLE_CLIENT_SECRET` | Client Secret de la app OAuth |
| `SHEET_MAIN_ID` | ID de la Google Sheet principal |
| `SHEET_SECONDARY_ID` | ID de la Google Sheet secundaria |

El resto de las variables (`SHEET_*_COL`, `SHEET_*_GID`, etc.) apuntan a los nombres de columna y configuración de cada hoja — ajustar según la estructura real de las planillas.

## Instalación

```bash
# Dependencias del backend
npm install

# Dependencias del frontend
cd frontend && npm install
```

## Desarrollo local

En dos terminales separadas:

```bash
# Terminal 1 — Backend (puerto 3001)
npm run dev

# Terminal 2 — Frontend (puerto 5173)
cd frontend && npm run dev
```

La app queda disponible en `http://localhost:5173`.  
El frontend proxea `/api/*` automáticamente al backend via Vite.

## Build para producción

```bash
# Backend
npm run build          # Compila TS → dist/
npm start              # Corre dist/index.js

# Frontend
cd frontend && npm run build   # Genera frontend/dist/
```

## Funcionalidades

- **Autenticación** con Google (OAuth 2.0), sesión persistente por cookie
- **Tabla de leads** con búsqueda, filtros por estado, fecha y flags
- **Filtros rápidos**: hoy · ayer · esta semana · este mes · este año
- **Panel de edición** por lead con tres secciones: WhatsApp · Grupo · Pasaje a Closer
- **Flags**: duplicado, cerrado manual, seguimiento
- **Sincronización** desde Google Sheets bajo demanda
- **Vista de métricas**: distribución de leads por estado (por fecha o estado actual)

## Variables de entorno — referencia completa

Ver [.env.example](.env.example).
