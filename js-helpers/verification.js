const util = require('util');
const exec = util.promisify(require('child_process').exec);
const _ = require('lodash');

const {
  log,
  chainIdByName,
} = require('./utils');

const {
  getDeployData,
  getOZProjectData,
} = require('./deploy');


const findImplementationAddress = (implementations, contractName) => {
  const implKey = _.findKey(implementations, (data) => {
    const contract = _.get(_.last(_.get(data, 'layout.storage', [])), 'contract', false);
    return contract === contractName;
  });
  return _.get(implementations, `${implKey}.address`, '');
};

const verifyProxyContract = async ({name, networkName}) => {
  const chainId = chainIdByName(networkName);
  const projectData = getOZProjectData(chainId);

  let implementationAddress = '';
  const deployData = getDeployData(name, chainId);
  const deployTx = _.get(deployData, 'upgradeTransaction', _.get(deployData, 'deployTransaction', ''));
  if (!_.isEmpty(deployTx)) {
    implementationAddress = findImplementationAddress(projectData.impls, name);
  }

  if (_.isEmpty(implementationAddress)) {
    log(`Failed to Verify Proxy: "${name}" - Implementation Address not found!`);
    return;
  }

  // Verify Implementation
  log(`Found implementation address for ${name} Proxy: "${implementationAddress}";`);
  await verifyContract({name, networkName, addressOverride: implementationAddress});
};

const verifyContract = async ({name, networkName, contractRef = null, addressOverride = null}) => {
  try {
    const deployment = (await deployments.get(name)) || {};
    const address = addressOverride || deployment.address;
    const constructorArgs = deployment.constructorArgs || [];
    log(`Verifying ${name} at address "${address}" ${constructorArgs ? `with ${constructorArgs.length} arg(s)` : ''}...`);

    const execArgs = constructorArgs.map(String).join(' ');
    const execCmd = [];
    execCmd.push('hardhat', 'verify', '--network', networkName);
    if (_.isString(contractRef) && contractRef.length > 0) {
      execCmd.push('--contract', `contracts/${contractRef}`);
    }
    execCmd.push(address, execArgs);

    log(`CMD: ${execCmd.join(' ')}`);
    await exec(execCmd.join(' '));
    log(`${name} verified!\n`);
  }
  catch (err) {
    if (/Contract source code already verified/.test(err.message || err)) {
      log(`${name} already verified\n`);
    } else {
      console.error(err);
    }
  }
}

module.exports = {
  findImplementationAddress,
  verifyContract,
  verifyProxyContract,
};
