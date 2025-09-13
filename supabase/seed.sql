-- Seed initial users for Videira São Miguel
-- Password for all users: Videira@123

-- Discipuladores
WITH new_user AS (
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, aud, role, raw_app_meta_data, raw_user_meta_data)
  VALUES (
    gen_random_uuid(),
    'marcos.moreira@videirasaomiguel.com',
    crypt('Videira@123', gen_salt('bf')),
    now(),
    'authenticated',
    'authenticated',
    '{"provider":"email","providers":["email"]}',
    '{"name":"Marcos Moreira"}'
  )
  RETURNING id
)
UPDATE public.profiles p
SET role = 'discipulador', phone = '(11)98752-6373'
FROM new_user
WHERE p.user_id = new_user.id;

WITH new_user AS (
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, aud, role, raw_app_meta_data, raw_user_meta_data)
  VALUES (
    gen_random_uuid(),
    'denis.sousa@videirasaomiguel.com',
    crypt('Videira@123', gen_salt('bf')),
    now(),
    'authenticated',
    'authenticated',
    '{"provider":"email","providers":["email"]}',
    '{"name":"Dênis Sousa"}'
  )
  RETURNING id
)
UPDATE public.profiles p
SET role = 'discipulador', phone = '(11)95892-6082'
FROM new_user
WHERE p.user_id = new_user.id;

WITH new_user AS (
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, aud, role, raw_app_meta_data, raw_user_meta_data)
  VALUES (
    gen_random_uuid(),
    'danylo.oliveira@videirasaomiguel.com',
    crypt('Videira@123', gen_salt('bf')),
    now(),
    'authenticated',
    'authenticated',
    '{"provider":"email","providers":["email"]}',
    '{"name":"Danylo Oliveira"}'
  )
  RETURNING id
)
UPDATE public.profiles p
SET role = 'discipulador', phone = '(11)96489-1128'
FROM new_user
WHERE p.user_id = new_user.id;

-- Pastor
WITH new_user AS (
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, aud, role, raw_app_meta_data, raw_user_meta_data)
  VALUES (
    gen_random_uuid(),
    'christian.almeida@videirasaomiguel.com',
    crypt('Videira@123', gen_salt('bf')),
    now(),
    'authenticated',
    'authenticated',
    '{"provider":"email","providers":["email"]}',
    '{"name":"Christian Almeida"}'
  )
  RETURNING id
)
UPDATE public.profiles p
SET role = 'pastor', phone = '(11)93015-2797'
FROM new_user
WHERE p.user_id = new_user.id;
