# DATA.md — Seed data completo

## Instrucciones
Este archivo contiene todos los datos del plan nutricional para insertar en Supabase.
Ejecutar los scripts de seed DESPUÉS de que los usuarios hayan hecho login por primera vez
(para tener sus UUIDs disponibles) o usar el campo `theme` para asignar por perfil.

---

## Lista de compras — todos los items

### owner: 'compartida' — frecuencia: semanal

#### Proteínas
| nombre | cantidad | badge | nota |
|---|---|---|---|
| Pechuga de pollo | 1 kg | Para los dos | |
| Carne de res | 500g | Para los dos | bistec o molida |
| Huevo | 18–24 pzas | Para los dos | grado A |
| Atún en agua | 2 latas | Eimy | lata, escurrido |
| Salmón o tilapia | 300g | Opcional | 1 vez por semana |

#### Lácteos
| nombre | cantidad | badge | nota |
|---|---|---|---|
| Yogur griego natural | 7–10 pzas | Para los dos | mín. 10g proteína/150g · sin azúcar añadida excesiva |
| Queso Oaxaca o asadero | 150g | Eimy | para quesadillas · porción 20–25g |
| Leche semidescremada | 500ml | Opcional | para cereal o avena |

#### Carbohidratos
| nombre | cantidad | badge | nota |
|---|---|---|---|
| Avena en hojuela | 500g | Para los dos | |
| Arroz blanco o integral | 500g | Para los dos | |
| Tortillas de maíz | 1 kg | Para los dos | |
| Pan integral | 1 barra | Eimy | alternativa a tortillas · <5g azúcar por rebanada |
| Espagueti | 250g | Eimy | alternativa al arroz |
| Frijoles negros | 250g | Eimy | bolsa o lata · sin manteca |
| Papa o camote | 500g | Opcional | alternativa al arroz cuando no hay tiempo de cocinarlo |

#### Semillas, aceites y especias (semanal)
| nombre | cantidad | badge | nota |
|---|---|---|---|
| Chía | 200g | Jugos | |
| Aceite de oliva | 250ml | Para los dos | |
| Nueces o almendras | 100g | Eimy | colación nocturna |
| Jengibre fresco o en polvo | 1 trozo/frasco | Jugos | compra si no tienes |
| Cúrcuma en polvo | 1 frasco | Jugos | dura semanas · compra si no tienes |
| Pimienta negra molida | 1 frasco | Bash | dura semanas |
| Canela en polvo | 1 frasco | Eimy | dura semanas |
| Menta fresca o hierbabuena | 1 manojo | Eimy | Rosa Hidratante |
| Galletas Marías | 1 paquete | Para los dos | snack ocasional |
| Crema de cacahuate natural | 1 frasco | Eimy | snack con galletas · sin azúcar añadida |

---

### owner: 'compartida' — frecuencia: 3-4 dias

#### Verduras — comidas
| nombre | cantidad | badge | nota |
|---|---|---|---|
| Brócoli | 500g | Para los dos | |
| Chayote | 3 pzas | Para los dos | |
| Jitomate | 500g | Bash | para cocinar |
| Jitomate cherry/baby | 250g | Eimy | ensaladas y snacks |
| Cebolla blanca | 3 pzas | Para los dos | |
| Chile | 1 manojo | Para los dos | |
| Pepino | 4 pzas | Para los dos | también para jugos de Eimy |
| Aguacate | 2 pzas | Eimy | |
| Lechuga o espinaca baby | 200g | Eimy | |
| Ejotes o champiñones | 200g | Opcional | acompañamiento para el huevo |

#### Frutas y verduras — jugos
| nombre | cantidad | badge | nota |
|---|---|---|---|
| Espinaca | 300g | Jugos | Verde Real (Bash) + Verde Ligero (Eimy) |
| Apio | 1 manojo | Jugos | Verde Real (Bash) + Verde Ligero (Eimy) |
| Manzana verde | 6 pzas | Jugos | jugos ambos + snack |
| Betabel con hojas | 700g | Bash | Rojo de Poder |
| Zanahoria | 1 kg | Jugos | jugos ambos + comidas |
| Piña | 1 pieza med. | Jugos | Antiinflamatorio + Digestivo |
| Limones | 12 pzas | Jugos | |
| Plátano | 6 pzas | Para los dos | desayuno + colación |
| Sandía | ½ pieza | Eimy | Rosa Hidratante + snack tajín |
| Uva morada o zarzamora | 150g | Eimy | Morado Jamaica |
| Jamaica seca | 50g | Eimy | concentrado — dura 1 semana en refri |

---

## Plan nutricional — Bash

### Comidas

