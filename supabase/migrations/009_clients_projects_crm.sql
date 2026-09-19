-- Zedwix Clients CRM: New tables for client/project management
-- Migration 009: Creates owner_clients, owner_projects, owner_milestones, owner_payments, owner_activity_log, owner_notes
-- Runs on the SAME Supabase project as zedwix-engine

-- ============================================================
-- 1. OWNER CLIENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.owner_clients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  company         text,
  email           text,
  phone           text,
  whatsapp        text,
  address         text,
  city            text,
  avatar_url      text,
  total_billed    numeric(12,2) NOT NULL DEFAULT 0,
  total_paid      numeric(12,2) NOT NULL DEFAULT 0,
  total_due       numeric(12,2) NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  last_activity   timestamptz DEFAULT now(),
  notes           text,
  order_id        text REFERENCES public.owner_orders(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_owner_clients_status ON public.owner_clients(status);
CREATE INDEX IF NOT EXISTS idx_owner_clients_created ON public.owner_clients(created_at DESC);

ALTER TABLE public.owner_clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access on owner_clients" ON public.owner_clients;
CREATE POLICY "Admin full access on owner_clients"
  ON public.owner_clients FOR ALL USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS set_owner_clients_updated_at ON public.owner_clients;
CREATE TRIGGER set_owner_clients_updated_at
  BEFORE UPDATE ON public.owner_clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 2. OWNER PROJECTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.owner_projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid NOT NULL REFERENCES public.owner_clients(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'on_hold')),
  start_date      date,
  deadline        date,
  total_amount    numeric(12,2) NOT NULL DEFAULT 0,
  paid_amount     numeric(12,2) NOT NULL DEFAULT 0,
  due_amount      numeric(12,2) NOT NULL DEFAULT 0,
  order_id        text REFERENCES public.owner_orders(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_owner_projects_client ON public.owner_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_owner_projects_status ON public.owner_projects(status);

ALTER TABLE public.owner_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access on owner_projects" ON public.owner_projects;
CREATE POLICY "Admin full access on owner_projects"
  ON public.owner_projects FOR ALL USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS set_owner_projects_updated_at ON public.owner_projects;
CREATE TRIGGER set_owner_projects_updated_at
  BEFORE UPDATE ON public.owner_projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 3. OWNER MILESTONES / DELIVERABLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.owner_milestones (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES public.owner_projects(id) ON DELETE CASCADE,
  title           text NOT NULL,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date        date,
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_owner_milestones_project ON public.owner_milestones(project_id);

ALTER TABLE public.owner_milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access on owner_milestones" ON public.owner_milestones;
CREATE POLICY "Admin full access on owner_milestones"
  ON public.owner_milestones FOR ALL USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS set_owner_milestones_updated_at ON public.owner_milestones;
CREATE TRIGGER set_owner_milestones_updated_at
  BEFORE UPDATE ON public.owner_milestones
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 4. OWNER PAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.owner_payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid NOT NULL REFERENCES public.owner_clients(id) ON DELETE CASCADE,
  project_id      uuid REFERENCES public.owner_projects(id) ON DELETE SET NULL,
  invoice_number  text NOT NULL,
  amount          numeric(12,2) NOT NULL,
  method          text NOT NULL DEFAULT 'bank_transfer' CHECK (method IN ('bank_transfer', 'jazzcash', 'easypaisa', 'sadapay', 'cash', 'other')),
  date            date NOT NULL DEFAULT CURRENT_DATE,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  transaction_id  text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_owner_payments_client ON public.owner_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_owner_payments_project ON public.owner_payments(project_id);
CREATE INDEX IF NOT EXISTS idx_owner_payments_status ON public.owner_payments(status);

ALTER TABLE public.owner_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access on owner_payments" ON public.owner_payments;
CREATE POLICY "Admin full access on owner_payments"
  ON public.owner_payments FOR ALL USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS set_owner_payments_updated_at ON public.owner_payments;
CREATE TRIGGER set_owner_payments_updated_at
  BEFORE UPDATE ON public.owner_payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 5. OWNER ACTIVITY LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.owner_activity_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     text NOT NULL CHECK (entity_type IN ('client', 'project', 'payment', 'store', 'milestone', 'system')),
  entity_id       text,
  action          text NOT NULL,
  description     text NOT NULL,
  actor           text NOT NULL DEFAULT 'System',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_owner_activity_created ON public.owner_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_owner_activity_entity ON public.owner_activity_log(entity_type, entity_id);

ALTER TABLE public.owner_activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access on owner_activity_log" ON public.owner_activity_log;
CREATE POLICY "Admin full access on owner_activity_log"
  ON public.owner_activity_log FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 6. OWNER NOTES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.owner_notes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     text NOT NULL CHECK (entity_type IN ('client', 'project', 'payment', 'general')),
  entity_id       text,
  content         text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_owner_notes_entity ON public.owner_notes(entity_type, entity_id);

ALTER TABLE public.owner_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access on owner_notes" ON public.owner_notes;
CREATE POLICY "Admin full access on owner_notes"
  ON public.owner_notes FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 7. ENABLE SUPABASE REALTIME ON NEW TABLES
-- ============================================================
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['owner_clients', 'owner_projects', 'owner_milestones', 'owner_payments', 'owner_activity_log', 'owner_notes']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
