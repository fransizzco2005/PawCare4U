-- Product conversations, preorder requests, and in-app messages.
CREATE TABLE IF NOT EXISTS product_conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  feedback_id INT DEFAULT NULL,
  kind ENUM('product','preorder') NOT NULL DEFAULT 'product',
  status ENUM('open','pending','approved','rejected') NOT NULL DEFAULT 'open',
  preorder_qty INT DEFAULT NULL,
  user_read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  owner_read_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_product_conversations_user_updated(user_id,updated_at),
  INDEX idx_product_conversations_updated(updated_at),
  INDEX idx_product_conversations_feedback(feedback_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (feedback_id) REFERENCES product_feedback(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_role ENUM('user','owner','system') NOT NULL,
  sender_id INT DEFAULT NULL,
  message VARCHAR(1000) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_product_messages_conversation(conversation_id,created_at,id),
  FOREIGN KEY (conversation_id) REFERENCES product_conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
