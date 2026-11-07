ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock BIGINT NOT NULL DEFAULT 100;

CREATE TABLE IF NOT EXISTS product_conversations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  feedback_id BIGINT REFERENCES product_feedback(id) ON DELETE SET NULL,
  kind TEXT NOT NULL DEFAULT 'product' CHECK (kind IN ('product','preorder')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','pending','approved','rejected')),
  preorder_qty BIGINT DEFAULT NULL CHECK (preorder_qty IS NULL OR preorder_qty > 0),
  user_read_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  owner_read_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_conversations_user_updated
  ON product_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_conversations_updated
  ON product_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_conversations_feedback
  ON product_conversations(feedback_id);

CREATE TABLE IF NOT EXISTS product_messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES product_conversations(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user','owner','system')),
  sender_id BIGINT DEFAULT NULL,
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_messages_conversation
  ON product_messages(conversation_id, created_at, id);
