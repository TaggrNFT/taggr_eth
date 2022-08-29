const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const {
  toEth,
  chainNameById,
  ensureDirectoryExistence,
} = require('./utils');

require('./chaiMatchers');

const presets = {

};

const txOverrides = (options = {}) => ({gasLimit: 15000000, ...options});

const saveDeploymentData = (chainId, deployData, overwrite = false) => {
  const network = chainNameById(chainId).toLowerCase();
  const deployPath = path.join(__dirname, '..', 'deployments', network);

  _.forEach(_.keys(deployData), (contractName) => {
    const filename = `${deployPath}/${contractName}.json`;

    let existingData = {};
    if (!overwrite && fs.existsSync(filename)) {
      existingData = JSON.parse(fs.readFileSync(filename));
    }

    const newData = _.merge(existingData, deployData[contractName]);
    ensureDirectoryExistence(filename);
    fs.writeFileSync(filename, JSON.stringify(newData, null, "\t"));
  });
};

const getContractAbi = (contractName) => {
  const buildPath = path.join(__dirname, '..', 'abis');
  const filename = `${buildPath}/${contractName}.json`;
  const contractJson = require(filename);
  return contractJson;
};

const getDeployData = (contractName, chainId = 31337) => {
  const network = chainNameById(chainId).toLowerCase();
  const deployPath = path.join(__dirname, '..', 'deployments', network);
  const filename = `${deployPath}/${contractName}.json`;
  delete require.cache[require.resolve(filename)]; // Prevent requiring cached deps
  const contractJson = require(filename);
  return contractJson;
}

const getOZProjectData = (chainId = 31337) => {
  let fileRef = '';
  switch (chainId) {
    case 1: fileRef = `mainnet`; break;
    case 5: fileRef = `goerli`; break;
    case 42: fileRef = `kovan`; break;
    default: fileRef = `unknown-${chainId}`; break;
  }
  const projectPath = path.join(__dirname, '..', '.openzeppelin');
  const filename = `${projectPath}/${fileRef}.json`;
  const projectJson = (fs.existsSync(filename)) ? require(filename) : {};
  return projectJson;
}


const getTxGasCost = ({deployTransaction}) => {
  const gasCost = toEth(deployTransaction.gasLimit.mul(deployTransaction.gasPrice));
  return `${gasCost} ETH`;
};

const getActualTxGasCost = async (txData) => {
  const txResult = await txData.wait();
  const gasCostEst = toEth(txData.gasLimit.mul(txData.gasPrice));
  const gasCost = toEth(txResult.gasUsed.mul(txData.gasPrice));
  return `${gasCost} ETH Used.  (Estimated: ${gasCostEst} ETH)`;
};


module.exports = {
  txOverrides,
  saveDeploymentData,
  getContractAbi,
  getDeployData,
  getOZProjectData,
  getTxGasCost,
  getActualTxGasCost,
  presets,
};
