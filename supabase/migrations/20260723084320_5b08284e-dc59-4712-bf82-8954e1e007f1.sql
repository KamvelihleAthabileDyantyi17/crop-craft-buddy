CREATE TABLE public.stock_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('animals','grain')),
  item_name text NOT NULL,
  action text NOT NULL CHECK (action IN ('bought','sold')),
  quantity numeric NOT NULL DEFAULT 0,
  unit_price_rands numeric NOT NULL DEFAULT 0,
  entry_month text NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_entries TO anon, authenticated;
GRANT ALL ON public.stock_entries TO service_role;
ALTER TABLE public.stock_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all" ON public.stock_entries FOR ALL USING (true) WITH CHECK (true);