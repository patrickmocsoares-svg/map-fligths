CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE public.airports (
  id BIGSERIAL PRIMARY KEY,
  iata_code TEXT NOT NULL UNIQUE,
  icao_code TEXT,
  airport_name TEXT NOT NULL,
  city TEXT,
  country TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.airports TO anon;
GRANT SELECT ON public.airports TO authenticated;
GRANT ALL ON public.airports TO service_role;

ALTER TABLE public.airports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Airports are publicly readable"
  ON public.airports FOR SELECT
  USING (true);

CREATE INDEX airports_iata_idx ON public.airports (iata_code);
CREATE INDEX airports_city_trgm_idx ON public.airports USING gin (city gin_trgm_ops);
CREATE INDEX airports_name_trgm_idx ON public.airports USING gin (airport_name gin_trgm_ops);
CREATE INDEX airports_country_trgm_idx ON public.airports USING gin (country gin_trgm_ops);