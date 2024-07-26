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
    requester_id INT,
    recipient_id INT,
    status TEXT,
    CONSTRAINT fk_requester_id FOREIGN KEY (requester_id) REFERENCES chatapp.users(id),
    CONSTRAINT fk_recipient_id FOREIGN KEY (recipient_id) REFERENCES chatapp.users(id)
);


CREATE TABLE IF NOT EXISTS chatapp.contacts (
    user_id INT,
    contact_user_id INT,
    CHECK (user_id < contact_user_id),
    CONSTRAINT pk_contacts PRIMARY KEY (user_id, contact_user_id),
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES chatapp.users(id),
    CONSTRAINT fk_contact_user_id FOREIGN KEY (contact_user_id) REFERENCES chatapp.users(id)
);
