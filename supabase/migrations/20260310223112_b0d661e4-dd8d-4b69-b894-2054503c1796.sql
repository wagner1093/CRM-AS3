
-- =============================================
-- FIX RLS: Remove public policies, add permissive authenticated policies
-- =============================================

-- CONTACTS: Drop public policy
DROP POLICY IF EXISTS "Allow all" ON public.contacts;
DROP POLICY IF EXISTS "contacts_authenticated" ON public.contacts;

CREATE POLICY "contacts_authenticated_access"
  ON public.contacts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- CONVERSATIONS: Replace restrictive with permissive
DROP POLICY IF EXISTS "conversations_authenticated" ON public.conversations;

CREATE POLICY "conversations_authenticated_access"
  ON public.conversations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DEALS: Drop public policies, replace with authenticated
DROP POLICY IF EXISTS "Allow all" ON public.deals;
DROP POLICY IF EXISTS "Allow all reads" ON public.deals;
DROP POLICY IF EXISTS "Allow all updates" ON public.deals;
DROP POLICY IF EXISTS "deals_authenticated" ON public.deals;

CREATE POLICY "deals_authenticated_access"
  ON public.deals FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- MESSAGES: Replace restrictive with permissive
DROP POLICY IF EXISTS "messages_authenticated" ON public.messages;

CREATE POLICY "messages_authenticated_access"
  ON public.messages FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- NOTIFICATIONS: Replace restrictive with permissive
DROP POLICY IF EXISTS "notifications_authenticated" ON public.notifications;

CREATE POLICY "notifications_authenticated_access"
  ON public.notifications FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- VEHICLES: Replace restrictive with permissive
DROP POLICY IF EXISTS "vehicles_authenticated" ON public.vehicles;

CREATE POLICY "vehicles_authenticated_access"
  ON public.vehicles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Revoke anon access to sensitive tables
REVOKE ALL ON public.contacts FROM anon;
REVOKE ALL ON public.conversations FROM anon;
REVOKE ALL ON public.deals FROM anon;
REVOKE ALL ON public.messages FROM anon;
REVOKE ALL ON public.notifications FROM anon;
REVOKE ALL ON public.vehicles FROM anon;