#### Desayuno (~500 kcal)
```json
[
  { "nombre": "Avena en hojuela", "cantidad": "60", "unidad": "g", "kcal": 220, "tip": "Acompaña con: canela, miel mínima o fruta picada encima" },
  { "nombre": "Yogur griego natural", "cantidad": "150", "unidad": "g", "kcal": 100, "tip": "Cualquier marca · mín. 10g proteína/150g · sin azúcar añadida excesiva" },
  { "nombre": "Plátano", "cantidad": "1", "unidad": "pieza", "kcal": 90, "tip": "" },
  { "nombre": "Chía", "cantidad": "15", "unidad": "g", "kcal": 75, "tip": "" },
  { "nombre": "Jugo Verde Real o Rojo de Poder", "cantidad": "1", "unidad": "vaso", "kcal": 80, "tip": "Sin Birdman por la mañana" }
]
```

#### Comida (~620 kcal)
```json
[
  { "nombre": "Pechuga de pollo o bistec de res", "cantidad": "150", "unidad": "g", "kcal": 275, "tip": "Acompaña con: limón, ajo asado, salsa verde, nopales o champiñones" },
  { "nombre": "Arroz cocido", "cantidad": "100", "unidad": "g", "kcal": 130, "tip": "Blanco o integral · ver alternativas si no hay tiempo" },
  { "nombre": "Brócoli o chayote al vapor", "cantidad": "150", "unidad": "g", "kcal": 50, "tip": "Acompaña con: gotas de limón y sal, o salteado con ajo" },
  { "nombre": "Aceite de oliva", "cantidad": "5", "unidad": "ml", "kcal": 45, "tip": "" },
  { "nombre": "Tortilla de maíz", "cantidad": "1", "unidad": "pieza", "kcal": 60, "tip": "Opcional si ya tienes el arroz" }
]
```

#### Cena (~380 kcal)
```json
[
  { "nombre": "Huevo entero", "cantidad": "3", "unidad": "piezas", "kcal": 210, "tip": "Acompaña con: frijoles, nopales, champiñones, aguacate en rodajas o espinaca salteada" },
  { "nombre": "Tortillas de maíz", "cantidad": "2", "unidad": "piezas", "kcal": 120, "tip": "" },
  { "nombre": "Jitomate + cebolla + chile", "cantidad": null, "unidad": "al gusto", "kcal": 30, "tip": "" }
]
```

#### Alternativas al arroz
```json
[
  { "nombre": "Papa hervida", "cantidad": "150", "unidad": "g", "prep": "Hervir en agua 15 min, sin vigilar" },
  { "nombre": "Camote hervido", "cantidad": "130", "unidad": "g", "prep": "15–20 min · más fibra" },
  { "nombre": "Tortillas extra", "cantidad": "2", "unidad": "piezas", "prep": "Sin cocción" },
  { "nombre": "Espagueti cocido", "cantidad": "70", "unidad": "g", "prep": "Mismas calorías aprox. · salsa jitomate natural" }
]
```

### Jugos Bash
```json
[
  {
    "nombre": "Verde Real",
    "subtitulo": "Enfoque y Magnesio",
    "emoji": null,
    "ingredientes": [
      { "nombre": "Espinaca (hojas y tallos)", "cantidad": "60", "unidad": "g" },
      { "nombre": "Apio (hojas y tallos)", "cantidad": "100", "unidad": "g" },
      { "nombre": "Manzana verde (con cáscara)", "cantidad": "140", "unidad": "g" },
      { "nombre": "Jugo de limón", "cantidad": "30", "unidad": "g" },
      { "nombre": "Agua", "cantidad": "250", "unidad": "ml" }
    ],
    "nota": null
  },
  {
    "nombre": "Rojo de Poder",
    "subtitulo": "Pre-entreno / Nitratos",
    "emoji": null,
    "ingredientes": [
      { "nombre": "Betabel (raíz rebanada)", "cantidad": "80", "unidad": "g" },
      { "nombre": "Hojas y tallos de betabel", "cantidad": "70–100", "unidad": "g" },
      { "nombre": "Zanahoria", "cantidad": "120", "unidad": "g" },
      { "nombre": "Jengibre en polvo", "cantidad": "1–2", "unidad": "g" },
      { "nombre": "Chía", "cantidad": "15", "unidad": "g" },
      { "nombre": "Agua", "cantidad": "300–350", "unidad": "ml" }
    ],
    "nota": "+ 1.5 scoops Birdman post-gym"
  },
  {
    "nombre": "Antiinflamatorio",
    "subtitulo": "Recuperación",
    "emoji": null,
    "ingredientes": [
      { "nombre": "Zanahoria", "cantidad": "150", "unidad": "g" },
      { "nombre": "Piña", "cantidad": "100", "unidad": "g" },
      { "nombre": "Cúrcuma fresca (o 2g polvo)", "cantidad": "5", "unidad": "g" },
      { "nombre": "Pimienta negra (activa la cúrcuma)", "cantidad": null, "unidad": "pizca" },
      { "nombre": "Agua", "cantidad": "200", "unidad": "ml" }
    ],
    "nota": null
  },
  {
    "nombre": "Digestivo",
    "subtitulo": "Saciedad / Control de peso",
    "emoji": null,
    "ingredientes": [
      { "nombre": "Pepino (con cáscara)", "cantidad": "150", "unidad": "g" },
      { "nombre": "Piña", "cantidad": "120", "unidad": "g" },
      { "nombre": "Chía hidratada", "cantidad": "15", "unidad": "g" },
      { "nombre": "Jengibre fresco (o 1g polvo)", "cantidad": "5", "unidad": "g" },
      { "nombre": "Agua", "cantidad": "300", "unidad": "ml" }
    ],
    "nota": null
  }
]
```

