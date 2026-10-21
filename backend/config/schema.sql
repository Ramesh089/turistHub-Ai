-- ============================================================
-- Tourist Hub AI — Production Database Schema
-- Platform: MySQL 8+ / MariaDB 10.5+
-- Compatible with Aiven MySQL (sql_require_primary_key=ON)
-- ============================================================

-- 1. states
CREATE TABLE IF NOT EXISTS states (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(10) NULL,
  capital VARCHAR(100) NULL,
  description TEXT NULL,
  image_url VARCHAR(500) NULL,
  banner_image VARCHAR(500) NULL,
  best_time VARCHAR(100) NULL,
  highlights TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(30) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'User',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  failed_attempts INT NOT NULL DEFAULT 0,
  lock_until DATETIME NULL,
  reset_token VARCHAR(255) NULL,
  reset_token_expiry DATETIME NULL,
  profile_image_url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  name VARCHAR(150) GENERATED ALWAYS AS (full_name) VIRTUAL,
  avatar_url VARCHAR(500) GENERATED ALWAYS AS (profile_image_url) VIRTUAL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. user_preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  travel_type VARCHAR(50) DEFAULT 'Couple',
  budget_range VARCHAR(50) DEFAULT 'Moderate',
  preferred_transport VARCHAR(50) DEFAULT 'Any',
  interests JSON NULL,
  food_preference VARCHAR(100) DEFAULT 'No Preference',
  preferred_duration INT DEFAULT 3,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. tourist_places
CREATE TABLE IF NOT EXISTS tourist_places (
  id INT AUTO_INCREMENT PRIMARY KEY,
  state_id INT NULL,
  destination_id INT NULL,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(160) NULL,
  category VARCHAR(100) DEFAULT 'Heritage',
  description TEXT NULL,
  location VARCHAR(255) NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  image_url TEXT NULL,
  banner_image VARCHAR(500) NULL,
  gallery_urls JSON NULL,
  rating DECIMAL(3,2) DEFAULT 4.50,
  reviews_count INT DEFAULT 0,
  best_time VARCHAR(150) NULL,
  best_time_to_visit VARCHAR(150) NULL,
  entry_fee DECIMAL(10,2) DEFAULT 0.00,
  estimated_cost_per_day DECIMAL(10,2) DEFAULT 2500.00,
  recommended_duration_days INT DEFAULT 3,
  latitude DECIMAL(10,8) NULL,
  longitude DECIMAL(11,8) NULL,
  is_popular TINYINT(1) DEFAULT 0,
  featured TINYINT(1) DEFAULT 0,
  tags VARCHAR(255) NULL,
  highlights JSON NULL,
  major_attractions JSON NULL,
  activities JSON NULL,
  local_food JSON NULL,
  local_transport JSON NULL,
  history TEXT NULL,
  culture_info TEXT NULL,
  famous_festival VARCHAR(200) NULL,
  famous_dance_art VARCHAR(200) NULL,
  cultural_uniqueness TEXT NULL,
  timings VARCHAR(100) NULL,
  duration VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tourist_places_state FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. cultures
CREATE TABLE IF NOT EXISTS cultures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  state_id INT NULL,
  state VARCHAR(100) NULL,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(100) NULL,
  description TEXT NULL,
  dance_forms VARCHAR(255) NULL,
  music VARCHAR(255) NULL,
  cuisine VARCHAR(255) NULL,
  art_crafts VARCHAR(255) NULL,
  image_url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cultures_state FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. festivals
CREATE TABLE IF NOT EXISTS festivals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  state_id INT NULL,
  state VARCHAR(100) NULL,
  name VARCHAR(200) NOT NULL,
  month VARCHAR(50) NULL,
  month_season VARCHAR(100) NULL,
  description TEXT NULL,
  significance TEXT NULL,
  celebrated_in VARCHAR(150) NULL,
  image_url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_festivals_state FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. travel_packages
CREATE TABLE IF NOT EXISTS travel_packages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  destination_id INT NULL,
  title VARCHAR(255) NOT NULL,
  name VARCHAR(255) NULL,
  company_name VARCHAR(150) NULL,
  duration_days INT DEFAULT 3,
  duration_nights INT DEFAULT 2,
  price DECIMAL(10,2) DEFAULT 9999.00,
  rating DECIMAL(3,2) DEFAULT 4.80,
  reviews_count INT DEFAULT 45,
  transport_type VARCHAR(50) NULL,
  hotel_type VARCHAR(50) NULL,
  food_included TINYINT(1) DEFAULT 1,
  guide_included TINYINT(1) DEFAULT 1,
  featured TINYINT(1) DEFAULT 0,
  activities JSON NULL,
  highlights JSON NULL,
  itinerary JSON NULL,
  included JSON NULL,
  excluded JSON NULL,
  description TEXT NULL,
  image_url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_packages_destination FOREIGN KEY (destination_id) REFERENCES tourist_places(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. hotels
CREATE TABLE IF NOT EXISTS hotels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  destination_id INT NULL,
  name VARCHAR(200) NOT NULL,
  city VARCHAR(100) DEFAULT '',
  location VARCHAR(255) NULL,
  address VARCHAR(255) NULL,
  room_type VARCHAR(100) DEFAULT 'Deluxe Room',
  price_per_night DECIMAL(10,2) DEFAULT 2500.00,
  rating DECIMAL(3,2) DEFAULT 4.20,
  amenities JSON NULL,
  image_url VARCHAR(500) NULL,
  contact VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hotels_destination FOREIGN KEY (destination_id) REFERENCES tourist_places(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. transport
CREATE TABLE IF NOT EXISTS transport (
  id INT AUTO_INCREMENT PRIMARY KEY,
  destination_id INT NULL,
  type VARCHAR(50) NULL,
  transport_type VARCHAR(50) NULL,
  provider VARCHAR(150) NULL,
  operator_name VARCHAR(150) NULL,
  route VARCHAR(255) NULL,
  from_location VARCHAR(150) NULL,
  to_location VARCHAR(150) NULL,
  departure_time VARCHAR(50) NULL,
  arrival_time VARCHAR(50) NULL,
  price DECIMAL(10,2) DEFAULT 500.00,
  duration VARCHAR(50) NULL,
  available_seats INT DEFAULT 40,
  rating DECIMAL(3,2) DEFAULT 4.20,
  booking_info VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_transport_destination FOREIGN KEY (destination_id) REFERENCES tourist_places(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. guides
CREATE TABLE IF NOT EXISTS guides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  destination_id INT NULL,
  name VARCHAR(150) NOT NULL,
  languages VARCHAR(255) NULL,
  experience_years INT DEFAULT 5,
  specialization VARCHAR(150) NULL,
  price_per_day DECIMAL(10,2) DEFAULT 1500.00,
  daily_rate DECIMAL(10,2) DEFAULT 1500.00,
  rating DECIMAL(3,2) DEFAULT 4.90,
  contact VARCHAR(100) NULL,
  phone VARCHAR(50) NULL,
  image_url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_guides_destination FOREIGN KEY (destination_id) REFERENCES tourist_places(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. emergency_services
CREATE TABLE IF NOT EXISTS emergency_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  destination_id INT NULL,
  service_type VARCHAR(100) DEFAULT 'Hospital',
  name VARCHAR(200) NOT NULL,
  contact_number VARCHAR(100) NULL,
  phone_primary VARCHAR(50) DEFAULT '',
  phone_secondary VARCHAR(50) NULL,
  address VARCHAR(255) NULL,
  city VARCHAR(100) DEFAULT '',
  distance_km DECIMAL(6,2) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_emergency_destination FOREIGN KEY (destination_id) REFERENCES tourist_places(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. bookings
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  package_id INT NULL,
  hotel_id INT NULL,
  transport_id INT NULL,
  guide_id INT NULL,
  booking_type VARCHAR(50) DEFAULT 'Package',
  total_price DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  discount_code VARCHAR(50) NULL,
  booking_date DATE NULL,
  travel_date DATE NULL,
  return_date DATE NULL,
  passengers_count INT DEFAULT 1,
  people_count INT DEFAULT 1,
  payment_method VARCHAR(50) DEFAULT 'UPI',
  payment_status VARCHAR(50) DEFAULT 'Paid',
  transaction_id VARCHAR(100) NULL,
  status VARCHAR(50) DEFAULT 'Confirmed',
  special_requests TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_package FOREIGN KEY (package_id) REFERENCES travel_packages(id) ON DELETE SET NULL,
  CONSTRAINT fk_bookings_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE SET NULL,
  CONSTRAINT fk_bookings_transport FOREIGN KEY (transport_id) REFERENCES transport(id) ON DELETE SET NULL,
  CONSTRAINT fk_bookings_guide FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. travel_plans
CREATE TABLE IF NOT EXISTS travel_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  destination_id INT NULL,
  title VARCHAR(200) NULL,
  origin VARCHAR(150) NULL,
  destination_name VARCHAR(150) NULL,
  travel_date DATE NULL,
  days INT DEFAULT 3,
  traveller_type VARCHAR(50) DEFAULT 'Solo',
  people_count INT DEFAULT 1,
  budget VARCHAR(50) DEFAULT 'Moderate',
  transport_mode VARCHAR(50) DEFAULT 'Train',
  interests JSON NULL,
  food_preference VARCHAR(50) DEFAULT 'Any',
  estimated_cost DECIMAL(10,2) DEFAULT 0.00,
  plan_data JSON NULL,
  itinerary JSON NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_plans_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_plans_destination FOREIGN KEY (destination_id) REFERENCES tourist_places(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. reviews
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  destination_id INT NULL,
  package_id INT NULL,
  rating INT NOT NULL DEFAULT 5,
  title VARCHAR(200) NULL,
  comment TEXT NULL,
  review_text TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_destination FOREIGN KEY (destination_id) REFERENCES tourist_places(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_package FOREIGN KEY (package_id) REFERENCES travel_packages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. payments (Demo Payment Simulations)
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  user_id INT NOT NULL,
  demo_transaction_id VARCHAR(100) NOT NULL UNIQUE,
  payment_method VARCHAR(50) NOT NULL,
  payment_submethod VARCHAR(50) NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  payment_status ENUM('demo_success', 'demo_failed', 'demo_cancelled') NOT NULL DEFAULT 'demo_success',
  is_demo TINYINT(1) DEFAULT 1,
  error_reason VARCHAR(255) NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
