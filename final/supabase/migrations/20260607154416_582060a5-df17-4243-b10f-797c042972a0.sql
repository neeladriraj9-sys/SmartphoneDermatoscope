
-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  age INTEGER,
  skin_tone TEXT CHECK (skin_tone IN ('I','II','III','IV','V','VI')),
  sun_exposure TEXT CHECK (sun_exposure IN ('low','moderate','high')),
  family_history_skin_cancer BOOLEAN NOT NULL DEFAULT false,
  personal_history_skin_cancer BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users delete own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Shared updated_at function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- SPOTS
-- =========================================================
CREATE TABLE public.spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  body_location TEXT NOT NULL,
  body_location_label TEXT NOT NULL,
  first_scan_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  latest_risk_level TEXT CHECK (latest_risk_level IN ('reassuring','watch','see_doctor_soon','see_doctor_urgently')),
  reminder_frequency_days INTEGER NOT NULL DEFAULT 90,
  next_reminder_date TIMESTAMPTZ,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_spots_user ON public.spots(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spots TO authenticated;
GRANT ALL ON public.spots TO service_role;
ALTER TABLE public.spots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own spots" ON public.spots FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_spots_updated_at BEFORE UPDATE ON public.spots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- SCANS
-- =========================================================
CREATE TABLE public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  body_location TEXT NOT NULL,
  duration_present TEXT,
  has_changed BOOLEAN NOT NULL DEFAULT false,
  change_description TEXT,
  symptoms TEXT,
  additional_notes TEXT,
  ai_result JSONB,
  risk_level TEXT CHECK (risk_level IN ('reassuring','watch','see_doctor_soon','see_doctor_urgently')),
  change_from_previous TEXT CHECK (change_from_previous IN ('improved','unchanged','changed','significantly_changed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_scans_user ON public.scans(user_id);
CREATE INDEX idx_scans_spot ON public.scans(spot_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scans TO authenticated;
GRANT ALL ON public.scans TO service_role;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own scans" ON public.scans FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- EDUCATION ARTICLES (public read)
-- =========================================================
CREATE TABLE public.education_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  read_time_minutes INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.education_articles TO anon, authenticated;
GRANT ALL ON public.education_articles TO service_role;
ALTER TABLE public.education_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Articles are public" ON public.education_articles FOR SELECT TO anon, authenticated USING (true);

-- Seed articles
INSERT INTO public.education_articles (title, slug, category, summary, body, read_time_minutes) VALUES
('What is the ABCDE rule?', 'abcde-rule', 'Self-Checks',
 'A simple framework to spot a mole that might need a doctor''s opinion — Asymmetry, Border, Colour, Diameter, Evolution.',
 E'The ABCDE rule is one of the easiest ways to keep an eye on the moles and spots on your skin. It''s used by doctors and is just as useful for you at home.\n\n**A — Asymmetry**: A typical, harmless mole is usually round and even. If you draw a line down the middle, both halves look similar. A mole that looks lopsided — one half doesn''t match the other — is worth a closer look.\n\n**B — Border**: Most healthy moles have a smooth, well-defined edge. Borders that look ragged, blurred, or notched are a feature worth a doctor''s opinion.\n\n**C — Colour**: Even-coloured moles in one shade of brown or tan are typical. Moles that contain several colours — different browns, black, red, white, or blue — should be checked.\n\n**D — Diameter**: Moles larger than 6mm (about the size of a pencil eraser) deserve more attention, though smaller moles can still be concerning.\n\n**E — Evolution**: Any mole that is changing — in size, shape, colour, or feel — is the single most important warning sign. A new symptom like itching, bleeding, or crusting also counts as evolution.\n\nMost moles are completely harmless. The ABCDE rule is just a calm way to notice the few that need professional attention sooner.',
 4),
('What does a normal mole look like?', 'normal-mole', 'Self-Checks',
 'The vast majority of moles are completely harmless. Here is what typical, reassuring moles look like — and why most of yours are probably fine.',
 E'Almost everyone has moles, and almost all of them are completely harmless. A typical mole is small, round or oval, and one even colour — usually a single shade of brown, tan, or pink. It has smooth, defined edges and looks the same from one month to the next.\n\nNew moles can appear up to around the age of 40 and that''s normal. Existing moles can slowly darken in the sun or fade with age — also normal. The moles you''ve had since childhood that haven''t changed in years are very likely nothing to worry about.\n\nWhat doctors look for is something *different* — a mole that doesn''t match the others on your body, or one that has clearly started to change. Most people have around 10–40 moles. If one stands out as the "odd one out", that''s worth a quick check.\n\nThe best thing you can do is know your own skin. Most spots are friends, not foes.',
 3),
('Understanding your skin tone and sun risk', 'fitzpatrick-skin-tone', 'Sun & Skin Tone',
 'The Fitzpatrick scale is a simple way to understand how your skin reacts to the sun — and what that means for your risk.',
 E'The Fitzpatrick scale describes six skin tones based on how your skin reacts to the sun. Knowing your type helps you understand your sun-damage risk and how often to check your skin.\n\n**Type I** — Very fair skin, often with freckles, light eyes, red or blond hair. Always burns, never tans. Highest risk of sun damage.\n\n**Type II** — Fair skin, light eyes, blond or light brown hair. Usually burns, tans minimally. High risk.\n\n**Type III** — Medium fair skin. Sometimes burns, gradually tans to light brown. Moderate risk.\n\n**Type IV** — Olive or light brown skin. Rarely burns, tans easily to a moderate brown. Lower risk.\n\n**Type V** — Brown skin. Very rarely burns, tans deeply. Low risk of burning but skin cancers do occur.\n\n**Type VI** — Deeply pigmented dark brown to black skin. Never burns. Lowest risk of sun-related damage, but skin cancers can still appear — often in less obvious places like soles of feet, palms, and under nails.\n\nWhatever your type, regular self-checks and sun protection are worthwhile. Lower-risk doesn''t mean no-risk.',
 5),
('When should I see a doctor about a skin spot?', 'when-to-see-doctor', 'When to See a Doctor',
 'Most spots are nothing to worry about. Here is a calm, clear guide to what does warrant a professional opinion.',
 E'Most skin spots are harmless and don''t need a doctor. But some features are worth a professional opinion, and seeing a GP early is always the right call when something is bothering you.\n\nSee your GP if you notice any of these:\n\n- A spot that is **clearly changing** — in size, shape, colour, or texture\n- A new spot that looks **different from your others**\n- A spot that **itches, bleeds, crusts, or won''t heal**\n- A mole that has become **asymmetrical**, has **ragged edges**, contains **several colours**, or is **larger than 6mm**\n- Any spot you simply feel uneasy about — your instinct matters\n\nYou don''t need to wait until something is dramatic. A short appointment with your GP is reassurance you can''t get any other way, and they''ll never make you feel silly for asking.\n\nIf you have a family history of skin cancer, or skin types I or II, consider an annual check with a dermatologist as a baseline. For everyone else, a yearly self-check covering the whole body is a great habit.',
 4),
('How to take a good photo of your skin for checking', 'good-photo-tips', 'How to Use SkinScan',
 'Clear, well-lit photos give the AI the best chance of giving you a useful read. Here is exactly how to do it.',
 E'A good photo makes all the difference. Here is what to aim for:\n\n**1. Natural light is best.** Stand near a window during the day. Avoid harsh overhead light, shadows across the spot, or yellow indoor lighting.\n\n**2. Get close — but stay focused.** Hold your phone about 10–15 cm away from the spot. Tap the screen on the spot to make sure the camera focuses on it. The spot should fill most of the frame.\n\n**3. Hold the phone steady.** A blurry photo is no good. Brace your elbow against your body or rest your hand on a surface if you can.\n\n**4. Skin only — no nail polish, makeup, or clothing edges in the frame.** Clean, dry skin gives the clearest image.\n\n**5. Take 2–3 photos** and choose the clearest one. It only takes a few seconds and gives you the best result.\n\nIf the AI can''t see your spot clearly, it can''t help you well. A few extra seconds setting up the shot is always worth it.',
 3),
('How often should I check my skin?', 'check-frequency', 'Self-Checks',
 'A simple frequency guide for self-checks — based on your skin type, family history, and what you''re tracking.',
 E'Regular checks are how most skin changes are caught early. The good news: it doesn''t take long, and you don''t need to do it every day.\n\n**Once a month** is a sensible rhythm for a full self-check. Pick a date — the first of the month, the same day as your phone bill, whatever sticks. Spend 10 minutes in front of a mirror checking your whole body, including places you don''t usually look: your back (use a hand mirror), scalp, behind your ears, soles of your feet, between your toes, under your nails.\n\n**Every 3 months** is a reasonable re-check for any individual spot you''re actively tracking. SkinScan AI will remind you when one of your spots is due.\n\n**Once a year** consider a professional skin check — especially if you have:\n- A family history of skin cancer\n- Skin type I or II\n- More than 50 moles\n- A history of significant sunburns\n- A previous skin cancer\n\nIf anything new appears between checks, or you notice a change, don''t wait until your next scheduled check — look at it now. Catching something early is always better than catching it late.',
 4);

-- =========================================================
-- CONTACT MESSAGES
-- =========================================================
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact messages" ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
