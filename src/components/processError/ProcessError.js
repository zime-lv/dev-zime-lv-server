const process = (args) => {
  let type = args.type;
  console.log("PROCESS TYPE: ", type);

  switch (type) {
    case "userRequest":
      return processUserRequest(args);
      break;

    default:
      break;
  }
  return false;
};

const processUserRequest = (args) => {
  // Modify response here:
  args.status = "error";
  //   if (
  //     args.type === "userRequest" &&
  //     args.req === "register user" &&
  //     args.error.code === "NO_ROWS_CHANGED"
  //   ) {
  //     args.error = "registration error";
  //   }
  return args;
};

module.exports = {
  process: process,
};
