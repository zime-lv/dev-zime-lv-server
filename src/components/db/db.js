const events = require("events");
const eventEmitter = new events.EventEmitter();
const crypto = require("crypto");
const db = require("./db_model");
const dbTypes = require("./db_types");
const ucode = require("../../utils/ucode");
const hash = require("object-hash");
const salt = "_hjs_722m_GHAE_";

/**
 * Validate session
 * @param {string} session
 */
const validateSession = ({ session }) => {
  let name = [];
  let sql = [];
  let values = [];
  name[0] = "VALIDATE SESSION";
  sql[0] = `
    SELECT COALESCE(email, "") AS email
    , COALESCE(token, "") AS token
    , COALESCE(iv, "") AS iv
    FROM sessions
    WHERE token = ?
  `;
  values[0] = [session];
  return { name, sql, values, index: 0 };
};

/**
 * Push queries
 * @param {object} queries
 * @param {integer} index
 */
const pushQueries = (queries, name, sql, values, index) => {
  for (let n = 1; n <= index; n++) {
    queries.push({
      // query
      name: name[n],
      sql: sql[n],
      values: values[n],
    });
  }
  return queries;
};

/**
 * Add or update user
 * @param {unique id} uid
 * @param {fullname} fullname
 * @param {email} email
 * @param {website} website
 * @param {phone} phone
 * @param {username} un
 * @param {password} pw
 * @param {reviser} reviser
 * @param {workplace} workplace
 */
const getSequence = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  email = null,
  birthdate = null,
  timezone = null,

  // standard
  uid = null,
  status = null,
  reviser = null,
  workplace = null,
}) => {
  let name = [];
  let sql = [];
  let values = [];

  timezone = timezone.slice(5); // cut the number part

  name[0] = "UPDATE users";
  sql[0] = `
    UPDATE users
    SET sequence = COALESCE(
        (
            SELECT seqplus FROM 
            (
                SELECT MAX(u2.sequence) + 1 as seqplus
                FROM users AS u2
                WHERE DATE(u2.birthdate) = DATE(?)
                AND u2.timezone = ?
            ) as x
    	), 0
    )
    WHERE email = ?
    `;
  values[0] = [
    /* Update values */
    birthdate,
    timezone,
    email,
  ];

  name[1] = "SELECT FROM users";
  sql[1] = `
    SELECT sequence
    FROM users
    WHERE email = ?
    `;
  values[1] = [
    /* Select values */
    email,
  ];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // user
      email: email,
      uid: uid,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
    {
      // query
      name: name[1],
      sql: sql[1],
      values: values[1],
    },
  ];

  return db.mergeIntoDb(queries);
};

/**
 * Add or update user
 * @param {unique id} uid
 * @param {fullname} fullname
 * @param {email} email
 * @param {website} website
 * @param {phone} phone
 * @param {username} un
 * @param {password} pw
 * @param {reviser} reviser
 * @param {workplace} workplace
 */
const mergeUser = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // req = null,
  // session = null,
  // onStatusChange = () => {},
  // onError = () => {},

  // user
  uid = null,
  firstname = null,
  lastname = null,
  email = null,

  birthdate = null,
  timezone = null,
  scode = null,
  tcode = null,
  sequence = null,

  pw = null,
  website = null,
  phone = null,
  acc_curr = null,
  acc_cred = null,
  acc_save = null,
  language = null,
  status = null,
  validateEmail = false,
  reviser = null,
  workplace = null,
}) => {
  let name = [];
  let sql = [];
  let values = [];

  // let { name, sql, values, index } = validateSession({ session });
  let index = -1;

  // generate uid here
  if (uid === null && scode !== null && tcode !== null && sequence !== null) {
    const checksum = ucode.getChecksum(`${tcode}${sequence}`);
    const sequence_hex = parseInt(sequence).toString(16).padStart(4, "0");
    uid = `U${scode}${sequence_hex}${checksum}`;
    if (!ucode.validate(uid)) {
      onError({
        req: req,
        reqData: reqData,
        session: session,
        error: { code: "CHECKSUM_FAILED" },
        context: ["db.js", "mergeUser", uid],
      });
      return;
    }
  }

  index++;
  name[index] = "INSERT INTO users";
  sql[index] = `
    INSERT INTO users (firstname, lastname, email, pw, acc_curr, acc_cred, acc_save, allowance_date, language, status, created, reviser, workplace)
    VALUES (?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), ?, 0, UTC_TIMESTAMP(), ?, ?)
    ON DUPLICATE KEY UPDATE 
    uid = COALESCE(?, uid)
    , firstname = COALESCE(?, firstname)
    , lastname = COALESCE(?, lastname)
    , email = COALESCE(?, email)
    , pw = COALESCE(?, pw)
    , birthdate = COALESCE(?, birthdate)
    , timezone = COALESCE(?, timezone)
    , website = COALESCE(?, website)
    , phone = COALESCE(?, phone)
    , acc_curr = COALESCE(?, acc_curr)
    , acc_cred = COALESCE(?, acc_cred)
    , acc_save = COALESCE(?, acc_save)
    , language = COALESCE(?, language)
    , status = COALESCE(?, status)
    , reviser = COALESCE(?, reviser)
    , workplace = COALESCE(?, workplace)
    `;
  values[index] = [
    /* Insert values */
    // uid,
    firstname,
    lastname,
    email,
    pw !== null ? hash(`${salt}${pw}`) : null,

    // website,
    // phone,
    0, // acc_curr,
    1000, // acc_cred,
    0, // acc_save,
    language,
    // 0, // status
    reviser,
    workplace,

    /* Update values */
    uid,
    firstname,
    lastname,
    email,
    pw !== null ? hash(`${salt}${pw}`) : null,

    birthdate,
    timezone,

    website,
    phone,
    acc_curr,
    acc_cred,
    acc_save,
    language,
    status,
    reviser,
    workplace,
  ];

  let token = null;
  if (validateEmail) {
    token = crypto.randomBytes(64).toString("base64");
    index++;
    name[index] = "INSERT INTO validation_tokens";
    sql[index] = `
    INSERT INTO validation_tokens (type, email, token, expiration, status, created, reviser, workplace)
    VALUES ('email', ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 HOUR), ?, UTC_TIMESTAMP(), ?, ?)
    ON DUPLICATE KEY UPDATE
    status = COALESCE(?, status)
    , reviser = COALESCE(?, reviser)
    , workplace = COALESCE(?, workplace)
    `;
    values[index] = [
      /* Insert values */
      email,
      token,
      0, // status
      reviser,
      workplace,
      /* Update values */
      status,
      reviser,
      workplace,
    ];
  }

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // user
      email: email,
      tags: { token: token, email: email, language: language },
      uid: uid,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  queries = pushQueries(queries, name, sql, values, index);

  return db.mergeIntoDb(queries);
};

/**
 * Reset password
 * @param {email} email
 * @param {reviser} reviser
 * @param {workplace} workplace
 */
const resetPassword = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  uid = null,
  email = null,
  status = 0,
  language = null,
  reviser = null,
  workplace = null,
}) => {
  let name = [];
  let sql = [];
  let values = [];

  let token = crypto.randomBytes(64).toString("base64");
  name[0] = "INSERT INTO validation_tokens";
  sql[0] = `
    INSERT INTO validation_tokens (type, email, token, expiration, status, created, reviser, workplace)
    VALUES ('password', ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 HOUR), ?, UTC_TIMESTAMP(), ?, ?)
    ON DUPLICATE KEY UPDATE
    token = COALESCE(?, token)
    , expiration = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 HOUR)
    , status = COALESCE(?, status)
    , reviser = COALESCE(?, reviser)
    , workplace = COALESCE(?, workplace)
    `;
  values[0] = [
    /* Insert values */
    email,
    token,
    0, // status
    reviser,
    workplace,
    /* Update values */
    token,
    status,
    reviser,
    workplace,
  ];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // user
      email: email,
      tags: { token: token, email: email, language: language },
      uid: uid,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  return db.mergeIntoDb(queries);
};

/**
 * Get user (for log in)
 * @param {*} param0
 */
const getUser = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  email = null,
}) => {
  let name = [];
  let sql = [];
  let values = [];

  name[0] = "SELECT users";
  sql[0] = `
    SELECT u.uid, u.firstname, u.lastname, u.email, u.acc_curr, u.acc_cred, u.acc_save, u.website, u.phone, c.name AS currency_name, c.abbr AS currency_abbr, u.language, u.status, u.ts 
    FROM users AS u
    INNER JOIN currencies AS c ON c.abbr = u.currency_id
    WHERE u.email = ? AND u.status < 2
    `; // suspended account status = 2
  values[0] = [email];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  // return db.selectFromDb(queries);
  return db.mergeIntoDb(queries);
};

/**
 * UploadFile
 * @param {*} param0
 */
const uploadFile = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},
}) => {
  let name = [];
  let sql = [];
  let values = [];

  name[0] = "SELECT 1";
  sql[0] = "SELECT COUNT(*) AS count_users FROM users WHERE status = 1";
  values[0] = [];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  // return db.selectFromDb(queries);
  return db.mergeIntoDb(queries);
};

/**
 * Init user (for log in)
 * @param {*} param0
 */
// const initUser = ({
//   // system
//   req = null,
//   reqData = null,
//   session = null,
//   onStatusChange = () => {},
//   onError = () => {},

//   // user
//   email = null,
// }) => {
//   let name = [];
//   let sql = [];
//   let values = [];

//   let n = -1;

//   if (true) {
//     n++;
//     name[n] = "UPDATE last seen user";
//     sql[n] = `
//     UPDATE users
//     SET last_seen = UTC_TIMESTAMP()
//     WHERE email = ?
//     `;
//     values[n] = [email];
//   }

