-- PawCare appointment booking migration
-- Import this once into the existing `pawcare` database.

CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL UNIQUE,
  description VARCHAR(500) DEFAULT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO services (id,name,description,active) VALUES
(1,'Dog & Cat Vaccinations','Core and non-core vaccines, including anti-rabies and age-appropriate protection.',1),
(2,'Wellness Consultation','Physical exams and health checks for puppies, adults and seniors.',1),
(3,'Deworming','Safe, weight-based parasite treatment for every life stage.',1),
(4,'Laboratory & Diagnostics','CBC, urinalysis, fecal exams, heartworm testing and imaging.',1),
(5,'Dental Care','Professional cleaning, oral assessment and dental procedures.',1),
(6,'Medication & Prevention','Prescription support, preventive care and wellness recommendations.',1)
ON DUPLICATE KEY UPDATE description=VALUES(description), active=VALUES(active);

CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  service_id INT NOT NULL,
  branch VARCHAR(190) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  customer_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  pet_name VARCHAR(100) NOT NULL,
  pet_type VARCHAR(40) NOT NULL,
  pet_age VARCHAR(30) DEFAULT NULL,
  notes VARCHAR(1000) DEFAULT NULL,
  status ENUM('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (service_id) REFERENCES services(id),
  UNIQUE KEY unique_active_slot (branch, appointment_date, appointment_time, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
