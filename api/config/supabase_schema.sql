-- ECODAILY CAMPUS - SUPABASE (POSTGRESQL) SCHEMA MIGRATION
-- Run this in your Supabase SQL Editor

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    avatar VARCHAR(255),
    eco_points INTEGER DEFAULT 0,
    waste_saved DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(15,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    category VARCHAR(100),
    images TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Menunggu Pembayaran',
    address TEXT,
    payment_method VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price_at_purchase DECIMAL(15,2) NOT NULL
);

-- 5. Testimonials
CREATE TABLE IF NOT EXISTS site_testimonials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Product Reviews
CREATE TABLE IF NOT EXISTS product_reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Eco Challenges
CREATE TABLE IF NOT EXISTS eco_challenges (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reward_points INTEGER DEFAULT 0,
    image VARCHAR(255),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Challenge Submissions (Verifications)
CREATE TABLE IF NOT EXISTS eco_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    challenge_id INTEGER REFERENCES eco_challenges(id),
    proof_image VARCHAR(255),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial Admin Account (Optional - Email: adminecodaily@gmail.com, Pass: Pas5seCur312@)
-- INSERT INTO users (name, email, password, role) 
-- VALUES ('Admin EcoDaily', 'adminecodaily@gmail.com', '$2y$10$YourHashedPasswordHere', 'admin');
