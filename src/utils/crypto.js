const crypto = require("crypto");
const algorithm = "aes-256-cbc";
const key = "2e3fa223e381c865cc25a533676b9e12e5eb5588331c32fe229d5088063e1208"; // crypto.randomBytes(32);
const iv = "456fe4efc189c7182278721778199fe3"; // crypto.randomBytes(16);

const encrypt = (text) => {
  // Creating Cipheriv with its parameter
  let cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(key, "hex"),
    Buffer.from(iv, "hex")
  );

  // Updating text
  let encrypted = cipher.update(text);

  // Using concatenation
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  // Returning iv and encrypted data
  return {
    encryptedData: encrypted.toString("hex"),
  };
};

const decrypt = (message) => {
  let encryptedText = Buffer.from(message, "hex");

  // Creating Decipher
  let decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(key, "hex"),
    Buffer.from(iv, "hex")
  );

  // Updating encrypted text
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  // returns data after decryption
  return decrypted.toString();
};

module.exports = {
  encrypt: encrypt,
  decrypt: decrypt,
};
