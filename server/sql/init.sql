CREATE SCHEMA IF NOT EXISTS chatapp;

CREATE TABLE IF NOT EXISTS chatapp.users (
    id SERIAL PRIMARY KEY,
    name TEXT,
    avatar_url TEXT,
    password_hash TEXT,
    password_salt CHARACTER(32)
);

CREATE TABLE IF NOT EXISTS chatapp.default_avatars (url TEXT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS chatapp.notifications (
    id SERIAL PRIMARY KEY,
    created_time TIMESTAMP,
    content TEXT,
    user_id INT,
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES chatapp.users(id)
);

CREATE TABLE IF NOT EXISTS chatapp.contacts (
    user_id INT,
    contact_user_id INT,
    CHECK (user_id < contact_user_id),
    CONSTRAINT pk_contacts PRIMARY KEY (user_id, contact_user_id),
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES chatapp.users(id),
    CONSTRAINT fk_contact_user_id FOREIGN KEY (contact_user_id) REFERENCES chatapp.users(id)
);
