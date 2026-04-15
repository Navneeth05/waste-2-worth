DROP DATABASE IF EXISTS Waste2Worth;
CREATE DATABASE Waste2Worth;
USE Waste2Worth;

-- -------------------------------------------------------
-- 1. TABLE CREATION
-- -------------------------------------------------------

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,   -- plain text: visible to developer
    role ENUM('hotel', 'ngo', 'muni') NOT NULL,
    phone VARCHAR(20),                -- phone number

    notice_points INT DEFAULT 0,      -- NGOs only
    hygiene_points INT DEFAULT 0,     -- Hotels only

    latitude  DECIMAL(10, 7),         -- GPS lat from signup
    longitude DECIMAL(10, 7),         -- GPS lng from signup
    city VARCHAR(100),
    zone VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE food_uploads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT NOT NULL,
    food_item VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    ai_label ENUM('edible','non-edible') NOT NULL,
    status ENUM('available','claimed','picked_up','expired','waste_routed') DEFAULT 'available',
    location VARCHAR(255) DEFAULT '',
    latitude  DECIMAL(10, 7),         -- GPS lat of hotel at upload time
    longitude DECIMAL(10, 7),         -- GPS lng of hotel at upload time
    notes TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (hotel_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE food_claims (
    id INT AUTO_INCREMENT PRIMARY KEY,
    upload_id INT NOT NULL,
    ngo_id INT NOT NULL,
    status ENUM('claimed','confirmed','cancelled') DEFAULT 'claimed',
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL,

    FOREIGN KEY (upload_id) REFERENCES food_uploads(id) ON DELETE CASCADE,
    FOREIGN KEY (ngo_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE hygiene_points_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT NOT NULL,
    ngo_id INT NOT NULL,
    claim_id INT NOT NULL,
    points_awarded INT NOT NULL,
    reason VARCHAR(255) DEFAULT 'Pickup confirmed',
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (hotel_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ngo_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (claim_id) REFERENCES food_claims(id) ON DELETE CASCADE
);


-- -------------------------------------------------------
-- 2. SEED DATA  (plain text passwords — visible in DB)
-- -------------------------------------------------------

INSERT INTO users (name, email, password, role, phone, city, zone, latitude, longitude) VALUES
('Grand Palace Hotel',  'hotel1@example.com', 'hotel123', 'hotel', '9876543210', 'Bangalore', 'Zone A', 12.9716, 77.5946),
('Elite Residency',     'hotel2@example.com', 'hotel234', 'hotel', '9876543211', 'Bangalore', 'Zone B', 12.9352, 77.6245),
('City Inn',            'hotel3@example.com', 'hotel345', 'hotel', '9876543212', 'Bangalore', 'Zone C', 12.9580, 77.6081),
('FoodHope NGO',        'ngo1@example.com',   'ngo123',   'ngo',   '9123456780', 'Bangalore', NULL,     12.9600, 77.5800),
('Helping Hands NGO',   'ngo2@example.com',   'ngo234',   'ngo',   '9123456781', 'Bangalore', NULL,     12.9750, 77.6100);

INSERT INTO food_uploads (hotel_id, food_item, quantity, ai_label, status, location, latitude, longitude, notes) VALUES
(1, 'Rice & Curry',    10.5, 'edible',     'available',   'MG Road, Bangalore',    12.9716, 77.5946, 'Packed fresh'),
(2, 'Chapati & Sabzi',  8.0, 'edible',     'available',   'Indiranagar, Bangalore',12.9352, 77.6245, ''),
(3, 'Spoiled Fruits',   4.0, 'non-edible', 'waste_routed','Whitefield, Bangalore', 12.9580, 77.6081, ''),
(1, 'Biryani',         12.0, 'edible',     'available',   'MG Road, Bangalore',    12.9716, 77.5946, ''),
(2, 'Expired Bread',    3.0, 'non-edible', 'waste_routed','Indiranagar, Bangalore',12.9352, 77.6245, '');

-- NGO 1 (id=4) claims Upload 1
INSERT INTO food_claims (upload_id, ngo_id) VALUES (1, 4);
UPDATE food_uploads SET status = 'claimed' WHERE id = 1;

-- Confirm pickup + award points
UPDATE food_claims SET status = 'confirmed', confirmed_at = NOW() WHERE id = 1;
UPDATE food_uploads SET status = 'picked_up' WHERE id = 1;
INSERT INTO hygiene_points_log (hotel_id, ngo_id, claim_id, points_awarded) VALUES (1, 4, 1, 10);
UPDATE users SET notice_points = notice_points + 15 WHERE id = 4;

UPDATE users SET notice_points = 30 WHERE id = 5;


-- -------------------------------------------------------
-- 3. LOGIN QUERY  →  /api/auth/login
-- Passwords stored in plain text — no bcrypt comparison needed.
-- -------------------------------------------------------

SELECT id, name, role, email, notice_points, city, zone, latitude, longitude, phone
FROM users
WHERE email = 'hotel1@example.com' AND password = 'hotel123';


-- -------------------------------------------------------
-- 4. REGISTER  →  /api/auth/register
-- Phone + GPS coordinates captured at sign-up.
-- -------------------------------------------------------

INSERT INTO users (name, email, password, role, phone, city, latitude, longitude)
VALUES ('New Hotel', 'newhotel@example.com', 'pass123', 'hotel', '9999999999', 'Mumbai', 19.0760, 72.8777);


-- -------------------------------------------------------
-- 5. HOTEL: Upload Food  →  POST /api/hotel/upload
-- AI classifies photo → edible goes to NGO, non-edible to Municipal.
-- Lat/lng stored from hotel's registered location.
-- -------------------------------------------------------

INSERT INTO food_uploads (hotel_id, food_item, quantity, ai_label, status, location, latitude, longitude, notes)
VALUES (1, 'Paneer Curry', 9.0, 'edible', 'available', 'MG Road, Bangalore', 12.9716, 77.5946, 'Fresh');

-- Non-edible goes straight to waste_routed (Municipal handles it)
INSERT INTO food_uploads (hotel_id, food_item, quantity, ai_label, status, location, latitude, longitude, notes)
VALUES (1, 'Stale Rice', 3.0, 'non-edible', 'waste_routed', 'MG Road, Bangalore', 12.9716, 77.5946, '');


-- -------------------------------------------------------
-- 6. HOTEL: History Page  →  GET /api/hotel/history
-- -------------------------------------------------------

SELECT
    f.id            AS upload_id,
    f.food_item,
    f.quantity,
    f.status,
    f.location,
    f.latitude,
    f.longitude,
    f.uploaded_at,
    DATE(f.uploaded_at)                    AS date,
    TIME_FORMAT(f.uploaded_at, '%h:%i %p') AS time,
    COALESCE(u_ngo.name, '—')              AS ngo,
    COALESCE(h.points_awarded, 0)          AS hygiene_points
FROM food_uploads f
LEFT JOIN food_claims c  ON f.id = c.upload_id AND c.status = 'confirmed'
LEFT JOIN hygiene_points_log h ON h.claim_id = c.id
LEFT JOIN users u_ngo    ON c.ngo_id = u_ngo.id
WHERE f.hotel_id = 1
ORDER BY f.uploaded_at DESC;


-- -------------------------------------------------------
-- 7. NGO MAP: Live food locations  →  GET /api/ngo/available
-- Returns lat/lng so map pins update in real time.
-- -------------------------------------------------------

SELECT
    f.id            AS upload_id,
    u.name          AS hotel_name,
    u.zone,
    u.city,
    f.food_item,
    f.quantity,
    f.location,
    f.latitude,
    f.longitude,
    f.uploaded_at,
    TIME_FORMAT(f.uploaded_at, '%h:%i %p') AS upload_time
FROM food_uploads f
JOIN users u ON f.hotel_id = u.id
WHERE f.status = 'available' AND f.ai_label = 'edible'
ORDER BY f.uploaded_at DESC;


-- -------------------------------------------------------
-- 8. NGO: Claim + Confirm + Award Points
-- -------------------------------------------------------

-- Claim
INSERT INTO food_claims (upload_id, ngo_id) VALUES (2, 4);
UPDATE food_uploads SET status = 'claimed' WHERE id = 2 AND status = 'available';

-- Confirm + award
UPDATE food_claims SET status = 'confirmed', confirmed_at = NOW() WHERE id = 2 AND ngo_id = 4;
UPDATE food_uploads  SET status = 'picked_up' WHERE id = 2;
INSERT INTO hygiene_points_log (hotel_id, ngo_id, claim_id, points_awarded, reason)
VALUES (1, 4, 2, 5, 'Pickup confirmed by FoodHope NGO');
UPDATE users SET notice_points = notice_points + 10 WHERE id = 4 AND role = 'ngo';


-- -------------------------------------------------------
-- 9. NGO: Pickup History  →  GET /api/ngo/pickups
-- -------------------------------------------------------

SELECT
    c.id            AS claim_id,
    u.name          AS hotel,
    f.food_item     AS item,
    f.quantity,
    f.location,
    c.status,
    c.claimed_at,
    c.confirmed_at,
    COALESCE(h.points_awarded, 0) AS hygiene_pts_awarded
FROM food_claims c
JOIN food_uploads f ON c.upload_id = f.id
JOIN users u        ON f.hotel_id  = u.id
LEFT JOIN hygiene_points_log h ON h.claim_id = c.id
WHERE c.ngo_id = 4
ORDER BY c.claimed_at DESC;


-- -------------------------------------------------------
-- 10. DEVELOPER VIEW — All users with plain-text passwords
-- -------------------------------------------------------

SELECT id, name, email, password, role, phone, city, latitude, longitude, notice_points
FROM users
ORDER BY role, id;
