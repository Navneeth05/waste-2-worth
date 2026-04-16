-- -------------------------------------------------------
-- Waste2Worth — PostgreSQL Schema (Render)
-- -------------------------------------------------------

-- 1. TABLE CREATION
-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('hotel', 'ngo', 'muni')),
    phone VARCHAR(20),

    notice_points INT DEFAULT 0,      -- NGOs only
    hygiene_points INT DEFAULT 0,     -- Hotels only

    latitude  DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    city VARCHAR(100),
    zone VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS food_uploads (
    id SERIAL PRIMARY KEY,
    hotel_id INT NOT NULL,
    food_item VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    ai_label VARCHAR(15) NOT NULL CHECK (ai_label IN ('edible','non-edible')),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available','claimed','picked_up','expired','waste_routed')),
    location VARCHAR(255) DEFAULT '',
    latitude  DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    notes TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (hotel_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS food_claims (
    id SERIAL PRIMARY KEY,
    upload_id INT NOT NULL,
    ngo_id INT NOT NULL,
    status VARCHAR(15) DEFAULT 'claimed' CHECK (status IN ('claimed','confirmed','cancelled')),
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL,

    FOREIGN KEY (upload_id) REFERENCES food_uploads(id) ON DELETE CASCADE,
    FOREIGN KEY (ngo_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hygiene_points_log (
    id SERIAL PRIMARY KEY,
    hotel_id INT NOT NULL,
    ngo_id INT NOT NULL,
    claim_id INT NOT NULL,
    points_awarded INT NOT NULL,
    reason TEXT DEFAULT 'Pickup confirmed by NGO',
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (hotel_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ngo_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (claim_id) REFERENCES food_claims(id) ON DELETE CASCADE
);


-- -------------------------------------------------------
-- 2. SEED DATA — Demo Users
-- -------------------------------------------------------

-- Hotels (password: hotel123)
INSERT INTO users (name, email, password, role, phone, city, zone, latitude, longitude)
VALUES
    ('Grand Palace Hotel', 'grand@example.com',    'hotel123', 'hotel', '9876543210', 'Bangalore', 'Zone A', 12.9716, 77.5946),
    ('Elite Residency',    'elite@example.com',    'hotel123', 'hotel', '9876543211', 'Bangalore', 'Zone B', 12.9352, 77.6245),
    ('Curry Leaf Hotel',   'curryleaf@example.com','hotel123', 'hotel', '9876543212', 'Bangalore', 'Zone A', 12.9590, 77.5870),
    ('City Inn',           'cityinn@example.com',  'hotel123', 'hotel', '9876543213', 'Bangalore', 'Zone C', 12.9580, 77.6081),
    ('The Oberoi',         'oberoi@example.com',   'hotel123', 'hotel', '9876500001', 'Bangalore', 'Zone A', 12.9733, 77.6117),
    ('ITC Gardenia',       'itc@example.com',      'hotel123', 'hotel', '9876500002', 'Bangalore', 'Zone A', 12.9600, 77.5900),
    ('Radisson Blu',       'radisson@example.com', 'hotel123', 'hotel', '9876500003', 'Bangalore', 'Zone C', 12.9780, 77.6400),
    ('Hyatt Regency',      'hyatt@example.com',    'hotel123', 'hotel', '9876500004', 'Bangalore', 'Zone B', 12.9300, 77.6200),
    ('Taj West End',       'taj@example.com',      'hotel123', 'hotel', '9876500005', 'Bangalore', 'Zone A', 12.9800, 77.5800)
ON CONFLICT (email) DO NOTHING;

-- NGOs (password: ngo123)
INSERT INTO users (name, email, password, role, phone, city, latitude, longitude)
VALUES
    ('FoodHope NGO',       'foodhope@example.com',     'ngo123', 'ngo', '9123456780', 'Bangalore', 12.9600, 77.5800),
    ('Helping Hands NGO',  'helpinghands@example.com', 'ngo123', 'ngo', '9123456781', 'Bangalore', 12.9500, 77.6100),
    ('Robin Hood Army',    'rha@example.com',          'ngo123', 'ngo', '9123400001', 'Bangalore', 12.9500, 77.6000),
    ('Feeding India',      'feedingindia@example.com', 'ngo123', 'ngo', '9123400002', 'Bangalore', 12.9400, 77.6100),
    ('Akshaya Patra',      'akshaya@example.com',      'ngo123', 'ngo', '9123400003', 'Bangalore', 13.0000, 77.5500)
ON CONFLICT (email) DO NOTHING;

-- Municipal (password: muni123)
INSERT INTO users (name, email, password, role, phone, city, latitude, longitude)
VALUES
    ('BBMP Municipal',  'bbmp@example.com',  'muni123', 'muni', '9111111111', 'Bangalore', 12.9716, 77.5946),
    ('Muni Admin',      'muni@example.com',  'muni123', 'muni', '9111111112', 'Bangalore', 12.9700, 77.5950)
ON CONFLICT (email) DO NOTHING;