//   let queries = [
//     {
//       // system
//       req: req,
//       reqData: reqData,
//       session: session,
//       onStatusChange: onStatusChange,
//       onError: onError,

//       // query
//       name: name[0],
//       sql: sql[0],
//       values: values[0],
//     },
//   ];

//   return db.mergeIntoDb(queries);
// };

/**
 * Get URI settings
 * @param {*} param0
 */
const getUriSettings = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  uri = null,
}) => {
  let name = [];
  let sql = [];
  let values = [];

  name[0] = "SELECT FROM uri_settings";
  sql[0] = `
    SELECT settings
    FROM uri_settings
    WHERE uri = ?
    `;
  values[0] = [uri];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  return db.mergeIntoDb(queries);
};

/**
 * Sign in user (for log in)
 * @param {*} param0
 */
const signInUser = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  email = null,
  ip = null,
  pw = null,
}) => {
  // const ip = require("ip");
  const geoip = require("geoip-lite");
  const ipAddress = ip;
  const ipGeo = geoip.lookup(ipAddress);
  // console.log("IP ADDRESS:", ipAddress, ipGeo);

  let name = [];
  let sql = [];
  let values = [];

  let n = -1;

  n++;
  name[n] = "SELECT users";
  sql[n] = `
    SELECT u.uid, u.firstname, u.lastname, u.email, u.sequence, u.acc_curr, u.acc_cred, u.acc_save, u.website, u.phone, u.language, u.status, u.ts,
    c.name AS currency_name, c.abbr AS currency_abbr, c.rate AS currency_rate, c.status AS currency_status
    FROM users AS u
    INNER JOIN currencies AS c ON c.abbr = u.currency_id
    WHERE u.email = ? AND u.pw = ?
    `; // suspended account status = 2
  values[n] = [email, hash(`${salt}${pw}`)];

  n++;
  name[n] = "INSERT INTO user_connection";
  sql[n] = `
    INSERT INTO user_connection (
      email, date, ip, connections, 
      country, region, eu, timezone, city, gps_lat, gps_lon, metro, area, 
      created, reviser, workplace
    )
    VALUES (
      ?, UTC_TIMESTAMP(), ?, 1,
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      UTC_TIMESTAMP(), 'SYS', 'SYSTEM'
    )
    ON DUPLICATE KEY UPDATE 
    connections = connections + 1
    `; // suspended account status = 2
  values[n] = [
    email,
    ipAddress,
    ipGeo === null ? null : ipGeo.country,
    ipGeo === null ? null : ipGeo.region,
    ipGeo === null ? null : ipGeo.eu,
    ipGeo === null ? "-" : ipGeo.timezone,
    ipGeo === null ? "-" : ipGeo.city,
    ipGeo === null ? null : ipGeo.gps_lat,
    ipGeo === null ? null : ipGeo.gps_lon,
    ipGeo === null ? null : ipGeo.metro,
    ipGeo === null ? "-" : ipGeo.area,
  ];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // tags
      tags: { email: email },

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
    {
      // query
      name: name[1],
      sql: sql[1],
      values: values[1],
    },
  ];

  return db.mergeIntoDb(queries);
};

/**
 * Last seen user
 * @param {*} param0
 */
// const lastSeenUser = ({
//   // system
//   req = null,
//   reqData = null,
//   session = null,
//   onStatusChange = () => {},
//   onError = () => {},

//   // user
//   email = null,
// }) => {
//   let name = [];
//   let sql = [];
//   let values = [];

//   name[0] = "UPDATE users";
//   sql[0] = `
//     UPDATE users
//     SET last_seen = UTC_TIMESTAMP()
//     WHERE email = ?
//     `; // suspended account status = 2
//   values[0] = [email];

//   let queries = [
//     {
//       // system
//       req: req,
//       reqData: reqData,
//       session: session,
//       // onStatusChange: () => {}, // onStatusChange,
//       onStatusChange: onStatusChange,
//       onError: onError,

//       // tags
//       tags: { email: email },

//       // query
//       name: name[0],
//       sql: sql[0],
//       values: values[0],
//     },
//   ];

//   return db.mergeIntoDb(queries);
// };

/**
 * Get account (for log in)
 * @param {*} param0
 */
const getAccount = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  uid = null,
}) => {
  let { name, sql, values, index } = validateSession({ session });

  index++;
  name[index] = "SELECT users";
  sql[index] = `
    SELECT u.uid, u.firstname, u.lastname, u.email, u.sequence, u.acc_curr, u.acc_cred, u.acc_save, u.website, u.phone, u.status, u.ts 
    , s.token, s.iv
    FROM users AS u
    INNER JOIN sessions AS s ON s.email = u.email 
    WHERE u.uid = ?
    AND s.token = ?
    `; // suspended account status = 2
  values[index] = [uid, session];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  queries = pushQueries(queries, name, sql, values, index);

  // return db.selectFromDb(queries);
  return db.mergeIntoDb(queries);
};

/**
 * Get Transactions
 * @param {*} param0
 */
const getTransactions = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  uid = null,
  language = null,
  dateStart = null,
  dateEnd = null,
  search = "%",
  page = 0,
  limit = 5,
}) => {
  // Process dates
  if (dateStart === "") dateStart = null;
  if (dateEnd === "") dateEnd = null;

  // Process search
  if (search === null) search = "*";
  search = search.split("*").join("%");
  if (search.indexOf("%") < 0) search = `%${search}%`;

  let { name, sql, values, index } = validateSession({ session });

  index++;
  name[index] = "SELECT transactions";
  sql[index] = `
  SELECT *
  FROM (
    SELECT 'sender' AS tid, (tp.amount * t.exchange_rate) as conv_amount, tp.from_account AS from_account, tp.to_account AS to_account, tp.recipient_id, tp.roles, tp.share, tp.share_per_cent, 
    us.firstname AS sender_firstname, us.lastname AS sender_lastname, us.status AS sender_status,
    ur.firstname AS recipient_firstname, ur.lastname AS recipient_lastname, ur.status AS recipient_status,
    b.business_id, b.title AS business_title, b.description AS business_description, b.link AS business_link, b.image AS business_image, b.status AS business_status,
    p.title AS purpose_title, p.description AS purpose_description, p.status AS purpose_status,
    t.type, t.currency, t.exchange_rate, t.sender_id, t.purpose_id, t.comment, DATE_FORMAT(t.created, '%Y-%m-%d %H:%i:%s') AS created
    FROM transaction_positions AS tp 
    LEFT JOIN transactions AS t ON t.transaction_id = tp.transaction_id
    LEFT JOIN users AS us ON us.uid = t.sender_id
    LEFT JOIN users AS ur ON ur.uid = tp.recipient_id
    LEFT JOIN purposes as p ON p.purpose_id = t.purpose_id
    LEFT JOIN businesses as b ON b.business_id = p.business_id
    WHERE tp.recipient_id = ?
    AND (t.created BETWEEN COALESCE(?, '1970-01-01') AND DATE_ADD(COALESCE(?, UTC_TIMESTAMP()), INTERVAL 1 DAY))
    AND ( 
      t.comment LIKE ?
      OR t.purpose_id LIKE ?
      OR us.firstname LIKE ?
      OR us.lastname LIKE ?
      OR CONCAT(us.firstname, " ", us.lastname) LIKE ?
    )

    UNION ALL

    SELECT 'receiver' AS tid, (t.amount * t.exchange_rate) as conv_amount, tp.from_account AS from_account, tp.to_account AS to_account, '-' AS recipient_id, '-' AS roles, '-' AS share, '-' AS share_per_cent,
    us.firstname AS sender_firstname, us.lastname AS sender_lastname, us.status AS sender_status,
    ur.firstname AS recipient_firstname, ur.lastname AS recipient_lastname, ur.status AS recipient_status,
    b.business_id, b.title AS business_title, b.description AS business_description, b.link AS business_link, b.image AS business_image, b.status AS business_status,
    p.title AS purpose_title, p.description AS purpose_description, p.status AS purpose_status,
    t.type, t.currency, t.exchange_rate, t.sender_id, t.purpose_id, t.comment, DATE_FORMAT(t.created, '%Y-%m-%d %H:%i:%s') AS created
    FROM transactions AS t
    LEFT JOIN transaction_positions AS tp ON tp.transaction_id = t.transaction_id
    LEFT JOIN users AS us ON us.uid = t.sender_id
    LEFT JOIN users AS ur ON ur.uid = tp.recipient_id
    LEFT JOIN purposes as p ON p.purpose_id = t.purpose_id
    LEFT JOIN businesses as b ON b.business_id = p.business_id
    WHERE t.sender_id = ?
    AND (t.created BETWEEN COALESCE(?, '1970-01-01') AND DATE_ADD(COALESCE(?, UTC_TIMESTAMP()), INTERVAL 1 DAY))
    AND ( 
      t.comment LIKE ?
      OR t.purpose_id LIKE ?
      OR ur.firstname LIKE ?
      OR ur.lastname LIKE ?
      OR CONCAT(ur.firstname, " ", ur.lastname) LIKE ?
    )
    GROUP BY tp.transaction_id
    
  ) a
  ORDER BY created DESC, conv_amount
  LIMIT ? OFFSET ?
    `;
  values[index] = [
    // sender
    uid,
    dateStart,
    dateEnd,
    search,
    search,
    search,
    search,
    search,

    // receiver
    uid,
    dateStart,
    dateEnd,
    search,
    search,
    search,
    search,
    search,

    //
    limit,
    page * limit,
  ];

  index++;
  name[index] = "COUNT transactions";
  sql[index] = `
    SELECT
    (
      SELECT COUNT(*)
      FROM transaction_positions AS tp
      LEFT JOIN transactions AS t ON t.transaction_id = tp.transaction_id
      LEFT JOIN users AS us ON us.uid = t.sender_id
      WHERE tp.recipient_id = ?
      AND (t.created BETWEEN COALESCE(?, '1970-01-01') AND DATE_ADD(COALESCE(?, UTC_TIMESTAMP()), INTERVAL 1 DAY))
      AND ( 
        t.comment LIKE ?
        OR t.purpose_id LIKE ?
        OR us.firstname LIKE ?
        OR us.lastname LIKE ?
        OR CONCAT(us.firstname, " ", us.lastname) LIKE ?
      )
    ) +
    (
      SELECT COUNT(*)
      FROM transactions AS t
      LEFT JOIN users AS us ON us.uid = t.sender_id
      WHERE t.sender_id = ?
      AND (t.created BETWEEN COALESCE(?, '1970-01-01') AND DATE_ADD(COALESCE(?, UTC_TIMESTAMP()), INTERVAL 1 DAY))
      AND ( 
        t.comment LIKE ?
        OR t.purpose_id LIKE ?
        OR us.firstname LIKE ?
        OR us.lastname LIKE ?
        OR CONCAT(us.firstname, " ", us.lastname) LIKE ?
      )
    )
    AS count_transaction_positions
  `;
  values[index] = [
    // sender
    uid,
    dateStart,
    dateEnd,
    search,
    search,
    search,
    search,
    search,

    // receiver
    uid,
    dateStart,
    dateEnd,
    search,
    search,
    search,
    search,
    search,
  ];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  queries = pushQueries(queries, name, sql, values, index);

  return db.mergeIntoDb(queries);
};

