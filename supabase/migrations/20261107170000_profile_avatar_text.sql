-- Store resized profile photo data URLs without the 255-character limit.
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;
ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT USING avatar_url::TEXT;

ALTER TABLE owners ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;
ALTER TABLE owners ALTER COLUMN avatar_url TYPE TEXT USING avatar_url::TEXT;
