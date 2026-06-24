-- profiles (extends auth.users)
CREATE TABLE profiles (
  id                 uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email              text NOT NULL,
  plan               text NOT NULL DEFAULT 'free'
                     CHECK (plan IN ('free', 'pro', 'team', 'lifetime')),
  stripe_customer_id text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND plan = (SELECT plan FROM profiles WHERE id = auth.uid())
    AND stripe_customer_id IS NOT DISTINCT FROM (SELECT stripe_customer_id FROM profiles WHERE id = auth.uid())
  );

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- checks (one row per verification run)
CREATE TABLE checks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  input_type    text NOT NULL CHECK (input_type IN ('text', 'url')),
  input_preview text,
  claim_count   int,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own checks"
  ON checks FOR SELECT USING (auth.uid() = user_id);

-- daily_usage (tracks free tier limits)
CREATE TABLE daily_usage (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint  text,
  user_id      uuid REFERENCES profiles(id) ON DELETE CASCADE,
  date         date NOT NULL,
  check_count  int NOT NULL DEFAULT 0,
  UNIQUE (fingerprint, date),
  UNIQUE (user_id, date)
);

ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;
-- Service role bypasses RLS for usage tracking

-- subscriptions
CREATE TABLE subscriptions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE,
  plan                   text NOT NULL CHECK (plan IN ('pro', 'team')),
  status                 text NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due')),
  current_period_end     timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own subscriptions"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);
