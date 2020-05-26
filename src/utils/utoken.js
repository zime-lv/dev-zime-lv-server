const crypto = require("./crypto");

/**
 * Creates a UToken
 * @param {string} data
 */
const create = (data) => {
  const hash = getHash(data);
  const ts = Math.floor(Date.now() / 1000);
  const encrypted = crypto.encrypt(`${hash}${ts}`, true);
  // return `${encrypted.iv}${encrypted.encryptedData}`;
  return { iv: encrypted.iv, token: encrypted.encryptedData };
  //   return encrypted;
};

/**
 * Validates a UToken
 * @param {string} data
 */
// const validate = (token, data) => {
//   const iv = token.substr(0, 32);
//   const encrypted = token.substr(32);
//   const hash = getHash(data);
//   const decrypted = crypto.decrypt(encrypted, iv);
//   let valid = decrypted.substr(0, 8) === hash;
//   const ts = decrypted.substr(8);
//   const tsAge = Math.floor((Date.now() / 1000 - ts) / 60); // minutes
//   if (tsAge > 5) valid = false; // token has expired
//   return valid;
// };

const validate = (token, iv, data) => {
  const hash = getHash(data);
  const decrypted = crypto.decrypt(token, iv);
  let valid = decrypted.substr(0, 8) === hash;
  const ts = decrypted.substr(8);
  const tsAge = Math.floor((Date.now() / 1000 - ts) / 60); // minutes
  if (tsAge > 5) valid = false; // token has expired
  return valid;
};

/**
 * Returns a hash for the data
 * @param {string} data
 */
const getHash = (data) => {
  return crypto.hash(data).substr(0, 8);
};

module.exports = {
  create: create,
  validate: validate,
};
