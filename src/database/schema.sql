-- =============================================================================
-- SISTEMA CONTABLE - CREACIÓN DE ESQUEMA DE BASE DE DATOS
-- =============================================================================

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS sistema_financiero_v1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seleccionar la base de datos
USE sistema_financiero_v1;

-- -----------------------------------------------------
-- 1. MÓDULO DE USUARIOS Y SEGURIDAD
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (permission_id) REFERENCES permissions(id),
    UNIQUE KEY unique_role_permission (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- -----------------------------------------------------
-- 2. MÓDULO DE CONFIGURACIÓN Y EMPRESA
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS currencies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(3) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(5) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS companies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    legal_name VARCHAR(150) NOT NULL,
    tax_id VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(100),
    logo_path VARCHAR(255),
    fiscal_year_start DATE NOT NULL,
    currency_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (currency_id) REFERENCES currencies(id)
);

CREATE TABLE IF NOT EXISTS fiscal_years (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    year_number INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    closed_at TIMESTAMP NULL,
    closed_by INT NULL,
    status ENUM('upcoming', 'active', 'closed') DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at TIMESTAMP NULL,
    updated_by INT,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (closed_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    UNIQUE KEY unique_company_year (company_id, year_number)
);

CREATE TABLE IF NOT EXISTS fiscal_periods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_closed BOOLEAN DEFAULT false,
    closed_at DATETIME NULL,
    closed_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (closed_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS exchange_rates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    currency_id INT NOT NULL,
    rate_date DATE NOT NULL,
    rate DECIMAL(10,6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    FOREIGN KEY (currency_id) REFERENCES currencies(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE KEY unique_currency_date (currency_id, rate_date)
);

-- -----------------------------------------------------
-- 3. MÓDULO DE CONTABILIDAD GENERAL
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS account_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    balance_sheet_section ENUM('asset','liability','equity','none') NOT NULL,
    income_statement_section ENUM('revenue','expense','none') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    account_type_id INT NOT NULL,
    parent_account_id INT NULL,
    is_active BOOLEAN DEFAULT true,
    allows_entries BOOLEAN DEFAULT false,
    level INT NOT NULL,
    balance_type ENUM('debit','credit') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_at TIMESTAMP NULL,
    updated_by INT NULL,
    FOREIGN KEY (account_type_id) REFERENCES account_types(id),
    FOREIGN KEY (parent_account_id) REFERENCES chart_of_accounts(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entry_number VARCHAR(20) UNIQUE NOT NULL,
    date DATE NOT NULL,
    fiscal_period_id INT NOT NULL,
    reference VARCHAR(100),
    description TEXT,
    status ENUM('draft','posted','reversed') DEFAULT 'draft',
    is_adjustment BOOLEAN DEFAULT false,
    is_recurring BOOLEAN DEFAULT false,
    source_document_type VARCHAR(50) NULL,
    source_document_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    posted_at DATETIME NULL,
    posted_by INT NULL,
    FOREIGN KEY (fiscal_period_id) REFERENCES fiscal_periods(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (posted_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id INT PRIMARY KEY AUTO_INCREMENT,
    journal_entry_id INT NOT NULL,
    account_id INT NOT NULL,
    description TEXT,
    debit_amount DECIMAL(15,2) DEFAULT 0.00,
    credit_amount DECIMAL(15,2) DEFAULT 0.00,
    order_number INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id),
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id)
);

CREATE TABLE IF NOT EXISTS account_balances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_id INT NOT NULL,
    fiscal_period_id INT NOT NULL,
    debit_balance DECIMAL(15,2) DEFAULT 0.00,
    credit_balance DECIMAL(15,2) DEFAULT 0.00,
    starting_balance DECIMAL(15,2) DEFAULT 0.00,
    ending_balance DECIMAL(15,2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id),
    FOREIGN KEY (fiscal_period_id) REFERENCES fiscal_periods(id),
    UNIQUE KEY unique_account_period (account_id, fiscal_period_id)
);

-- Añadir restricciones para líneas de asiento
ALTER TABLE journal_entry_lines
ADD CONSTRAINT chk_journal_entry_lines_amounts 
CHECK (debit_amount >= 0 AND credit_amount >= 0);

ALTER TABLE journal_entry_lines
ADD CONSTRAINT chk_journal_entry_lines_debit_credit 
CHECK ((debit_amount > 0 AND credit_amount = 0) OR (credit_amount > 0 AND debit_amount = 0) OR (debit_amount = 0 AND credit_amount = 0));

-- -----------------------------------------------------
-- DATOS INICIALES
-- -----------------------------------------------------

-- Insertar roles básicos
INSERT INTO roles (name, description) 
VALUES 
('admin', 'Administrador del sistema con acceso completo'),
('accountant', 'Contador con acceso a funcionalidades contables'),
('user', 'Usuario con acceso limitado');

-- Insertar usuario administrador (password: admin123)
INSERT INTO users (username, password, email, full_name, role_id) 
VALUES 
('admin', '$2b$10$iE5lR.H5rpAnhJWgU8YU6epRRnfJbL4bRxZmiCWDDZMJSjmH1t5uq', 'admin@example.com', 'Administrador', 1);

-- Insertar moneda por defecto
INSERT INTO currencies (code, name, symbol, is_default) 
VALUES 
('USD', 'Dólar estadounidense', '$', true),
('COP', 'Peso colombiano', '$', false);

-- Insertar empresa por defecto
INSERT INTO companies (name, legal_name, tax_id, fiscal_year_start, currency_id) 
VALUES 
('Mi Empresa', 'Mi Empresa S.A.', '123456789', '2023-01-01', 1); 