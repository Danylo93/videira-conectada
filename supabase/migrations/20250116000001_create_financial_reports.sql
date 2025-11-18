-- Criar tabela para relatórios financeiros semanais
CREATE TABLE IF NOT EXISTS public.financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  sector VARCHAR(50) NOT NULL CHECK (sector IN ('dizimos', 'ofertas', 'cantina')),
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  account_status BOOLEAN DEFAULT false, -- Prestação de contas ok?
  observations TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_financial_reports_week_start ON public.financial_reports(week_start);
CREATE INDEX IF NOT EXISTS idx_financial_reports_sector ON public.financial_reports(sector);
CREATE INDEX IF NOT EXISTS idx_financial_reports_date ON public.financial_reports(date);
CREATE INDEX IF NOT EXISTS idx_financial_reports_created_by ON public.financial_reports(created_by);

-- RLS Policies
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para pastores e obreiros
CREATE POLICY "Pastores e obreiros podem ver relatórios financeiros"
  ON public.financial_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('pastor', 'obreiro')
    )
  );

-- Política para permitir inserção para pastores e obreiros
CREATE POLICY "Pastores e obreiros podem criar relatórios financeiros"
  ON public.financial_reports
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('pastor', 'obreiro')
    )
  );

-- Política para permitir atualização para pastores e obreiros
CREATE POLICY "Pastores e obreiros podem atualizar relatórios financeiros"
  ON public.financial_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('pastor', 'obreiro')
    )
  );

-- Política para permitir exclusão para pastores e obreiros
CREATE POLICY "Pastores e obreiros podem deletar relatórios financeiros"
  ON public.financial_reports
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('pastor', 'obreiro')
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_financial_reports_updated_at
  BEFORE UPDATE ON public.financial_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

