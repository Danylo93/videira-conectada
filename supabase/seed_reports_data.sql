-- Seed data for Enhanced Reports System
-- This script should be run after the migration is applied

-- Insert sample lost members (without foreign key references)
INSERT INTO public.lost_members (name, phone, email, last_attendance_date, last_cell_meeting_date, last_culto_date, reason, reason_details, status, priority, contact_attempts, last_contact_date, last_contact_method, last_contact_notes) VALUES
('João Silva', '11999999999', 'joao@email.com', '2023-12-15', '2023-12-10', '2023-12-12', 'work', 'Mudou de turno no trabalho', 'lost', 'medium', 2, '2024-01-10', 'whatsapp', 'Não respondeu'),
('Maria Santos', '11988888888', 'maria@email.com', '2023-11-20', '2023-11-15', '2023-11-18', 'family', 'Problemas familiares', 'lost', 'high', 3, '2024-01-12', 'phone', 'Falou que vai voltar em breve'),
('Pedro Costa', '11977777777', 'pedro@email.com', '2023-10-30', '2023-10-25', '2023-10-28', 'moved', 'Mudou de cidade', 'lost', 'low', 1, '2024-01-05', 'email', 'Confirmou mudança');

-- Insert sample contact attempts (using the lost member IDs from above)
INSERT INTO public.contact_attempts (lost_member_id, contact_method, contact_date, contact_time, success, response, notes, next_contact_date) VALUES
((SELECT id FROM public.lost_members WHERE name = 'João Silva' LIMIT 1), 'whatsapp', '2024-01-10', '14:30:00', false, 'no_answer', 'Enviou mensagem mas não respondeu', '2024-01-17'),
((SELECT id FROM public.lost_members WHERE name = 'João Silva' LIMIT 1), 'phone', '2024-01-15', '19:00:00', false, 'busy', 'Ligou mas estava ocupado', '2024-01-22'),
((SELECT id FROM public.lost_members WHERE name = 'Maria Santos' LIMIT 1), 'phone', '2024-01-12', '20:00:00', true, 'answered', 'Conversou sobre os problemas familiares', '2024-01-19'),
((SELECT id FROM public.lost_members WHERE name = 'Pedro Costa' LIMIT 1), 'email', '2024-01-05', NULL, true, 'answered', 'Confirmou mudança e pediu orações', '2024-01-12');

-- Insert sample report templates
INSERT INTO public.report_templates (name, description, type, template_data, is_active) VALUES
('Relatório de Célula Padrão', 'Template padrão para relatórios de célula', 'cell', '{"sections": ["meetings", "attendance", "visitors", "conversions", "challenges", "victories", "prayer_requests", "goals"]}', true),
('Relatório de Culto Padrão', 'Template padrão para relatórios de culto', 'culto', '{"sections": ["basic_info", "attendance", "visitors", "conversions", "offerings", "notes"]}', true),
('Relatório Mensal Padrão', 'Template padrão para relatórios mensais', 'monthly', '{"sections": ["summary", "statistics", "highlights", "challenges", "goals"]}', true);

-- Insert sample reports (without foreign key references for now)
INSERT INTO public.reports (report_type, period_start, period_end, data, status, notes) VALUES
('cell', '2024-01-01', '2024-01-31', '{"total_meetings": 4, "total_attendance": 32, "total_visitors": 8, "total_conversions": 2, "average_attendance": 8, "challenges": "Alguns membros com dificuldades de presença", "victories": "Duas conversões este mês", "prayer_requests": "Família Silva passando por dificuldades", "next_goals": "Aumentar presença média para 10 pessoas"}', 'draft', 'Relatório de janeiro da célula'),
('culto', '2024-01-15', '2024-01-15', '{"culto_name": "Culto de Jovens", "culto_type": "jovens", "total_presence": 45, "total_visitors_culto": 8, "total_conversions_culto": 2, "total_offerings": 150.00, "notes": "Culto muito abençoado"}', 'submitted', 'Relatório do culto de jovens'),
('monthly', '2024-01-01', '2024-01-31', '{"summary": "Mês de crescimento e bênçãos", "statistics": {"total_meetings": 4, "total_attendance": 32, "conversions": 2}, "highlights": ["Duas conversões", "Presença consistente"], "challenges": ["Alguns membros ausentes"], "goals": ["Aumentar presença", "Mais visitantes"]}', 'approved', 'Relatório mensal de janeiro');
