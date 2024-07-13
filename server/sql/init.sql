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
    type TEXT,
    content TEXT
);
