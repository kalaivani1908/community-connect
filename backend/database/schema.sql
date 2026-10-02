CREATE DATABASE IF NOT EXISTS community_volunteer;
USE community_volunteer;

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS misbehavior_records;
DROP TABLE IF EXISTS rewards;
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS signups;
DROP TABLE IF EXISTS event_roles;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash CHAR(64) NOT NULL,
    role ENUM('ORGANIZATION','VOLUNTEER') NOT NULL,
    phone VARCHAR(30),
    skills VARCHAR(500),
    availability VARCHAR(300),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    title VARCHAR(180) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(180),
    status ENUM('DRAFT','PUBLISHED','COMPLETED','CANCELLED') DEFAULT 'PUBLISHED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES users(id)
);

CREATE TABLE event_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    role_name VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    required_skills VARCHAR(300),
    slots INT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE signups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    role_id INT NOT NULL,
    volunteer_id INT NOT NULL,
    status ENUM('PENDING','APPROVED','REJECTED','COMPLETED') DEFAULT 'PENDING',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_signup (event_id, role_id, volunteer_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES event_roles(id) ON DELETE CASCADE,
    FOREIGN KEY (volunteer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    signup_id INT NOT NULL UNIQUE,
    checkin_at DATETIME NULL,
    checkout_at DATETIME NULL,
    hours DECIMAL(6,2) DEFAULT 0,
    FOREIGN KEY (signup_id) REFERENCES signups(id) ON DELETE CASCADE
);

CREATE TABLE certificates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    signup_id INT NOT NULL UNIQUE,
    certificate_code VARCHAR(80) NOT NULL UNIQUE,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (signup_id) REFERENCES signups(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(180) NOT NULL,
    message VARCHAR(500) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE complaints (
    id INT PRIMARY KEY AUTO_INCREMENT,
    volunteer_id INT NOT NULL,
    organization_id INT NOT NULL,
    subject VARCHAR(180) NOT NULL,
    details TEXT,
    status ENUM('OPEN','RESOLVED') DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (volunteer_id) REFERENCES users(id),
    FOREIGN KEY (organization_id) REFERENCES users(id)
);

CREATE TABLE rewards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    volunteer_id INT NOT NULL,
    organization_id INT NOT NULL,
    title VARCHAR(180) NOT NULL,
    details VARCHAR(500),
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (volunteer_id) REFERENCES users(id),
    FOREIGN KEY (organization_id) REFERENCES users(id)
);

CREATE TABLE misbehavior_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    volunteer_id INT NOT NULL,
    organization_id INT NOT NULL,
    event_id INT NULL,
    details VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (volunteer_id) REFERENCES users(id),
    FOREIGN KEY (organization_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
);

INSERT INTO users (name,email,password_hash,role,phone,skills,availability) VALUES
('Community Admin','admin@community.org',SHA2('admin123',256),'ORGANIZATION','9876543210','Event planning, Coordination','Weekends'),
('Demo Volunteer','volunteer@community.org',SHA2('volunteer123',256),'VOLUNTEER','9876501234','Teaching, Communication','Saturday and Sunday');

INSERT INTO events (organization_id,title,description,event_date,start_time,end_time,location,status) VALUES
(1,'Community Clean-up Drive','Neighborhood clean-up and awareness activity.','2026-10-10','08:00:00','12:00:00','RIT Community Ground','PUBLISHED'),
(1,'Education Support Camp','Support school students with learning activities and materials.','2026-10-18','09:30:00','13:30:00','Community Learning Centre','PUBLISHED');

INSERT INTO event_roles (event_id,role_name,description,required_skills,slots) VALUES
(1,'Clean-up Volunteer','Assist with clean-up and material distribution.','Teamwork',10),
(1,'Awareness Coordinator','Coordinate awareness activities.','Communication',4),
(2,'Teaching Volunteer','Help students with learning activities.','Teaching',8),
(2,'Registration Desk','Manage participant registration.','Communication',3);

INSERT INTO notifications (user_id,title,message) VALUES
(2,'Welcome to the platform','Your volunteer account is ready. Browse events and apply for suitable roles.');
