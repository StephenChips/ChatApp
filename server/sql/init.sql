CREATE SCHEMA IF NOT EXISTS chatapp;

CREATE TABLE IF NOT EXISTS chatapp.users (
    id SERIAL PRIMARY KEY,
    name TEXT,
    avatar_url TEXT,
    password_hash TEXT,
    salt CHARACTER(32)
);

CREATE TABLE IF NOT EXISTS chatapp.default_avatars (url TEXT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS chatapp.add_contact_requests (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP,
    requester_id INT REFERENCES chatapp.users(id),
    recipient_id INT REFERENCES chatapp.users(id),
    status TEXT
);

CREATE TABLE IF NOT EXISTS chatapp.add_contact_request_notifications (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP,
    has_read BOOLEAN,
    add_contact_request_id INT REFERENCES chatapp.add_contact_requests(id),
    user_id INT REFERENCES chatapp.users(id)
);

CREATE TABLE IF NOT EXISTS chatapp.contacts (
    user_id INT REFERENCES chatapp.users(id),
    contact_user_id INT REFERENCES chatapp.users(id),
    CHECK (user_id < contact_user_id),
    CONSTRAINT pk_contacts PRIMARY KEY (user_id, contact_user_id)
);

CREATE TABLE IF NOT EXISTS chatapp.contact_messages (
    id SERIAL PRIMARY KEY,
    sent_at TIMESTAMP,
    recipient_id INT,
    sender_id INT,
    message_type TEXT,
    content JSON
);
