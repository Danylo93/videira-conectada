-- Script para inserir eventos de encontro no banco de dados
-- Execute este script diretamente no Supabase SQL Editor

-- Inserir eventos de encontro de exemplo
INSERT INTO encounter_events (
  id,
  name,
  description,
  event_dates,
  location,
  encounter_type,
  max_capacity,
  created_by
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'Encontro com Deus - Jovens Setembro 2024',
  'Encontro especial para jovens com foco em crescimento espiritual e relacionamento com Deus.',
  ARRAY['2024-09-26'::date, '2024-09-27'::date, '2024-09-28'::date],
  'Igreja Videira Conectada - Sede',
  'jovens',
  50,
  (SELECT id FROM profiles WHERE role = 'pastor' LIMIT 1)
), (
  '550e8400-e29b-41d4-a716-446655440002',
  'Encontro com Deus - Adultos Outubro 2024',
  'Encontro para adultos com foco em renovação espiritual e propósito.',
  ARRAY['2024-10-03'::date, '2024-10-04'::date, '2024-10-05'::date],
  'Igreja Videira Conectada - Sede',
  'adultos',
  40,
  (SELECT id FROM profiles WHERE role = 'pastor' LIMIT 1)
);

-- Verificar se os dados foram inseridos
SELECT 
  id,
  name,
  encounter_type,
  event_dates,
  created_at
FROM encounter_events 
ORDER BY created_at DESC;
