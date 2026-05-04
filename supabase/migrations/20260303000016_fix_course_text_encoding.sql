-- Normalize legacy mojibake text in courses-related tables.
-- This fixes records previously saved as "TerÃ§a", "MÃ³dulo", etc.

CREATE OR REPLACE FUNCTION public.fix_mojibake_ptbr(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  fixed TEXT := coalesce(input_text, '');
BEGIN
  fixed := replace(fixed, 'ÃƒÂ§', 'ç');
  fixed := replace(fixed, 'ÃƒÂ£', 'ã');
  fixed := replace(fixed, 'ÃƒÂ¡', 'á');
  fixed := replace(fixed, 'ÃƒÂ©', 'é');
  fixed := replace(fixed, 'ÃƒÂ­', 'í');
  fixed := replace(fixed, 'ÃƒÂ³', 'ó');
  fixed := replace(fixed, 'ÃƒÂº', 'ú');
  fixed := replace(fixed, 'ÃƒÂµ', 'õ');
  fixed := replace(fixed, 'ÃƒÂª', 'ê');
  fixed := replace(fixed, 'ÃƒÂ´', 'ô');
  fixed := replace(fixed, 'ÃƒÂ‰', 'É');
  fixed := replace(fixed, 'ÃƒÂ“', 'Ó');
  fixed := replace(fixed, 'ÃƒÂ‡', 'Ç');
  fixed := replace(fixed, 'Ã§', 'ç');
  fixed := replace(fixed, 'Ã£', 'ã');
  fixed := replace(fixed, 'Ã¡', 'á');
  fixed := replace(fixed, 'Ã©', 'é');
  fixed := replace(fixed, 'Ã­', 'í');
  fixed := replace(fixed, 'Ã³', 'ó');
  fixed := replace(fixed, 'Ãº', 'ú');
  fixed := replace(fixed, 'Ãµ', 'õ');

  RETURN fixed;
END;
$$;

UPDATE public.courses
SET
  name = public.fix_mojibake_ptbr(name),
  description = public.fix_mojibake_ptbr(description),
  short_description = public.fix_mojibake_ptbr(short_description),
  updated_at = now()
WHERE
  coalesce(name, '') ~ '(Ã|Â)'
  OR coalesce(description, '') ~ '(Ã|Â)'
  OR coalesce(short_description, '') ~ '(Ã|Â)';

UPDATE public.course_modules
SET
  title = public.fix_mojibake_ptbr(title),
  description = public.fix_mojibake_ptbr(description),
  updated_at = now()
WHERE
  coalesce(title, '') ~ '(Ã|Â)'
  OR coalesce(description, '') ~ '(Ã|Â)';

UPDATE public.course_lessons
SET
  title = public.fix_mojibake_ptbr(title),
  description = public.fix_mojibake_ptbr(description),
  location = public.fix_mojibake_ptbr(location),
  homework = public.fix_mojibake_ptbr(homework),
  updated_at = now()
WHERE
  coalesce(title, '') ~ '(Ã|Â)'
  OR coalesce(description, '') ~ '(Ã|Â)'
  OR coalesce(location, '') ~ '(Ã|Â)'
  OR coalesce(homework, '') ~ '(Ã|Â)';

DROP FUNCTION IF EXISTS public.fix_mojibake_ptbr(TEXT);
