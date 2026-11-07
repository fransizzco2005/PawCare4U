-- PawCare Supabase PostgreSQL schema
-- =========================================================
-- PawCare — MySQL schema
-- Import with: mysql -u root -p pawcare < schema.sql
-- (create the database first: CREATE DATABASE pawcare;)
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30) DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS addresses (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  line1 VARCHAR(190) NOT NULL,
  city VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  is_default SMALLINT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  category VARCHAR(40) NOT NULL,
  subcategory VARCHAR(80) DEFAULT NULL,
  price DECIMAL(10,2) NOT NULL,
  old_price DECIMAL(10,2) DEFAULT NULL,
  rating DECIMAL(2,1) DEFAULT 4.5,
  reviews BIGINT DEFAULT 0,
  tag VARCHAR(20) DEFAULT NULL,
  icon VARCHAR(10) DEFAULT NULL,
  stock BIGINT DEFAULT 100,
  image_url VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Cart is tied to a logged-in user OR a guest session id, so a cart survives
-- a page refresh even before someone signs in.
CREATE TABLE IF NOT EXISTS cart_items (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT DEFAULT NULL,
  guest_token VARCHAR(64) DEFAULT NULL,
  product_id BIGINT NOT NULL,
  qty BIGINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  address_id BIGINT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  order_status TEXT NOT NULL DEFAULT 'placed',
  paymongo_reference VARCHAR(190) DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (address_id) REFERENCES addresses(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  name_snapshot VARCHAR(190) NOT NULL,
  price_snapshot DECIMAL(10,2) NOT NULL,
  qty BIGINT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Seed/refresh 100 static catalog products (10 categories × 2 per animal).
INSERT INTO products (id,name,category,subcategory,price,old_price,rating,reviews,tag,stock,image_url) VALUES
(1,'Premium Adult Dog Food 12kg','dog','Food & Treats',386,NULL,4.7,57,'sale',100,'https://loremflickr.com/640/640/dog,food?lock=1'),
(2,'Everyday Adult Dog Food 12kg','dog','Food & Treats',523,NULL,4.9,74,'top',100,'https://loremflickr.com/640/640/dog,food?lock=2'),
(3,'Gentle Oatmeal Dog Shampoo 500ml','dog','Grooming & Beauty',660,NULL,4.6,91,NULL,100,'https://loremflickr.com/640/640/dog,shampoo?lock=3'),
(4,'Gentle Oatmeal Dog Shampoo 500ml Plus','dog','Grooming & Beauty',797,1089,4.8,108,'new',100,'https://loremflickr.com/640/640/dog,shampoo?lock=4'),
(5,'Interactive Chew Toy Set','dog','Toys & Enrichment',934,NULL,4.5,125,'sale',100,'https://loremflickr.com/640/640/dog,toy?lock=5'),
(6,'Interactive Chew Toy Set Plus','dog','Toys & Enrichment',1071,NULL,4.7,142,'top',100,'https://loremflickr.com/640/640/dog,toy?lock=6'),
(7,'Orthopedic Support Bed — Large','dog','Beds & Comfort',1208,NULL,4.9,159,NULL,100,'https://loremflickr.com/640/640/dog,bed?lock=7'),
(8,'Orthopedic Support Bed — Large Plus','dog','Beds & Comfort',1345,1429,4.6,176,'new',100,'https://loremflickr.com/640/640/dog,bed?lock=8'),
(9,'Stainless Steel Feeding Bowl','dog','Feeding',1482,NULL,4.8,193,'sale',100,'https://loremflickr.com/640/640/dog,bowl?lock=9'),
(10,'Stainless Steel Feeding Bowl Plus','dog','Feeding',1619,NULL,4.5,210,'top',100,'https://loremflickr.com/640/640/dog,bowl?lock=10'),
(11,'Full-Grain Walking Leash 1.5m','dog','Walking & Outdoor',1756,NULL,4.7,227,NULL,100,'https://loremflickr.com/640/640/dog,leash?lock=11'),
(12,'Full-Grain Walking Leash 1.5m Plus','dog','Walking & Outdoor',1893,2269,4.9,244,'new',100,'https://loremflickr.com/640/640/dog,leash?lock=12'),
(13,'Joint & Mobility Care Bites','dog','Health & Wellness',2030,NULL,4.6,261,'sale',100,'https://loremflickr.com/640/640/dog,health?lock=13'),
(14,'Joint & Mobility Care Bites Plus','dog','Health & Wellness',2167,NULL,4.8,278,'top',100,'https://loremflickr.com/640/640/dog,health?lock=14'),
(15,'Positive Training Treat Pouch','dog','Training',2304,NULL,4.5,295,NULL,100,'https://loremflickr.com/640/640/dog,training?lock=15'),
(16,'Positive Training Treat Pouch Plus','dog','Training',2441,2609,4.7,52,'new',100,'https://loremflickr.com/640/640/dog,training?lock=16'),
(17,'Waterproof Dog Rain Jacket','dog','Clothing & Accessories',2578,NULL,4.9,69,'sale',100,'https://loremflickr.com/640/640/dog,clothing?lock=17'),
(18,'Waterproof Dog Rain Jacket Plus','dog','Clothing & Accessories',2715,NULL,4.6,86,'top',100,'https://loremflickr.com/640/640/dog,clothing?lock=18'),
(19,'Travel Carrier Backpack for Dogs','dog','Travel',2852,NULL,4.8,103,NULL,100,'https://loremflickr.com/640/640/dog,travel?lock=19'),
(20,'Travel Carrier Backpack for Dogs Plus','dog','Travel',2989,3449,4.5,120,'new',100,'https://loremflickr.com/640/640/dog,travel?lock=20'),
(21,'Premium Salmon Cat Food 3kg','cat','Food & Treats',3126,NULL,4.7,137,'sale',100,'https://loremflickr.com/640/640/cat,food?lock=21'),
(22,'Everyday Salmon Cat Food 3kg','cat','Food & Treats',3263,NULL,4.9,154,'top',100,'https://loremflickr.com/640/640/cat,food?lock=22'),
(23,'Sensitive Skin Cat Shampoo','cat','Grooming & Beauty',3400,NULL,4.6,171,NULL,100,'https://loremflickr.com/640/640/cat,shampoo?lock=23'),
(24,'Sensitive Skin Cat Shampoo Plus','cat','Grooming & Beauty',3537,3789,4.8,188,'new',100,'https://loremflickr.com/640/640/cat,shampoo?lock=24'),
(25,'Feather & Bell Enrichment Set','cat','Toys & Enrichment',3674,NULL,4.5,205,'sale',100,'https://loremflickr.com/640/640/cat,toy?lock=25'),
(26,'Feather & Bell Enrichment Set Plus','cat','Toys & Enrichment',3811,NULL,4.7,222,'top',100,'https://loremflickr.com/640/640/cat,toy?lock=26'),
(27,'Cozy Cat Cave Bed','cat','Beds & Comfort',348,NULL,4.9,239,NULL,100,'https://loremflickr.com/640/640/cat,bed?lock=27'),
(28,'Cozy Cat Cave Bed Plus','cat','Beds & Comfort',485,529,4.6,256,'new',100,'https://loremflickr.com/640/640/cat,bed?lock=28'),
(29,'Elevated Ceramic Cat Bowl','cat','Feeding',622,NULL,4.8,273,'sale',100,'https://loremflickr.com/640/640/cat,bowl?lock=29'),
(30,'Elevated Ceramic Cat Bowl Plus','cat','Feeding',759,NULL,4.5,290,'top',100,'https://loremflickr.com/640/640/cat,bowl?lock=30'),
(31,'Reflective Cat Walking Harness','cat','Walking & Outdoor',896,NULL,4.7,47,NULL,100,'https://loremflickr.com/640/640/cat,collar?lock=31'),
(32,'Reflective Cat Walking Harness Plus','cat','Walking & Outdoor',1033,1369,4.9,64,'new',100,'https://loremflickr.com/640/640/cat,collar?lock=32'),
(33,'Hairball & Wellness Bites','cat','Health & Wellness',1170,NULL,4.6,81,'sale',100,'https://loremflickr.com/640/640/cat,health?lock=33'),
(34,'Hairball & Wellness Bites Plus','cat','Health & Wellness',1307,NULL,4.8,98,'top',100,'https://loremflickr.com/640/640/cat,health?lock=34'),
(35,'Clicker Training Kit for Cats','cat','Training',1444,NULL,4.5,115,NULL,100,'https://loremflickr.com/640/640/cat,training?lock=35'),
(36,'Clicker Training Kit Plus for Cats','cat','Training',1581,1709,4.7,132,'new',100,'https://loremflickr.com/640/640/cat,training?lock=36'),
(37,'Soft Cat Harness & Vest','cat','Clothing & Accessories',1718,NULL,4.9,149,'sale',100,'https://loremflickr.com/640/640/cat,clothing?lock=37'),
(38,'Soft Cat Harness & Vest Plus','cat','Clothing & Accessories',1855,NULL,4.6,166,'top',100,'https://loremflickr.com/640/640/cat,clothing?lock=38'),
(39,'Airline-Friendly Cat Carrier','cat','Travel',1992,NULL,4.8,183,NULL,100,'https://loremflickr.com/640/640/cat,carrier?lock=39'),
(40,'Airline-Friendly Cat Carrier Plus','cat','Travel',2129,2549,4.5,200,'new',100,'https://loremflickr.com/640/640/cat,carrier?lock=40'),
(41,'Premium Seed & Grain Mix 1kg','bird','Food & Treats',2266,NULL,4.7,217,'sale',100,'https://loremflickr.com/640/640/bird,food?lock=41'),
(42,'Everyday Seed & Grain Mix 1kg','bird','Food & Treats',2403,NULL,4.9,234,'top',100,'https://loremflickr.com/640/640/bird,food?lock=42'),
(43,'Gentle Bird Feather Care Spray','bird','Grooming & Beauty',2540,NULL,4.6,251,NULL,100,'https://loremflickr.com/640/640/bird,grooming?lock=43'),
(44,'Gentle Bird Feather Care Spray Plus','bird','Grooming & Beauty',2677,2889,4.8,268,'new',100,'https://loremflickr.com/640/640/bird,grooming?lock=44'),
(45,'Natural Wood Perch & Toy Set','bird','Toys & Enrichment',2814,NULL,4.5,285,'sale',100,'https://loremflickr.com/640/640/bird,toy?lock=45'),
(46,'Natural Wood Perch & Toy Set Plus','bird','Toys & Enrichment',2951,NULL,4.7,42,'top',100,'https://loremflickr.com/640/640/bird,toy?lock=46'),
(47,'Soft Cage Rest Hammock','bird','Beds & Comfort',3088,NULL,4.9,59,NULL,100,'https://loremflickr.com/640/640/bird,bed?lock=47'),
(48,'Soft Cage Rest Hammock Plus','bird','Beds & Comfort',3225,3229,4.6,76,'new',100,'https://loremflickr.com/640/640/bird,bed?lock=48'),
(49,'Non-Spill Bird Feeder','bird','Feeding',3362,NULL,4.8,93,'sale',100,'https://loremflickr.com/640/640/bird,feeding?lock=49'),
(50,'Non-Spill Bird Feeder Plus','bird','Feeding',3499,NULL,4.5,110,'top',100,'https://loremflickr.com/640/640/bird,feeding?lock=50'),
(51,'Secure Outdoor Flight Harness','bird','Walking & Outdoor',3636,NULL,4.7,127,NULL,100,'https://loremflickr.com/640/640/bird,walking?lock=51'),
(52,'Secure Outdoor Flight Harness Plus','bird','Walking & Outdoor',3773,4069,4.9,144,'new',100,'https://loremflickr.com/640/640/bird,walking?lock=52'),
(53,'Daily Bird Vitamin Drops','bird','Health & Wellness',310,NULL,4.6,161,'sale',100,'https://loremflickr.com/640/640/bird,health?lock=53'),
(54,'Daily Bird Vitamin Drops Plus','bird','Health & Wellness',447,NULL,4.8,178,'top',100,'https://loremflickr.com/640/640/bird,health?lock=54'),
(55,'Clicker Training Starter Kit','bird','Training',584,NULL,4.5,195,NULL,100,'https://loremflickr.com/640/640/bird,training?lock=55'),
(56,'Clicker Training Starter Kit Plus','bird','Training',721,809,4.7,212,'new',100,'https://loremflickr.com/640/640/bird,training?lock=56'),
(57,'Colorful Bird Accessory Set','bird','Clothing & Accessories',858,NULL,4.9,229,'sale',100,'https://loremflickr.com/640/640/bird,accessories?lock=57'),
(58,'Colorful Bird Accessory Set Plus','bird','Clothing & Accessories',995,NULL,4.6,246,'top',100,'https://loremflickr.com/640/640/bird,accessories?lock=58'),
(59,'Travel Cage with Carry Handle','bird','Travel',1132,NULL,4.8,263,NULL,100,'https://loremflickr.com/640/640/bird,travel?lock=59'),
(60,'Travel Cage with Carry Handle Plus','bird','Travel',1269,1649,4.5,280,'new',100,'https://loremflickr.com/640/640/bird,travel?lock=60'),
(61,'Tropical Flake Food 200g','fish','Food & Treats',1406,NULL,4.7,297,'sale',100,'https://loremflickr.com/640/640/fish,food?lock=61'),
(62,'Tropical Flake Food 200g Plus','fish','Food & Treats',1543,NULL,4.9,54,'top',100,'https://loremflickr.com/640/640/fish,food?lock=62'),
(63,'Aquarium Glass Cleaning Pad','fish','Grooming & Beauty',1680,NULL,4.6,71,NULL,100,'https://loremflickr.com/640/640/fish,grooming?lock=63'),
(64,'Aquarium Glass Cleaning Pad Plus','fish','Grooming & Beauty',1817,1989,4.8,88,'new',100,'https://loremflickr.com/640/640/fish,grooming?lock=64'),
(65,'Floating Enrichment Ring Set','fish','Toys & Enrichment',1954,NULL,4.5,105,'sale',100,'https://loremflickr.com/640/640/aquarium,toy?lock=65'),
(66,'Floating Enrichment Ring Set Plus','fish','Toys & Enrichment',2091,NULL,4.7,122,'top',100,'https://loremflickr.com/640/640/aquarium,toy?lock=66'),
(67,'Aquarium Comfort Hideout','fish','Beds & Comfort',2228,NULL,4.9,139,NULL,100,'https://loremflickr.com/640/640/aquarium,bed?lock=67'),
(68,'Aquarium Comfort Hideout Plus','fish','Beds & Comfort',2365,2829,4.6,156,'new',100,'https://loremflickr.com/640/640/aquarium,bed?lock=68'),
(69,'Automatic Fish Feeder','fish','Feeding',2502,NULL,4.8,173,'sale',100,'https://loremflickr.com/640/640/aquarium,feeding?lock=69'),
(70,'Automatic Fish Feeder Plus','fish','Feeding',2639,NULL,4.5,190,'top',100,'https://loremflickr.com/640/640/aquarium,feeding?lock=70'),
(71,'Secure Aquarium Net & Tool Set','fish','Walking & Outdoor',2776,NULL,4.7,207,NULL,100,'https://loremflickr.com/640/640/aquarium,accessories?lock=71'),
(72,'Secure Aquarium Net & Tool Set Plus','fish','Walking & Outdoor',2913,3169,4.9,224,'new',100,'https://loremflickr.com/640/640/aquarium,accessories?lock=72'),
(73,'Water Health Conditioner','fish','Health & Wellness',3050,NULL,4.6,241,'sale',100,'https://loremflickr.com/640/640/aquarium,health?lock=73'),
(74,'Water Health Conditioner Plus','fish','Health & Wellness',3187,NULL,4.8,258,'top',100,'https://loremflickr.com/640/640/aquarium,health?lock=74'),
(75,'Fish Feeding Training Ring','fish','Training',3324,NULL,4.5,275,NULL,100,'https://loremflickr.com/640/640/fish,training?lock=75'),
(76,'Fish Feeding Training Ring Plus','fish','Training',3461,3509,4.7,292,'new',100,'https://loremflickr.com/640/640/fish,training?lock=76'),
(77,'Aquarium Plant & Cover Set','fish','Clothing & Accessories',3598,NULL,4.9,49,'sale',100,'https://loremflickr.com/640/640/aquarium,accessories?lock=77'),
(78,'Aquarium Plant & Cover Set Plus','fish','Clothing & Accessories',3735,NULL,4.6,66,'top',100,'https://loremflickr.com/640/640/aquarium,accessories?lock=78'),
(79,'Portable Fish Travel Container','fish','Travel',272,NULL,4.8,83,NULL,100,'https://loremflickr.com/640/640/aquarium,travel?lock=79'),
(80,'Portable Fish Travel Container Plus','fish','Travel',409,749,4.5,100,'new',100,'https://loremflickr.com/640/640/aquarium,travel?lock=80'),
(81,'Compressed Timothy Hay 2kg','rodent','Food & Treats',546,NULL,4.7,117,'sale',100,'https://loremflickr.com/640/640/rabbit,food?lock=81'),
(82,'Compressed Timothy Hay 2kg Plus','rodent','Food & Treats',683,NULL,4.9,134,'top',100,'https://loremflickr.com/640/640/rabbit,food?lock=82'),
(83,'Small Pet Gentle Grooming Kit','rodent','Grooming & Beauty',820,NULL,4.6,151,NULL,100,'https://loremflickr.com/640/640/small,pet,grooming?lock=83'),
(84,'Small Pet Gentle Grooming Kit Plus','rodent','Grooming & Beauty',957,1089,4.8,168,'new',100,'https://loremflickr.com/640/640/small,pet,grooming?lock=84'),
(85,'Silent Enrichment Chew Toy Set','rodent','Toys & Enrichment',1094,NULL,4.5,185,'sale',100,'https://loremflickr.com/640/640/small,pet,toy?lock=85'),
(86,'Silent Enrichment Chew Toy Set Plus','rodent','Toys & Enrichment',1231,NULL,4.7,202,'top',100,'https://loremflickr.com/640/640/small,pet,toy?lock=86'),
(87,'Soft Small Pet Rest Bed','rodent','Beds & Comfort',1368,NULL,4.9,219,NULL,100,'https://loremflickr.com/640/640/small,pet,bed?lock=87'),
(88,'Soft Small Pet Rest Bed Plus','rodent','Beds & Comfort',1505,1929,4.6,236,'new',100,'https://loremflickr.com/640/640/small,pet,bed?lock=88'),
(89,'Heavy-Duty Hay Feeder','rodent','Feeding',1642,NULL,4.8,253,'sale',100,'https://loremflickr.com/640/640/small,pet,feeding?lock=89'),
(90,'Heavy-Duty Hay Feeder Plus','rodent','Feeding',1779,NULL,4.5,270,'top',100,'https://loremflickr.com/640/640/small,pet,feeding?lock=90'),
(91,'Adjustable Small Pet Harness','rodent','Walking & Outdoor',1916,NULL,4.7,287,NULL,100,'https://loremflickr.com/640/640/small,pet,leash?lock=91'),
(92,'Adjustable Small Pet Harness Plus','rodent','Walking & Outdoor',2053,2269,4.9,44,'new',100,'https://loremflickr.com/640/640/small,pet,leash?lock=92'),
(93,'Small Pet Wellness Drops','rodent','Health & Wellness',2190,NULL,4.6,61,'sale',100,'https://loremflickr.com/640/640/small,pet,health?lock=93'),
(94,'Small Pet Wellness Drops Plus','rodent','Health & Wellness',2327,NULL,4.8,78,'top',100,'https://loremflickr.com/640/640/small,pet,health?lock=94'),
(95,'Target Training Clicker Kit','rodent','Training',2464,NULL,4.5,95,NULL,100,'https://loremflickr.com/640/640/small,pet,training?lock=95'),
(96,'Target Training Clicker Kit Plus','rodent','Training',2601,2609,4.7,112,'new',100,'https://loremflickr.com/640/640/small,pet,training?lock=96'),
(97,'Cozy Small Pet Vest','rodent','Clothing & Accessories',2738,NULL,4.9,129,'sale',100,'https://loremflickr.com/640/640/small,pet,clothing?lock=97'),
(98,'Cozy Small Pet Vest Plus','rodent','Clothing & Accessories',2875,NULL,4.6,146,'top',100,'https://loremflickr.com/640/640/small,pet,clothing?lock=98'),
(99,'Ventilated Travel Carrier','rodent','Travel',3012,NULL,4.8,163,NULL,100,'https://loremflickr.com/640/640/small,pet,travel?lock=99'),
(100,'Ventilated Travel Carrier Plus','rodent','Travel',3149,3449,4.5,180,'new',100,'https://loremflickr.com/640/640/small,pet,travel?lock=100')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, subcategory=EXCLUDED.subcategory, price=EXCLUDED.price, old_price=EXCLUDED.old_price, rating=EXCLUDED.rating, reviews=EXCLUDED.reviews, tag=EXCLUDED.tag, stock=EXCLUDED.stock, image_url=EXCLUDED.image_url;


-- PawCare appointment booking migration
-- Import this once into the existing `pawcare` database.

CREATE TABLE IF NOT EXISTS services (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(190) NOT NULL UNIQUE,
  description VARCHAR(500) DEFAULT NULL,
  active SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO services (id,name,description,active) VALUES
(1,'Dog & Cat Vaccinations','Core and non-core vaccines, including anti-rabies and age-appropriate protection.',1),
(2,'Wellness Consultation','Physical exams and health checks for puppies, adults and seniors.',1),
(3,'Deworming','Safe, weight-based parasite treatment for every life stage.',1),
(4,'Laboratory & Diagnostics','CBC, urinalysis, fecal exams, heartworm testing and imaging.',1),
(5,'Dental Care','Professional cleaning, oral assessment and dental procedures.',1),
(6,'Medication & Prevention','Prescription support, preventive care and wellness recommendations.',1)
ON CONFLICT (id) DO UPDATE SET description=EXCLUDED.description, active=EXCLUDED.active;

CREATE TABLE IF NOT EXISTS appointments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT DEFAULT NULL,
  service_id BIGINT NOT NULL,
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
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (service_id) REFERENCES services(id),
  CONSTRAINT unique_active_slot UNIQUE (branch, appointment_date, appointment_time, status)
);


-- PawCare owner, order tracking, and product feedback migration
CREATE TABLE IF NOT EXISTS owners (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL,
  status TEXT NOT NULL,
  note VARCHAR(255) DEFAULT NULL,
  changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_feedback (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  comment TEXT NOT NULL,
  owner_reply TEXT DEFAULT NULL,
  replied_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Demo owner account. Change this password after installation.
-- Email: owner@pawcare.ph | Password: owner123
INSERT INTO owners (name,email,password_hash)
VALUES ('PawCare Owner','owner@pawcare.ph','$2b$12$VSIpE75dS9S9Btk15h1TruJZZ8iO6pXpr/VQhqYiJo30AW6B1bhvS')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash;

INSERT INTO order_status_history (order_id,status,note)
SELECT id, order_status, 'Initial order status'
FROM orders o
WHERE NOT EXISTS (SELECT 1 FROM order_status_history h WHERE h.order_id=o.id);


-- Profile fields used by the account pages.
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(80) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255) DEFAULT NULL;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS profile_name VARCHAR(120) DEFAULT NULL;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255) DEFAULT NULL;

-- Owner-to-customer order messages.
CREATE TABLE IF NOT EXISTS order_messages (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  owner_id BIGINT NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_order_messages_order ON order_messages(order_id, created_at);

-- Keep sequences synchronized after seeded rows are inserted explicitly.
SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE(MAX(id), 1), true) FROM products;
SELECT setval(pg_get_serial_sequence('services', 'id'), COALESCE(MAX(id), 1), true) FROM services;
SELECT setval(pg_get_serial_sequence('owners', 'id'), COALESCE(MAX(id), 1), true) FROM owners;
