const utoken = require("../utils/utoken");
const db = require("../components/db/db");
const processError = require("../components/processError/ProcessError");

const deleteToken = (email) => {
  const token = { token: "", iv: "" };

  db.mergeSession({
    // system
    req: "renew session",
    session: token.token,
    reqData: null,
    onStatusChange: () => {},
    onError: () => {},

    // user
    email: email,
    token: token.token,
    iv: token.iv,
  });

  return token.token;
};

const saveToken = (email, args = {}) => {
  if (email === null) return false;

  const token = utoken.create(email);
  args.token = token.token;

  db.mergeSession({
    // system
    req: "save session",
    session: token.token,
    reqData: null,
    onStatusChange: () => {},
    onError: () => {},

    // user
    email: email,
    token: token.token,
    iv: token.iv,
  });

  //   console.log("AFTER MERGE");
  return args;
};

const validateToken = (args) => {
  const token = args.results.token;
  const iv = args.results.iv;
  const email = args.results.email;

  const { status: valid, renew } = utoken.validate(token, iv, email); // "abc" | email
  console.log("ADARGSTIXVIX", valid, renew);

  //   delete args.results.token;
  delete args.results.iv;
  //   delete args.results.email;

  // delete args.results;

  if (valid) {
    // const newToken = renewToken(email, args);
    // args.newToken = newToken;

    if (renew) {
      args = saveToken(email, args);
    } else {
      // args.token = token;
    }

    return args;
  } else {
    // args = {};
    delete args.results;
    delete args.reqData;

    args.type = "userRequest";
    args.error = { code: "INVALID_SESSION" };
    args.socketAction = { closeSocket: token };
    args.context = ["ProcessEvent.js", "process", "utoken.validate failed"];
    return processError.process(args);
  }
};

module.exports = {
  saveToken: saveToken,
  validateToken: validateToken,
};
