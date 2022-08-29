const { log } = require('../js-helpers/utils');
const { contractDeploy } = require('../js-helpers/contractDeploy.js');

module.exports = async (hre) => {
    // Deploy Contracts
    await contractDeploy();

    log('\n  Contract Deployment Data saved to "deployments" directory.');
    log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};

module.exports.tags = ['core']