// /**
//  * Find Transactions
//  * @param {*} param0
//  */
// const findTransactions = ({
//   // system
//   req = null,
//   reqData = null,
//   session = null,
//   onStatusChange = () => {},
//   onError = () => {},

//   // user
//   uid = null,
//   search = "%",
//   page = 0,
//   limit = 5,
// }) => {
//   let { name, sql, values, index } = validateSession({ session });

//   index++;
//   name[index] = "SELECT transactions";
//   sql[index] = `
//   SELECT *
//   FROM (
//     SELECT 'sender' AS tid, (tp.amount * t.exchange_rate) as conv_amount, tp.from_account AS from_account, tp.to_account AS to_account, tp.recipient_id, tp.roles, tp.share, tp.share_per_cent,
//     us.firstname AS sender_firstname, us.lastname AS sender_lastname, us.status AS sender_status,
//     ur.firstname AS recipient_firstname, ur.lastname AS recipient_lastname, ur.status AS recipient_status,
//     b.business_id, b.title AS business_title, b.description AS business_description, b.link AS business_link, b.image AS business_image, b.status AS business_status,
//     p.title AS purpose_title, p.description AS purpose_description, p.status AS purpose_status,
//     t.type, t.currency, t.exchange_rate, t.sender_id, t.purpose_id, t.comment, DATE_FORMAT(t.created, '%Y-%m-%d %H:%i:%s') AS created
//     FROM transaction_positions AS tp
//     LEFT JOIN transactions AS t ON t.transaction_id = tp.transaction_id
//     LEFT JOIN users AS us ON us.uid = t.sender_id
//     LEFT JOIN users AS ur ON ur.uid = tp.recipient_id
//     LEFT JOIN purposes as p ON p.purpose_id = t.purpose_id
//     LEFT JOIN businesses as b ON b.business_id = p.business_id
//     WHERE tp.recipient_id = ?
//     -- AND t.comment != "allowance"

//     UNION ALL

//     SELECT 'receiver' AS tid, (t.amount * t.exchange_rate) as conv_amount, tp.from_account AS from_account, tp.to_account AS to_account, '-' AS recipient_id, '-' AS roles, '-' AS share, '-' AS share_per_cent,
//     us.firstname AS sender_firstname, us.lastname AS sender_lastname, us.status AS sender_status,
//     ur.firstname AS recipient_firstname, ur.lastname AS recipient_lastname, ur.status AS recipient_status,
//     b.business_id, b.title AS business_title, b.description AS business_description, b.link AS business_link, b.image AS business_image, b.status AS business_status,
//     p.title AS purpose_title, p.description AS purpose_description, p.status AS purpose_status,
//     t.type, t.currency, t.exchange_rate, t.sender_id, t.purpose_id, t.comment, DATE_FORMAT(t.created, '%Y-%m-%d %H:%i:%s') AS created
//     FROM transactions AS t
//     LEFT JOIN transaction_positions AS tp ON tp.transaction_id = t.transaction_id
//     LEFT JOIN users AS us ON us.uid = t.sender_id
//     LEFT JOIN users AS ur ON ur.uid = tp.recipient_id
//     LEFT JOIN purposes as p ON p.purpose_id = t.purpose_id
//     LEFT JOIN businesses as b ON b.business_id = p.business_id
//     WHERE t.sender_id = ?
//     GROUP BY tp.transaction_id

//   ) a
//   ORDER BY created DESC, conv_amount
//   LIMIT ? OFFSET ?
//     `;
//   values[index] = [uid, uid, limit, page * limit];

//   index++;
//   name[index] = "COUNT transactions";
//   sql[index] = `
//     SELECT
//     (
//       SELECT COUNT(*)
//       FROM transaction_positions AS tp
//       LEFT JOIN transactions AS t ON t.transaction_id = tp.transaction_id
//       WHERE tp.recipient_id = ?
//     ) +
//     (
//       SELECT COUNT(*)
//       FROM transactions
//       WHERE sender_id = ?
//     )
//     AS count_transaction_positions
//   `;
//   values[index] = [uid, uid];

//   let queries = [
//     {
//       // system
//       req: req,
//       reqData: reqData,
//       session: session,
//       onStatusChange: onStatusChange,
//       onError: onError,

//       // query
//       name: name[0],
//       sql: sql[0],
//       values: values[0],
//     },
//   ];

//   queries = pushQueries(queries, name, sql, values, index);

//   return db.mergeIntoDb(queries);
// };

/**
 * Get shares
 * @param {*} param0
 */
const getShares = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  uid = null,
  language = null,
  search = "%",
  page = 0,
  limit = 5,
}) => {
  // Process search
  if (search === null) search = "*";
  search = search.split("*").join("%");
  if (search.indexOf("%") < 0) search = `%${search}%`;

  let { name, sql, values, index } = validateSession({ session });

  index++;
  name[index] = "SELECT shares";
  sql[index] = `
    SELECT s.shareholder_id, s.purpose_id, s.title AS shares_title, s.description AS shares_description, s.roles AS shares_roles, s.share AS shares_share, s.status AS shares_status, DATE_FORMAT(s.created, '%Y-%m-%d %H:%i:%s') as shares_created,
    p.title AS purpose_title, p.description AS purpose_description, '' AS purpose_link, '' AS purpose_image, p.status AS purpose_status,
    b.business_id, b.title AS business_title, b.description AS business_description, b.link AS business_link, b.image AS business_image, b.status AS business_status,
    o.uid AS owner_uid, o.firstname AS owner_firstname, o.lastname AS owner_lastname, o.status AS owner_status,
    (
      100 / 
      (
        SELECT SUM(s2.share) 
        FROM shares AS s2 
        WHERE s2.purpose_id = s.purpose_id
      ) * s.share
    ) AS share_per_cent
    FROM shares AS s
    LEFT JOIN purposes as p ON p.purpose_id = s.purpose_id
    LEFT JOIN businesses as b ON b.business_id = p.business_id
    LEFT JOIN users as o ON o.uid = b.owner_id
    WHERE s.shareholder_id = ?
    AND s.status < 2
    AND (
      b.title LIKE ?
      OR p.title LIKE ?
      OR s.roles LIKE ?
    )
    ORDER BY shares_created DESC, shares_title
    LIMIT ? OFFSET ?
    `;
  values[index] = [uid, search, search, search, limit, page * limit];

  index++;
  name[index] = "COUNT shares";
  sql[index] = `
    SELECT COUNT(*) as count_shares
    FROM shares AS s
    LEFT JOIN purposes as p ON p.purpose_id = s.purpose_id
    LEFT JOIN businesses as b ON b.business_id = p.business_id
    WHERE s.shareholder_id = ?
    AND s.status < 2
    AND (
      b.title LIKE ?
      OR p.title LIKE ?
      OR s.roles LIKE ?
    )
  `;
  values[index] = [uid, search, search, search];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  queries = pushQueries(queries, name, sql, values, index);

  return db.mergeIntoDb(queries);
};

const endSession = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  token = null,
}) => {
  let name = [];
  let sql = [];
  let values = [];

  name[0] = "UPDATE sessions";
  sql[0] = `
    UPDATE sessions
    SET token = ''
    , iv = ''
    WHERE token = ?
  `;
  values[0] = [
    /* Update values */
    token,
  ];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // user
      // email: null,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  // console.log("mergeIntoDb: ", queries);

  return db.mergeIntoDb(queries);
};

const mergeSession = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  email = null,
  token = null,
  iv = null,
  status = 0,
}) => {
  let name = [];
  let sql = [];
  let values = [];

  name[0] = "INSERT INTO sessions";
  sql[0] = `
    INSERT INTO sessions (email, token, iv, status, created)
    VALUES (?, ?, ?, ?, UTC_TIMESTAMP())
    ON DUPLICATE KEY UPDATE 
    token = COALESCE(?, token)
    , iv = COALESCE(?, iv)
    , status = COALESCE(?, status)
    , created = UTC_TIMESTAMP()
  `;
  values[0] = [
    /* Insert values */
    email,
    token,
    iv,
    status,

    /* Update values */
    token,
    iv,
    status,
  ];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // user
      email: null,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  // console.log("mergeIntoDb: ", queries);

  return db.mergeIntoDb(queries);
};

