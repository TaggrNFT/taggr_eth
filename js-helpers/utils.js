const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const toWei = ethers.utils.parseEther;
const toEth = ethers.utils.formatEther;
const toBN = ethers.BigNumber.from;
const toStr = (val) => ethers.utils.toUtf8String(val).replace(/\0/g, '');
const toBytes = ethers.utils.formatBytes32String;

const bn = function(number, defaultValue = null) { if (number == null) { if (defaultValue == null) { return null } number = defaultValue } return ethers.BigNumber.from(number) }

const log = (...args) => {
  console.log(...args);
};

const chainIdByName = (chainName) => {
  switch (_.toLower(chainName)) {
    case 'homestead': return 1;
    case 'mainnet': return 1;
    case 'ropsten': return 3;
    case 'rinkeby': return 4;
    case 'goerli': return 5;
    case 'kovan': return 42;
    case 'polygon': return 137;
    case 'mumbai': return 80001;
    case 'hardhat': return 31337;
    case 'coverage': return 31337;
    default: return 0;
  }
};

const chainNameById = (chainId, toLower = false) => {
  switch (parseInt(chainId, 10)) {
    case 1: return toLower ? 'mainnet' : 'Mainnet';
    case 5: return toLower ? 'goerli' : 'Goerli';
    case 137: return toLower ? 'polygon' : 'Polygon';
    case 80001: return toLower ? 'mumbai' : 'Mumbai';
    case 31337: return toLower ? 'hardhat' : 'Hardhat';
    default: return toLower ? 'unknown' : 'Unknown';
  }
};

const chainTypeById = (chainId) => {
  switch (parseInt(chainId, 10)) {
    case 1:
    case 137:
      return {isProd: true, isTestnet: false, isHardhat: false};
    case 3:
    case 4:
    case 5:
    case 42:
    case 80001:
      return {isProd: false, isTestnet: true, isHardhat: false};
    case 31337:
    default:
      return {isProd: false, isTestnet: false, isHardhat: true};
  }
};
const ensureDirectoryExistence = (filePath) => {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
};


module.exports = {
  toWei,
  toEth,
  toBN,
  toStr,
  toBytes,
  bn,
  log,
  chainTypeById,
  chainNameById,
  chainIdByName,
  ensureDirectoryExistence,
}