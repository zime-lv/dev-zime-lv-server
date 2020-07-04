const mysql = require("mysql");
// const events = require("events");
const dbTypes = require("./db_types");
const config = require("../../utils/config");

let pool = null;

/**
 * Start DB connection
 */
const startDbConnection = () => {
  if (pool !== null) return;

  pool = mysql.createPool({
    connectionLimit: 1000,
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
  });

  pool.on("acquire", function (connection) {
    console.log("Connection %d acquired", connection.threadId);
  });

  pool.on("connection", function (connection) {
    // connection.query('SET SESSION auto_increment_increment=1')
  });

  pool.on("enqueue", function () {
    console.log("Waiting for available connection slot");
  });

  pool.on("release", function (connection) {
    console.log("Connection %d released", connection.threadId);
  });
};

const mergeIntoDb = (queries, flags = 2) => {
  startDbConnection();

  let req = queries[0].req;
  let reqData =
    typeof queries[0].reqData !== "undefined" ? queries[0].reqData : null;
  let session = queries[0].session;
  let email = queries[0].email;
  let tags = typeof queries[0].tags !== "undefined" ? queries[0].tags : null;
  let uid = queries[0].uid;
  let onStatusChange = queries[0].onStatusChange;
  let onError = queries[0].onError;

  pool.getConnection(function (err, connection) {
    if (err) {
      onError({
        req: req,
        reqData: reqData,
        session: session,
        error: err,
        context: ["db_model.js", "mergeIntoDb", "pool.getConnection"],
      }); // not connected!
      return;
    }

    // Use the connection
    connection.beginTransaction(function (err) {
      if (err) {
        onError({
          req: req,
          reqData: reqData,
          session: session,
          error: err,
          context: [
            "db_model.js",
            "mergeIntoDb",
            "connection.beginTransaction",
          ],
        });
        return;
      }

      let queryCnt = 0;

      let data = {
        queries,
        connection,
        onStatusChange,
        onError,
        req,
        reqData,
        session,
        email,
        tags,
        flags,
        queryCnt,
      };
      doQuery(data);
    });
  });
  onStatusChange({
    req: req,
    reqData: reqData,
    session: session,
    status: "pending",
  });
};

const doQuery = (data) => {
  let {
    queries,
    connection,
    // query,
    onStatusChange,
    onError,
    // name,
    req,
    reqData,
    session,
    email,
    tags,
    flags,
    queryCnt,
  } = data;

  if (typeof queries[queryCnt] === "undefined") {
    // we are finished
    connection.commit((err) => {
      if (err) {
        return connection.rollback(() => {
          onError({
            req: req,
            reqData: reqData,
            session: session,
            error: err,
            context: [
              "db_model.js",
              "mergeIntoDb",
              "INSERT INTO log",
              "connection.commit",
            ],
          });
        });
      }
      onStatusChange({
        req: req,
        reqData: reqData,
        session: session,
        email: email,
        tags: tags,
        status: "success",
      });
      try {
        connection.release();
      } catch (error) {
        console.log("On connection release error:", error);
      }
    });
    return true;
  }

  const sql = queries[queryCnt].sql;
  const values = queries[queryCnt].values;
  const name =
    queries[queryCnt].name !== "undefined" ? queries[queryCnt].name : null;

  const query = connection.query(sql, values);

  query
    .on("error", (err) => {
      // Handle error, an 'end' event will be emitted after this as well
      return connection.rollback(function () {
        onError({
          name: name,
          req: req,
          reqData: reqData,
          session: session,
          error: err,
          context: ["db_model.js", "mergeIntoDb", "connection.query"],
        });
      });
    })
    .on("fields", (fields) => {
      // console.log("MERGE CONNECTION FIELDS:", fields);
      // the field packets for the rows to follow
    })
    .on("result", (results) => {
      console.log("MERGE CONNECTION RESULT:", results);

      if (
        !(flags & dbTypes.dbMergeFlags.ALLOW_UNCHANGED_ROWS) &&
        results.insertId === 0 &&
        results.changedRows === 0 &&
        results.affectedRows === 0
        // query.sql.indexOf("DELETE FROM") === -1
      ) {
        return connection.rollback(function () {
          onError({
            name: name,
            req: req,
            reqData: reqData,
            session: session,
            error: { code: "NO_ROWS_CHANGED" },
            context: ["db_model.js", "mergeIntoDb", "connection.rollback (1)"],
            query: query.sql,
          });
        });
      }

      // Pausing the connnection is useful if your processing involves I/O
      /// connection.pause();

      onStatusChange({
        name: name,
        req: req,
        reqData: reqData,
        session: session,
        email: email,
        tags: tags,
        queryCnt: queryCnt,
        results: results,
        status: "continue",
      });

      // Execute next query
      queryCnt++;
      data.queryCnt = queryCnt;
      if (typeof queries[queryCnt] !== "undefined") {
        queries[queryCnt].sql = queries[queryCnt].sql.replace(
          "[INSERT_ID]",
          results.insertId
        );
        data.queries = queries;
      }
      doQuery(data);
    })
    .on("end", () => {
      // all queries have been processed
      // connection.release();
      onStatusChange({
        name: name,
        req: req,
        reqData: reqData,
        session: session,
        email: email,
        tags: tags,
        queryCnt: queryCnt,
        status: "finished",
      });
    });
};

// const closeAllDbConnections = () => {
//   if (pool !== null) {
//     pool.end(function (err) {
//       console.log("all connections in the pool have ended");
//       pool = null;
//     });
//   }
// };

module.exports = {
  mergeIntoDb: mergeIntoDb,
  startDbConnection: startDbConnection,
};
