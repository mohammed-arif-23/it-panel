-- Sample assignments for separate classes
-- Run these SQL commands in your Supabase SQL editor

-- Sample assignments for II-IT (2nd year) students
INSERT INTO assignments (title, description, class_year, due_date) VALUES
('Data Structures Assignment', 'Implement linked list operations in C/Java', 'II-IT', NOW() + INTERVAL '10 days'),
('Web Development Project', 'Create a responsive website using HTML, CSS, and JavaScript', 'II-IT', NOW() + INTERVAL '15 days'),
('Database Fundamentals', 'Design a simple database schema for a college management system', 'II-IT', NOW() + INTERVAL '12 days');

-- Sample assignments for III-IT (3rd year) students
INSERT INTO assignments (title, description, class_year, due_date) VALUES
('Advanced Database Systems', 'Design and implement a complex database with stored procedures and triggers', 'III-IT', NOW() + INTERVAL '18 days'),
('Software Engineering Project', 'Develop a complete web application using modern frameworks and follow SDLC', 'III-IT', NOW() + INTERVAL '25 days'),
('Machine Learning Implementation', 'Implement a machine learning algorithm and create a research report', 'III-IT', NOW() + INTERVAL '20 days');

-- Verify the data
SELECT title, class_year, due_date FROM assignments ORDER BY class_year, created_at;