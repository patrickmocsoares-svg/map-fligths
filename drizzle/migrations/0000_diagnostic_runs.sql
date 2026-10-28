CREATE TABLE public.diagnostic_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_at timestamptz NOT NULL DEFAULT now(),
  overall text NOT NULL,
  sections jsonb NOT NULL,
  run_by uuid
);
CREATE INDEX diagnostic_runs_checked_at_idx ON public.diagnostic_runs (checked_at DESC);
GRANT SELECT, INSERT ON public.diagnostic_runs TO authenticated;
GRANT ALL ON public.diagnostic_runs TO service_role;
ALTER TABLE public.diagnostic_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read diagnostic runs" ON public.diagnostic_runs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert diagnostic runs" ON public.diagnostic_runs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') AND run_by = auth.uid());