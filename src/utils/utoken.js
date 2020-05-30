const crypto = require("./crypto");
const timeout = 15 * 60; // timeout: 10 = 10 seconds | 5 * 60 = 5 minutes
const renew = 2 * 60; // suggest a token to be renewed n seconds before expiration

/**
 * Creates a UToken
 * @param {string} data
 */
const create = (data) => {
  const hash = getHash(data);
  const ts = Math.floor(Date.now() / 1000) + timeout;
  const encrypted = crypto.encrypt(`${hash}${ts}`, true);
  return { iv: encrypted.iv, token: encrypted.encryptedData };
};

/**
 * Validates a UToken
 * @param {string} data
 */
const validate = (token, iv, data) => {
  const hash = getHash(data);
  const decrypted = crypto.decrypt(token, iv);
  let valid = decrypted.substr(0, 8) === hash;
  const ts = decrypted.substr(8);
  const tillTimeout = Math.floor((Date.now() / 1000 - ts) / 1); // / 1 = seconds, / 60 = minutes
  // if (-tsAge)
  // if (tsAge > 5) valid = false; // token has expired
  if (ts < Date.now() / 1000) valid = false; // token has expired
  return { status: valid, renew: -tillTimeout < renew };
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
