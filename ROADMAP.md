# ROADMAP — NutriApp

## Fase actual: 1 — Setup inicial

---

## Fase 1 — Setup inicial
**Estado: PENDIENTE**

### 1.1 Supabase
- [ ] Crear proyecto "nutriapp" en Supabase
- [ ] Ejecutar SQL completo del esquema (ver CONTEXT.md)
- [ ] Activar Google OAuth: Authentication → Providers → Google → habilitar
- [ ] Crear proyecto en Google Cloud Console, obtener Client ID y Secret
- [ ] Configurar Redirect URL en Google: `https://xxxx.supabase.co/auth/v1/callback`
- [ ] Copiar SUPABASE_URL y SUPABASE_ANON_KEY

### 1.2 Railway
- [ ] Crear proyecto "nutriapp" en Railway
- [ ] Conectar repositorio GitHub (crear repo primero)
- [ ] Agregar variables de entorno en Railway
- [ ] Verificar que el Dockerfile hace build correctamente

### 1.3 Frontend base
- [ ] `npm create vite@latest frontend -- --template react`
- [ ] Instalar dependencias: `npm install @supabase/supabase-js react-router-dom recharts`
- [ ] Instalar PWA: `npm install -D vite-plugin-pwa`
- [ ] Configurar vite.config.js con PWA plugin
- [ ] Crear `src/lib/supabase.js` con cliente
- [ ] Crear `App.jsx` con router y theme provider
- [ ] Crear página Login.jsx con botón Google
- [ ] Verificar que el login con Google funciona

### 1.4 Backend base
- [ ] Crear `backend/main.py` con FastAPI
- [ ] Configurar CORS para desarrollo y producción
- [ ] Crear `backend/db.py` con cliente Supabase service key
- [ ] Crear `backend/routers/auth.py` — validar JWT de Supabase
- [ ] Endpoint GET `/api/health` para verificar que corre
- [ ] Endpoint GET `/api/me` — devuelve perfil del usuario autenticado
- [ ] Configurar FastAPI para servir el build de React en `/`

### 1.5 Deploy inicial
- [ ] Crear Dockerfile multi-stage
- [ ] Push a GitHub → Railway hace deploy automático
- [ ] Verificar que la app corre en el dominio Railway
- [ ] Verificar login con Google en producción

**Entregable fase 1:** App en Railway con login Google funcional, pantalla de inicio vacía pero con tema correcto según usuario.

---

## Fase 2 — Lista de compras
**Estado: PENDIENTE**

### 2.1 Seed de datos
- [ ] Script para insertar todos los items de la lista en Supabase (ver DATA.md)
- [ ] Items separados por owner: 'bash', 'eimy', 'compartida'
- [ ] Verificar que los items aparecen correctamente en Supabase

### 2.2 Backend
- [ ] `GET /api/lista?owner=compartida` — items de la lista compartida
- [ ] `GET /api/lista?owner=bash` — items de Bash
- [ ] `GET /api/lista?owner=eimy` — items de Eimy
- [ ] `PATCH /api/lista/{id}/check` — marcar/desmarcar item
- [ ] `PATCH /api/lista/{id}/reset` — reiniciar todos los checks de una categoría
- [ ] `POST /api/lista` — agregar item nuevo
- [ ] `DELETE /api/lista/{id}` — eliminar item

### 2.3 Frontend — Lista.jsx
- [ ] Vista con 3 tabs: Mi lista / Compartida / Lista [otro usuario]
- [ ] Categorías colapsables (mismo diseño que el HTML)
- [ ] Checkbox animado por item
- [ ] Progress bar con porcentaje
- [ ] Cards de frecuencia (semanal / 3-4 días)
- [ ] Badges por persona con colores

### 2.4 Realtime
- [ ] Hook `useRealtime.js` — suscripción a cambios en lista_items
- [ ] Cuando Bash marca un item → Eimy lo ve en tiempo real sin recargar
- [ ] Indicador visual "actualizado hace X segundos"

### 2.5 Persistencia offline
- [ ] Service worker cachea la lista localmente
- [ ] Si no hay conexión, muestra la última versión guardada
- [ ] Al recuperar conexión, sincroniza cambios pendientes

