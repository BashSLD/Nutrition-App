# NutriApp — Contexto completo del proyecto

## Qué es esto
App personal de nutrición y seguimiento para dos usuarios: **Bash** y **Eimy**.
PWA con React + FastAPI + Supabase + Railway. Login con Google.

## Estado actual
- [ ] Fase 1 — Setup inicial (PENDIENTE — aquí arranca el desarrollo)
- [ ] Fase 2 — Lista de compras con Realtime
- [ ] Fase 3 — Plan nutricional dinámico
- [ ] Fase 4 — Seguimiento de medidas y gráficas
- [ ] Fase 5 — PWA (manifest + service worker)

---

## Usuarios

### Bash
- Hombre, 34 años, 80 kg, 1.64 m, sedentario → iniciando gym
- Meta: ~1,700 kcal/día (déficit ~400 kcal)
- Con gym: ~1,850 kcal/día
- Tema visual: dark, fondo negro, acento verde neón (#c8f135)
- Fuentes: Syne (headings) + DM Mono (body)
- Tiene proteína Birdman — solo post-gym en Rojo de Poder

### Eimy
- Mujer, 24 años, 60 kg, 1.50 m, sedentaria → iniciando gym
- Meta: ~1,300 kcal/día (déficit ~350 kcal)
- Con gym: ~1,400 kcal/día
- Come poco y despacio — sin presión de velocidad
- Mínimo absoluto: 1,200 kcal/día
- Tema visual: Bratz Y2K, fondo morado oscuro (#1a0020), acento pink (#ff1aab)
- Fuentes: Pacifico (headings) + Nunito (body)
- Hidratación: beber cuando tenga sed, no forzar 2L

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite |
| Estilos | CSS modules con variables por tema |
| Auth | Supabase Auth (Google OAuth) |
| Base de datos | Supabase (PostgreSQL) |
| Realtime | Supabase Realtime (lista compartida) |
| Backend | FastAPI (Python 3.11) |
| Deploy | Railway — 1 solo servicio |
| PWA | Vite PWA plugin |

---

## Infraestructura

- **Supabase**: cuenta existente de Bash — crear proyecto nuevo "nutriapp"
- **Railway**: cuenta existente de Bash — crear proyecto nuevo "nutriapp"
- **Dominio**: subdominio Railway por defecto (sin dominio propio)
- **Variables de entorno**: ver archivo `.env.example`

---

## Arquitectura de archivos

```
nutrition-app/
├── CONTEXT.md              ← este archivo
├── ROADMAP.md              ← fases detalladas
├── .env.example            ← variables necesarias
├── Dockerfile              ← build frontend + serve con FastAPI
├── railway.toml            ← config Railway
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js      ← incluye PWA plugin
│   ├── public/
│   │   ├── manifest.json
│   │   └── icons/
│   └── src/
│       ├── main.jsx
│       ├── App.jsx          ← router + theme provider
│       ├── lib/
│       │   ├── supabase.js  ← cliente Supabase
│       │   └── api.js       ← llamadas a FastAPI
│       ├── hooks/
│       │   ├── useAuth.js
│       │   ├── useProfile.js
│       │   └── useRealtime.js
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Home.jsx
│       │   ├── Plan.jsx
│       │   ├── Lista.jsx
│       │   └── Seguimiento.jsx
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── MealCard.jsx
│       │   ├── JuiceChecklist.jsx
│       │   ├── ShoppingItem.jsx
│       │   ├── MedidaForm.jsx
│       │   └── ProgressChart.jsx
│       └── styles/
│           ├── global.css
│           ├── theme-bash.css
│           └── theme-eimy.css
│
└── backend/
    ├── main.py
    ├── db.py
    ├── requirements.txt
    ├── routers/
    │   ├── auth.py
    │   ├── plan.py
    │   ├── lista.py
    │   └── seguimiento.py
    └── models/
        ├── plan.py
        ├── lista.py
        └── seguimiento.py
```

---

## Base de datos Supabase — esquema completo

```sql
-- Ejecutar en el SQL Editor de Supabase

-- Perfiles de usuario
create table profiles (
  id          uuid references auth.users on delete cascade primary key,
  name        text not null,
  theme       text check (theme in ('bash', 'eimy')) not null,
  peso_kg     float,
  altura_cm   float,
  edad        int,
  meta_kcal   int,
  created_at  timestamptz default now()
);

-- Habilitar RLS
alter table profiles enable row level security;
create policy "users can read own profile"
  on profiles for select using (auth.uid() = id);
create policy "users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Comidas del plan nutricional
create table meals (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users on delete cascade,
  tipo         text check (tipo in ('desayuno','comida','cena','snack')),
  nombre       text not null,
  ingredientes jsonb not null default '[]',
  kcal_total   int,
  orden        int default 0,
  created_at   timestamptz default now()
);

alter table meals enable row level security;
create policy "users manage own meals"
  on meals for all using (auth.uid() = user_id);

-- Jugos
create table jugos (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users on delete cascade,
  nombre       text not null,
  subtitulo    text,
  emoji        text,
  ingredientes jsonb not null default '[]',
  nota         text,
  orden        int default 0
);

alter table jugos enable row level security;
create policy "users manage own jugos"
  on jugos for all using (auth.uid() = user_id);

-- Items de lista de compras
create table lista_items (
  id          uuid default gen_random_uuid() primary key,
  owner       text check (owner in ('bash','eimy','compartida')) not null,
  categoria   text not null,
  nombre      text not null,
  cantidad    text,
  badge       text,
  frecuencia  text check (frecuencia in ('semanal','3-4 dias')) default 'semanal',
  nota        text,
  checked     boolean default false,
  checked_by  uuid references auth.users,
  updated_at  timestamptz default now()
);

-- Lista compartida: ambos pueden leer y escribir
alter table lista_items enable row level security;
create policy "authenticated users can manage lista"
  on lista_items for all
  to authenticated
  using (true)
  with check (true);

-- Habilitar realtime en lista_items
alter publication supabase_realtime add table lista_items;

-- Registros de seguimiento
create table registros (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users on delete cascade,
  fecha       date not null default current_date,
  peso_kg     float,
  cintura_cm  float,
  cadera_cm   float,
  cuello_cm   float,
  abdomen_cm  float,
  notas       text,
  created_at  timestamptz default now(),
  unique(user_id, fecha)
);

alter table registros enable row level security;
create policy "users manage own registros"
  on registros for all using (auth.uid() = user_id);
```

---

## Variables de entorno

```bash
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...   # solo backend

# FastAPI
SECRET_KEY=genera-uno-random
ENVIRONMENT=production

# Frontend (Vite — prefijo VITE_)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=/api
```

---

## Diseño visual — referencia

Los HTML ya generados son la referencia definitiva del diseño.
Están en `/diseños/` y deben replicarse en React exactamente.

### Tema Bash
- Fondo: #0a0a0a con grid de líneas verde muy tenue
- Superficie: #111111 / #181818
- Acento: #c8f135 (verde neón)
- Tipografía: Syne 800 (headings) + DM Mono (body)
- Bordes: 1px solid #222222
- Métricas: grid 4 columnas, meta resaltada en verde neón sólido

### Tema Eimy
- Fondo: #1a0020 con gradientes radiales pink/purple
- Superficie: #2a0035 / #380045
- Acento: #ff1aab (hot pink)
- Secundario: #9b1dff (purple), #ffe600 (yellow), #00f0ff (cyan)
- Tipografía: Pacifico (headings) + Nunito (body)
- Elementos: border-radius 20px, glitter animado en header
- Opciones de comida: acordeón expandible

### Lista de compras
- Fondo: #0f1117 (dark app)
- Surface: #1a1d27 / #222636
- Acento: #6366f1 (indigo)
- Badges por persona: verde (ambos), azul (Bash), purple (Eimy), naranja (jugos), amarillo (opcional)
- Categorías colapsables con header clickeable
- Progress bar con porcentaje animado
- Frecuencia marcada en categorías de verdura/fruta

---

## Notas importantes del plan nutricional

- Yogur: cualquier marca con mín. 10g proteína/150g, sin azúcar añadida excesiva
- Alternativas al arroz: papa hervida, camote, tortillas extra, pan tostado, espagueti — son OPCIONALES, no reemplazo permanente
- Jugos Bash: 4 jugos, se mantienen sin cambio. Birdman solo post-gym en Rojo de Poder
- Jugos Eimy: 5 jugos (Verde Ligero con apio suave, Digestivo Suave, Naranja Antiinflamatorio con pimienta opcional, Rosa Hidratante, Morado Jamaica con concentrado)
- Jamaica: concentrado casero, dura 1 semana en refri
- Pimienta negra: solo Bash la usa regularmente. En jugos de Eimy es opcional
- Queso con galletas Marías: sustitutos son crema de cacahuate natural, plátano con canela, o yogur como dip
- Jitomate: normal para Bash / cherry/baby para Eimy
- Agua Eimy: beber cuando tenga sed, no forzar cantidad

---

## Sustitutos de ingredientes difíciles

| Ingrediente | Sustituto |
|---|---|
| Menta fresca | Hierbabuena (más fácil en mercado MX) u omitir |
| Zarzamora | Uva morada / arándano / cualquier fruta morada |
| Jamaica seca | Agua de jamaica de sobre sin azúcar (emergencia) |
| Apio | Reducir o omitir — no afecta el plan |
| Betabel | Sin sustituto en plan Bash — es ingrediente clave |

---

## Frecuencia de compras

- **Cada 7 días**: proteínas, lácteos, carbohidratos, latas, especias, semillas
- **Cada 3–4 días**: toda verdura y fruta fresca (jugos y comidas)

---

## Medidas de seguimiento

Ambos: peso, cintura, cadera, cuello, abdomen
Frecuencia: 1 vez por semana, mismo día, misma hora, en ayunas
Nota Eimy: pecho omitido por decisión propia, puede agregarse después

---

## Checklist para el agente CLI — Fase 1

Cuando retomes este proyecto, ejecuta en orden:

1. `cd nutrition-app`
2. Leer este archivo completo
3. Leer `ROADMAP.md` para ver la fase actual
4. Crear el proyecto en Supabase y ejecutar el SQL del esquema
5. Crear el proyecto en Railway
6. Configurar Google OAuth en Supabase (Authentication → Providers → Google)
7. Copiar `.env.example` a `.env` y llenar las variables
8. `cd frontend && npm install`
9. `cd ../backend && pip install -r requirements.txt`
10. Verificar que `npm run dev` levanta el frontend
11. Verificar que `uvicorn backend.main:app --reload` levanta el backend
12. Continuar con la fase indicada en ROADMAP.md