const mergeBusiness = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  uid = null,
  title = null,
  description = null,
  status = 0,
  reviser = null,
  workplace = null,
}) => {
  // let name = [];
  // let sql = [];
  // let values = [];

  let { name, sql, values, index } = validateSession({ session });

  index++;
  name[index] = "INSERT INTO businesses";
  sql[index] = `
    INSERT INTO businesses (title, description, owner_id, status, created, reviser, workplace)
    VALUES (?, ?, ?, ?, UTC_TIMESTAMP(), ?, ?)
    ON DUPLICATE KEY UPDATE 
    description = COALESCE(?, description)
    , status = COALESCE(?, status)
    , reviser = COALESCE(?, reviser)
    , workplace = COALESCE(?, workplace)
  `;
  values[index] = [
    /* Insert values */
    title,
    description,
    uid,
    status,
    reviser,
    workplace,
    /* Update values */
    description,
    status,
    reviser,
    workplace,
  ];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // user
      email: null,
      uid: uid,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  queries = pushQueries(queries, name, sql, values, index);

  return db.mergeIntoDb(queries);
};

const mergeCurrency = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  uid = null,
  curr_title = null,
  abbr = null,
  rate = null,
  region = null,

  // standard
  status = 0,
  reviser = null,
  workplace = null,
}) => {
  // let name = [];
  // let sql = [];
  // let values = [];

  let { name, sql, values, index } = validateSession({ session });

  index++;
  name[index] = "INSERT INTO currencies";
  sql[index] = `
    INSERT INTO currencies (name, abbr, rate, region, status, created, reviser, workplace)
    VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP(), ?, ?)
    ON DUPLICATE KEY UPDATE 
    name = COALESCE(?, name)
    , abbr = COALESCE(?, abbr)
    , rate = COALESCE(?, rate)
    , region = COALESCE(?, region)
    , status = COALESCE(?, status)
    , reviser = COALESCE(?, reviser)
    , workplace = COALESCE(?, workplace)
  `;
  values[index] = [
    /* Insert values */
    curr_title,
    abbr,
    rate,
    region,
    status,
    reviser,
    workplace,
    /* Update values */
    curr_title,
    abbr,
    rate,
    region,
    status,
    reviser,
    workplace,
  ];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // user
      email: null,
      uid: uid,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  queries = pushQueries(queries, name, sql, values, index);

  return db.mergeIntoDb(queries);
};

/**
 * Get currencies
 * @param {*} param0
 */
const getCurrencies = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  uid = null,
  search = "%",
  page = 0,
  limit = 5,
}) => {
  // Process search
  if (search === null) search = "*";
  search = search.split("*").join("%");
  if (search.indexOf("%") < 0) search = `%${search}%`;

  let { name, sql, values, index } = validateSession({ session });

  index++;
  name[index] = "SELECT currencies";
  sql[index] = `
    SELECT c.name, c.abbr, c.rate, c.region, c.status, DATE_FORMAT(c.created, '%Y-%m-%d %H:%i:%s') as created
    FROM currencies AS c
    LEFT JOIN users AS u ON u.currency_id = c.abbr AND u.uid = ?
    WHERE (
      c.name LIKE ?
      OR c.abbr LIKE ?
      OR c.region LIKE ?
    )
    AND c.status < 2
    GROUP BY c.abbr
    ORDER BY u.currency_id DESC, c.abbr
    LIMIT ? OFFSET ?
    `; // suspended account status = 2
  values[index] = [uid, search, search, search, limit, page * limit];

  index++;
  name[index] = "COUNT currencies";
  sql[index] = `
    SELECT COUNT(*) count_currencies 
    FROM currencies
    WHERE 
      name LIKE ?
      OR abbr LIKE ?
      OR region LIKE ?
    AND status < 2;
  `;
  values[index] = [search, search, search];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  queries = pushQueries(queries, name, sql, values, index);

  return db.mergeIntoDb(queries);
};

// /**
//  * Find currencies
//  * @param {*} param0
//  */
// const findCurrencies = ({
//   // system
//   req = null,
//   reqData = null,
//   session = null,
//   onStatusChange = () => {},
//   onError = () => {},

//   // user
//   uid = null,
//   search = "%",
//   page = 0,
//   limit = 5,
// }) => {
//   search = search.split("*").join("%");

//   if (search.indexOf("%") < 0) search = `%${search}%`;

//   let { name, sql, values, index } = validateSession({ session });

//   index++;
//   name[index] = "SELECT currencies";
//   sql[index] = `
//     SELECT c.name, c.abbr, c.rate, c.region, c.status, DATE_FORMAT(c.created, '%Y-%m-%d %H:%i:%s') as created
//     FROM currencies AS c
//     LEFT JOIN users AS u ON u.currency_id = c.abbr AND u.uid = ?
//     WHERE (
//       c.name LIKE ?
//       OR c.abbr LIKE ?
//       OR c.region LIKE ?
//     )
//     AND c.status < 2
//     GROUP BY c.abbr
//     ORDER BY u.currency_id DESC, c.abbr
//     LIMIT ? OFFSET ?
//     `; // suspended account status = 2
//   values[index] = [uid, search, search, search, limit, page * limit];

//   index++;
//   name[index] = "COUNT currencies";
//   sql[index] = `
//     SELECT COUNT(*) count_currencies
//     FROM currencies
//     WHERE
//       name LIKE ?
//       OR abbr LIKE ?
//       OR region LIKE ?
//     AND status < 2;
//   `;
//   values[index] = [search, search, search];

//   let queries = [
//     {
//       // system
//       req: req,
//       reqData: reqData,
//       session: session,
//       onStatusChange: onStatusChange,
//       onError: onError,

//       // query
//       name: name[0],
//       sql: sql[0],
//       values: values[0],
//     },
//   ];

//   queries = pushQueries(queries, name, sql, values, index);

//   return db.mergeIntoDb(queries);
// };

/**
 * Register user language
 * @param {*} param0
 */
const mergeUserLanguage = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  email = null,
  language = null,
}) => {
  let name = [];
  let sql = [];
  let values = [];

  name[0] = "UPDATE users";
  sql[0] = `
    UPDATE users 
    SET language = ?
    WHERE email = ?
    `; // suspended account status = 2
  values[0] = [language, email];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  return db.mergeIntoDb(queries);
};

/**
 * Register user currency
 * @param {*} param0
 */
const mergeUserCurrency = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  email = null,
  currency_id = null,
}) => {
  // let name = [];
  // let sql = [];
  // let values = [];

  let { name, sql, values, index } = validateSession({ session });

  index++;
  name[index] = "UPDATE users";
  sql[index] = `
    UPDATE users 
    SET currency_id = ?
    WHERE email = ?
    `; // suspended account status = 2
  values[index] = [currency_id, email];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  queries = pushQueries(queries, name, sql, values, index);

  return db.mergeIntoDb(queries);
};

/**
 * Validate email token
 * @param {*} param0
 */
const validateEmailToken = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  token = null,
  email = null,
}) => {
  let name = [];
  let sql = [];
  let values = [];

  name[0] = "UPDATE validation tokens";
  sql[0] = `
    UPDATE validation_tokens
    SET status = ?
    WHERE type = 'email'
    AND email = ? 
    AND token = ? 
    AND expiration >= UTC_TIMESTAMP()
    `;
  values[0] = [1, email, token]; // status 1 = validated

  name[1] = "UPDATE users";
  sql[1] = `
    UPDATE users
    SET status = ?
    WHERE email = ? 
    `;
  values[1] = [1, email]; // user status: 0 = not validated, 1 = validated

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
    {
      // query
      name: name[1],
      sql: sql[1],
      values: values[1],
    },
  ];

  return db.mergeIntoDb(queries);
};

/**
 * Resend validate email token
 * @param {*} param0
 */
const resendValidateEmailToken = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  email = null,
  token = null,
  language = null,
}) => {
  let name = [];
  let sql = [];
  let values = [];

  name[0] = "UPDATE validation tokens";
  sql[0] = `
    UPDATE validation_tokens
    SET resent = resent + 1
    WHERE type = 'email'
    AND email = ? 
    AND token = ?
    AND status = 0
    AND expiration >= UTC_TIMESTAMP()
    `;
  values[0] = [email, token]; // status 0 = not validated

  name[1] = "SELECT validation_tokens";
  sql[1] = `
    SELECT resent
    FROM validation_tokens
    WHERE email = ?
    AND type = 'email' 
    `;
  values[1] = [email];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // user
      // email: email,
      tags: { token: token, email: email, language: language },

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
    {
      // query
      name: name[1],
      sql: sql[1],
      values: values[1],
    },
  ];

  return db.mergeIntoDb(queries);
};

/**
 * Validate password reset token
 * @param {*} param0
 */
const validatePasswordResetToken = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  token = null,
  email = null,
}) => {
  let name = [];
  let sql = [];
  let values = [];

  name[0] = "UPDATE validation tokens";
  sql[0] = `
    UPDATE validation_tokens
    SET status = ?
    WHERE type = 'password'
    AND email = ? 
    AND token = ? 
    AND expiration >= UTC_TIMESTAMP()
    `;
  values[0] = [1, email, token]; // status 1 = validated

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  return db.mergeIntoDb(queries);
};

/**
 * Get account (for log in)
 * @param {*} param0
 */
const getValidateSession = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},
}) => {
  let { name, sql, values, index } = validateSession({ session });

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  return db.mergeIntoDb(queries);
};