**Entregable fase 2:** Lista de compras funcional, sincronizada en tiempo real, funciona offline.

---

## Fase 3 — Plan nutricional dinámico
**Estado: PENDIENTE**

### 3.1 Seed del plan
- [ ] Script para insertar todas las comidas y jugos en Supabase (ver DATA.md)
- [ ] Separado por user_id (necesita que los usuarios ya existan)
- [ ] Alternativa: seed por theme ('bash'/'eimy') y asignar al primer login

### 3.2 Backend
- [ ] `GET /api/plan/meals` — todas las comidas del usuario
- [ ] `GET /api/plan/jugos` — todos los jugos del usuario
- [ ] `PATCH /api/plan/meals/{id}` — editar comida (ingredientes, kcal)
- [ ] `PATCH /api/plan/jugos/{id}` — editar jugo
- [ ] `POST /api/plan/meals` — agregar comida nueva
- [ ] `DELETE /api/plan/meals/{id}` — eliminar comida

### 3.3 Frontend — Plan.jsx
- [ ] Tema visual igual al HTML generado (Bash: dark neón / Eimy: Bratz)
- [ ] Métricas TMB/TDEE/Meta en cards superiores
- [ ] Secciones por tipo de comida
- [ ] Tips de acompañamiento en itálica debajo de cada ingrediente
- [ ] Acordeón expandible (Eimy) / tabla fija (Bash)
- [ ] Sección de jugos con checklist interactivo y barra de progreso
- [ ] Botón editar inline — click en ingrediente abre input editable
- [ ] Sección de snacks permitidos
- [ ] Alternativas al arroz colapsables

**Entregable fase 3:** Plan nutricional idéntico a los HTML, editable desde la app.

---

## Fase 4 — Seguimiento
**Estado: PENDIENTE**

### 4.1 Backend
- [ ] `GET /api/seguimiento` — todos los registros del usuario
- [ ] `POST /api/seguimiento` — nuevo registro (peso + medidas + notas)
- [ ] `PATCH /api/seguimiento/{id}` — editar registro existente
- [ ] `DELETE /api/seguimiento/{id}` — eliminar registro

### 4.2 Frontend — Seguimiento.jsx
- [ ] Formulario de registro semanal
  - Fecha (default: hoy)
  - Peso (kg)
  - Cintura (cm)
  - Cadera (cm)
  - Cuello (cm)
  - Abdomen (cm)
  - Notas (textarea)
- [ ] Alerta si llevan más de 8 días sin registrar
- [ ] Gráfica de peso — línea de tiempo con Recharts
- [ ] Gráfica de medidas — líneas múltiples (cintura, cadera, abdomen)
- [ ] Tabla de historial — todos los registros con opción de editar
- [ ] Cálculo automático: % de meta alcanzada respecto al peso objetivo

### 4.3 Home.jsx — Dashboard
- [ ] Último peso registrado
- [ ] Días desde último registro
- [ ] Acceso rápido a las 4 secciones
- [ ] Resumen del plan del día (qué comer hoy)

**Entregable fase 4:** Seguimiento funcional con gráficas de progreso.

---

## Fase 5 — PWA
**Estado: PENDIENTE**

### 5.1 Manifest
- [ ] `public/manifest.json` con nombre, colores, iconos
- [ ] Iconos en múltiples tamaños (192x192, 512x512)
- [ ] Theme color por usuario (negro para Bash, morado para Eimy)

### 5.2 Service Worker
- [ ] Vite PWA plugin configura esto automáticamente
- [ ] Cachear assets estáticos
- [ ] Cachear última versión de la lista de compras
- [ ] Cachear plan nutricional

### 5.3 Instalación
- [ ] Banner "Agregar a pantalla de inicio" en iOS/Android
- [ ] Funciona sin conexión (al menos lista y plan)
- [ ] Sincroniza al recuperar conexión

**Entregable fase 5:** App instalable en el home screen del teléfono, funciona offline.

---

## Backlog (ideas futuras)
- Modo oscuro/claro toggle manual
- Exportar registros de seguimiento a CSV
- Foto de progreso adjunta a registro
- Compartir progreso entre usuarios
- Calculadora de kcal rápida
- Temporizador para jugos (recordatorio de preparación)
