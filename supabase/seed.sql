-- Seed initial users for development

-- Insert users into auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES
  ('07e7f1fa-dddb-4307-84a6-5a4490deb1dc', '00000000-0000-0000-0000-000000000000', 'christian.almeida@videirasaomiguel', crypt('password', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{"name":"Christian Almeida"}'),
  ('447dcd2b-fe80-4fa2-98fe-e60234a93b88', '00000000-0000-0000-0000-000000000000', 'denis.sousa@videirasaomiguel', crypt('password', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{"name":"Denis Sousa"}'),
  ('c71f04b0-8ff9-4dac-abca-0111ff68334a', '00000000-0000-0000-0000-000000000000', 'danylo.oliveira@videirasaomiguel', crypt('password', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{"name":"Danylo Oliveira"}'),
  ('722fa0ab-7196-4f04-a57d-d4103debab0d', '00000000-0000-0000-0000-000000000000', 'marcos.moreira@videirasaomiguel', crypt('password', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{"name":"Marcos Moreira"}');

-- Insert corresponding profiles
INSERT INTO public.profiles (
  id,
  user_id,
  name,
  email,
  role,
  pastor_uuid
) VALUES
  ('ecdd4f10-fa2a-437c-86ad-a3cd9c4c3c4b', '07e7f1fa-dddb-4307-84a6-5a4490deb1dc', 'Christian Almeida', 'christian.almeida@videirasaomiguel', 'pastor', NULL),
  ('c0ea0da5-bfd7-425b-a72c-7fb055208724', '447dcd2b-fe80-4fa2-98fe-e60234a93b88', 'Denis Sousa', 'denis.sousa@videirasaomiguel', 'discipulador', 'ecdd4f10-fa2a-437c-86ad-a3cd9c4c3c4b'),
  ('b0f5e238-634d-4823-90e4-3785bf636e8f', 'c71f04b0-8ff9-4dac-abca-0111ff68334a', 'Danylo Oliveira', 'danylo.oliveira@videirasaomiguel', 'discipulador', 'ecdd4f10-fa2a-437c-86ad-a3cd9c4c3c4b'),
  ('52fb8002-6727-475b-8e1c-b3cdb6e2a0f4', '722fa0ab-7196-4f04-a57d-d4103debab0d', 'Marcos Moreira', 'marcos.moreira@videirasaomiguel', 'discipulador', 'ecdd4f10-fa2a-437c-86ad-a3cd9c4c3c4b');
