-- Family member names (jsonb array of { role: "adult"|"child", name: string })
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS family_members jsonb;

-- Allergies & intolerances (jsonb array of strings, e.g. ["Gluten", "Nuts"])
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allergies jsonb;
