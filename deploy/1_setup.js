const { contractSetup } = require('../js-helpers/contractSetup.js');

module.exports = async (hre) => {
  // Setup Contracts
  await contractSetup();
};

module.exports.tags = ['setup'];
