-- Seed data for local development
-- This file is executed when running: npx supabase db reset

insert into public.users (
  username,
  password_hash,
  role
)
values
  (
    'admin',
    encode(digest('admin123', 'sha256'), 'hex'),
    'admin'
  ),
  (
    'demo',
    encode(digest('demo123', 'sha256'), 'hex'),
    'user'
  )
on conflict (username) do update set
  password_hash = excluded.password_hash,
  role = excluded.role;
  
insert into public.ingredient_catalog (
  name,
  allowed_units,
  equivalences,
  image_path,
  created_by
)
values
  (
    'Arroz',
    '["g", "kg", "taza"]'::jsonb,
    '[
      { "from": "taza", "to": "g", "factor": 185 },
      { "from": "kg", "to": "g", "factor": 1000 }
    ]'::jsonb,
    'catalog/arroz.png',
    'admin'
  ),
  (
    'Pasta',
    '["g", "kg", "taza"]'::jsonb,
    '[
      { "from": "taza", "to": "g", "factor": 100 },
      { "from": "kg", "to": "g", "factor": 1000 }
    ]'::jsonb,
    'catalog/pasta.png',
    'admin'
  ),
  (
    'Leche',
    '["ml", "l", "taza"]'::jsonb,
    '[
      { "from": "taza", "to": "ml", "factor": 240 },
      { "from": "l", "to": "ml", "factor": 1000 }
    ]'::jsonb,
    'catalog/leche.png',
    'admin'
  ),
  (
    'Huevos',
    '["unidad"]'::jsonb,
    '[]'::jsonb,
    'catalog/huevos.png',
    'admin'
  ),
  (
    'Harina',
    '["g", "kg", "taza"]'::jsonb,
    '[
      { "from": "taza", "to": "g", "factor": 120 },
      { "from": "kg", "to": "g", "factor": 1000 }
    ]'::jsonb,
    'catalog/harina.png',
    'admin'
  ),
  (
    'Azúcar',
    '["g", "kg", "taza", "cda", "cdta"]'::jsonb,
    '[
      { "from": "taza", "to": "g", "factor": 200 },
      { "from": "cda", "to": "g", "factor": 12.5 },
      { "from": "cdta", "to": "g", "factor": 4 },
      { "from": "kg", "to": "g", "factor": 1000 }
    ]'::jsonb,
    'catalog/azucar.png',
    'admin'
  ),
  (
    'Aceite',
    '["ml", "l", "cda", "cdta", "taza"]'::jsonb,
    '[
      { "from": "cda", "to": "ml", "factor": 15 },
      { "from": "cdta", "to": "ml", "factor": 5 },
      { "from": "taza", "to": "ml", "factor": 240 },
      { "from": "l", "to": "ml", "factor": 1000 }
    ]'::jsonb,
    'catalog/aceite.png',
    'admin'
  ),
  (
    'Sal',
    '["g", "kg", "cda", "cdta"]'::jsonb,
    '[
      { "from": "cda", "to": "g", "factor": 18 },
      { "from": "cdta", "to": "g", "factor": 6 },
      { "from": "kg", "to": "g", "factor": 1000 }
    ]'::jsonb,
    'catalog/sal.png',
    'admin'
  ),
  (
    'Tomate',
    '["g", "kg", "unidad"]'::jsonb,
    '[
      { "from": "unidad", "to": "g", "factor": 120 },
      { "from": "kg", "to": "g", "factor": 1000 }
    ]'::jsonb,
    'catalog/tomate.png',
    'admin'
  ),
  (
    'Cebolla',
    '["g", "kg", "unidad"]'::jsonb,
    '[
      { "from": "unidad", "to": "g", "factor": 150 },
      { "from": "kg", "to": "g", "factor": 1000 }
    ]'::jsonb,
    'catalog/cebolla.png',
    'admin'
  ),
  (
    'Cebolla morada',
    '["g", "kg", "unidad"]'::jsonb,
    '[
      { "from": "unidad", "to": "g", "factor": 150 },
      { "from": "kg", "to": "g", "factor": 1000 }
    ]'::jsonb,
    'catalog/cebolla-morada.png',
    'admin'
  ),
  (
    'Ajo',
    '["g", "unidad", "diente"]'::jsonb,
    '[
      { "from": "diente", "to": "g", "factor": 5 },
      { "from": "unidad", "to": "g", "factor": 40 }
    ]'::jsonb,
    'catalog/ajo.png',
    'admin'
  ),
  (
    'Papa',
    '["g", "kg", "unidad"]'::jsonb,
    '[
      { "from": "unidad", "to": "g", "factor": 180 },
      { "from": "kg", "to": "g", "factor": 1000 }
    ]'::jsonb,
    'catalog/papa.png',
    'admin'
  ),
  (
    'Zanahoria',
    '["g", "kg", "unidad"]'::jsonb,
    '[
      { "from": "unidad", "to": "g", "factor": 70 },
      { "from": "kg", "to": "g", "factor": 1000 }
    ]'::jsonb,
    'catalog/zanahoria.png',
    'admin'
  ),
  (
    'Zapallo',
    '["g", "kg", "taza"]'::jsonb,
    '[
      { "from": "taza", "to": "g", "factor": 140 },
      { "from": "kg", "to": "g", "factor": 1000 }
    ]'::jsonb,
    'catalog/zapallo.png',
    'admin'
  ),
  (
    'Repollo blanco',
    '["g", "kg", "unidad", "taza"]'::jsonb,
    '[
      { "from": "taza", "to": "g", "factor": 90 },
      { "from": "unidad", "to": "g", "factor": 900 },
      { "from": "kg", "to": "g", "factor": 1000 }
    ]'::jsonb,
    'catalog/repollo-blanco.png',
    'admin'
  ),
  (
    'Pollo',
    '["g", "kg", "unidad"]'::jsonb,
    '[
      { "from": "kg", "to": "g", "factor": 1000 }
    ]'::jsonb,
    'catalog/pollo.png',
    'admin'
  ),
  (
    'Carne molida',
    '["g", "kg"]'::jsonb,
    '[
      { "from": "kg", "to": "g", "factor": 1000 }
    ]'::jsonb,
    'catalog/carne-molida.png',
    'admin'
  ),
  (
    'Atún',
    '["g", "kg", "lata"]'::jsonb,
    '[
      { "from": "lata", "to": "g", "factor": 160 },
      { "from": "kg", "to": "g", "factor": 1000 }
    ]'::jsonb,
    'catalog/atun.png',
    'admin'
  ),
  (
    'Tofu',
    '["g", "kg", "bloque"]'::jsonb,
    '[
      { "from": "bloque", "to": "g", "factor": 250 },
      { "from": "kg", "to": "g", "factor": 1000 }
    ]'::jsonb,
    'catalog/tofu.png',
    'admin'
  ),
  (
    'Seitán',
    '["g", "kg"]'::jsonb,
    '[
      { "from": "kg", "to": "g", "factor": 1000 }
    ]'::jsonb,
    'catalog/seitan.png',
    'admin'
  ),
  (
    'Hamburguesa de soya',
    '["g", "kg", "unidad"]'::jsonb,
    '[
      { "from": "unidad", "to": "g", "factor": 100 },
      { "from": "kg", "to": "g", "factor": 1000 }
    ]'::jsonb,
    'catalog/hamburguesa-soya.png',
    'admin'
  ),
  (
    'Hamburguesa de vacuno',
    '["g", "kg", "unidad"]'::jsonb,
    '[
      { "from": "unidad", "to": "g", "factor": 120 },
      { "from": "kg", "to": "g", "factor": 1000 }
    ]'::jsonb,
    'catalog/hamburguesa-vacuno.png',
    'admin'
  ),
  (
    'Frambuesa',
    '["g", "kg", "taza"]'::jsonb,
    '[
      { "from": "taza", "to": "g", "factor": 125 },
      { "from": "kg", "to": "g", "factor": 1000 }
    ]'::jsonb,
    'catalog/frambuesa.png',
    'admin'
  ),
  (
    'Mora',
    '["g", "kg", "taza"]'::jsonb,
    '[
      { "from": "taza", "to": "g", "factor": 140 },
      { "from": "kg", "to": "g", "factor": 1000 }
    ]'::jsonb,
    'catalog/mora.png',
    'admin'
  ),
  (
    'Arándano',
    '["g", "kg", "taza"]'::jsonb,
    '[
      { "from": "taza", "to": "g", "factor": 150 },
      { "from": "kg", "to": "g", "factor": 1000 }
    ]'::jsonb,
    'catalog/arandano.png',
    'admin'
  ),
  (
    'Cereal',
    '["g", "kg", "taza"]'::jsonb,
    '[
      { "from": "taza", "to": "g", "factor": 40 },
      { "from": "kg", "to": "g", "factor": 1000 }
    ]'::jsonb,
    'catalog/cereal.png',
    'admin'
  ),
  (
    'Proteína en polvo',
    '["g", "kg", "scoop"]'::jsonb,
    '[
      { "from": "scoop", "to": "g", "factor": 30 },
      { "from": "kg", "to": "g", "factor": 1000 }
    ]'::jsonb,
    'catalog/proteina-polvo.png',
    'admin'
  ),
  (
    'Manteca',
    '["g", "kg", "cda", "taza"]'::jsonb,
    '[
      { "from": "cda", "to": "g", "factor": 13 },
      { "from": "taza", "to": "g", "factor": 205 },
      { "from": "kg", "to": "g", "factor": 1000 }
    ]'::jsonb,
    'catalog/manteca.png',
    'admin'
  )