/**
 * Get account (for log in)
 * @param {*} param0
 */
const getBusiness = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  uid = null,
  page = 0,
  limit = 1,
}) => {
  // let name = []; // query name
  // let sql = [];
  // let values = [];

  let { name, sql, values, index } = validateSession({ session });

  index++;
  name[index] = "SELECT businesses";
  sql[index] = `
    SELECT business_id, title, description, link, image, status, DATE_FORMAT(created, '%Y-%m-%d %H:%i:%s') as created
    FROM businesses 
    WHERE owner_id = ? AND status < 2
    ORDER BY title
    LIMIT ? OFFSET ?
    `; // suspended account status = 2
  values[index] = [uid, limit, page * limit];

  index++;
  name[index] = "COUNT businesses";
  sql[index] = `
    SELECT COUNT(*) as count_businesses
    FROM businesses
    WHERE owner_id = ?
  `;
  values[index] = [uid];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  queries = pushQueries(queries, name, sql, values, index);

  return db.mergeIntoDb(queries);
};

/**
 * Get user business by id
 * @param {*} param0
 */
const getBusinessById = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  id = null,
}) => {
  let name = []; // query name
  let sql = [];
  let values = [];

  name[0] = "SELECT businesses";
  sql[0] = `
    SELECT business_id, title, description, link, image, status, DATE_FORMAT(created, '%Y-%m-%d %H:%i:%s') as created
    FROM businesses 
    WHERE id = ? AND status < 2
    `; // suspended account status = 2
  values[0] = [id];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  return db.mergeIntoDb(queries);
};

/**
 * Get cart purposes
 * @param {*} param0
 */
const getCartPurposes = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  purposes = null,
  language = null,
  page = 0,
  limit = 5,
}) => {
  let name = [];
  let sql = [];
  let values = [];

  // const purposes_joined = "'" + purposes.join(",") + "'";
  const purposes_array = JSON.parse(purposes);

  // WHERE purpose_id IN (${purposes}) AND status = 1

  name[0] = "SELECT purposes";
  sql[0] = `
    SELECT p.business_id, p.purpose_id, p.title, p.description, '' AS link, '' AS image, p.status, DATE_FORMAT(p.created, '%Y-%m-%d %H:%i:%s') as created
    FROM purposes AS p
    WHERE p.purpose_id IN (?) 
    AND p.status = 1
    ORDER BY p.title
    LIMIT ? OFFSET ?
    `; // suspended account status = 2
  values[0] = [purposes_array, limit, page * limit];

  name[1] = "COUNT purposes";
  sql[1] = `
    SELECT COUNT(*) as count_purposes
    FROM purposes
    WHERE purpose_id IN (?)
    AND status = 1
  `;
  values[1] = [purposes_array];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },

    {
      // query
      name: name[1],
      sql: sql[1],
      values: values[1],
    },
  ];

  // return db.selectFromDb(queries);
  return db.mergeIntoDb(queries);
};

/**
 * Get business purposes
 * @param {*} param0
 */
const getPurpose = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  business_id = null,
  language = null,
  search = "%",
  page = 0,
  limit = 5,
}) => {
  // let name = [];
  // let sql = [];
  // let values = [];

  // Process search
  if (search === null) search = "*";
  search = search.split("*").join("%");
  if (search.indexOf("%") < 0) search = `%${search}%`;

  let { name, sql, values, index } = validateSession({ session });

  index++;
  name[index] = "SELECT purposes";
  sql[index] = `
  SELECT p.id, p.business_id, p.purpose_id, p.status, DATE_FORMAT(p.created, '%Y-%m-%d %H:%i:%s') as created
  , p.title, p.description, p.keywords
  FROM purposes AS p
  WHERE p.business_id = ?
  AND p.status < 2
  AND (
    p.title LIKE ?
    OR p.description LIKE ?
    OR p.keywords LIKE ?
    OR p.purpose_id LIKE ?
  )
  ORDER BY p.title
  LIMIT ? OFFSET ?
    `; // suspended account status = 2
  values[index] = [
    business_id,
    search,
    search,
    search,
    search,
    limit,
    page * limit,
  ];

  index++;
  name[index] = "COUNT purposes";
  sql[index] = `
    SELECT COUNT(*) as count_purposes
    FROM purposes
    WHERE business_id = ?
    AND status < 2
    AND (
      title LIKE ?
      OR description LIKE ?
      OR keywords LIKE ?
      OR purpose_id LIKE ?
    )
  `;
  values[index] = [business_id, search, search, search, search];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  queries = pushQueries(queries, name, sql, values, index);

  return db.mergeIntoDb(queries);
};

/**
 * Get share
 * @param {*} param0
 */
const getShare = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  purpose_id = null,
}) => {
  // let name = [];
  // let sql = [];
  // let values = [];

  let { name, sql, values, index } = validateSession({ session });

  index++;
  name[index] = "SELECT shares";
  sql[index] = `
    SELECT s.purpose_id, s.shareholder_id, u.firstname, u.lastname, u.email, s.title, s.description, s.roles, s.share, s.status, DATE_FORMAT(s.created, '%Y-%m-%d %H:%i:%s') as created
    FROM shares as s
    INNER JOIN users as u ON u.uid = s.shareholder_id
    WHERE s.purpose_id = ? 
    AND s.status < 2
    AND u.status < 2
    `; // suspended account status = 2
  values[index] = [purpose_id];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  queries = pushQueries(queries, name, sql, values, index);

  return db.mergeIntoDb(queries);
};

/**
 * Get business purpose by id
 * @param {*} param0
 */
const getPurposeById = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  id = null,
  language = null,
}) => {
  let name = [];
  let sql = [];
  let values = [];

  // SELECT p.id, p.business_id, p.purpose_id, p.status, DATE_FORMAT(p.created, '%Y-%m-%d %H:%i:%s') as created
  // , pp.title, pp.description, pp.category, pp.subcategory, pp.subcategory2, pp.keywords, pp.link, pp.image
  // FROM purposes AS p
  // LEFT JOIN purpose_props AS pp ON pp.purpose_id = p.purpose_id
  // WHERE p.id = ?
  // AND p.status < 2
  // AND pp.language = ?

  name[0] = "SELECT purposes";
  sql[0] = `
    SELECT p.id, p.business_id, p.purpose_id, p.status, DATE_FORMAT(p.created, '%Y-%m-%d %H:%i:%s') as created
    , p.title, p.description, p.keywords
    FROM purposes AS p
    WHERE p.id = ? 
    AND p.status < 2
    `; // suspended account status = 2
  values[0] = [id];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  // return db.selectFromDb(queries);
  return db.mergeIntoDb(queries);
};

/**
 * Get account (for log in)
 * @param {*} param0
 */
const getShareholderById = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  id = null,
}) => {
  let name = [];
  let sql = [];
  let values = [];

  name[0] = "SELECT shares";
  sql[0] = `
    SELECT s.purpose_id, s.shareholder_id, u.firstname, u.lastname, u.email, s.title, s.description, s.roles, s.share, s.status, DATE_FORMAT(s.created, '%Y-%m-%d %H:%i:%s') as created
    FROM shares as s
    INNER JOIN users as u ON u.uid = s.shareholder_id
    WHERE s.id = ?  
    AND s.status < 2
    AND u.status < 2
    `; // suspended account status = 2
  values[0] = [id];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  return db.mergeIntoDb(queries);
};

/**
 * Get currency by id
 * @param {*} param0
 */
const getCurrencyById = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  id = null,
}) => {
  let name = [];
  let sql = [];
  let values = [];

  name[0] = "SELECT currencies";
  sql[0] = `
    SELECT c.name, c.abbr, c.rate, c.region, c.status, DATE_FORMAT(c.created, '%Y-%m-%d %H:%i:%s') as created, COUNT(cs.abbr) AS sponsors
    FROM currencies as c
    LEFT JOIN currency_sponsors as cs ON cs.abbr = c.abbr
    WHERE c.id = ?  
    AND c.status < 2
    GROUP BY c.abbr
    `; // suspended account status = 2
  values[0] = [id];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  // return db.selectFromDb(queries);
  return db.mergeIntoDb(queries);
};

/**
 * Get transaction by id
 * @param {*} param0
 */
const getTransactionById = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  id = null,
  language = null,
}) => {
  let name = [];
  let sql = [];
  let values = [];

  // SELECT (tp.amount * t.exchange_rate) as conv_amount, tp.to_account, tp.roles, tp.share, tp.share_per_cent,
  // t.type, t.currency, t.exchange_rate, t.sender_id, t.purpose_id, t.comment, DATE_FORMAT(t.created, '%Y-%m-%d %H:%i:%s') as created,
  // u.firstname, u.lastname, u.status AS sender_status,
  // pp.title AS purpose_title, pp.description AS purpose_description, pp.link AS purpose_link, pp.image AS purpose_image, p.status AS purpose_status,
  // b.business_id, b.title AS business_title, b.description AS business_description, b.link AS business_link, b.image AS business_image, b.status AS business_status
  // FROM transaction_positions AS tp
  // LEFT JOIN transactions AS t ON t.transaction_id = tp.transaction_id
  // LEFT JOIN users AS u ON u.uid = t.sender_id
  // LEFT JOIN purposes as p ON p.purpose_id = t.purpose_id
  // LEFT JOIN purpose_props AS pp ON pp.purpose_id = p.purpose_id
  // LEFT JOIN businesses as b ON b.business_id = p.business_id
  // WHERE tp.id = ?
  // AND pp.language = ?

  name[0] = "SELECT transaction_positions";
  sql[0] = `
    SELECT (tp.amount * t.exchange_rate) as conv_amount, tp.to_account, tp.roles, tp.share, tp.share_per_cent,
    t.type, t.currency, t.exchange_rate, t.sender_id, t.purpose_id, t.comment, DATE_FORMAT(t.created, '%Y-%m-%d %H:%i:%s') as created,
    u.firstname, u.lastname, u.status AS sender_status,
    p.title AS purpose_title, p.description AS purpose_description, p.status AS purpose_status,
    b.business_id, b.title AS business_title, b.description AS business_description, b.link AS business_link, b.image AS business_image, b.status AS business_status
    FROM transaction_positions AS tp 
    LEFT JOIN transactions AS t ON t.transaction_id = tp.transaction_id
    LEFT JOIN users AS u ON u.uid = t.sender_id
    LEFT JOIN purposes as p ON p.purpose_id = t.purpose_id
    LEFT JOIN businesses as b ON b.business_id = p.business_id
    WHERE tp.id = ?
    `; // suspended account status = 2
  values[0] = [id];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  return db.mergeIntoDb(queries);
};

