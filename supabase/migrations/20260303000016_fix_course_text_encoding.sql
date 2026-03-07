-- Normalize legacy mojibake text in courses-related tables.
-- This fixes records previously saved as "TerÃ§a", "MÃ³dulo", etc.

CREATE OR REPLACE FUNCTION public.fix_mojibake_ptbr(input_text TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT
    replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(
                  replace(
                    replace(
                      replace(
                        replace(
                          replace(
                            replace(
                              replace(
                                replace(
                                  replace(
                                    replace(
                                      replace(
                                        replace(
                                          replace(
                                            replace(
                                              replace(coalesce(input_text, ''), 'ÃƒÂ§', 'ç'),
                                            'ÃƒÂ£', 'ã'),
                                          'ÃƒÂ¡', 'á'),
                                        'ÃƒÂ©', 'é'),
                                      'ÃƒÂ­', 'í'),
                                    'ÃƒÂ³', 'ó'),
                                  'ÃƒÂº', 'ú'),
                                'ÃƒÂµ', 'õ'),
                              'ÃƒÂª', 'ê'),
                            'ÃƒÂ´', 'ô'),
                          'ÃƒÂ‰', 'É'),
                        'ÃƒÂ“', 'Ó'),
                      'ÃƒÂ‡', 'Ç'),
                    'Ã§', 'ç'),
                  'Ã£', 'ã'),
                'Ã¡', 'á'),
              'Ã©', 'é'),
            'Ã­', 'í'),
          'Ã³', 'ó'),
        'Ãº', 'ú'),
      'Ãµ', 'õ')
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
