ALTER TABLE product_feedback
  ADD COLUMN IF NOT EXISTS rating SMALLINT;

ALTER TABLE product_feedback
  ALTER COLUMN comment DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'product_feedback_rating_range'
      AND conrelid = 'product_feedback'::regclass
  ) THEN
    ALTER TABLE product_feedback
      ADD CONSTRAINT product_feedback_rating_range
      CHECK (rating IS NULL OR rating BETWEEN 1 AND 5);
  END IF;
END
$$;
