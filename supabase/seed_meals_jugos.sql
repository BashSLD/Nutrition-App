-- seed_meals_jugos.sql
-- Meals y Jugos para Bash y Eimy
-- IMPORTANTE: Ejecutar DESPUÉS de que ambos usuarios hayan hecho login al menos una vez
-- (para que sus registros existan en la tabla profiles)

DO $$
DECLARE
  bash_id uuid;
  eimy_id uuid;
BEGIN
  SELECT id INTO bash_id FROM profiles WHERE theme = 'bash' LIMIT 1;
  SELECT id INTO eimy_id FROM profiles WHERE theme = 'eimy' LIMIT 1;

  IF bash_id IS NULL THEN
    RAISE NOTICE 'Usuario Bash no encontrado — asegúrate de que haya hecho login primero.';
  END IF;
  IF eimy_id IS NULL THEN
    RAISE NOTICE 'Usuario Eimy no encontrado — asegúrate de que haya hecho login primero.';
  END IF;

  -- ══════════════════════════════════════════════════════════════
  --  LIMPIAR DATOS PREVIOS (descomenta si quieres reiniciar)
  -- ══════════════════════════════════════════════════════════════
  -- DELETE FROM meals WHERE user_id IN (bash_id, eimy_id);
  -- DELETE FROM jugos WHERE user_id IN (bash_id, eimy_id);

  -- ══════════════════════════════════════════════════════════════
  --  BASH — MEALS
  -- ══════════════════════════════════════════════════════════════

  IF bash_id IS NOT NULL THEN

    -- Desayuno (~565 kcal)
    INSERT INTO meals (user_id, tipo, nombre, ingredientes, kcal_total, orden) VALUES (
      bash_id, 'desayuno', 'Desayuno',
      '[
        {"nombre":"Avena en hojuela","cantidad":"60","unidad":"g","kcal":220,"tip":"Acompaña con: canela, miel mínima o fruta picada encima"},
        {"nombre":"Yogur griego natural","cantidad":"150","unidad":"g","kcal":100,"tip":"Cualquier marca · mín. 10g proteína/150g · sin azúcar añadida excesiva"},
        {"nombre":"Plátano","cantidad":"1","unidad":"pieza","kcal":90,"tip":""},
        {"nombre":"Chía","cantidad":"15","unidad":"g","kcal":75,"tip":""},
        {"nombre":"Jugo Verde Real o Rojo de Poder","cantidad":"1","unidad":"vaso","kcal":80,"tip":"Sin Birdman por la mañana"}
      ]'::jsonb,
      565, 1
    );

    -- Comida (~560 kcal)
    INSERT INTO meals (user_id, tipo, nombre, ingredientes, kcal_total, orden) VALUES (
      bash_id, 'comida', 'Comida',
      '[
        {"nombre":"Pechuga de pollo o bistec de res","cantidad":"150","unidad":"g","kcal":275,"tip":"Acompaña con: limón, ajo asado, salsa verde, nopales o champiñones"},
        {"nombre":"Arroz cocido","cantidad":"100","unidad":"g","kcal":130,"tip":"Blanco o integral · ver alternativas si no hay tiempo"},
        {"nombre":"Brócoli o chayote al vapor","cantidad":"150","unidad":"g","kcal":50,"tip":"Acompaña con: gotas de limón y sal, o salteado con ajo"},
        {"nombre":"Aceite de oliva","cantidad":"5","unidad":"ml","kcal":45,"tip":""},
        {"nombre":"Tortilla de maíz","cantidad":"1","unidad":"pieza","kcal":60,"tip":"Opcional si ya tienes el arroz"}
      ]'::jsonb,
      560, 2
    );

    -- Cena (~360 kcal)
    INSERT INTO meals (user_id, tipo, nombre, ingredientes, kcal_total, orden) VALUES (
      bash_id, 'cena', 'Cena',
      '[
        {"nombre":"Huevo entero","cantidad":"3","unidad":"piezas","kcal":210,"tip":"Acompaña con: frijoles, nopales, champiñones, aguacate en rodajas o espinaca salteada"},
        {"nombre":"Tortillas de maíz","cantidad":"2","unidad":"piezas","kcal":120,"tip":""},
        {"nombre":"Jitomate + cebolla + chile","cantidad":null,"unidad":"al gusto","kcal":30,"tip":""}
      ]'::jsonb,
      360, 3
    );

  END IF; -- bash meals

  -- ══════════════════════════════════════════════════════════════
  --  EIMY — MEALS
  -- ══════════════════════════════════════════════════════════════

  IF eimy_id IS NOT NULL THEN

    -- ── Desayunos (5 opciones rotativas) ──────────────────────

    INSERT INTO meals (user_id, tipo, nombre, ingredientes, kcal_total, orden) VALUES (
      eimy_id, 'desayuno', 'Huevo con tortilla o pan tostado',
      '[
        {"nombre":"Huevo entero","cantidad":"2","unidad":"piezas","kcal":140,"tip":"Acompaña con: nopales, champiñones salteados, frijoles, aguacate o espinaca"},
        {"nombre":"Tortilla de maíz o pan tostado integral","cantidad":"1–2","unidad":"piezas","kcal":70,"tip":"Pan tostado: buscar menos de 5g azúcar por rebanada"},
        {"nombre":"Espinaca salteada","cantidad":"50","unidad":"g","kcal":15,"tip":""},
        {"nombre":"Jitomate","cantidad":null,"unidad":"al gusto","kcal":15,"tip":""},
        {"nombre":"Yogur griego natural","cantidad":"150","unidad":"g","kcal":100,"tip":"Cualquier marca · mín. 10g proteína/150g"},
        {"nombre":"Jugo Verde Ligero","cantidad":"1","unidad":"vaso","kcal":60,"tip":""}
      ]'::jsonb,
      400, 1
    );

    INSERT INTO meals (user_id, tipo, nombre, ingredientes, kcal_total, orden) VALUES (
      eimy_id, 'desayuno', 'Avena cremosa con fruta',
      '[
        {"nombre":"Avena en hojuela","cantidad":"40","unidad":"g","kcal":148,"tip":"Acompaña con: canela, fruta picada encima"},
        {"nombre":"Yogur griego natural","cantidad":"150","unidad":"g","kcal":100,"tip":"Cualquier marca · mín. 10g proteína/150g"},
        {"nombre":"Plátano en rodajas","cantidad":"½","unidad":"pieza","kcal":45,"tip":""},
        {"nombre":"Chía","cantidad":"10","unidad":"g","kcal":50,"tip":""},
        {"nombre":"Canela al gusto","cantidad":null,"unidad":"—","kcal":0,"tip":""},
        {"nombre":"Jugo Naranja Antiinflamatorio","cantidad":"1","unidad":"vaso","kcal":65,"tip":""}
      ]'::jsonb,
      408, 2
    );

    INSERT INTO meals (user_id, tipo, nombre, ingredientes, kcal_total, orden) VALUES (
      eimy_id, 'desayuno', 'Tostadas de aguacate con huevo',
      '[
        {"nombre":"Tortillas tostadas o pan integral tostado","cantidad":"2","unidad":"piezas","kcal":120,"tip":"2 tortillas o 2 rebanadas de pan integral"},
        {"nombre":"Aguacate","cantidad":"40","unidad":"g (¼ pieza)","kcal":64,"tip":""},
        {"nombre":"Huevo pochado o estrellado","cantidad":"1","unidad":"pieza","kcal":70,"tip":"Acompaña con: jitomate cherry, champiñones o espinaca baby encima"},
        {"nombre":"Jitomate cherry + sal + limón","cantidad":null,"unidad":"al gusto","kcal":15,"tip":""},
        {"nombre":"Jugo Verde Ligero","cantidad":"1","unidad":"vaso","kcal":60,"tip":""}
      ]'::jsonb,
      329, 3
    );

    INSERT INTO meals (user_id, tipo, nombre, ingredientes, kcal_total, orden) VALUES (
      eimy_id, 'desayuno', 'Bowl de yogur con granola',
      '[
        {"nombre":"Yogur griego natural","cantidad":"150","unidad":"g","kcal":100,"tip":""},
        {"nombre":"Avena tostada en sartén seca","cantidad":"25","unidad":"g","kcal":92,"tip":"Acompaña con: fruta picada, miel mínima o canela"},
        {"nombre":"Manzana verde picada","cantidad":"80","unidad":"g","kcal":42,"tip":""},
        {"nombre":"Chía","cantidad":"10","unidad":"g","kcal":50,"tip":""},
        {"nombre":"Miel (opcional)","cantidad":"5","unidad":"g","kcal":15,"tip":""},
        {"nombre":"Jugo Digestivo Suave","cantidad":"1","unidad":"vaso","kcal":70,"tip":""}
      ]'::jsonb,
      369, 4
    );

    INSERT INTO meals (user_id, tipo, nombre, ingredientes, kcal_total, orden) VALUES (
      eimy_id, 'desayuno', 'Quesadilla ligera con huevo',
      '[
        {"nombre":"Tortilla de maíz o pan tostado","cantidad":"2","unidad":"piezas","kcal":120,"tip":""},
        {"nombre":"Huevo revuelto","cantidad":"2","unidad":"piezas","kcal":140,"tip":"Acompaña con: frijoles, nopales o champiñones para que no sea solo huevo"},
        {"nombre":"Queso Oaxaca","cantidad":"20–25","unidad":"g","kcal":60,"tip":"Reducir cantidad porque tiene más grasa que el panela"},
        {"nombre":"Chile + epazote al gusto","cantidad":null,"unidad":"—","kcal":5,"tip":""},
        {"nombre":"Yogur griego natural (aparte)","cantidad":"150","unidad":"g","kcal":100,"tip":""}
      ]'::jsonb,
      425, 5
    );

    -- ── Comidas (6 opciones rotativas) ────────────────────────

    INSERT INTO meals (user_id, tipo, nombre, ingredientes, kcal_total, orden) VALUES (
      eimy_id, 'comida', 'Pollo a la plancha con arroz',
      '[
        {"nombre":"Pechuga de pollo","cantidad":"120","unidad":"g","kcal":200,"tip":"Acompaña con: limón, ajo, salsa verde o pico de gallo"},
        {"nombre":"Arroz cocido","cantidad":"70","unidad":"g","kcal":91,"tip":"Ver alternativas al arroz si no hay tiempo de cocinar"},
        {"nombre":"Ensalada (lechuga, jitomate, pepino)","cantidad":null,"unidad":"libre","kcal":30,"tip":""},
        {"nombre":"Aceite de oliva","cantidad":"5","unidad":"ml","kcal":45,"tip":""},
        {"nombre":"Jugo Digestivo Suave","cantidad":"1","unidad":"vaso","kcal":70,"tip":""}
      ]'::jsonb,
      436, 1
    );

    INSERT INTO meals (user_id, tipo, nombre, ingredientes, kcal_total, orden) VALUES (
      eimy_id, 'comida', 'Sopa aguada de verduras con pollo',
      '[
        {"nombre":"Pollo desmenuzado (hervido)","cantidad":"100","unidad":"g","kcal":165,"tip":"Acompaña con: chile, cilantro, limón al servir"},
        {"nombre":"Chayote + zanahoria + calabaza","cantidad":"200","unidad":"g total","kcal":60,"tip":""},
        {"nombre":"Caldo de pollo natural (sin sal extra)","cantidad":"300","unidad":"ml","kcal":30,"tip":""},
        {"nombre":"Tortilla de maíz o pan tostado","cantidad":"1","unidad":"pieza","kcal":60,"tip":""}
      ]'::jsonb,
      315, 2
    );

    INSERT INTO meals (user_id, tipo, nombre, ingredientes, kcal_total, orden) VALUES (
      eimy_id, 'comida', 'Espagueti con jitomate y pollo',
      '[
        {"nombre":"Espagueti cocido","cantidad":"70","unidad":"g","kcal":110,"tip":"Salsa jitomate natural con ajo y cebolla — evitar crema o queso rallado encima"},
        {"nombre":"Pechuga de pollo desmenuzada","cantidad":"100","unidad":"g","kcal":165,"tip":""},
        {"nombre":"Salsa jitomate natural (jitomate + ajo + cebolla)","cantidad":null,"unidad":"al gusto","kcal":40,"tip":""},
        {"nombre":"Aceite de oliva","cantidad":"5","unidad":"ml","kcal":45,"tip":""}
      ]'::jsonb,
      360, 3
    );

    INSERT INTO meals (user_id, tipo, nombre, ingredientes, kcal_total, orden) VALUES (
      eimy_id, 'comida', 'Pescado al limón con verdura',
      '[
        {"nombre":"Tilapia o salmón","cantidad":"120","unidad":"g","kcal":200,"tip":"Acompaña con: ensalada de pepino y jitomate, o verdura al vapor"},
        {"nombre":"Brócoli o ejotes salteados","cantidad":"150","unidad":"g","kcal":55,"tip":""},
        {"nombre":"Arroz cocido o espagueti","cantidad":"60","unidad":"g","kcal":78,"tip":""},
        {"nombre":"Limón + ajo + sal + aceite","cantidad":null,"unidad":"al gusto","kcal":55,"tip":""}
      ]'::jsonb,
      388, 4
    );

    INSERT INTO meals (user_id, tipo, nombre, ingredientes, kcal_total, orden) VALUES (
      eimy_id, 'comida', 'Tacos de res con frijoles',
      '[
        {"nombre":"Bistec de res en tiras","cantidad":"100","unidad":"g","kcal":200,"tip":"Acompaña con: salsa verde, limón, cilantro y cebolla"},
        {"nombre":"Tortillas de maíz","cantidad":"2","unidad":"piezas","kcal":120,"tip":""},
        {"nombre":"Frijoles negros (sin manteca)","cantidad":"60","unidad":"g","kcal":80,"tip":""},
        {"nombre":"Jitomate + cebolla + cilantro","cantidad":null,"unidad":"al gusto","kcal":20,"tip":""}
      ]'::jsonb,
      420, 5
    );

    INSERT INTO meals (user_id, tipo, nombre, ingredientes, kcal_total, orden) VALUES (
      eimy_id, 'comida', 'Bowl de atún sin cocción',
      '[
        {"nombre":"Atún en agua (escurrido)","cantidad":"100","unidad":"g","kcal":116,"tip":"Acompaña con: aguacate, pepino o ensalada de jitomate"},
        {"nombre":"Pepino en rodajas","cantidad":"100","unidad":"g","kcal":15,"tip":""},
        {"nombre":"Aguacate","cantidad":"40","unidad":"g","kcal":64,"tip":""},
        {"nombre":"Arroz cocido","cantidad":"60","unidad":"g","kcal":78,"tip":""},
        {"nombre":"Limón + sal + chile en polvo","cantidad":null,"unidad":"al gusto","kcal":10,"tip":"Sin cocción · perfecta para días calurosos o sin ganas de cocinar"}
      ]'::jsonb,
      283, 6
    );

    -- ── Snacks (3 opciones) ───────────────────────────────────

    INSERT INTO meals (user_id, tipo, nombre, ingredientes, kcal_total, orden) VALUES (
      eimy_id, 'snack', 'Fruta o verdura con tajín y limón',
      '[
        {"nombre":"Fruta o verdura al gusto","cantidad":"~150","unidad":"g","kcal":70,"tip":"Pepino · jícama · sandía · mango · zanahoria · melón · naranja — lo que haya o se antoje"},
        {"nombre":"Tajín + limón","cantidad":null,"unidad":"al gusto","kcal":5,"tip":"Con chamoy va bien pero cuidar cantidad — tiene mucho sodio"}
      ]'::jsonb,
      75, 1
    );

    INSERT INTO meals (user_id, tipo, nombre, ingredientes, kcal_total, orden) VALUES (
      eimy_id, 'snack', 'Galletas Marías con dip',
      '[
        {"nombre":"Galletas Marías","cantidad":"3","unidad":"galletas","kcal":60,"tip":"Máximo 3 galletas · combinar con algo para no disparar hambre"},
        {"nombre":"Elige uno: crema de cacahuate natural","cantidad":"10","unidad":"g","kcal":60,"tip":"1 cucharadita sobre las galletas — rico y saciante"},
        {"nombre":"O: plátano con canela","cantidad":"½","unidad":"plátano","kcal":45,"tip":"Rodajas sobre las galletas · dulce natural"},
        {"nombre":"O: yogur griego como dip","cantidad":"50","unidad":"g","kcal":33,"tip":"Las galletas como cuchara con el yogur"}
      ]'::jsonb,
      110, 2
    );

    INSERT INTO meals (user_id, tipo, nombre, ingredientes, kcal_total, orden) VALUES (
      eimy_id, 'snack', 'Cereal con leche',
      '[
        {"nombre":"Cereal","cantidad":"25","unidad":"g","kcal":90,"tip":"Buscar: menos de 8g azúcar por porción y más de 3g de fibra"},
        {"nombre":"Leche semidescremada","cantidad":"100","unidad":"ml","kcal":50,"tip":"Medio vaso · contarla dentro del total del día"}
      ]'::jsonb,
      140, 3
    );

  END IF; -- eimy meals

  -- ══════════════════════════════════════════════════════════════
  --  BASH — JUGOS
  -- ══════════════════════════════════════════════════════════════

  IF bash_id IS NOT NULL THEN

    INSERT INTO jugos (user_id, nombre, subtitulo, emoji, ingredientes, nota, orden) VALUES (
      bash_id, 'Verde Real', 'Enfoque y Magnesio', null,
      '[
        {"nombre":"Espinaca (hojas y tallos)","cantidad":"60","unidad":"g"},
        {"nombre":"Apio (hojas y tallos)","cantidad":"100","unidad":"g"},
        {"nombre":"Manzana verde (con cáscara)","cantidad":"140","unidad":"g"},
        {"nombre":"Jugo de limón","cantidad":"30","unidad":"g"},
        {"nombre":"Agua","cantidad":"250","unidad":"ml"}
      ]'::jsonb,
      null, 1
    );

    INSERT INTO jugos (user_id, nombre, subtitulo, emoji, ingredientes, nota, orden) VALUES (
      bash_id, 'Rojo de Poder', 'Pre-entreno / Nitratos', null,
      '[
        {"nombre":"Betabel (raíz rebanada)","cantidad":"80","unidad":"g"},
        {"nombre":"Hojas y tallos de betabel","cantidad":"70–100","unidad":"g"},
        {"nombre":"Zanahoria","cantidad":"120","unidad":"g"},
        {"nombre":"Jengibre en polvo","cantidad":"1–2","unidad":"g"},
        {"nombre":"Chía","cantidad":"15","unidad":"g"},
        {"nombre":"Agua","cantidad":"300–350","unidad":"ml"}
      ]'::jsonb,
      '+ 1.5 scoops Birdman post-gym', 2
    );

    INSERT INTO jugos (user_id, nombre, subtitulo, emoji, ingredientes, nota, orden) VALUES (
      bash_id, 'Antiinflamatorio', 'Recuperación', null,
      '[
        {"nombre":"Zanahoria","cantidad":"150","unidad":"g"},
        {"nombre":"Piña","cantidad":"100","unidad":"g"},
        {"nombre":"Cúrcuma fresca (o 2g polvo)","cantidad":"5","unidad":"g"},
        {"nombre":"Pimienta negra (activa la cúrcuma)","cantidad":null,"unidad":"pizca"},
        {"nombre":"Agua","cantidad":"200","unidad":"ml"}
      ]'::jsonb,
      null, 3
    );

    INSERT INTO jugos (user_id, nombre, subtitulo, emoji, ingredientes, nota, orden) VALUES (
      bash_id, 'Digestivo', 'Saciedad / Control de peso', null,
      '[
        {"nombre":"Pepino (con cáscara)","cantidad":"150","unidad":"g"},
        {"nombre":"Piña","cantidad":"120","unidad":"g"},
        {"nombre":"Chía hidratada","cantidad":"15","unidad":"g"},
        {"nombre":"Jengibre fresco (o 1g polvo)","cantidad":"5","unidad":"g"},
        {"nombre":"Agua","cantidad":"300","unidad":"ml"}
      ]'::jsonb,
      null, 4
    );

  END IF; -- bash jugos

  -- ══════════════════════════════════════════════════════════════
  --  EIMY — JUGOS
  -- ══════════════════════════════════════════════════════════════

  IF eimy_id IS NOT NULL THEN

    INSERT INTO jugos (user_id, nombre, subtitulo, emoji, ingredientes, nota, orden) VALUES (
      eimy_id, 'Verde Ligero', 'Para abrir el día', '🌿',
      '[
        {"nombre":"Espinaca","cantidad":"40","unidad":"g"},
        {"nombre":"Apio (tallos)","cantidad":"60","unidad":"g"},
        {"nombre":"Manzana verde","cantidad":"100","unidad":"g"},
        {"nombre":"Jugo de limón","cantidad":"20","unidad":"g"},
        {"nombre":"Agua","cantidad":"200","unidad":"ml"}
      ]'::jsonb,
      'Suave, con poco apio ✨', 1
    );

    INSERT INTO jugos (user_id, nombre, subtitulo, emoji, ingredientes, nota, orden) VALUES (
      eimy_id, 'Digestivo Suave', 'Después de la comida', '🥒',
      '[
        {"nombre":"Pepino con cáscara","cantidad":"120","unidad":"g"},
        {"nombre":"Piña","cantidad":"100","unidad":"g"},
        {"nombre":"Chía hidratada","cantidad":"10","unidad":"g"},
        {"nombre":"Agua","cantidad":"250","unidad":"ml"},
        {"nombre":"Jengibre (opcional)","cantidad":null,"unidad":"poquito"}
      ]'::jsonb,
      'Ayuda con digestión lenta', 2
    );

    INSERT INTO jugos (user_id, nombre, subtitulo, emoji, ingredientes, nota, orden) VALUES (
      eimy_id, 'Naranja Antiinflamatorio', 'Dulce y fácil', '🧡',
      '[
        {"nombre":"Zanahoria","cantidad":"120","unidad":"g"},
        {"nombre":"Piña","cantidad":"80","unidad":"g"},
        {"nombre":"Cúrcuma en polvo","cantidad":"1","unidad":"g"},
        {"nombre":"Pimienta (opcional)","cantidad":null,"unidad":"pizca"},
        {"nombre":"Agua","cantidad":"180","unidad":"ml"}
      ]'::jsonb,
      'La pimienta es opcional — activa la cúrcuma pero se puede omitir', 3
    );

    INSERT INTO jugos (user_id, nombre, subtitulo, emoji, ingredientes, nota, orden) VALUES (
      eimy_id, 'Rosa Hidratante', 'Días calurosos', '🌸',
      '[
        {"nombre":"Sandía sin semilla","cantidad":"150","unidad":"g"},
        {"nombre":"Pepino con cáscara","cantidad":"100","unidad":"g"},
        {"nombre":"Jugo de limón","cantidad":"15","unidad":"g"},
        {"nombre":"Menta o hierbabuena fresca","cantidad":null,"unidad":"unas hojas"},
        {"nombre":"Agua","cantidad":"150","unidad":"ml"}
      ]'::jsonb,
      '~50 kcal · ligero y muy refrescante', 4
    );

    INSERT INTO jugos (user_id, nombre, subtitulo, emoji, ingredientes, nota, orden) VALUES (
      eimy_id, 'Morado Jamaica', 'Antioxidante', '💜',
      '[
        {"nombre":"Concentrado de jamaica","cantidad":"80","unidad":"ml"},
        {"nombre":"Uva morada o zarzamora","cantidad":"80","unidad":"g"},
        {"nombre":"Manzana verde","cantidad":"80","unidad":"g"},
        {"nombre":"Jugo de limón","cantidad":"15","unidad":"g"},
        {"nombre":"Agua","cantidad":"150","unidad":"ml"}
      ]'::jsonb,
      'Concentrado: hervir jamaica en poca agua, guardar en refri hasta 1 semana', 5
    );

  END IF; -- eimy jugos

  RAISE NOTICE 'Seed completado exitosamente.';

END $$;
