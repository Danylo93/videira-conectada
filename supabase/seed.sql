-- Seed demo auth users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'pastor@videirasaomiguel.com', crypt('password', gen_salt('bf')), now(), '{}'::jsonb, '{}'::jsonb),
  ('11111111-1111-1111-1111-111111111111', 'discipulador@videirasaomiguel.com', crypt('password', gen_salt('bf')), now(), '{}'::jsonb, '{}'::jsonb);

-- Seed demo profiles
INSERT INTO public.profiles (user_id, name, email, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'Pastor João Silva', 'pastor@videirasaomiguel.com', 'pastor'::app_role);

INSERT INTO public.profiles (user_id, name, email, role)
VALUES ('11111111-1111-1111-1111-111111111111', 'Discipulador Carlos Lima', 'discipulador@videirasaomiguel.com', 'discipulador'::app_role);
