/**
 * System imports
 */
const fs = require("fs");
const FileType = require("file-type");
const { v4: uuidv4 } = require("uuid");

/**
 * User imports
 */
const db = require("../db/db");
const processError = require("../processError/ProcessError");
const processEvent = require("../processEvent/ProcessEvent");

let onResult = null;

const onStatusChange = (args) => {
  let res;

  args.type = "userRequest";
  res = processEvent.process(args);

  console.log("processEvent response: ", res);
  if (res !== false) {
    onResult(res);
  }
};

const onRequestError = (args) => {
  console.log("onError: ", args);
  args.type = "userRequest";
  res = processError.process(args);
  if (res !== false) {
    console.log("emit onDataReceived: ", res);
    onResult(res);
  }
};

const userRequest = (args) => {
  data = args.data;
  onResult = args.onResult;
  const userData = data.data;

  switch (data.req) {
    case "get account data":
      // db.transferV2U({
      //   // system
      //   req: "transfer V2U",
      //   session: data.session,
      //   reqData: userData,
      //   onStatusChange: onStatusChange,
      //   onError: onRequestError,

      //   // user
      //   recipient_id: userData.uid,
      // });

      // // TODO: consider using a promise here

      db.getAccount({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        uid: userData.uid,
        timeout: userData.timeout,
      });
      break;

    case "dispatch daily allowance":
      db.transferV2U({
        // system
        req: "transfer V2U",
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        recipient_id: userData.uid,
      });

      break;

    case "get transactions":
      db.getTransactions({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        uid: userData.uid,
        language: userData.language,
        page: userData.page - 1,
        limit: userData.limit,
      });
      break;

    case "get shares":
      db.getShares({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        uid: userData.uid,
        language: userData.language,
        page: userData.page - 1,
        limit: userData.limit,
      });
      break;

    /**
     * Sign in user
     */
    case "sign in user":
      db.initUser({
        // system
        req: "init user",
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        email: userData.email,
      });

      // TODO: Consider using promise here

      let settings = {
        currencies: null,
        // currency: "Z",
        currencyCreationAllowed: true,
        logo: "gfx/zlogo_light.png",
      };

      // const settings = require("./settings.json");
      userData.settings = settings;

      db.signInUser({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        email: userData.email,
        pw: userData.password,
        ip: userData.ip,
      });
      break;

    /**
     * Update last seen user
     */
    case "update last seen user":
      db.lastSeenUser({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        email: userData.email,
      });
      break;

    /**
     * Register user
     */
    case "register user":
      db.mergeUser({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        firstname: userData.firstName,
        lastname: userData.lastName,
        email: userData.email,
        pw: userData.password,
        language: userData.language,
        validateEmail: userData.validateEmail,
        reviser: userData.reviser,
        workplace: userData.workplace,
      });
      break;

    /**
     * Change password
     */
    case "change password":
      db.mergeUser({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        email: userData.email,
        pw: userData.password,
        reviser: userData.reviser,
        workplace: userData.workplace,
      });
      break;

    /**
     * Register account
     */
    case "get user sequence":
      db.getSequence({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        email: userData.email,
        birthdate: userData.birthDate,
        timezone: userData.timezone,

        uid: null, // userData.personalID,
        reviser: userData.reviser,
        workplace: userData.workplace,
      });
      break;

    /**
     * Register account
     */
    case "register account":
      db.mergeUser({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        email: userData.email,

        birthdate: userData.birthDate,
        timezone: userData.timezone,
        scode: userData.scode,
        tcode: userData.tcode,
        sequence: userData.sequence,

        uid: null, // userData.personalID,
        reviser: userData.reviser,
        workplace: userData.workplace,
      });
      break;

    case "update user":
      db.mergeUser({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        email: userData.email,
        uid: userData.personalID,
        firstname: userData.firstName,
        lastname: userData.lastName,
        pw: userData.password,
        reviser: userData.reviser,
        workplace: userData.workplace,
      });
      break;

    /**
     * Validate email token
     */
    case "validate email token":
      db.validateEmailToken({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        token: userData.token,
        email: userData.email,
      });
      break;

    /**
     * Resend validate email token
     */
    case "resend validate email token":
      db.resendValidateEmailToken({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        email: userData.email,
        token: userData.token,
        language: userData.language,
      });
      break;

    /**
     * Validate password reset token
     */
    case "validate password reset token":
      db.validatePasswordResetToken({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        token: userData.token,
        email: userData.email,
      });
      break;

    /**
     * Reset password token requested
     */
    case "reset password":
      db.resetPassword({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        email: userData.email,
        language: userData.language,
      });
      break;

    /**
     * Upload file
     */
    case "upload file":
      console.log("UPLOAD FILE DATA:", data);

      const gfx = userData.acceptedFiles[0];
      const session = data.session;
      const dir = global.appRoot + "/uploads/" + session;
      const fileName = uuidv4();
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }

      FileType.fromBuffer(gfx).then((response) => {
        let ext = response.ext;
        fs.writeFile(dir + "/" + fileName + "." + ext, gfx, (err) => {
          if (err) {
            return console.log(err);
          }
          // console.log("The file was saved!");

          db.uploadFile({
            // system
            req: data.req,
            session: data.session,
            reqData: userData,
            onStatusChange: onStatusChange,
            onError: onRequestError,
          });
        });
      });

      break;

    case "get user":
      db.getUser({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        email: userData.email,
      });
      break;

    case "get currencies":
      db.getCurrencies({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        page: userData.page - 1,
        limit: userData.limit,
      });
      break;

    case "register user language":
      db.mergeUserLanguage({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        email: userData.email,
        language: userData.language,
      });
      break;

    case "register user currency":
      db.mergeUserCurrency({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        email: userData.email,
        currency_id: userData.currency_id,
      });
      break;

    case "get user businesses":
      db.getBusiness({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        uid: userData.uid,
        page: userData.page - 1,
        limit: userData.limit,
      });

      break;

    case "get business purposes":
      db.getPurpose({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        business_id: userData.business_id,
        language: userData.language,
        page: userData.page - 1,
        limit: userData.limit,
      });
      break;

    case "get cart purposes":
      db.getCartPurposes({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        purposes: userData.purposes,
        language: userData.language,
        page: userData.page - 1,
        limit: userData.limit,
      });
      break;

    case "get purpose shareholders":
      db.getShare({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        purpose_id: userData.purpose_id,
      });
      break;

    case "get business by id":
      db.getBusinessById({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        id: userData.id,
      });
      break;

    case "get purpose by id":
      db.getPurposeById({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        id: userData.id,
        language: userData.language,
      });
      break;

    case "get shareholder by id":
      db.getShareholderById({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        id: userData.id,
      });
      break;

    case "get currency by id":
      db.getCurrencyById({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        id: userData.id,
      });
      break;

    case "get transaction by id":
      db.getTransactionById({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        id: userData.id,
        language: userData.language,
      });
      break;

    case "register currency":
      db.mergeCurrency({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        uid: userData.uid,
        curr_title: userData.curr_title,
        abbr: userData.curr_abbr,
        rate: userData.curr_rate,
        region: userData.curr_region,

        // standard
        reviser: userData.reviser,
        workplace: userData.workplace,
      });
      break;

    case "register business":
      db.mergeBusiness({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        uid: userData.uid,
        title: userData.businessTitle,
        description: userData.businessDescription,
        reviser: userData.reviser,
        workplace: userData.workplace,
      });
      break;

    case "register purpose":
      db.addPurpose({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        uid: userData.uid,
        language: userData.language,
        business_id: userData.businessID,
        title: userData.purposeTitle,
        description: userData.purposeDescription,
        reviser: userData.reviser,
        workplace: userData.workplace,
      });
      break;

    case "change purpose status":
      db.changePurposeStatus({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        purpose_id: userData.purpose_id,
        status: userData.purpose_status,
        reviser: userData.reviser,
        workplace: userData.workplace,
      });
      break;

    case "update purpose property":
      db.updatePurposeProps({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        purpose_id: userData.purposeID,
        title: userData.purposeTitle,
        description: userData.purposeDescription,
        language: userData.language,
        reviser: userData.reviser,
        workplace: userData.workplace,
      });
      break;

    case "register shareholder":
      // console.log("REGISTER SHAREHOLDER", data);

      db.mergeShareholder({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        purpose_id: userData.purposeID,
        shareholder_id: userData.personalID,
        roles: userData.shareholderRoles,
        share: userData.shares,
        reviser: userData.reviser,
        workplace: userData.workplace,
      });
      break;

    case "change share":
      db.mergeShareholder({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        purpose_id: userData.purpose_id,
        shareholder_id: userData.shareholder_id,
        // roles: userData.shareholderRoles,
        share: userData.share,
        reviser: userData.reviser,
        workplace: userData.workplace,
      });
      break;

    case "remove shareholder":
      db.removeShareholder({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        purpose_id: userData.purpose_id,
        shareholder_id: userData.shareholder_id,
        reviser: userData.reviser,
        workplace: userData.workplace,
      });
      break;

    case "transfer U2S":
      db.transferU2S({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        uid: data.uid,
        sender_id: userData.uid,
        fromAccount: userData.fromAccount,
        toAccount: userData.toAccount,
        amount: userData.amount,
        reviser: userData.reviser,
        workplace: userData.workplace,
      });
      break;

    case "get cart":
      db.getCart({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        customer: userData.customer,
        cart: userData.cart,
      });
      break;

    case "get tan":
      db.getTAN({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        email: userData.email,
        language: userData.language,
        reviser: userData.reviser,
        workplace: userData.workplace,
      });
      break;

    case "submit tan":
      db.processTAN({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        email: userData.email,
        tan: userData.tan,
        reviser: userData.reviser,
        workplace: userData.workplace,
      });
      break;

    case "save cart":
      db.saveCart({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        cartid: userData.cartid,
        content: userData.content,
        merchant: userData.merchant,
        reviser: userData.reviser,
        workplace: userData.workplace,
      });
      break;

    case "transfer U2U":
      db.transferU2U({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        uid: data.uid,
        sender_id: userData.uid,
        fromAccount: userData.fromAccount,
        recipient_id: userData.toPersonalID,
        amount: userData.amount,
        description: userData.description,
        reviser: userData.reviser,
        workplace: userData.workplace,
      });
      break;

    case "transfer U2B":
      db.transferU2B({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // user
        uid: data.uid,
        sender_id: userData.uid,
        fromAccount: userData.fromAccount,
        purpose_id: userData.purposeID,
        currency: userData.currency,
        amount: userData.amount,
        description: userData.description,
        reviser: userData.reviser,
        workplace: userData.workplace,
      });
      break;

    default:
      // unknown request
      console.log("Unknown request: " + data.req);

      onRequestError({
        // system
        req: data.req,
        session: data.session,
        reqData: userData,
        onStatusChange: onStatusChange,
        onError: onRequestError,

        // error
        error: { code: "UNKNOWN_REQUEST" },
        context: ["ProcessRequest.js", "userRequest", "switch default"],
        query: null,
      });

      break;
  }
};

module.exports = {
  userRequest: userRequest,
};