on conflict (name) do update set
  allowed_units = excluded.allowed_units,
  equivalences = excluded.equivalences,
  image_path = excluded.image_path,
  created_by = excluded.created_by;


insert into public.ingredients (
  username,
  name,
  quantity,
  unit
)
values
  ('demo', 'Arroz', 1, 'kg'),
  ('demo', 'Pasta', 500, 'g'),
  ('demo', 'Leche', 1, 'l'),
  ('demo', 'Huevos', 6, 'unidad'),
  ('demo', 'Tomate', 4, 'unidad'),
  ('demo', 'Cebolla', 2, 'unidad'),
  ('demo', 'Ajo', 3, 'diente'),
  ('demo', 'Tofu', 1, 'bloque'),
  ('demo', 'Atún', 2, 'lata'),
  ('demo', 'Frambuesa', 300, 'g')
on conflict do nothing;

insert into public.recipes (
  title,
  description,
  instructions,
  difficulty,
  time_minutes,
  servings,
  created_by
)
select
  'Arroz con Pollo',
  'Receta clasica de arroz con pollo para toda la familia.',
  '1. Sofrie cebolla y ajo en aceite.\n2. Agrega pollo en cubos y dora.\n3. Incorpora arroz y mezcla 1 minuto.\n4. Agrega agua caliente y sal.\n5. Cocina tapado a fuego bajo 18 minutos.\n6. Reposa 5 minutos y sirve.',
  'medio',
  35,
  4,
  'admin'
