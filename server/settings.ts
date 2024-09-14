

const {
  POSTGRES_USER,
  POSTGRES_DB,
  POSTGRES_HOST,
  POSTGRES_PASSWORD_FILE,
  POSTGRES_PORT,
  JWT_SECRET_FILE,
  TLS_CERT_FILE,
  TLS_KEY_FILE,
  HTTP_PORT,
  HTTPS_PORT,
} = process.env;

export default {
  jwtSecretFile: JWT_SECRET_FILE,
  postgreSQL: {
    user: POSTGRES_USER,
    passwordFile: POSTGRES_PASSWORD_FILE,
    host: POSTGRES_HOST,
    port: POSTGRES_PORT,
    database: POSTGRES_DB,
  },
  http: {
    port: HTTP_PORT,
  },
  https: {
    port: HTTPS_PORT,
    certPath: TLS_CERT_FILE,
    keyPath: TLS_KEY_FILE,
  },
};
