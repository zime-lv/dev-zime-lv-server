"use strict";
const email = require("../email/email");

const process = (args) => {
  let type = args.type;
  // console.log("PROCESS TYPE: ", type);

  switch (type) {
    case "userRequest":
      // console.log("PROCESS EVENT");

      // console.log(args);

      /**
       * Send email validation request to new registerd users
       */
      if (
        (args.req === "register user" ||
          args.req === "resend validate email token") &&
        args.status === "success"
      ) {
        if (args.tags.token !== null) {
          // console.log("SEND VALIDATION EMAIL to", args.email);
          email.send(args).catch(console.error);
        }
        // return true;
      }

      if (args.req === "get tan" && args.status === "success") {
        if (args.tags.token !== null) {
          email.send(args).catch(console.error);
        }
        // return true;
      }

      if (args.req === "reset password" && args.status === "success") {
        if (args.tags.token !== null) {
          // console.log("SEND VALIDATION EMAIL to", args.email);
          email.send(args).catch(console.error);
        }
        // return true;
      }

      // if (args.req === "init user" && args.status === "success") {
      //   const data = args;
      //   const userData = data.data;
      //   db.signInUser({
      //     // system
      //     req: data.req,
      //     session: data.session,
      //     reqData: userData,
      //     onStatusChange: onStatusChange,
      //     onError: onRequestError,

      //     // user
      //     email: userData.email,
      //     pw: userData.password,
      //   });
      //   // return true;
      // }

      return processUserRequest(args);
      break;

    default:
      break;
  }
  return false;
};

const processUserRequest = (args) => {
  return args;
  // Modify response here:
  // let status = args.status;
  // // console.log("PROCESS USER REQUEST: ", args);
  // switch (status) {
  //   case "pending":
  //   case "continue":
  //   case "success":
  //   case "ready":
  //     console.log("returning data: ", args);

  //     return args;
  //     break;

  //   default:
  //     break;
  // }
  // console.log("processUserRequest: ", data);
  // if (req === "register user" && data === "pending") {
  //   return data;
  // }
  return false;
};

module.exports = {
  process: process,
};
