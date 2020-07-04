"use strict";
const nodemailer = require("nodemailer");
const config = require("../../utils/config");
const organization = "Local-Currency.com";

const send = (args) => {
  return main(args);
};

// async..await is not allowed in global scope, must use a wrapper
async function main(args) {
  let { token, email, language } = args.tags;
  const { req } = args;
  token = encodeURIComponent(token);
  const domain = config.uri.ENDPOINT;

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    // pool: true,
    host: "local-currency.com", // "strazds.com" // "local-currency.com", // "smtp.ethereal.email",
    port: 465, // 465 | 587
    secure: true, // true for 465, false for other ports
    auth: {
      user: "service@local-currency.com",
      pass: "hajgfd_36754_JSZDM",
    },
    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: false,
    },
  });

  // verify connection configuration
  transporter.verify(function (error, success) {
    if (error) {
      console.log(error);
    } else {
      console.log("Server is ready to take our messages");
    }
  });

  let subject = "";
  let html = "";
  let text = "";

  switch (req) {
    case "resend validate email token":
    case "register user":
    case "update user":
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
          
          <p>Tava ${organization} komanda</p>
        `;

        text = `
        Sveiki,
        \n\n
        lai apstiprinātu savu e-pasta adresi, izmanto šo saiti.
        \n\n
        ${domain}/validate-email?token=${token}&email=${email}">${domain}/validate-email?token=${token}&email=${email}
        \n\n
        Ja nelūdzi apstiprināt e-pasta adresi, vari ignorēt šo e-pastu.
        \n\n
        Paldies,
        \n\n
        Tava ${organization} komanda
        \n\n
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
          
          <p>Your ${organization} team</p>
        `;

        text = `
          Hello,
          \n\n
          Follow this link to validate your email address.
          \n\n
          ${domain}/validate-email?token=${token}&email=${email}">${domain}/validate-email?token=${token}&email=${email}
          \n\n
          If you didn't ask to validate your email address, you can ignore this email.
          \n\n
          Thanks,
          \n\n
          Your ${organization} team
          \n\n
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
          
          <p>lai veiktu ${organization} pārskaitījumu, izmanto šo numuru.</p>
          
          <p>
            <b>${token}</b>
          </p>
          
          <p>Ja nevēlies veikt pārskaitījumu, vari ignorēt šo e-pastu.</p>
          
          <p>Paldies,</p>
          
          <p>Tava ${organization} komanda</p>
        `;

        text = `
          Sveiki,
          \n\n
          lai veiktu ${organization} pārskaitījumu, izmanto šo numuru.
          \n\n
          
            ${token}
            \n\n
          
          Ja nevēlies veikt pārskaitījumu, vari ignorēt šo e-pastu.
          \n\n
          Paldies,
          \n\n
          Tava ${organization} komanda
          \n\n
      `;
      } else {
        // en | en-US etc.
        subject = `Your transaction number`;
        html = `
          <p>Hello,</p>
          
          <p>Use this TAN for your ${organization} transfer.</p>
          
          <p>
            <b>${token}</b>
          </p>
          
          <p>If you didn't whish to make a transfer, you can ignore this email.</p>
          
          <p>Thanks,</p>
          
          <p>Your ${organization} team</p>
        `;

        text = `
          Hello,
          \n\n
          Use this TAN for your ${organization} transfer.
          \n\n

            ${token}
            \n\n
          
          If you didn't whish to make a transfer, you can ignore this email.
          \n\n
          Thanks,
          \n\n
          Your ${organization} team
          \n\n
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
          
          <p>lai atiestatītu savu ${organization} paroli, izmanto šo saiti.</p>
          
          <p>
            <a href="${domain}/reset?token=${token}&email=${email}">${domain}/reset?token=${token}&email=${email}</a>
          </p>
          
          <p>Ja nelūdzi atiestatīt paroli, vari ignorēt šo e-pastu.</p>
          
          <p>Paldies,</p>
          
          <p>Tava ${organization} komanda</p>
        `;

        text = `
        Sveiki,
        \n\n
        lai atiestatītu savu ${organization} paroli, izmanto šo saiti.
        \n\n
        
          ${domain}/reset?token=${token}&email=${email}">${domain}/reset?token=${token}&email=${email}
          \n\n
        
        Ja nelūdzi atiestatīt paroli, vari ignorēt šo e-pastu.
        \n\n
        Paldies,
        \n\n
        Tava ${organization} komanda
        \n\n
      `;
      } else {
        // en | en-US etc.
        subject = `Your password reset link`;
        html = `
          <p>Hello,</p>
          
          <p>Follow this link to reset your ${organization} password.</p>
          
          <p>
            <a href="${domain}/reset?token=${token}&email=${email}">${domain}/reset?token=${token}&email=${email}</a>
          </p>
          
          <p>If you didn't ask to reset your password, you can ignore this email.</p>
          
          <p>Thanks,</p>
          
          <p>Your ${organization} team</p>
        `;

        text = `
          Hello,
          \n\n
          Follow this link to reset your ${organization} password.
          \n\n
          
            ${domain}/reset?token=${token}&email=${email}">${domain}/reset?token=${token}&email=${email}
            \n\n
          
          If you didn't ask to reset your password, you can ignore this email.
          \n\n
          Thanks,
          \n\n
          Your ${organization} team
          \n\n
      `;
      }
      break;
    default:
      break;
  }

  let info;

  const wrapHtml = (html) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
      </head>
      <body>
        ${html}
      </body>
    </html>
    `;
  };

  // send mail with defined transport object
  info = await transporter.sendMail({
    from: '"Local Currency Service" <noreply@local-currency.com>', // sender address (👻✔)
    to: email, // list of receivers (e. g. strazds@gmail.com, baz@example.com)
    bcc: [`"${email}" <strazds@gmail.com>`],
    list: {
      unsubscribe: {
        url: "https://local-currency.com/unsubscribe?email=" + email,
        comment: "Unsubscribe",
      },
    },
    subject: subject, // Subject line
    // text: "Hello world?", // plain text body
    text: text,
    html: wrapHtml(html), // html body
  });

  console.log("Info:", info);

  // Email to admin, switch it off in production
  // info = await transporter.sendMail({
  //   from: '"ZIME Service" <noreply@zime.lv>', // sender address (👻✔)
  //   to: "strazds@gmail.com", // list of receivers (e. g. strazds@gmail.com, baz@example.com)
  //   subject: `${subject} - ${email}`, // Subject line
  //   // text: "Hello world?", // plain text body
  //   html: html, // html body
  // });

  return true;
}

module.exports = {
  send: send,
};
