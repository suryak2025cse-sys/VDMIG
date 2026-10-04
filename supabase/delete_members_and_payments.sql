-- ====================================================================
-- SCRIPT: DELETE ALL MEMBERS AND PAYMENT COLLECTION RECORDS
-- VATHAMBAI ILANTHAZHIR KUZHU (வதம்பை இளந்தளிர் குழு)
-- ====================================================================

BEGIN;

-- 1. Delete all payment submission and verification records
DELETE FROM public.payments;

-- 2. Delete all attendance logs and notifications linked to members
DELETE FROM public.attendance_records;
DELETE FROM public.notifications;

-- 3. Delete all payment collector configurations
DELETE FROM public.payment_collectors;

-- 4. Delete all member profiles
DELETE FROM public.profiles;

-- 5. OPTIONAL: To delete users from Supabase Auth so emails can be re-registered:
-- DELETE FROM auth.users;

COMMIT;
