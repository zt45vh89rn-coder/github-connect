
-- Generic per-user JSONB tables used by the YEN app REST calls
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['tasks','projects','deals','invoices','cashflow','memos','schedule','finances','competitors','feed','ventures','okrs','gigs','gigorders']
  LOOP
    EXECUTE format($f$
      CREATE TABLE IF NOT EXISTS public.%1$I (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        data jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.%1$I TO authenticated;
      GRANT ALL ON public.%1$I TO service_role;
      ALTER TABLE public.%1$I ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "own rows" ON public.%1$I;
      CREATE POLICY "own rows" ON public.%1$I FOR ALL TO authenticated
        USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
      CREATE INDEX IF NOT EXISTS %2$I ON public.%1$I(user_id, created_at);
    $f$, t, t || '_user_created_idx');
  END LOOP;
END $$;

-- userdata: one row per user, keyed by auth uid
CREATE TABLE IF NOT EXISTS public.userdata (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.userdata TO authenticated;
GRANT ALL ON public.userdata TO service_role;
ALTER TABLE public.userdata ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own userdata" ON public.userdata;
CREATE POLICY "own userdata" ON public.userdata FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- yen_wallets: one row per user
CREATE TABLE IF NOT EXISTS public.yen_wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.yen_wallets TO authenticated;
GRANT ALL ON public.yen_wallets TO service_role;
ALTER TABLE public.yen_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own wallet" ON public.yen_wallets;
CREATE POLICY "own wallet" ON public.yen_wallets FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-create empty wallet on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.yen_wallets(user_id, balance) VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.userdata(id, data) VALUES (NEW.id, '{}'::jsonb)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
