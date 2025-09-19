-- Migration for multi-tenant billing system
-- This migration adds tenant management and billing tables

-- Create tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    owner_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create profile_tenants junction table
CREATE TABLE IF NOT EXISTS public.profile_tenants (
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (profile_id, tenant_id)
);

-- Create tenant_billing table
CREATE TABLE IF NOT EXISTS public.tenant_billing (
    tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255) UNIQUE,
    plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'standard', 'pro')),
    status VARCHAR(50) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'past_due', 'canceled', 'unpaid')),
    current_period_end TIMESTAMP WITH TIME ZONE,
    payment_method_type VARCHAR(50) CHECK (payment_method_type IN ('card', 'pix')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tenant_invoices table
CREATE TABLE IF NOT EXISTS public.tenant_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    stripe_invoice_id VARCHAR(255) UNIQUE,
    amount INTEGER NOT NULL, -- Amount in cents
    currency VARCHAR(3) DEFAULT 'BRL',
    status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
    hosted_invoice_url TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create audit_payments table for webhook logging
CREATE TABLE IF NOT EXISTS public.audit_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    payload_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add tenant_id to existing tables for multi-tenancy
-- Note: We'll add these columns but keep them nullable for backward compatibility
-- You'll need to populate them based on your business logic

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.cell_reports ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.course_registrations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_owner ON public.tenants(owner_profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_tenants_profile ON public.profile_tenants(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_tenants_tenant ON public.profile_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_billing_customer ON public.tenant_billing(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_tenant_invoices_tenant ON public.tenant_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_invoices_stripe ON public.tenant_invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_audit_payments_tenant ON public.audit_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_payments_event ON public.audit_payments(event_type);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tenant_billing_updated_at BEFORE UPDATE ON public.tenant_billing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenants table
CREATE POLICY "Users can view tenants they belong to" ON public.tenants
    FOR SELECT USING (
        id IN (
            SELECT tenant_id FROM public.profile_tenants 
            WHERE profile_id IN (
                SELECT id FROM public.profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update tenants they own" ON public.tenants
    FOR UPDATE USING (
        owner_profile_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for profile_tenants table
CREATE POLICY "Users can view their own tenant memberships" ON public.profile_tenants
    FOR SELECT USING (
        profile_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Tenant owners can manage memberships" ON public.profile_tenants
    FOR ALL USING (
        tenant_id IN (
            SELECT id FROM public.tenants 
            WHERE owner_profile_id IN (
                SELECT id FROM public.profiles WHERE user_id = auth.uid()
            )
        )
    );

-- RLS Policies for tenant_billing table
CREATE POLICY "Users can view billing for their tenants" ON public.tenant_billing
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM public.profile_tenants 
            WHERE profile_id IN (
                SELECT id FROM public.profiles WHERE user_id = auth.uid()
            )
        )
    );

-- RLS Policies for tenant_invoices table
CREATE POLICY "Users can view invoices for their tenants" ON public.tenant_invoices
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM public.profile_tenants 
            WHERE profile_id IN (
                SELECT id FROM public.profiles WHERE user_id = auth.uid()
            )
        )
    );

-- RLS Policies for audit_payments table (read-only for users)
CREATE POLICY "Users can view payment audits for their tenants" ON public.audit_payments
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM public.profile_tenants 
            WHERE profile_id IN (
                SELECT id FROM public.profiles WHERE user_id = auth.uid()
            )
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.tenant_billing TO authenticated;
GRANT SELECT, INSERT ON public.tenant_invoices TO authenticated;
GRANT SELECT ON public.audit_payments TO authenticated;

-- Grant service role permissions for webhooks
GRANT ALL ON public.tenant_billing TO service_role;
GRANT ALL ON public.tenant_invoices TO service_role;
GRANT ALL ON public.audit_payments TO service_role;
GRANT ALL ON public.tenants TO service_role;
GRANT ALL ON public.profile_tenants TO service_role;

-- Create function to check if user has access to tenant
CREATE OR REPLACE FUNCTION public.user_has_tenant_access(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profile_tenants pt
        JOIN public.profiles p ON pt.profile_id = p.id
        WHERE pt.tenant_id = tenant_uuid 
        AND p.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's tenant_id from profile
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT pt.tenant_id 
        FROM public.profile_tenants pt
        JOIN public.profiles p ON pt.profile_id = p.id
        WHERE p.user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
