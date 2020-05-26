const crypto = require("crypto");
const algorithm = "aes-256-cbc";
const key = "2e3fa223e381c865cc25a533676b9e12e5eb5588331c32fe229d5088063e1208"; // crypto.randomBytes(32);
const iv = "456fe4efc189c7182278721778199fe3"; // crypto.randomBytes(16);

const encrypt = (text, randomIv = false) => {
  const tiv = !randomIv ? iv : crypto.randomBytes(16);
  // Creating Cipheriv with its parameter
  let cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(key, "hex"),
    !randomIv ? Buffer.from(tiv, "hex") : tiv
  );

  // Updating text
  let encrypted = cipher.update(text);

  // Using concatenation
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  // Returning iv and encrypted data
  return {
    encryptedData: encrypted.toString("hex"),
    iv: !randomIv ? "" : tiv.toString("hex"),
  };
};

const decrypt = (message, randomIv = false) => {
  const tiv = randomIv === false ? iv : randomIv;
  let encryptedText = Buffer.from(message, "hex");

  // Creating Decipher
  let decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(key, "hex"),
    // Buffer.from(tiv, "hex")
    Buffer.from(tiv, "hex")
  );

  // Updating encrypted text
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  // returns data after decryption
  return decrypted.toString();
};

const hash = (message) => {
  return crypto.createHash("sha256").update(message).digest("hex");
};

module.exports = {
  encrypt: encrypt,
  decrypt: decrypt,
  hash: hash,
};
