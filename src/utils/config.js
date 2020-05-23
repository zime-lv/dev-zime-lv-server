require("dotenv").config();

const SITE_MODE =
  typeof process.env.SITE_MODE !== "undefined"
    ? process.env.SITE_MODE
    : "DEVELOPMENT";
// (DEVELOPMENT | STAGING | LIVE)

const dev = {
  uri: {
    ENDPOINT: process.env.DEV_URI,
  },
  db: {
    host: process.env.DEV_DB_HOST,
    user: process.env.DEV_DB_USER,
    password: process.env.DEV_DB_PASS,
    database: process.env.DEV_DB,
  },
};

const staging = {
  uri: {
    ENDPOINT: process.env.STAGING_URI,
  },
  db: {
    host: process.env.STAGING_DB_HOST,
    user: process.env.STAGING_DB_USER,
    password: process.env.STAGING_DB_PASS,
    database: process.env.STAGING_DB,
  },
};

const prod = {
  uri: {
    ENDPOINT: process.env.PROD_URI,
  },
  db: {
    host: process.env.PROD_DB_HOST,
    user: process.env.PROD_DB_USER,
    password: process.env.PROD_DB_PASS,
    database: process.env.PROD_DB,
  },
};

// const hostname = window && window.location && window.location.hostname;

let config;
switch (SITE_MODE) {
  case "DEVELOPMENT":
    config = dev;
    break;
  case "STAGING":
    config = staging;
    break;
  case "LIVE":
    config = prod;
    break;
  default:
    config = dev;
    break;
}

module.exports = {
  ...config,
};
