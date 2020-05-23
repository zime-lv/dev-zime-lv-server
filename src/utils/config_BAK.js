const SITE_MODE =
  typeof process.env.SITE_MODE !== "undefined"
    ? process.env.SITE_MODE
    : "DEVELOPMENT";
// (DEVELOPMENT | STAGING | LIVE)

const dev = {
  uri: {
    ENDPOINT: "http://localhost:3000",
    // ENDPOINT: "http://192.168.2.100:3000",
    // ENDPOINT: "http://localhost:5000",
  },
  db: {
    host: "localhost",
    user: "root",
    password: "",
    database: "zimelv",
  },
};

const staging = {
  uri: {
    ENDPOINT: "https://dev.zime.lv",
  },
  db: {
    host: "localhost",
    user: "u501809312753",
    password: "pmKdzo_732Hg5",
    database: "dev_zimelv",
  },
};

const prod = {
  uri: {
    ENDPOINT: "https://zime.lv",
  },
  db: {
    host: "localhost",
    user: "u501809312753",
    password: "pmKdzo_732Hg5",
    database: "zimelv",
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

// export default {
//   ...config,
// };

module.exports = {
  ...config,
};
