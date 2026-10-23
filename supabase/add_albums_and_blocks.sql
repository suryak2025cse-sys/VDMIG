-- ==============================================================================
-- MIGRATION: ALBUM MANAGEMENT & USER BLOCK/UNBLOCK RELATIONSHIP
-- ==============================================================================

-- 1. CREATE ALBUMS TABLE
CREATE TABLE IF NOT EXISTS public.albums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ENHANCE GALLERY TABLE FOR ALBUM & VIDEO MEDIA SUPPORT
ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS album_id UUID REFERENCES public.albums(id) ON DELETE CASCADE;
ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image';
ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS public_id TEXT;

-- Sync existing image_url to file_url if file_url is null
UPDATE public.gallery SET file_url = image_url WHERE file_url IS NULL;

-- 3. MIGRATE EXISTING GALLERY ITEMS WITH EVENT_NAME INTO ALBUMS
DO $$
DECLARE
    rec RECORD;
    v_album_id UUID;
BEGIN
    FOR rec IN SELECT DISTINCT event_name FROM public.gallery WHERE event_name IS NOT NULL AND album_id IS NULL LOOP
        SELECT id INTO v_album_id FROM public.albums WHERE name = rec.event_name LIMIT 1;
        IF v_album_id IS NULL THEN
            INSERT INTO public.albums (name, description, cover_image_url)
            SELECT rec.event_name, 'Event Album', image_url FROM public.gallery WHERE event_name = rec.event_name LIMIT 1
            RETURNING id INTO v_album_id;
        END IF;
        UPDATE public.gallery SET album_id = v_album_id WHERE event_name = rec.event_name AND album_id IS NULL;
    END LOOP;
END $$;

-- 4. CREATE USER_BLOCKS TABLE FOR BLOCK RELATIONSHIPS
CREATE TABLE IF NOT EXISTS public.user_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- 5. ADD BLOCK TRACKING COLUMNS TO PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;

-- 6. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES FOR ALBUMS
DROP POLICY IF EXISTS "View albums" ON public.albums;
CREATE POLICY "View albums" ON public.albums
    FOR SELECT USING (public.is_approved());

DROP POLICY IF EXISTS "Manage albums" ON public.albums;
CREATE POLICY "Manage albums" ON public.albums
    FOR ALL USING (public.is_leader_or_admin());

-- 8. RLS POLICIES FOR USER_BLOCKS
DROP POLICY IF EXISTS "View user blocks" ON public.user_blocks;
CREATE POLICY "View user blocks" ON public.user_blocks
    FOR SELECT USING (
        auth.uid() = blocker_id OR public.is_leader_or_admin()
    );

DROP POLICY IF EXISTS "Manage user blocks" ON public.user_blocks;
CREATE POLICY "Manage user blocks" ON public.user_blocks
    FOR ALL USING (
        auth.uid() = blocker_id OR public.is_leader_or_admin()
    );
