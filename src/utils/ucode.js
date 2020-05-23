const getChecksum = (code) => {
  const factors = [
    2,
    1, // timezone
    2,
    5,
    7,
    1,
    2,
    1, // birth date
    2,
    5,
    7,
    1,
    2, // initial
    2,
    5,
    7,
    1,
    2, // sequence
  ];
  const ssnr = code.split("");
  const ssnra = [];
  ssnr.forEach((value, index) => {
    ssnra.push(parseInt(value) * factors[index]);
  });
  const ssnrb = ssnra.join("").split("");
  let ssnrc = 0;
  ssnrb.forEach((value) => {
    ssnrc += parseInt(value);
  });
  return ssnrc % 10;
};

const validate = (ucode) => {
  const acode = ucode.slice(1); // Cut initial "U"
  const timezone = acode.substr(0, 2);
  const birthdate = acode.substr(2, 6);
  const initial = acode.substr(8, 1).toUpperCase(); // Get user letter
  const icode = initial.charCodeAt(0).toString().padStart(5, "0"); // Convert user letter to unicode
  const sequence = parseInt(acode.substr(9, 4), 16).toString().padStart(5, "0");
  const code = `${timezone}${birthdate}${icode}${sequence}`;
  const checksum1 = parseInt(ucode.slice(-1));
  const checksum2 = getChecksum(code);
  return checksum1 === checksum2;
};

module.exports = {
  getChecksum: getChecksum,
  validate: validate,
};