---

## Plan nutricional — Eimy

### Desayunos (5 opciones rotativas)
Ver plan_eimy.html para referencia visual completa.

Opciones: A (Huevo con tortilla/pan), B (Avena overnight), C (Tostadas aguacate), D (Bowl yogur), E (Quesadilla)

### Comidas (6 opciones rotativas)
Opciones: A (Pollo+arroz), B (Sopa aguada), C (Espagueti), D (Pescado), E (Tacos res), F (Bowl atún)

### Jugos Eimy
```json
[
  {
    "nombre": "Verde Ligero",
    "subtitulo": "Para abrir el día",
    "emoji": "🌿",
    "ingredientes": [
      { "nombre": "Espinaca", "cantidad": "40", "unidad": "g" },
      { "nombre": "Apio (tallos)", "cantidad": "60", "unidad": "g" },
      { "nombre": "Manzana verde", "cantidad": "100", "unidad": "g" },
      { "nombre": "Jugo de limón", "cantidad": "20", "unidad": "g" },
      { "nombre": "Agua", "cantidad": "200", "unidad": "ml" }
    ],
    "nota": "Suave, con poco apio"
  },
  {
    "nombre": "Digestivo Suave",
    "subtitulo": "Después de la comida",
    "emoji": "🥒",
    "ingredientes": [
      { "nombre": "Pepino con cáscara", "cantidad": "120", "unidad": "g" },
      { "nombre": "Piña", "cantidad": "100", "unidad": "g" },
      { "nombre": "Chía hidratada", "cantidad": "10", "unidad": "g" },
      { "nombre": "Agua", "cantidad": "250", "unidad": "ml" },
      { "nombre": "Jengibre (opcional)", "cantidad": null, "unidad": "poquito" }
    ],
    "nota": "Ayuda con digestión lenta"
  },
  {
    "nombre": "Naranja Antiinflamatorio",
    "subtitulo": "Dulce y fácil",
    "emoji": "🧡",
    "ingredientes": [
      { "nombre": "Zanahoria", "cantidad": "120", "unidad": "g" },
      { "nombre": "Piña", "cantidad": "80", "unidad": "g" },
      { "nombre": "Cúrcuma en polvo", "cantidad": "1", "unidad": "g" },
      { "nombre": "Pimienta (opcional)", "cantidad": null, "unidad": "pizca" },
      { "nombre": "Agua", "cantidad": "180", "unidad": "ml" }
    ],
    "nota": "La pimienta es opcional — activa la cúrcuma pero se puede omitir"
  },
  {
    "nombre": "Rosa Hidratante",
    "subtitulo": "Días calurosos",
    "emoji": "🌸",
    "ingredientes": [
      { "nombre": "Sandía sin semilla", "cantidad": "150", "unidad": "g" },
      { "nombre": "Pepino con cáscara", "cantidad": "100", "unidad": "g" },
      { "nombre": "Jugo de limón", "cantidad": "15", "unidad": "g" },
      { "nombre": "Menta o hierbabuena fresca", "cantidad": null, "unidad": "unas hojas" },
      { "nombre": "Agua", "cantidad": "150", "unidad": "ml" }
    ],
    "nota": "~50 kcal · ligero y muy refrescante"
  },
  {
    "nombre": "Morado Jamaica",
    "subtitulo": "Antioxidante",
    "emoji": "💜",
    "ingredientes": [
      { "nombre": "Concentrado de jamaica", "cantidad": "80", "unidad": "ml" },
      { "nombre": "Uva morada o zarzamora", "cantidad": "80", "unidad": "g" },
      { "nombre": "Manzana verde", "cantidad": "80", "unidad": "g" },
      { "nombre": "Jugo de limón", "cantidad": "15", "unidad": "g" },
      { "nombre": "Agua", "cantidad": "150", "unidad": "ml" }
    ],
    "nota": "Concentrado: hervir jamaica en poca agua, guardar en refri hasta 1 semana"
  }
]
```

---

## Métricas calóricas

### Bash
- TMB: 1,750 kcal
- TDEE: 2,100 kcal
- Meta: 1,700 kcal (déficit -400)
- Meta con gym: 1,850 kcal

### Eimy
- TMB: 1,380 kcal
- TDEE: 1,650 kcal
- Meta: 1,300 kcal (déficit -350)
- Meta con gym: 1,400 kcal
- Mínimo absoluto: 1,200 kcal
