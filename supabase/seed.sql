CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
  RETURNING id, email
), ins_identity AS (
  INSERT INTO auth.identities (id, user_id, provider, provider_id, identity_data, created_at, updated_at)
  SELECT gen_random_uuid(), id, 'email', email,
         jsonb_build_object('sub', id::text, 'email', email),
         now(), now()
  FROM new_user
)
INSERT INTO public.profiles (user_id, name, email, phone, role)
SELECT id, 'Marcos Moreira', 'marcos.moreira@videirasaomiguel.com', '(11)98752-6373', 'discipulador'
FROM new_user;

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
  RETURNING id, email
), ins_identity AS (
  INSERT INTO auth.identities (id, user_id, provider, provider_id, identity_data, created_at, updated_at)
  SELECT gen_random_uuid(), id, 'email', email,
         jsonb_build_object('sub', id::text, 'email', email),
         now(), now()
  FROM new_user
)
INSERT INTO public.profiles (user_id, name, email, phone, role)
SELECT id, 'Dênis Sousa', 'denis.sousa@videirasaomiguel.com', '(11)95892-6082', 'discipulador'
FROM new_user;

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
  RETURNING id, email
), ins_identity AS (
  INSERT INTO auth.identities (id, user_id, provider, provider_id, identity_data, created_at, updated_at)
  SELECT gen_random_uuid(), id, 'email', email,
         jsonb_build_object('sub', id::text, 'email', email),
         now(), now()
  FROM new_user
)
INSERT INTO public.profiles (user_id, name, email, phone, role)
SELECT id, 'Danylo Oliveira', 'danylo.oliveira@videirasaomiguel.com', '(11)96489-1128', 'discipulador'
FROM new_user;

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
  RETURNING id, email
), ins_identity AS (
  INSERT INTO auth.identities (id, user_id, provider, provider_id, identity_data, created_at, updated_at)
  SELECT gen_random_uuid(), id, 'email', email,
         jsonb_build_object('sub', id::text, 'email', email),
         now(), now()
  FROM new_user
)
INSERT INTO public.profiles (user_id, name, email, phone, role)
SELECT id, 'Christian Almeida', 'christian.almeida@videirasaomiguel.com', '(11)93015-2797', 'pastor'
FROM new_user;
