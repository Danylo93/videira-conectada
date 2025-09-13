-- supabase/seed.sql
create extension if not exists pgcrypto;

-- Utilitário: cria/garante usuário, identidade e perfil
-- Uso:
--   DO $$ BEGIN PERFORM public._ensure_user(
--     'email@dominio.com', 'SenhaForte123', 'Nome Completo', '(11)99999-9999', 'role'
--   ); END $$;

create or replace function public._ensure_user(
  p_email text,
  p_password text,
  p_name text,
  p_phone text,
  p_role text
) returns void
language plpgsql
as $$
declare
  uid uuid;
begin
  -- Procura usuário por e-mail
  select u.id into uid
  from auth.users u
  join auth.identities i on i.user_id = u.id and i.provider = 'email'
  where i.provider_id = p_email
  limit 1;

  -- Se não existir, cria em auth.users e auth.identities
  if uid is null then
    insert into auth.users (
      id, email, encrypted_password, email_confirmed_at, aud, role,
      raw_app_meta_data, raw_user_meta_data
    )
    values (
      gen_random_uuid(),
      p_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      'authenticated',
      'authenticated',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', p_name)
    )
    returning id into uid;

    insert into auth.identities (
      id, user_id, provider, provider_id, identity_data, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), uid, 'email', p_email,
      jsonb_build_object('sub', uid::text, 'email', p_email),
      now(), now(), now()
    );
  end if;

  -- Upsert no perfil
  insert into public.profiles (user_id, name, email, phone, role)
  values (uid, p_name, p_email, nullif(p_phone,''), p_role)
  on conflict (user_id) do update
    set name  = excluded.name,
        email = excluded.email,
        phone = excluded.phone,
        role  = excluded.role;
end;
$$;

-- =========================
-- SEMENTES (USUÁRIOS)
-- =========================

DO $$ BEGIN
  PERFORM public._ensure_user('marcos.moreira@videirasaomiguel.com', 'Videira@123', 'Marcos Moreira', '(11)98752-6373', 'discipulador');
END $$;

DO $$ BEGIN
  PERFORM public._ensure_user('denis.sousa@videirasaomiguel.com', 'Videira@123', 'Dênis Sousa', '(11)95892-6082', 'discipulador');
END $$;

DO $$ BEGIN
  PERFORM public._ensure_user('danylo.oliveira@videirasaomiguel.com', 'Videira@123', 'Danylo Oliveira', '(11)96489-1128', 'discipulador');
END $$;

DO $$ BEGIN
  PERFORM public._ensure_user('christian.almeida@videirasaomiguel.com', 'Videira@123', 'Christian Almeida', '(11)93015-2797', 'pastor');
END $$;

-- Caso queira um líder de teste:
-- DO $$ BEGIN
--   PERFORM public._ensure_user('lider.teste@videirasaomiguel.com', 'Videira@123', 'Líder Teste', '(11)90000-0000', 'lider');
-- END $$;

-- Dica: você pode inserir também alguns eventos/membros aqui, se quiser.
