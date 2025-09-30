-- Inserir eventos de encontro de exemplo
INSERT INTO encounter_events (
  name,
  description,
  event_dates,
  location,
  encounter_type,
  max_capacity,
  registration_deadline,
  price,
  requirements,
  status,
  created_by
) VALUES (
  'Encontro com Deus - Jovens Setembro 2024',
  'Encontro especial para jovens com foco em crescimento espiritual e relacionamento com Deus.',
  ARRAY['2024-09-26', '2024-09-27', '2024-09-28'],
  'Igreja Videira Conectada - Sede',
  'jovens',
  50,
  '2024-09-20',
  50.00,
  'Idade entre 13 e 25 anos, participação em célula',
  'active',
  (SELECT id FROM profiles WHERE role = 'pastor' LIMIT 1)
), (
  'Encontro com Deus - Adultos Outubro 2024',
  'Encontro para adultos com foco em renovação espiritual e propósito.',
  ARRAY['2024-10-03', '2024-10-04', '2024-10-05'],
  'Igreja Videira Conectada - Sede',
  'adultos',
  40,
  '2024-09-28',
  60.00,
  'Maior de 25 anos, participação em célula',
  'active',
  (SELECT id FROM profiles WHERE role = 'pastor' LIMIT 1)
), (
  'Encontro com Deus - Crianças Novembro 2024',
  'Encontro especial para crianças com atividades lúdicas e ensino bíblico.',
  ARRAY['2024-11-15', '2024-11-16'],
  'Igreja Videira Conectada - Sede',
  'criancas',
  30,
  '2024-11-10',
  25.00,
  'Idade entre 5 e 12 anos',
  'active',
  (SELECT id FROM profiles WHERE role = 'pastor' LIMIT 1)
);

