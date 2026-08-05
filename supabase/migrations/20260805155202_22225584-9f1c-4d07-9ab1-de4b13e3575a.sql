-- ============ ROLES ============
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can read their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ SETTINGS ============
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  cost_per_mile numeric NOT NULL DEFAULT 0.025,
  markup_fixed numeric NOT NULL DEFAULT 150,
  airport_tax numeric NOT NULL DEFAULT 38,
  whatsapp_number text NOT NULL DEFAULT '5511999999999',
  business_hours text NOT NULL DEFAULT 'Seg a Sáb, 8h às 20h (horário de Brasília)',
  contact_email text NOT NULL DEFAULT 'contato@mabflights.com',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read settings"
  ON public.settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER settings_set_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.settings (singleton) VALUES (true)
ON CONFLICT (singleton) DO NOTHING;

-- ============ ORDERS: QUOTE FIELDS ============
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS real_price_brl numeric,
  ADD COLUMN IF NOT EXISTS miles_required numeric,
  ADD COLUMN IF NOT EXISTS miles_price_brl numeric,
  ADD COLUMN IF NOT EXISTS markup_applied_brl numeric,
  ADD COLUMN IF NOT EXISTS airport_tax_brl numeric,
  ADD COLUMN IF NOT EXISTS final_price_brl numeric,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS locator text;

-- ============ ADMIN READ ACCESS ============
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.customers TO authenticated;
GRANT SELECT ON public.order_status_history TO authenticated;
GRANT SELECT ON public.order_messages TO authenticated;
GRANT SELECT ON public.payments TO authenticated;
GRANT SELECT ON public.email_logs TO authenticated;

CREATE POLICY "Admins can read orders" ON public.orders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can read customers" ON public.customers
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can read order status history" ON public.order_status_history
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can read order messages" ON public.order_messages
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can read payments" ON public.payments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can read email logs" ON public.email_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));