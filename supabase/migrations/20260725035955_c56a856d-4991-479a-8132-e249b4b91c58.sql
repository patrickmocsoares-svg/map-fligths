-- MAB Deals Intelligence: historical price observations
CREATE TABLE public.price_history (
  id BIGSERIAL PRIMARY KEY,
  origin_iata TEXT NOT NULL,
  destination_iata TEXT NOT NULL,
  airline TEXT,
  cabin TEXT NOT NULL DEFAULT 'economy',
  price NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  flight_date DATE NOT NULL,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'mock',
  CONSTRAINT price_history_iata_origin_len CHECK (char_length(origin_iata) = 3),
  CONSTRAINT price_history_iata_dest_len CHECK (char_length(destination_iata) = 3),
  CONSTRAINT price_history_price_pos CHECK (price >= 0)
);

-- Normalize IATA codes to uppercase for consistent lookups
CREATE OR REPLACE FUNCTION public.price_history_normalize()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.origin_iata := upper(NEW.origin_iata);
  NEW.destination_iata := upper(NEW.destination_iata);
  NEW.currency := upper(NEW.currency);
  IF NEW.airline IS NOT NULL THEN
    NEW.airline := upper(NEW.airline);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER price_history_normalize_bi
BEFORE INSERT OR UPDATE ON public.price_history
FOR EACH ROW EXECUTE FUNCTION public.price_history_normalize();

CREATE INDEX price_history_route_flight_idx
  ON public.price_history (origin_iata, destination_iata, flight_date);
CREATE INDEX price_history_route_searched_idx
  ON public.price_history (origin_iata, destination_iata, searched_at DESC);

-- Aggregate helper: route stats over the last N days (defaults to 90)
CREATE OR REPLACE FUNCTION public.route_price_stats(
  _origin TEXT,
  _destination TEXT,
  _cabin TEXT DEFAULT 'economy',
  _days INT DEFAULT 90
)
RETURNS TABLE (
  samples INT,
  avg_price NUMERIC,
  min_price NUMERIC,
  max_price NUMERIC,
  p25_price NUMERIC,
  p50_price NUMERIC,
  p75_price NUMERIC,
  last_price NUMERIC,
  last_searched_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    COUNT(*)::int AS samples,
    AVG(price)::numeric AS avg_price,
    MIN(price)::numeric AS min_price,
    MAX(price)::numeric AS max_price,
    percentile_cont(0.25) WITHIN GROUP (ORDER BY price)::numeric AS p25_price,
    percentile_cont(0.50) WITHIN GROUP (ORDER BY price)::numeric AS p50_price,
    percentile_cont(0.75) WITHIN GROUP (ORDER BY price)::numeric AS p75_price,
    (SELECT price FROM public.price_history ph2
       WHERE ph2.origin_iata = upper(_origin)
         AND ph2.destination_iata = upper(_destination)
         AND ph2.cabin = _cabin
       ORDER BY ph2.searched_at DESC LIMIT 1) AS last_price,
    MAX(searched_at) AS last_searched_at
  FROM public.price_history
  WHERE origin_iata = upper(_origin)
    AND destination_iata = upper(_destination)
    AND cabin = _cabin
    AND searched_at >= now() - make_interval(days => _days);
$$;

-- GRANTs (Data API is explicit-by-default)
GRANT SELECT ON public.price_history TO anon, authenticated;
GRANT ALL ON public.price_history TO service_role;
GRANT EXECUTE ON FUNCTION public.route_price_stats(TEXT, TEXT, TEXT, INT) TO anon, authenticated, service_role;

-- RLS: public reads, writes only via service_role (backend / seeder / cron)
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Price history is publicly readable"
  ON public.price_history
  FOR SELECT
  USING (true);
