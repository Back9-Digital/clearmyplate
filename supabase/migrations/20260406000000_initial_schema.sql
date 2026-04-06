-- ============================================================
-- ClearMyPlate – Initial Schema
-- ============================================================

-- Enums
CREATE TYPE goal_type AS ENUM ('build_muscle', 'lose_weight', 'maintain');
CREATE TYPE plan_status AS ENUM ('draft', 'active', 'archived');

-- ============================================================
-- 1. household_profiles
-- ============================================================
CREATE TABLE household_profiles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  adults      int  NOT NULL DEFAULT 2 CHECK (adults >= 1),
  kids        int  NOT NULL DEFAULT 0 CHECK (kids >= 0),
  meals_together bool NOT NULL DEFAULT true,
  timezone    text NOT NULL DEFAULT 'Pacific/Auckland',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE household_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "household_profiles: owner access"
  ON household_profiles
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 2. preferences
-- ============================================================
CREATE TABLE preferences (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id        uuid NOT NULL UNIQUE REFERENCES household_profiles(id) ON DELETE CASCADE,
  goal                goal_type NOT NULL DEFAULT 'maintain',
  budget_weekly_nzd   int NOT NULL DEFAULT 200 CHECK (budget_weekly_nzd > 0),
  will_eat            jsonb NOT NULL DEFAULT '[]',
  wont_eat            jsonb NOT NULL DEFAULT '[]',
  pref_use_leftovers  bool NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "preferences: owner access"
  ON preferences
  FOR ALL
  USING (
    household_id IN (
      SELECT id FROM household_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    household_id IN (
      SELECT id FROM household_profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 3. plans
-- ============================================================
CREATE TABLE plans (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id          uuid NOT NULL REFERENCES household_profiles(id) ON DELETE CASCADE,
  week_start_date       date NOT NULL,
  status                plan_status NOT NULL DEFAULT 'draft',
  preferences_snapshot  jsonb NOT NULL DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (household_id, week_start_date)
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans: owner access"
  ON plans
  FOR ALL
  USING (
    household_id IN (
      SELECT id FROM household_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    household_id IN (
      SELECT id FROM household_profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 4. plan_items
-- ============================================================
CREATE TABLE plan_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id          uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  day_of_week      int  NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  meal_type        text NOT NULL DEFAULT 'dinner',
  meal_name        text NOT NULL,
  description      text,
  key_ingredients  jsonb NOT NULL DEFAULT '[]',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plan_items: owner access"
  ON plan_items
  FOR ALL
  USING (
    plan_id IN (
      SELECT p.id FROM plans p
      JOIN household_profiles h ON h.id = p.household_id
      WHERE h.user_id = auth.uid()
    )
  )
  WITH CHECK (
    plan_id IN (
      SELECT p.id FROM plans p
      JOIN household_profiles h ON h.id = p.household_id
      WHERE h.user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. grocery_lists
-- ============================================================
CREATE TABLE grocery_lists (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id       uuid NOT NULL UNIQUE REFERENCES plans(id) ON DELETE CASCADE,
  household_id  uuid NOT NULL REFERENCES household_profiles(id) ON DELETE CASCADE,
  items         jsonb NOT NULL DEFAULT '[]',
  -- items shape: [{"category": "Produce", "name": "Onions", "quantity": "3"}]
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grocery_lists: owner access"
  ON grocery_lists
  FOR ALL
  USING (
    household_id IN (
      SELECT id FROM household_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    household_id IN (
      SELECT id FROM household_profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- updated_at trigger (shared)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_household_profiles_updated_at
  BEFORE UPDATE ON household_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_preferences_updated_at
  BEFORE UPDATE ON preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_plan_items_updated_at
  BEFORE UPDATE ON plan_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_grocery_lists_updated_at
  BEFORE UPDATE ON grocery_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
