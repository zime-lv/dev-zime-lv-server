const os = require("os");
const PRODUCTION_MODE = os.hostname() !== "Suranadira";

const express = require("express");
const app = express();
const server = require("http").Server(app); // NEVER use https here!!
const io = require("socket.io")(server, { serveClient: false });

const { v4: uuidv4 } = require("uuid");

const config = require("./src/utils/config");
const domain = config.uri.ENDPOINT;

io.setMaxListeners(0);

// const favicon = require("serve-favicon");
const path = require("path");
global.appRoot = path.resolve(__dirname);
// app.use(favicon(path.join(__dirname, "/public", "gfx", "favicon.ico")));

const processRequest = require("./src/components/processRequest/ProcessRequest");

server.listen(PRODUCTION_MODE ? 443 : 9000);

app.use(express.static(__dirname + "/_client"));

app.use(express.json()); // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies

const onProcessResult = (args) => {
  if (args !== false) {
    console.log("SENDING", args, "TO", args.session);

    io.in(args.session).emit("onDataReceived", args);
  }
};

const onExternalResult = (res, cartid) => {
  //
};

app.post("/ip", function (req, res) {
  // need access to IP address here
  const ip =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null);
  res.send({ ip: ip });
});

app.post("/auth", function (req, res) {
  // res.sendFile(path.join(__dirname, "/_client/index.html"), function (err) {
  //   if (err) {
  //     res.status(500).send(err);
  //   }
  // });
  // const business =
  //   typeof req.body.business !== "undefined" ? req.body.business : 0;
  const cartid = uuidv4();
  const merchant =
    typeof req.body.merchant !== "undefined" ? req.body.merchant : "";
  const content = typeof req.body.cart !== "undefined" ? req.body.cart : "";
  const reviser = "SYS";
  const workplace = "SYSTEM";
  const data = { cartid, content, merchant, reviser, workplace };

  processRequest.userRequest({
    data: { req: "save cart", session: null, data: data },
    onResult: () => onExternalResult(res, cartid),
  });

  res.redirect(`${domain}/auth?cart=${cartid}`);
});

// const cartid = uuidv4();
// const merchant = "B0012296910248021096";
// const content =
//   '[{"product":"P00100764234755200791149","price":10,"amount":2},{"product":"P00100325561170645732005","price":4.99,"amount":1}]';
// const reviser = "SYS";
// const workplace = "SYSTEM";
// const data = { cartid, content, merchant, reviser, workplace };

// processRequest.userRequest({
//   data: { req: "save cart", session: null, data: data },
//   onResult: () => {},
// });

// app.get("/*", function (req, res) {

app.get("/summary", function (req, res) {
  // const filePath = "./_client/index.html";
  const filePath = "./_client/index.html";
  const resolvedPath = path.resolve(filePath);
  console.log("resolvedPath:", resolvedPath);
  // res.sendFile(path.join(__dirname, "/_client/index.html"), function (err) {
  res.sendFile(resolvedPath, function (err) {
    if (err) {
      res.status(500).send(err);
    }
  });
});

// app.get("/*", function (req, res) {
app.get("*", function (req, res) {
  // const filePath = "./_client/index.html";
  const filePath = "./_client/index.html";
  const resolvedPath = path.resolve(filePath);
  console.log("resolvedPath:", resolvedPath);
  // res.sendFile(path.join(__dirname, "/_client/index.html"), function (err) {
  res.sendFile(resolvedPath, function (err) {
    if (err) {
      res.status(500).send(err);
    }
  });
});

// app.post("/*", function (req, res) {
//   res.sendFile(path.join(__dirname, "/_client/index.html"), function (err) {
//     if (err) {
//       res.status(500).send(err);
//     }
//   });
// });

const allClients = [];

// Handle client connection
io.on("connection", (socket) => {
  // console.log("SOCKET:", socket);
  allClients.push(socket);
  // console.log("CLIENTS:", allClients[0].adapter.rooms);

  // Emit on user starting the session
  socket.on("start session", function (data) {
    socket.join(data.session);
    data.status = "success";
    data.socketId = socket.id;
    data.reqData = data.data;
    io.in(data.session).emit("onDataReceived", data);
    console.log("Socket started the session", data.session);
    console.log("ROOMS:", allClients[0].adapter.rooms);
  });

  // Emit on user leaving the session
  socket.on("end session", function (data) {
    data.status = "success";
    data.reqData = data.data;
    io.in(data.session).emit("onDataReceived", data);
    socket.leave(data.session);
    console.log("Socket ended the session", data.session);
  });

  socket.on("disconnect", () => {
    console.log("Got disconnect!");

    const i = allClients.indexOf(socket);
    allClients.splice(i, 1);
  });

  // Broadcast on user sending message
  socket.on("onDataReceived", (data) => {
    processRequest.userRequest({
      data: data,
      onResult: onProcessResult,
    });
  });
});
