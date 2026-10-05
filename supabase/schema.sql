-- ==============================================================================
-- DATABASE SCHEMA: வதம்பை இளந்தளிர் குழு (Vadambai Ilanthazhir Kuzhu)
-- Village Event Management Platform
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS / TYPE CONSTRAINTS
-- Roles: super_admin, leader, payment_collector, member
-- Statuses: pending, approved, rejected, blocked

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    profile_photo_url TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('super_admin', 'leader', 'payment_collector', 'member')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'blocked')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS public.system_settings (
    id TEXT PRIMARY KEY DEFAULT 'primary',
    group_name_ta TEXT NOT NULL DEFAULT 'வதம்பை இளந்தளிர் குழு',
    group_name_en TEXT NOT NULL DEFAULT 'Vadambai Ilanthazhir Kuzhu',
    contact_phone TEXT DEFAULT '',
    logo_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default system settings if not exists
INSERT INTO public.system_settings (id, group_name_ta, group_name_en)
VALUES ('primary', 'வதம்பை இளந்தளிர் குழு', 'Vadambai Ilanthazhir Kuzhu')
ON CONFLICT (id) DO NOTHING;

-- 5. PAYMENT COLLECTORS (2 Assigned Collectors)
CREATE TABLE IF NOT EXISTS public.payment_collectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_number INT UNIQUE CHECK (slot_number IN (1, 2)),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    upi_id TEXT NOT NULL,
    qr_code_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    updated_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 6. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TEXT,
    venue TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    collector_id UUID REFERENCES public.payment_collectors(id),
    collector_name TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_id TEXT, -- UTR / Reference ID
    screenshot_url TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    rejection_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. DANCE PERFORMANCES TABLE
CREATE TABLE IF NOT EXISTS public.dance_performances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_name TEXT NOT NULL,
    performer_name TEXT NOT NULL,
    duration TEXT NOT NULL, -- e.g. "5:30"
    song_title TEXT NOT NULL,
    song_url TEXT,
    song_file_path TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed')),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. INCOME TABLE
CREATE TABLE IF NOT EXISTS public.income (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    source TEXT NOT NULL,
    paid_by TEXT,
    description TEXT,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    collected_by TEXT NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL CHECK (category IN ('Food', 'Decoration', 'Sound System', 'Transportation', 'Printing', 'Event Materials', 'Other')),
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    paid_by TEXT NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
    created_by_name TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. ATTENDANCE SESSIONS & RECORDS
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, member_id)
);

-- 13. GALLERY TABLE
CREATE TABLE IF NOT EXISTS public.gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    event_name TEXT,
    title TEXT,
    image_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'general' CHECK (type IN ('general', 'approval', 'payment', 'announcement', 'event')),
    is_read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON public.payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_income_date ON public.income(date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON public.attendance_records(session_id);

-- ==============================================================================
-- AUTH TRIGGER: Automatic Profile Creation on Signup
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, phone, email, role, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Member'),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
        'pending' -- All new registrations require approval
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- HELPER FUNCTIONS FOR RLS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin' AND status = 'approved'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_leader_or_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('super_admin', 'leader') AND status = 'approved'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_payment_collector_or_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('super_admin', 'leader', 'payment_collector') AND status = 'approved'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_approved()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND status = 'approved'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_collectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dance_performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
-- Users can view their own profile; Approved Leaders/Admins can view all profiles
CREATE POLICY "View profiles" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id OR public.is_leader_or_admin() OR (public.is_approved() AND role IN ('leader', 'payment_collector'))
    );

-- Users can update their own phone / profile photo; Admins/Leaders can update roles and approval statuses
CREATE POLICY "Update profiles" ON public.profiles
    FOR UPDATE USING (
        auth.uid() = id OR public.is_leader_or_admin()
    );

-- Super admin can delete profiles
CREATE POLICY "Admin delete profile" ON public.profiles
    FOR DELETE USING (public.is_super_admin());

-- 2. SYSTEM SETTINGS POLICIES
CREATE POLICY "Anyone authenticated can view settings" ON public.system_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Super admin can edit settings" ON public.system_settings
    FOR ALL USING (public.is_super_admin());

-- 3. PAYMENT COLLECTORS POLICIES
CREATE POLICY "View collectors" ON public.payment_collectors
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Super admin manage collectors" ON public.payment_collectors
    FOR ALL USING (public.is_super_admin());

-- 4. PAYMENTS POLICIES
-- Members can view their own payments; Collectors and Leaders can view all
CREATE POLICY "View payments" ON public.payments
    FOR SELECT USING (
        auth.uid() = member_id OR public.is_payment_collector_or_admin()
    );

-- Approved members can submit payments
CREATE POLICY "Insert payments" ON public.payments
    FOR INSERT WITH CHECK (
        auth.uid() = member_id AND public.is_approved()
    );

-- Collectors / Leaders can verify / reject payments; Member cannot update verified payment
CREATE POLICY "Update payments" ON public.payments
    FOR UPDATE USING (
        public.is_payment_collector_or_admin() OR (auth.uid() = member_id AND status = 'pending')
    );

-- 5. DANCE PERFORMANCES POLICIES
CREATE POLICY "View dances" ON public.dance_performances
    FOR SELECT USING (public.is_approved());

CREATE POLICY "Manage dances" ON public.dance_performances
    FOR ALL USING (public.is_leader_or_admin());

-- 6. INCOME & EXPENSES POLICIES
-- Only leaders and super admins can view/manage finances
CREATE POLICY "View income" ON public.income
    FOR SELECT USING (public.is_leader_or_admin());

CREATE POLICY "Manage income" ON public.income
    FOR ALL USING (public.is_leader_or_admin());

CREATE POLICY "View expenses" ON public.expenses
    FOR SELECT USING (public.is_leader_or_admin());

CREATE POLICY "Manage expenses" ON public.expenses
    FOR ALL USING (public.is_leader_or_admin());

-- 7. ANNOUNCEMENTS & EVENTS POLICIES
CREATE POLICY "View announcements" ON public.announcements
    FOR SELECT USING (public.is_approved());

CREATE POLICY "Manage announcements" ON public.announcements
    FOR ALL USING (public.is_leader_or_admin());

CREATE POLICY "View events" ON public.events
    FOR SELECT USING (public.is_approved());

CREATE POLICY "Manage events" ON public.events
    FOR ALL USING (public.is_leader_or_admin());

-- 8. ATTENDANCE POLICIES
CREATE POLICY "View attendance sessions" ON public.attendance_sessions
    FOR SELECT USING (public.is_approved());

CREATE POLICY "Manage attendance sessions" ON public.attendance_sessions
    FOR ALL USING (public.is_leader_or_admin());

CREATE POLICY "View attendance records" ON public.attendance_records
    FOR SELECT USING (
        auth.uid() = member_id OR public.is_leader_or_admin()
    );

CREATE POLICY "Manage attendance records" ON public.attendance_records
    FOR ALL USING (public.is_leader_or_admin());

-- 9. GALLERY POLICIES
CREATE POLICY "View gallery" ON public.gallery
    FOR SELECT USING (public.is_approved());

CREATE POLICY "Manage gallery" ON public.gallery
    FOR ALL USING (public.is_leader_or_admin());

-- 10. NOTIFICATIONS POLICIES
CREATE POLICY "View own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- STORAGE BUCKETS CONFIGURATION (Run in Supabase Storage SQL Editor)
-- ==============================================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('songs', 'songs', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