const transferU2S = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  uid = null,
  sender_id = null,
  fromAccount = null,
  toAccount = null,
  amount = null,
  reviser = null,
  workplace = null,
}) => {
  if (amount <= 0) {
    onError({
      req: req,
      reqData: reqData,
      session: session,
      error: { code: "INVALID_AMOUNT" },
      context: ["db.js", "transferU2S", "amount <= 0"],
    });
    return;
  }
  // let name = []; // query name
  // let sql = [];
  // let values = [];

  let { name, sql, values, index } = validateSession({ session });

  index++;
  name[index] = "UPDATE users";
  sql[index] = `
    UPDATE users
    SET ${fromAccount} = ${fromAccount} - ?,
    ${toAccount} = ${toAccount} + ?,
    reviser = ?,
    workplace = ?
    WHERE uid = ?
    AND ${fromAccount} - ? >= 0
    `;
  values[index] = [amount, amount, reviser, workplace, sender_id, amount];

  index++;
  name[index] = "INSERT INTO transactions";
  sql[index] = `
  INSERT INTO transactions (type, amount, currency, exchange_rate, sender_id, created, reviser, workplace)
  VALUES (?, ?, 'Z', 1.0, ?, UTC_TIMESTAMP(), 'SYSTEM', 'SYSTEM')`;
  values[index] = [req, amount, sender_id];

  index++;
  name[index] = "INSERT INTO transaction_positions";
  sql[index] = `
  INSERT INTO transaction_positions (transaction_id, amount, recipient_id, from_account, to_account, created, reviser, workplace)
  VALUES ('[INSERT_ID]', ?, ?, ?, ?, UTC_TIMESTAMP(), 'SYSTEM', 'SYSTEM')`;
  values[index] = [amount, sender_id, fromAccount, toAccount];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // user
      uid: uid,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  queries = pushQueries(queries, name, sql, values, index);

  return db.mergeIntoDb(queries);
};

const genTAN = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
};

const processTAN = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  email = null,
  tan = null,
  status = null,
  reviser = null,
  workplace = null,
}) => {
  let name = []; // query name
  let sql = [];
  let values = [];

  name[0] = "UPDATE tans";
  sql[0] = `
    UPDATE tans
    SET status = ?
    WHERE type = 'email'
    AND email = ? 
    AND tan = ? 
    AND expiration >= UTC_TIMESTAMP()
    `;
  values[0] = [1, email, tan]; // status 1 = validated

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // user
      // email: email,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  return db.mergeIntoDb(queries);
};

const getTAN = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  email = null,
  language = null,
  status = null,
  reviser = null,
  workplace = null,
}) => {
  let name = []; // query name
  let sql = [];
  let values = [];

  const tan = genTAN(100000, 999999).toString(); // crypto.randomBytes(64).toString("base64");
  name[0] = "INSERT INTO tans";
  sql[0] = `
  INSERT INTO tans (type, email, tan, expiration, status, created, reviser, workplace)
  VALUES ('email', ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 15 MINUTE), ?, UTC_TIMESTAMP(), ?, ?)
  ON DUPLICATE KEY UPDATE
  tan = COALESCE(?, tan)
  , expiration = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 15 MINUTE)
  , status = COALESCE(?, status)
  , reviser = COALESCE(?, reviser)
  , workplace = COALESCE(?, workplace)
  `;
  values[0] = [
    /* Insert values */
    email,
    tan,
    0, // status
    reviser,
    workplace,
    /* Update values */
    tan,
    0, // status
    reviser,
    workplace,
  ];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // user
      email: email,
      tags: { token: tan, email: email, language: language },

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  return db.mergeIntoDb(queries);
};

const saveCart = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  type = "default",
  cartid = null,
  content = null,
  merchant = null,
  customer = null,
  status = null,
  reviser = null,
  workplace = null,
}) => {
  let name = []; // query name
  let sql = [];
  let values = [];

  name[0] = "INSERT INTO carts";
  sql[0] = `
  INSERT INTO carts (type, cartid, content, expiration, merchant, status, created, reviser, workplace)
  VALUES (?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 6 HOUR), ?, ?, UTC_TIMESTAMP(), ?, ?)
  ON DUPLICATE KEY UPDATE
  customer = COALESCE(?, customer)
  , status = COALESCE(?, status)
  , reviser = COALESCE(?, reviser)
  , workplace = COALESCE(?, workplace)
  `;
  values[0] = [
    /* Insert values */
    type,
    cartid,
    content,
    merchant,
    0, // status
    reviser,
    workplace,
    /* Update values */
    customer,
    status, // status
    reviser,
    workplace,
  ];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      //// user
      // email: email,
      // tags: { token: tan, email: email, language: language },

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  return db.mergeIntoDb(queries);
};

/**
 * Get cart
 * @param {*} param0
 */
const getCart = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  customer = null,
  cart = null,
}) => {
  let name = [];
  let sql = [];
  let values = [];

  name[0] = "SELECT carts";
  sql[0] = `
    SELECT type, cartid, content
    FROM carts
    WHERE cartid = ?  
    AND expiration >= UTC_TIMESTAMP()
    AND status = 0
    `; // suspended account status = 2
  values[0] = [cart];

  name[1] = "UPDATE carts";
  sql[1] = `
    UPDATE carts
    SET customer = ?
    WHERE cartid = ?  
    `; // suspended account status = 2
  values[1] = [customer, cart];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },

    {
      // query
      name: name[1],
      sql: sql[1],
      values: values[1],
    },
  ];

  // return db.selectFromDb(queries);
  return db.mergeIntoDb(queries);
};

const transferU2U = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  uid = null,
  sender_id = null,
  fromAccount = null,
  toAccount = "acc_curr",
  recipient_id = null,
  amount = null,
  description = null,
  reviser = null,
  workplace = null,
}) => {
  if (amount <= 0) {
    onError({
      req: req,
      reqData: reqData,
      session: session,
      error: { code: "INVALID_AMOUNT" },
      context: ["db.js", "transferU2U", "amount <= 0"],
    });
    return;
  }
  // let name = []; // query name
  // let sql = [];
  // let values = [];

  let { name, sql, values, index } = validateSession({ session });

  index++;
  name[index] = "UPDATE sender";
  sql[index] = `
    UPDATE users
    SET ${fromAccount} = ${fromAccount} - ?,
    reviser = ?,
    workplace = ?
    WHERE uid = ?
    AND ${fromAccount} - ? >= 0
    `;
  values[index] = [amount, reviser, workplace, sender_id, amount];

  /**
   * Initialy user accounts are limited to Z 2000;
   * Every day this limit is increased by Z 48
   * until a total limit of Z 24,000 is reached.
   */
  index++;
  name[index] = "UPDATE recipient";
  sql[index] = `
  UPDATE users
  SET ${toAccount} = ${toAccount} + ?,
  reviser = ?,
  workplace = ?
  WHERE uid = ?
  AND acc_curr + acc_cred + acc_save + ? <= 2000 + DATEDIFF(UTC_TIMESTAMP(), created) * 48
  AND acc_curr + acc_cred + acc_save + ? <= 24000
  `;
  values[index] = [amount, reviser, workplace, recipient_id, amount, amount];

  index++;
  name[index] = "INSERT INTO transactions";
  sql[index] = `
  INSERT INTO transactions (type, amount, currency, exchange_rate, sender_id, comment, created, reviser, workplace)
  VALUES (?, ?, 'Z', 1.0, ?, ?, UTC_TIMESTAMP(), 'SYSTEM', 'SYSTEM')`;
  values[index] = [req, amount, sender_id, description];

  index++;
  name[index] = "INSERT INTO transaction_positions";
  sql[index] = `
  INSERT INTO transaction_positions (transaction_id, amount, recipient_id, from_account, to_account, created, reviser, workplace)
  VALUES ('[INSERT_ID]', ?, ?, ?, ?, UTC_TIMESTAMP(), 'SYSTEM', 'SYSTEM')`;
  values[index] = [amount, recipient_id, fromAccount, toAccount];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // user
      uid: uid,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  queries = pushQueries(queries, name, sql, values, index);

  return db.mergeIntoDb(queries);
};

