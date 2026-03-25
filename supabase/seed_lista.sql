-- seed_lista.sql
-- Lista de compras compartida — ejecutar en Supabase SQL Editor
-- No requiere que los usuarios hayan hecho login. Puede ejecutarse en cualquier momento.

-- Limpiar datos previos (opcional, descomenta si quieres empezar limpio)
-- DELETE FROM lista_items;

INSERT INTO lista_items (owner, categoria, nombre, cantidad, badge, frecuencia, nota) VALUES

-- ─── SEMANAL — Proteínas ──────────────────────────────────────────────────
('compartida', 'Proteínas', 'Pechuga de pollo',    '1 kg',      'both',  'semanal',   null),
('compartida', 'Proteínas', 'Carne de res',         '500g',      'both',  'semanal',   'bistec o molida'),
('compartida', 'Proteínas', 'Huevo',                '18–24 pzas','both',  'semanal',   'grado A'),
('compartida', 'Proteínas', 'Atún en agua',         '2 latas',   'eimy',  'semanal',   'lata, escurrido'),
('compartida', 'Proteínas', 'Salmón o tilapia',     '300g',      'opt',   'semanal',   '1 vez por semana'),

-- ─── SEMANAL — Lácteos ───────────────────────────────────────────────────
('compartida', 'Lácteos', 'Yogur griego natural',       '7–10 pzas', 'both',  'semanal', 'mín. 10g proteína/150g · sin azúcar añadida excesiva'),
('compartida', 'Lácteos', 'Queso Oaxaca o asadero',     '150g',      'eimy',  'semanal', 'para quesadillas · porción 20–25g'),
('compartida', 'Lácteos', 'Leche semidescremada',       '500ml',     'opt',   'semanal', 'para cereal o avena'),

-- ─── SEMANAL — Carbohidratos ──────────────────────────────────────────────
('compartida', 'Carbohidratos', 'Avena en hojuela',     '500g',      'both',  'semanal', null),
('compartida', 'Carbohidratos', 'Arroz blanco o integral','500g',    'both',  'semanal', null),
('compartida', 'Carbohidratos', 'Tortillas de maíz',    '1 kg',      'both',  'semanal', null),
('compartida', 'Carbohidratos', 'Pan integral',          '1 barra',   'eimy',  'semanal', 'alternativa a tortillas · <5g azúcar por rebanada'),
('compartida', 'Carbohidratos', 'Espagueti',             '250g',      'eimy',  'semanal', 'alternativa al arroz'),
('compartida', 'Carbohidratos', 'Frijoles negros',       '250g',      'eimy',  'semanal', 'bolsa o lata · sin manteca'),
('compartida', 'Carbohidratos', 'Papa o camote',         '500g',      'opt',   'semanal', 'alternativa al arroz cuando no hay tiempo de cocinar'),

-- ─── SEMANAL — Semillas, aceites y especias ───────────────────────────────
('compartida', 'Semillas y especias', 'Chía',                        '200g',     'juice', 'semanal', null),
('compartida', 'Semillas y especias', 'Aceite de oliva',             '250ml',    'both',  'semanal', null),
('compartida', 'Semillas y especias', 'Nueces o almendras',          '100g',     'eimy',  'semanal', 'colación nocturna'),
('compartida', 'Semillas y especias', 'Jengibre fresco o en polvo',  '1 trozo o frasco', 'juice', 'semanal', 'compra si no tienes'),
('compartida', 'Semillas y especias', 'Cúrcuma en polvo',            '1 frasco', 'juice', 'semanal', 'dura semanas · compra si no tienes'),
('compartida', 'Semillas y especias', 'Pimienta negra molida',       '1 frasco', 'bash',  'semanal', 'dura semanas'),
('compartida', 'Semillas y especias', 'Canela en polvo',             '1 frasco', 'eimy',  'semanal', 'dura semanas'),
('compartida', 'Semillas y especias', 'Menta fresca o hierbabuena',  '1 manojo', 'eimy',  'semanal', 'Rosa Hidratante · puede sustituir por hierbabuena u omitir'),
('compartida', 'Semillas y especias', 'Galletas Marías',             '1 paquete','both',  'semanal', 'snack ocasional'),
('compartida', 'Semillas y especias', 'Crema de cacahuate natural',  '1 frasco', 'eimy',  'semanal', 'snack con galletas · sin azúcar añadida'),

-- ─── 3–4 DÍAS — Verduras comidas ──────────────────────────────────────────
('compartida', 'Verduras', 'Brócoli',                   '500g',      'both',  '3-4 dias', null),
('compartida', 'Verduras', 'Chayote',                   '3 pzas',    'both',  '3-4 dias', null),
('compartida', 'Verduras', 'Jitomate',                  '500g',      'bash',  '3-4 dias', 'para cocinar'),
('compartida', 'Verduras', 'Jitomate cherry/baby',      '250g',      'eimy',  '3-4 dias', 'ensaladas y snacks'),
('compartida', 'Verduras', 'Cebolla blanca',            '3 pzas',    'both',  '3-4 dias', null),
('compartida', 'Verduras', 'Chile',                     '1 manojo',  'both',  '3-4 dias', null),
('compartida', 'Verduras', 'Pepino',                    '4 pzas',    'both',  '3-4 dias', 'también para jugos de Eimy'),
('compartida', 'Verduras', 'Aguacate',                  '2 pzas',    'eimy',  '3-4 dias', null),
('compartida', 'Verduras', 'Lechuga o espinaca baby',   '200g',      'eimy',  '3-4 dias', null),
('compartida', 'Verduras', 'Ejotes o champiñones',      '200g',      'opt',   '3-4 dias', 'acompañamiento para el huevo'),

-- ─── 3–4 DÍAS — Frutas y verduras para jugos ──────────────────────────────
('compartida', 'Frutas y jugos', 'Espinaca',            '300g',      'juice', '3-4 dias', 'Verde Real (Bash) + Verde Ligero (Eimy)'),
('compartida', 'Frutas y jugos', 'Apio',                '1 manojo',  'juice', '3-4 dias', 'Verde Real (Bash) + Verde Ligero (Eimy)'),
('compartida', 'Frutas y jugos', 'Manzana verde',       '6 pzas',    'juice', '3-4 dias', 'jugos ambos + snack'),
('compartida', 'Frutas y jugos', 'Betabel con hojas',   '700g',      'bash',  '3-4 dias', 'Rojo de Poder · sin sustituto'),
('compartida', 'Frutas y jugos', 'Zanahoria',           '1 kg',      'juice', '3-4 dias', 'jugos ambos + comidas'),
('compartida', 'Frutas y jugos', 'Piña',                '1 pieza med.','juice','3-4 dias', 'Antiinflamatorio + Digestivo'),
('compartida', 'Frutas y jugos', 'Limones',             '12 pzas',   'juice', '3-4 dias', null),
('compartida', 'Frutas y jugos', 'Plátano',             '6 pzas',    'both',  '3-4 dias', 'desayuno + colación'),
('compartida', 'Frutas y jugos', 'Sandía',              '½ pieza',   'eimy',  '3-4 dias', 'Rosa Hidratante + snack tajín'),
('compartida', 'Frutas y jugos', 'Uva morada o zarzamora','150g',    'eimy',  '3-4 dias', 'Morado Jamaica'),
('compartida', 'Frutas y jugos', 'Jamaica seca',        '50g',       'eimy',  '3-4 dias', 'concentrado — dura 1 semana en refri');