where not exists (
  select 1 from public.recipes where title = 'Arroz con Pollo'
);

insert into public.recipes (
  title,
  description,
  instructions,
  difficulty,
  time_minutes,
  servings,
  created_by
)
select
  'Ensalada Fresca',
  'Ensalada simple con vegetales frescos.',
  '1. Lava las verduras.\n2. Corta lechuga, tomate y cebolla.\n3. Mezcla en un bowl con aceite y sal.\n4. Sirve de inmediato.',
  'facil',
  15,
  2,
  'admin'
where not exists (
  select 1 from public.recipes where title = 'Ensalada Fresca'
);

insert into public.recipes (
  title,
  description,
  instructions,
  difficulty,
  time_minutes,
  servings,
  created_by
)
select
  'Pasta Primavera',
  'Pasta con verduras salteadas.',
  '1. Cocina la pasta en agua con sal.\n2. Saltea ajo y cebolla.\n3. Agrega tomate y zanahoria.\n4. Mezcla con la pasta y sirve.',
  'facil',
  25,
  3,
  'admin'
where not exists (
  select 1 from public.recipes where title = 'Pasta Primavera'
);

insert into public.recipe_ingredients (recipe_id, product_id, quantity_required, unit)
select r.id, c.id, 400, 'g'
from public.recipes r
join public.ingredient_catalog c on c.name = 'Arroz'
where r.title = 'Arroz con Pollo'
and not exists (
  select 1 from public.recipe_ingredients ri where ri.recipe_id = r.id and ri.product_id = c.id and ri.unit = 'g'
);