const transferU2B = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user args
  uid = null,
  sender_id = null,
  fromAccount = null,
  toAccount = "acc_curr",
  purpose_id = null,
  currency = "Z",
  amount = null,
  description = null,
  reviser = null,
  workplace = null,
}) => {
  if (amount <= 0) {
    onError({
      req: req,
      reqData: reqData,
      session: session,
      error: { code: "INVALID_AMOUNT" },
      context: ["db.js", "transferU2B", "amount <= 0"],
    });
    return;
  }

  // let name = []; // query name
  // let sql = [];
  // let values = [];

  let { name, sql, values, index } = validateSession({ session });

  index++;
  name[index] = "UPDATE sender";
  sql[index] = `
    UPDATE users
    SET ${fromAccount} = ${fromAccount} - ?,
    reviser = ?,
    workplace = ?
    WHERE uid = ?
    `;
  values[index] = [amount, reviser, workplace, sender_id];

  index++;
  name[index] = "UPDATE shareholders";
  sql[index] = `
  UPDATE users AS u
  LEFT JOIN shares AS s1 ON s1.shareholder_id = u.uid
  LEFT JOIN purposes AS p ON p.purpose_id = s1.purpose_id
  SET u.${toAccount} = u.${toAccount} + ROUND(? / 
    (
      SELECT SUM(s2.share) 
      FROM shares AS s2 
      WHERE s2.purpose_id = s1.purpose_id
    ) * s1.share, 5),
  u.reviser = ?,
  u.workplace = ?
  WHERE p.purpose_id = ?
  `;
  values[index] = [amount, reviser, workplace, purpose_id];

  index++;
  name[index] = "INSERT INTO transactions";
  sql[index] = `
  INSERT INTO transactions (type, amount, currency, exchange_rate, sender_id, purpose_id, comment, created, reviser, workplace)
  VALUES (?, ?, ?, (SELECT rate FROM currencies WHERE abbr = ?), ?, ?, ?, UTC_TIMESTAMP(), 'SYSTEM', 'SYSTEM')`;
  values[index] = [
    req,
    amount,
    currency,
    currency,
    sender_id,
    purpose_id,
    description,
  ];

  index++;
  name[index] = "INSERT INTO transaction_positions";
  sql[index] = `
  INSERT INTO transaction_positions (transaction_id, amount, recipient_id, roles, share, share_per_cent, from_account, to_account, created, reviser, workplace)
  SELECT '[INSERT_ID]', 
  (
    ? / 
    (
      SELECT SUM(s2.share) 
      FROM shares AS s2 WHERE 
      s2.purpose_id = s1.purpose_id
    ) * s1.share
  ) AS amount,
  s1.shareholder_id, s1.roles, s1.share,
  (
    100 / 
    (
      SELECT SUM(s3.share) 
      FROM shares AS s3 WHERE 
      s3.purpose_id = s1.purpose_id
    ) * s1.share
  ) AS share_per_cent,
  '${fromAccount}', '${toAccount}', UTC_TIMESTAMP(), 'SYSTEM', 'SYSTEM'
  FROM shares AS s1
  LEFT JOIN purposes AS p ON p.purpose_id = s1.purpose_id
  LEFT JOIN users AS u ON u.uid = s1.shareholder_id
  WHERE s1.purpose_id = ?
  `;
  values[index] = [amount, purpose_id];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // user
      uid: uid,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  queries = pushQueries(queries, name, sql, values, index);

  return db.mergeIntoDb(queries);
};

/**
 * Transfer the allowance
 * @param {*} param0
 */
const transferV2U = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  // uid = null,
  fromAccount = "vault",
  toAccount = "acc_save",
  recipient_id = null,
  // token = null,
  amount = 48,
  description = "allowance",
  reviser = "VAULT",
  workplace = "SYSTEM",
}) => {
  if (amount <= 0) {
    onError({
      req: req,
      reqData: reqData,
      session: session,
      error: { code: "INVALID_AMOUNT" },
      context: ["db.js", "transferV2U", "amount <= 0"],
    });
    return;
  }

  // let name = []; // query name
  // let sql = [];
  // let values = [];

  let { name, sql, values, index } = validateSession({ session });

  index++;
  name[index] = "UPDATE vault";
  sql[index] = `
    UPDATE vault
    SET acc = acc - ?,
    reviser = ?,
    workplace = ?
    AND acc - ? >= 0
    `;
  values[index] = [amount, reviser, workplace, amount];

  index++;
  name[index] = "UPDATE recipient";
  sql[index] = `
  UPDATE users AS u
  INNER JOIN sessions AS s ON s.email = u.email 
  AND s.token = ?
  SET u.${toAccount} = u.${toAccount} + ?,
  u.allowance_date = DATE(UTC_TIMESTAMP()),
  u.reviser = ?,
  u.workplace = ?
  WHERE u.uid = ?
  AND (u.allowance_date < DATE(UTC_TIMESTAMP()) OR u.allowance_date IS null)
  `;
  values[index] = [session, amount, reviser, workplace, recipient_id];

  index++;
  name[index] = "INSERT INTO transactions";
  sql[index] = `
  INSERT INTO transactions (type, amount, currency, exchange_rate, comment, created, reviser, workplace)
  VALUES (?, ?, 'Z', 1.0, ?, UTC_TIMESTAMP(), ?, ?)`;
  values[index] = [req, amount, description, reviser, workplace];

  index++;
  name[index] = "INSERT INTO transaction_positions";
  sql[index] = `
  INSERT INTO transaction_positions (transaction_id, amount, recipient_id, from_account, to_account, created, reviser, workplace)
  VALUES ('[INSERT_ID]', ?, ?, ?, ?, UTC_TIMESTAMP(), ?, ?)`;
  values[index] = [
    amount,
    recipient_id,
    fromAccount,
    toAccount,
    reviser,
    workplace,
  ];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // user
      // uid: uid,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  queries = pushQueries(queries, name, sql, values, index);

  return db.mergeIntoDb(queries);
};

// const transferP2B = ({
//   // system
//   req = null,
//   reqData = null,
//   session = null,
//   onStatusChange = () => {},
//   onError = () => {},

//   // user
//   pool_id = null,
//   recipient_id = null,
//   purpose_id = null,
//   amount = null,
//   reviser = null,
//   workplace = null,
// }) => {
//   if (amount <= 0) {
//     onError({
//       req: req,
//       reqData: reqData,
//       session: session,
//       error: { code: "INVALID_AMOUNT" },
//       context: ["db.js", "transferP2B", "amount <= 0"],
//     });
//     return;
//   }
//   let name = [];
//   let sql = [];
//   let values = [];

//   name[0] = "UPDATE sender";
//   sql[0] = `
//     UPDATE users AS u
//     LEFT JOIN pool_users AS pu1 ON pu1.user_fid = u.id
//     LEFT JOIN pools AS p ON p.id = pu1.pool_fid
//     SET u.acc_curr = u.acc_curr - ? / (
//       SELECT acc_curr_sum FROM (
//         SELECT SUM(acc_curr) AS acc_curr_sum FROM users AS u2
//         LEFT OUTER JOIN pool_users AS pu2 ON pu2.user_fid = u2.id
//         LEFT JOIN pools AS p2 ON p2.id = pu2.pool_fid
//         WHERE p2.pool_id = ?
//       ) as temp
//     ) * u.acc_curr,
//     u.reviser = ?,
//     u.workplace = ?
//     WHERE p.pool_id = ?
//     `;
//   values[0] = [amount, pool_id, reviser, workplace, pool_id];

//   name[0] = "UPDATE recipient";
//   sql[1] = `
//   UPDATE users
//   LEFT JOIN shares AS s1 ON s1.user_fid = users.id
//   LEFT JOIN purposes ON purposes.id = s1.purpose_fid
//   SET users.acc_curr = users.acc_curr + ? / (SELECT SUM(s2.share) FROM shares AS s2 WHERE s2.purpose_fid = s1.purpose_fid) * s1.share,
//   users.reviser = ?,
//   users.workplace = ?
//   WHERE purposes.recipient_id = ?
//   AND purposes.purpose_id = ?
//   `;
//   values[1] = [amount, reviser, workplace, recipient_id, purpose_id];

//   let queries = [
//     {
//       // system
//       req: req,
//       reqData: reqData,
//       session: session,
//       onStatusChange: onStatusChange,
//       onError: onError,

//       // query
//       name: name[0],
//       sql: sql[0],
//       values: values[0],
//     },
//     {
//       // query
//       name: name[1],
//       sql: sql[1],
//       values: values[1],
//     },
//   ];

//   return db.mergeIntoDb(queries);
// };

// const mergePool = ({
//   title = null,
//   description = null,
//   status = null,
//   reviser = null,
//   workplace = null,
// }) => {
//   let sql = `
//     INSERT INTO pools (title, description, status, created, reviser, workplace)
//     VALUES (?, ?, ?, UTC_TIMESTAMP(), ?, ?)
//     ON DUPLICATE KEY UPDATE
//     title = COALESCE(?, title)
//     , description = COALESCE(?, description)
//     , status = COALESCE(?, status)`;
//   let values = [
//     title,
//     description,
//     status,
//     reviser,
//     workplace,
//     title,
//     description,
//     status,
//   ];
//   let queries = [{ sql: sql, values: values }];

//   return db.mergeIntoDb(queries);
// };

const changePurposeStatus = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  purpose_id = null,
  status = 0,
  reviser = null,
  workplace = null,
}) => {
  let name = [];
  let sql = [];
  let values = [];

  name[0] = "UPDATE purposes";
  sql[0] = `
  UPDATE purposes
  SET status = ?
  WHERE purpose_id = ?
  `;

  values[0] = [
    // update vars
    status,
    purpose_id,
  ];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // user
      // email: null,
      // uid: uid,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  return db.mergeIntoDb(queries);
};

