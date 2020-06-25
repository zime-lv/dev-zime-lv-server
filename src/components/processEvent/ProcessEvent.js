"use strict";
const email = require("../email/email");
const session = require("../../utils/session");

const process = (args) => {
  let type = args.type;

  switch (type) {
    case "userRequest":
      /**
       * Add user access token
       */
      if (args.req === "sign in user" && args.status === "success") {
        return session.saveToken(args.tags.email, args);
      }

      if (args.name === "VALIDATE SESSION" && args.status === "continue") {
        return session.validateToken(args);
      }

      /**
       * Send email validation request to new registerd users
       */
      if (
        (args.req === "register user" ||
          args.req === "update user" ||
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
        // return session.validateToken(args);
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