insert into public.recipe_ingredients (recipe_id, product_id, quantity_required, unit)
select r.id, c.id, 500, 'g'
from public.recipes r
join public.ingredient_catalog c on c.name = 'Pollo'
where r.title = 'Arroz con Pollo'
and not exists (
  select 1 from public.recipe_ingredients ri where ri.recipe_id = r.id and ri.product_id = c.id and ri.unit = 'g'
);

insert into public.recipe_ingredients (recipe_id, product_id, quantity_required, unit)
select r.id, c.id, 1, 'unidad'
from public.recipes r
join public.ingredient_catalog c on c.name = 'Cebolla'
where r.title = 'Arroz con Pollo'
and not exists (
  select 1 from public.recipe_ingredients ri where ri.recipe_id = r.id and ri.product_id = c.id and ri.unit = 'unidad'
);

insert into public.recipe_ingredients (recipe_id, product_id, quantity_required, unit)
select r.id, c.id, 2, 'diente'
from public.recipes r
join public.ingredient_catalog c on c.name = 'Ajo'
where r.title = 'Arroz con Pollo'
and not exists (
  select 1 from public.recipe_ingredients ri where ri.recipe_id = r.id and ri.product_id = c.id and ri.unit = 'diente'
);

insert into public.recipe_ingredients (recipe_id, product_id, quantity_required, unit)
select r.id, c.id, 2, 'unidad'
from public.recipes r
join public.ingredient_catalog c on c.name = 'Tomate'
where r.title = 'Ensalada Fresca'
and not exists (
  select 1 from public.recipe_ingredients ri where ri.recipe_id = r.id and ri.product_id = c.id and ri.unit = 'unidad'
);

insert into public.recipe_ingredients (recipe_id, product_id, quantity_required, unit)
select r.id, c.id, 1, 'unidad'
from public.recipes r
join public.ingredient_catalog c on c.name = 'Lechuga'
where r.title = 'Ensalada Fresca'
and not exists (
  select 1 from public.recipe_ingredients ri where ri.recipe_id = r.id and ri.product_id = c.id and ri.unit = 'unidad'
);

insert into public.recipe_ingredients (recipe_id, product_id, quantity_required, unit)
select r.id, c.id, 0.5, 'unidad'
from public.recipes r
join public.ingredient_catalog c on c.name = 'Cebolla'
where r.title = 'Ensalada Fresca'
and not exists (
  select 1 from public.recipe_ingredients ri where ri.recipe_id = r.id and ri.product_id = c.id and ri.unit = 'unidad'
);

insert into public.recipe_ingredients (recipe_id, product_id, quantity_required, unit)
select r.id, c.id, 400, 'g'
from public.recipes r
join public.ingredient_catalog c on c.name = 'Pasta'
where r.title = 'Pasta Primavera'
and not exists (
  select 1 from public.recipe_ingredients ri where ri.recipe_id = r.id and ri.product_id = c.id and ri.unit = 'g'
);

insert into public.recipe_ingredients (recipe_id, product_id, quantity_required, unit)
select r.id, c.id, 2, 'unidad'
from public.recipes r
join public.ingredient_catalog c on c.name = 'Tomate'
where r.title = 'Pasta Primavera'
and not exists (
  select 1 from public.recipe_ingredients ri where ri.recipe_id = r.id and ri.product_id = c.id and ri.unit = 'unidad'
);

insert into public.recipe_ingredients (recipe_id, product_id, quantity_required, unit)
select r.id, c.id, 1, 'unidad'
from public.recipes r
join public.ingredient_catalog c on c.name = 'Zanahoria'
where r.title = 'Pasta Primavera'
and not exists (
  select 1 from public.recipe_ingredients ri where ri.recipe_id = r.id and ri.product_id = c.id and ri.unit = 'unidad'
);

insert into public.recipe_ratings (recipe_id, username, rating, comment)
select r.id, 'demo', 4.5, 'Muy rica y facil de preparar.'
from public.recipes r
where r.title = 'Arroz con Pollo'
and not exists (
  select 1 from public.recipe_ratings rr where rr.recipe_id = r.id and rr.username = 'demo'
);