const updatePurposeProps = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  purpose_id = null,
  language = null,
  title = null,
  description = null,
  category = null,
  subcategory = null,
  subcategory2 = null,
  keywords = null,
  link = null,
  image = null,
  status = 0,
  reviser = null,
  workplace = null,
}) => {
  // let name = [];
  // let sql = [];
  // let values = [];

  let { name, sql, values, index } = validateSession({ session });

  // INSERT INTO purpose_props (purpose_id, language, title, description, category, subcategory, subcategory2, keywords, link, image, status, created, reviser, workplace)
  // VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), ?, ?)
  // ON DUPLICATE KEY UPDATE
  // title = COALESCE(?, title)
  // , description = COALESCE(?, description)
  // , category = COALESCE(?, category)
  // , subcategory = COALESCE(?, subcategory)
  // , subcategory2 = COALESCE(?, subcategory2)
  // , keywords = COALESCE(?, keywords)
  // , link = COALESCE(?, link)
  // , image = COALESCE(?, image)
  // , status = COALESCE(?, status)
  // , reviser = COALESCE(?, reviser)
  // , workplace = COALESCE(?, workplace)

  index++;
  name[index] = "MERGE purpose_props";
  sql[index] = `
  UPDATE purposes SET
  title = COALESCE(?, title), 
  description = COALESCE(?, description), 
  keywords = COALESCE(?, keywords), 
  status = status = COALESCE(?, status),
  reviser = COALESCE(?, reviser), 
  workplace = COALESCE(?, workplace)
  WHERE purpose_id = ?
  `;
  values[index] = [
    // update vars
    title,
    description,
    keywords,
    status,
    reviser,
    workplace,
    purpose_id,
  ];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // user

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  queries = pushQueries(queries, name, sql, values, index);

  return db.mergeIntoDb(queries);
};

const addPurpose = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  uid = null,
  language = null,
  business_id = null,
  purpose_id = null,
  title = null,
  description = null,
  category = null,
  subcategory = null,
  subcategory2 = null,
  keywords = null,
  link = null,
  image = null,
  status = 0,
  reviser = null,
  workplace = null,
}) => {
  // let name = [];
  // let sql = [];
  // let values = [];

  let { name, sql, values, index } = validateSession({ session });

  index++;
  name[index] = "INSERT INTO purposes";
  sql[index] = `
  INSERT INTO purposes (business_id, purpose_id, title, description, keywords, status, created, reviser, workplace)
  VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), ?, ?)
  `;
  values[index] = [
    // insert vars
    business_id,
    purpose_id,
    title,
    description,
    keywords,
    status, // status,
    reviser,
    workplace,
  ];

  // index++;
  // name[index] = "INSERT INTO purpose_props";
  // sql[index] = `
  // INSERT INTO purpose_props (purpose_id, language, title, description, category, subcategory, subcategory2, keywords, link, image, status, created, reviser, workplace)
  // VALUES ( (SELECT purpose_id FROM purposes WHERE id = [INSERT_ID]), ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, UTC_TIMESTAMP(), ?, ?)
  // `;
  // values[index] = [
  //   /* Insert values */
  //   language,
  //   title,
  //   description,
  //   category,
  //   subcategory,
  //   subcategory2,
  //   keywords,
  //   link,
  //   image,
  //   reviser,
  //   workplace,
  // ];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // user
      email: null,
      uid: uid,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  queries = pushQueries(queries, name, sql, values, index);

  return db.mergeIntoDb(queries);
};

const mergeShareholder = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  uid = null,
  purpose_id = null,
  shareholder_id = null,
  roles = null,
  share = null,
  title = null,
  description = null,
  status = 0,
  reviser = null,
  workplace = null,
}) => {
  // let name = [];
  // let sql = [];
  // let values = [];

  let { name, sql, values, index } = validateSession({ session });

  index++;
  name[index] = "INSERT INTO shares";
  sql[index] = `
  INSERT INTO shares (purpose_id, shareholder_id, title, description, roles, share, status, created, reviser, workplace)
  VALUES (?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), ?, ?)
  ON DUPLICATE KEY UPDATE 
  title = COALESCE(?, title)
  , description = COALESCE(?, description)
  , roles = COALESCE(?, roles)
  , share = COALESCE(?, share)
  , status = COALESCE(?, status)
  , reviser = COALESCE(?, reviser)
  , workplace = COALESCE(?, workplace)`;
  values[index] = [
    // insert vars
    purpose_id,
    shareholder_id,
    title,
    description,
    roles,
    share,
    status,
    reviser,
    workplace,
    // update vars
    title,
    description,
    roles,
    share,
    status,
    reviser,
    workplace,
  ];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // user
      email: null,
      uid: uid,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  queries = pushQueries(queries, name, sql, values, index);

  return db.mergeIntoDb(queries);
};

const saveMessage = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  sender = null,
  language = null,
  subject = null,
  message = null,
  reviser = null,
  workplace = null,
}) => {
  let name = [];
  let sql = [];
  let values = [];

  name[0] = "INSERT INTO contact";
  sql[0] = `
  INSERT INTO contact (sender, subject, message, language, created, reviser, workplace )
  VALUES (?, ?, ?, ?, UTC_TIMESTAMP(), ?, ?)
  `;

  values[0] = [
    // insert vars
    sender,
    subject,
    message,
    language,
    reviser,
    workplace,
  ];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  return db.mergeIntoDb(queries);
};

const removeShareholder = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  uid = null,
  purpose_id = null,
  shareholder_id = null,
  reviser = null,
  workplace = null,
}) => {
  let name = [];
  let sql = [];
  let values = [];

  name[0] = "UPDATE shares";
  sql[0] = `
  UPDATE shares
  SET share = ?
  , status = ?
  WHERE purpose_id = ? AND shareholder_id = ?
  `;

  values[0] = [
    // insert vars
    0,
    2,
    purpose_id,
    shareholder_id,
  ];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],

      // user
      uid: uid,
      email: null,
    },
  ];

  return db.mergeIntoDb(queries);
};

// const mergePoolUsers = (data) => {
//   let sql;
//   let values;
//   let queries = [];

//   sql = `
//   DELETE FROM pool_users
//   WHERE pool_fid = ?`;
//   values = [data[0].pool_fid];

//   queries.push({ sql: sql, values: values });

//   let sql_temp = `
//   INSERT INTO pool_users (title, description, pool_fid, user_fid, status, created, reviser, workplace)
//   VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP(), ?, ?)
//   ON DUPLICATE KEY UPDATE
//   title = COALESCE(?, title),
//   description = COALESCE(?, description),
//   status = COALESCE(?, status)`;
//   for (let n = 0; n < data.length; n++) {
//     sql = sql_temp;
//     values = [
//       data[n].title,
//       data[n].description,
//       data[n].pool_fid,
//       data[n].user_fid,
//       data[n].status,
//       data[n].reviser,
//       data[n].workplace,
//       data[n].title,
//       data[n].description,
//       data[n].status,
//     ];
//     queries.push({ sql: sql, values: values });
//   }

//   return db.mergeIntoDb(queries, dbTypes.dbMergeFlags.ALLOW_UNCHANGED_ROWS);
// };

// const mergeShares = (data) => {
//   let sql_temp = `
//   INSERT INTO shares (title, description, purpose_fid, user_fid, share, reviser, workplace)
//   VALUES (?, ?, ?, ?, ?, ?, ?)
//   ON DUPLICATE KEY UPDATE
//   share = COALESCE(?, share)`;
//   let sql = [];
//   let values = [];
//   let queries = [];
//   for (let n = 0; n < data.length; n++) {
//     sql[n] = sql_temp;
//     values[n] = [
//       data[n].title,
//       data[n].description,
//       data[n].purpose_fid,
//       data[n].user_fid,
//       data[n].share,
//       data[n].reviser,
//       data[n].workplace,
//       data[n].share,
//     ];
//     queries.push({ sql: sql[n], values: values[n] });
//   }

//   return db.mergeIntoDb(queries);
// };

const unknownRequest = ({
  // system
  req = null,
  reqData = null,
  session = null,
  onStatusChange = () => {},
  onError = () => {},

  // user
  uid = null,
}) => {
  let name = [];
  let sql = [];
  let values = [];

  name[0] = "SELECT unknown request";
  sql[0] = `SELECT 'unknown request' AS error`;
  values[0] = [];

  let queries = [
    {
      // system
      req: req,
      reqData: reqData,
      session: session,
      onStatusChange: onStatusChange,
      onError: onError,

      // user
      uid: uid,

      // query
      name: name[0],
      sql: sql[0],
      values: values[0],
    },
  ];

  // return db.selectFromDb(queries);
  return db.mergeIntoDb(queries);
};

// Event handler: Error
eventEmitter.on("error", function (err) {
  console.log("Error: " + err.code);
});

module.exports = {
  // setSocket: setSocket,
  // addCurrency: addCurrency,
  getSequence,
  mergeUser,
  endSession,
  mergeSession,
  mergeBusiness,
  mergeCurrency,
  // emitCurrency,
  getTAN,
  processTAN,
  saveCart,
  getCart,
  transferU2S,
  transferU2U,
  transferU2B,
  transferV2U,
  // transferP2B,
  // initUser,
  getUriSettings,
  signInUser,
  // lastSeenUser,
  resetPassword,
  getUser,
  uploadFile,
  getAccount,
  getValidateSession,
  getBusiness,
  getBusinessById,
  getCartPurposes,
  getPurpose,
  getPurposeById,
  getShare,
  getShareholderById,
  getCurrencyById,
  getTransactionById,
  getCurrencies,
  // findCurrencies,
  getTransactions,
  // findTransactions,
  getShares,
  updatePurposeProps,
  addPurpose,
  changePurposeStatus,
  mergeShareholder,
  removeShareholder,
  saveMessage,
  //  mergeShares,
  //  mergePool,
  //  mergePoolUsers,
  mergeUserLanguage,
  mergeUserCurrency,
  validateEmailToken,
  resendValidateEmailToken,
  validatePasswordResetToken,
  unknownRequest,
};
