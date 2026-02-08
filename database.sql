-- WAG Services - Schema MySQL per phpMyAdmin (Hostinger)
-- Importa questo file da phpMyAdmin dopo aver creato/selezionato il database.

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- ========================================
-- ELIMINA TABELLE ESISTENTI
-- ========================================
DROP TABLE IF EXISTS quotes;
DROP TABLE IF EXISTS portfolio_items;
DROP TABLE IF EXISTS users;

-- ========================================
-- TABELLA USERS
-- ========================================
CREATE TABLE users (
    id VARCHAR(191) PRIMARY KEY NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    banned TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- TABELLA QUOTES (preventivi)
-- ========================================
CREATE TABLE quotes (
    id VARCHAR(191) PRIMARY KEY NOT NULL,
    user_id VARCHAR(191) NOT NULL,
    project_type VARCHAR(100) NOT NULL,
    budget_range VARCHAR(100) DEFAULT '',
    description TEXT NOT NULL,
    deadline VARCHAR(100) DEFAULT '',
    attachments TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    admin_notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- TABELLA PORTFOLIO
-- ========================================
CREATE TABLE portfolio_items (
    id VARCHAR(191) PRIMARY KEY NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    project_url VARCHAR(500) DEFAULT '',
    category VARCHAR(100) NOT NULL,
    featured TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_featured (featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ========================================
-- UTENTE ADMIN (Email: admin@wagservices.it / Password: admin123)
-- ========================================
INSERT INTO users (id, name, email, password_hash, role, banned) VALUES
('admin_001', 'Admin WAG', 'admin@wagservices.it', '$2y$10$8K1p/a0dL1LXMIgoEDFrwOfMQCDJfMPJPbF.tQ8gJ7mLQdz33G7Im', 'ADMIN', 0);

-- ========================================
-- UTENTE TEST (Email: user@wagservices.it / Password: user123)
-- ========================================
INSERT INTO users (id, name, email, password_hash, role, banned) VALUES
('user_001', 'Utente Test', 'user@wagservices.it', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USER', 0);

-- ========================================
-- PORTFOLIO ITEM DI ESEMPIO
-- ========================================
INSERT INTO portfolio_items (id, title, description, image_url, project_url, category, featured) VALUES
('port_001', 'TechStore Pro', 'E-commerce tech con catalogo headless e reportistica.', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop&q=80', '#', 'E-Commerce', 1),
('port_002', 'FinanceFlow', 'Dashboard fintech con indicatori personalizzati.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop&q=80', '#', 'Web App', 1);
