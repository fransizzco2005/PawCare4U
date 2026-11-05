-- PawCare owner, order tracking, and product feedback migration
CREATE TABLE IF NOT EXISTS owners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  status ENUM('placed','processing','shipped','delivered','cancelled') NOT NULL,
  note VARCHAR(255) DEFAULT NULL,
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  comment TEXT NOT NULL,
  owner_reply TEXT DEFAULT NULL,
  replied_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Demo owner account. Change this password after installation.
-- Email: owner@pawcare.ph | Password: owner123
INSERT INTO owners (name,email,password_hash)
VALUES ('PawCare Owner','owner@pawcare.ph','$2y$12$GaRF0/1JiK4CDI2Lc36pDOkO/SHiCvFg/5sHfMXe64uu6UAGdLriu')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO order_status_history (order_id,status,note)
SELECT id, order_status, 'Initial order status'
FROM orders o
WHERE NOT EXISTS (SELECT 1 FROM order_status_history h WHERE h.order_id=o.id);


-- Profile page additions: editable nickname/profile photo for users and owners.
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='nickname')=0, 'ALTER TABLE users ADD COLUMN nickname VARCHAR(80) DEFAULT NULL', 'SELECT 1'); PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='avatar_url')=0, 'ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL', 'SELECT 1'); PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='owners' AND COLUMN_NAME='profile_name')=0, 'ALTER TABLE owners ADD COLUMN profile_name VARCHAR(120) DEFAULT NULL', 'SELECT 1'); PREPARE s FROM @sql; EXECUTE s;
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='owners' AND COLUMN_NAME='avatar_url')=0, 'ALTER TABLE owners ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL', 'SELECT 1'); PREPARE s FROM @sql; EXECUTE s;


-- Owner-to-customer order messages. Owners can send a thank-you/update for a specific order.
CREATE TABLE IF NOT EXISTS order_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  owner_id INT NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
  INDEX idx_order_messages_order (order_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
