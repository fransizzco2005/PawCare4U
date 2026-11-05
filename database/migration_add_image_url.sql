-- Run this once if your `products` table already exists (i.e. you already
-- imported schema.sql / database/pawcare.sql before this update).
-- It adds the column needed to show real product photos instead of the
-- black placeholder.

ALTER TABLE products ADD COLUMN image_url VARCHAR(255) DEFAULT NULL AFTER stock;

-- Example: set an image for a specific product once you have uploaded it,
-- e.g. to an "images/products/" folder in this project:
-- UPDATE products SET image_url = 'images/products/1.jpg' WHERE id = 1;
