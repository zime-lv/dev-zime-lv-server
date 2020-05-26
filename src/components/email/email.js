"use strict";
const nodemailer = require("nodemailer");
const config = require("../../utils/config");

const send = (args) => {
  return main(args);
};

// async..await is not allowed in global scope, must use a wrapper
async function main(args) {
  let { token, email, language } = args.tags;
  const { req } = args;
  token = encodeURIComponent(token);
  const domain = config.uri.ENDPOINT; // "https://dev.zime.lv"; // http://localhost:3000 | "zime.lv"; // process.env.DOMAIN;

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "zime.lv", // "strazds.com" // "zime.lv", // "smtp.ethereal.email",
    port: 465, // 587,
    // port: 443,
    // rejectUnauthorized: false,
    secure: true, // true for 465, false for other ports
    auth: {
      user: "service@zime.lv", // service@strazds.com // testAccount.user, // generated ethereal user
      pass: "hajgfd_36754_JSZDM", // testAccount.pass, // generated ethereal password
    },
  });

  let subject = "";
  let html = "";

  switch (req) {
    case "resend validate email token":
    case "register user":
      if (language === "lv") {
        subject = `Tava aktivizācijas saite`;
        html = `
          <p>Sveiki,</p>
          
          <p>lai apstiprinātu savu e-pasta adresi, izmanto šo saiti.</p>
          
          <p>
            <a href="${domain}/validate-email?token=${token}&email=${email}">${domain}/validate-email?token=${token}&email=${email}</a>
          </p>
          
          <p>Ja nelūdzi apstiprināt e-pasta adresi, vari ignorēt šo e-pastu.</p>
          
          <p>Paldies,</p>
          
          <p>Tava ZIME.LV komanda</p>
        `;
      } else {
        // en | en-US etc.
        subject = `Your activation link`;
        html = `
          <p>Hello,</p>
          
          <p>Follow this link to validate your email address.</p>
          
          <p>
            <a href="${domain}/validate-email?token=${token}&email=${email}">${domain}/validate-email?token=${token}&email=${email}</a>
          </p>
          
          <p>If you didn't ask to validate your email address, you can ignore this email.</p>
          
          <p>Thanks,</p>
          
          <p>Your ZIME.LV team</p>
        `;
      }
      break;

    /**
     * Send transaction TAN
     */
    case "get tan":
      if (language === "lv") {
        subject = `Tavs pārskaitījuma numurs`;
        html = `
          <p>Sveiki,</p>
          
          <p>lai veiktu ZIME.LV pārskaitījumu, izmanto šo numuru.</p>
          
          <p>
            <b>${token}</b>
          </p>
          
          <p>Ja nevēlies veikt pārskaitījumu, vari ignorēt šo e-pastu.</p>
          
          <p>Paldies,</p>
          
          <p>Tava ZIME.LV komanda</p>
        `;
      } else {
        // en | en-US etc.
        subject = `Your transaction number`;
        html = `
          <p>Hello,</p>
          
          <p>Use this TAN for your ZIME.LV transfer.</p>
          
          <p>
            <b>${token}</b>
          </p>
          
          <p>If you didn't whish to make a transfer, you can ignore this email.</p>
          
          <p>Thanks,</p>
          
          <p>Your ZIME.LV team</p>
        `;
      }
      break;

    /**
     * Resend password
     */
    case "reset password":
      if (language === "lv") {
        subject = `Tava paroles atiestatīšanas saite`;
        html = `
          <p>Sveiki,</p>
          
          <p>lai atiestatītu savu ZIME.LV paroli, izmanto šo saiti.</p>
          
          <p>
            <a href="${domain}/reset?token=${token}&email=${email}">${domain}/reset?token=${token}&email=${email}</a>
          </p>
          
          <p>Ja nelūdzi atiestatīt paroli, vari ignorēt šo e-pastu.</p>
          
          <p>Paldies,</p>
          
          <p>Tava ZIME.LV komanda</p>
        `;
      } else {
        // en | en-US etc.
        subject = `Your password reset link`;
        html = `
          <p>Hello,</p>
          
          <p>Follow this link to reset your ZIME.LV password.</p>
          
          <p>
            <a href="${domain}/reset?token=${token}&email=${email}">${domain}/reset?token=${token}&email=${email}</a>
          </p>
          
          <p>If you didn't ask to reset your password, you can ignore this email.</p>
          
          <p>Thanks,</p>
          
          <p>Your ZIME.LV team</p>
        `;
      }
      break;
    default:
      break;
  }

  let info;

  // send mail with defined transport object
  info = await transporter.sendMail({
    from: '"ZIME Service" <noreply@zime.lv>', // sender address (👻✔)
    to: email, // list of receivers (e. g. strazds@gmail.com, baz@example.com)
    subject: subject, // Subject line
    // text: "Hello world?", // plain text body
    html: html, // html body
  });

  // Email to admin, switch it off in production
  info = await transporter.sendMail({
    from: '"ZIME Service" <noreply@zime.lv>', // sender address (👻✔)
    to: "strazds@gmail.com", // list of receivers (e. g. strazds@gmail.com, baz@example.com)
    subject: `${subject} - ${email}`, // Subject line
    // text: "Hello world?", // plain text body
    html: html, // html body
  });

  console.log("Info:", info);

  return true;
}

module.exports = {
  send: send,
};
