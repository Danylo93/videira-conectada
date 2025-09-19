-- Migration for notifications system
-- This migration adds notifications table and related functionality

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON public.notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- Create function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS INTEGER AS $$
DECLARE
    user_profile_id UUID;
    unread_count INTEGER;
BEGIN
    -- Get user's profile ID
    SELECT id INTO user_profile_id
    FROM public.profiles
    WHERE user_id = auth.uid();
    
    IF user_profile_id IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Count unread notifications
    SELECT COUNT(*) INTO unread_count
    FROM public.notifications
    WHERE user_id = user_profile_id
    AND read = false;
    
    RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS BOOLEAN AS $$
DECLARE
    user_profile_id UUID;
BEGIN
    -- Get user's profile ID
    SELECT id INTO user_profile_id
    FROM public.profiles
    WHERE user_id = auth.uid();
    
    IF user_profile_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Mark all notifications as read
    UPDATE public.notifications
    SET read = true
    WHERE user_id = user_profile_id
    AND read = false;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to cleanup old notifications
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete notifications older than 30 days
    DELETE FROM public.notifications
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically cleanup old notifications
CREATE OR REPLACE FUNCTION public.auto_cleanup_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Only cleanup if we have more than 1000 notifications
    IF (SELECT COUNT(*) FROM public.notifications) > 1000 THEN
        PERFORM public.cleanup_old_notifications();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_cleanup_notifications
    AFTER INSERT ON public.notifications
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.auto_cleanup_notifications();

-- Create function to send notification to all tenant users
CREATE OR REPLACE FUNCTION public.send_tenant_notification(
    p_tenant_id UUID,
    p_type VARCHAR(20),
    p_title VARCHAR(255),
    p_message TEXT,
    p_data JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    notification_count INTEGER;
BEGIN
    -- Insert notifications for all users in the tenant
    INSERT INTO public.notifications (tenant_id, user_id, type, title, message, data)
    SELECT 
        p_tenant_id,
        pt.profile_id,
        p_type,
        p_title,
        p_message,
        p_data
    FROM public.profile_tenants pt
    WHERE pt.tenant_id = p_tenant_id;
    
    GET DIAGNOSTICS notification_count = ROW_COUNT;
    
    RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_notifications() TO service_role;
GRANT EXECUTE ON FUNCTION public.send_tenant_notification(UUID, VARCHAR, VARCHAR, TEXT, JSONB) TO service_role;
