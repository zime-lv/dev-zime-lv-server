"use strict";
const email = require("../email/email");
const utoken = require("../../utils/utoken");
const db = require("../db/db");
const processError = require("../processError/ProcessError");

const process = (args) => {
  let type = args.type;

  switch (type) {
    case "userRequest":
      /**
       * Add user access token
       */
      if (
        (args.req === "sign in user" || args.req === "update last seen user") &&
        args.status === "success"
      ) {
        if (args.tags.email !== null) {
          const token = utoken.create(args.tags.email);
          args.token = token.token;
          // store the utoken & email for future reference
          db.mergeSession({
            // system
            req: "save session",
            session: token.token,
            reqData: null,
            onStatusChange: () => {},
            onError: () => {},

            // user
            email: args.tags.email,
            token: token.token,
            iv: token.iv,
          });
          return args;
        }
        return false;
      }

      /**
       * Send email validation request to new registerd users
       */
      if (
        (args.req === "register user" ||
          args.req === "resend validate email token") &&
        args.status === "success"
      ) {
        if (args.tags.token !== null) {
          email.send(args).catch(console.error);
          return args;
        }
        return false;
      }

      /**
       * Send email validation request to new registerd users
       */
      if (args.req === "get account data" && args.status === "continue") {
        const token = args.results.token;
        const iv = args.results.iv;
        const email = args.results.email;

        const valid = utoken.validate(token, iv, email); // "abc" | email
        // console.log("ADARGSTIXV", valid);

        delete args.results.token;
        delete args.results.iv;

        // onError({
        //   req: req,
        //   reqData: reqData,
        //   session: session,
        //   error: { code: "INVALID_AMOUNT" },
        //   context: ["db.js", "transferU2S", "amount <= 0"],
        // });

        if (valid) {
          return args;
        } else {
          // console.log("asdgdgshja", args);
          // return args;

          // args = {};
          delete args.results;
          delete args.reqData;

          args.type = "userRequest";
          args.error = { code: "INVALID_SESSION" };
          args.socketAction = { closeSocket: token };
          args.context = [
            "ProcessEvent.js",
            "process",
            "utoken.validate failed",
          ];
          const res = processError.process(args);

          // const res = processError.process(args);
          // console.log("ADARGSTIXVERR", res);
          // return false;

          return res;
          // return { invalidateSession: token };
        }
      }

      if (args.req === "get tan" && args.status === "success") {
        if (args.tags.token !== null) {
          email.send(args).catch(console.error);
          return args;
        }
        return false;
      }

      if (args.req === "reset password" && args.status === "success") {
        if (args.tags.token !== null) {
          email.send(args).catch(console.error);
          return args;
        }
        return false;
      }

      return processUserRequest(args);

    default:
      break;
  }
  return false;
};

const processUserRequest = (args) => {
  // Modify response here
  return args;
};

module.exports = {
  process: process,
};
