ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS fulfillment_method TEXT NOT NULL DEFAULT 'delivery'
    CHECK (fulfillment_method IN ('delivery', 'pickup')),
  ADD COLUMN IF NOT EXISTS pickup_branch VARCHAR(190);

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', TRUE)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;
