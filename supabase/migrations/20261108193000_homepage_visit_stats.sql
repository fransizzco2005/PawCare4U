CREATE TABLE IF NOT EXISTS site_stats (
  id SMALLINT PRIMARY KEY CHECK (id = 1),
  visits BIGINT NOT NULL DEFAULT 0 CHECK (visits >= 0)
);

INSERT INTO site_stats (id, visits)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;
