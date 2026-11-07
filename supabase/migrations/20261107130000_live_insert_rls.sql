-- Live PawCare inserts and public catalog access.
-- Backend API connections use the privileged PostgreSQL service role and bypass these policies.

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public products read" ON products;
CREATE POLICY "Public products read" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public services read" ON services;
CREATE POLICY "Public services read" ON services FOR SELECT USING (true);

DROP POLICY IF EXISTS "Guest cart insert" ON cart_items;
CREATE POLICY "Guest cart insert" ON cart_items FOR INSERT
WITH CHECK (guest_token IS NOT NULL OR user_id IS NOT NULL);

DROP POLICY IF EXISTS "Guest cart update" ON cart_items;
CREATE POLICY "Guest cart update" ON cart_items FOR UPDATE
USING (guest_token IS NOT NULL OR user_id IS NOT NULL)
WITH CHECK (guest_token IS NOT NULL OR user_id IS NOT NULL);

DROP POLICY IF EXISTS "Guest cart delete" ON cart_items;
CREATE POLICY "Guest cart delete" ON cart_items FOR DELETE
USING (guest_token IS NOT NULL OR user_id IS NOT NULL);

DROP POLICY IF EXISTS "Public appointment insert" ON appointments;
CREATE POLICY "Public appointment insert" ON appointments FOR INSERT
WITH CHECK (service_id IS NOT NULL AND branch IS NOT NULL AND appointment_date IS NOT NULL);
