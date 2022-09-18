const { ethers, getNamedAccounts, network: networkObj, run } = require('hardhat');

const {
  getDeployData,
  getContractAbi,
  saveDeploymentData,
} = require('../js-helpers/deploy');

const {
  executeTx,
} = require('../js-helpers/executeTx');

const {
  log,
  toWei,
  chainTypeById,
  chainNameById,
  chainIdByName,
} = require('../js-helpers/utils');

const { verifyContract } = require('../js-helpers/verification');

const _ = require('lodash');

const MEMBERSHIP_PLAN_TYPE = {
  'free'          : 1,
  'standard'      : 2,
  'professional'  : 3,
  'business'      : 4,
};

const CONTRACT_TYPE = {
  'Lazy721': 1,
};

const CONTRACT_ABI = {
  '1': getContractAbi('TaggrLazy721'),
};


const _createCustomer = async (txId, taggr, project) => {
  let tx;
  log(`[TX-${txId}-a] Taggr: Creating Customer: ${project.customer} (Address: ${project.customerAddress})`);
  tx = await taggr.managerUpdateCustomerAccount(project.customerAddress, project.planType);
  await tx.wait();

  if (project.selfServe) {
    log(`[TX-${txId}-b] Taggr: Enabling Self-Serve for: ${project.customer}`);
    tx = await taggr.toggleCustomerSelfServe(project.customerAddress, true);
    await tx.wait();
  }
};

const _deployProject = async (txId, taggr, customerSettings, project, chainId, networkName) => {
  log(`[TX-${txId}-a] Taggr: Launching Project for ${project.name}: ${project.projectId}`);
  const txData = await taggr.managerLaunchNewProject(
    project.customerAddress,
    project.projectId,
    project.name,
    project.symbol,
    project.baseTokenUri,
    project.nftFactoryId,
    project.max,
    project.royalties,
  );
  const txDeployData = await txData.wait();

  const tx = await customerSettings.setProjectPurchaseFee(project.projectId, project.purchaseToken, project.purchaseFee);
  await tx.wait();

  const projectContract = await taggr.getProjectContract(project.projectId);
  const deployData = {};
  deployData[project.projectId] = {
    abi: CONTRACT_ABI[project.type],
    address: projectContract,
    deployTransaction: txDeployData,
  }
  saveDeploymentData(chainId, deployData);
  log(`   - New Project Contract: ${projectContract}`);
  log(`   - Deployment saved to: "deployments/${networkName}/${project.projectId}.json`);
};


module.exports = async () => {
  const { deployer, protocolOwner } = await getNamedAccounts();
  const network = await networkObj;
  const chainId = chainIdByName(network.name);
  const {isProd, isHardhat} = chainTypeById(chainId);
  let project;

  const toUSDC = v => ethers.utils.parseUnits(v, 6);

  const ddTaggr = getDeployData('Taggr', chainId);
  const ddCustomerSettings = getDeployData('CustomerSettings', chainId);
  let ddFakeUSDC;
  if (!isProd) {
    ddFakeUSDC = getDeployData('FakeUSDC', chainId);
  }
  // if (isHardhat) { return; }

  const networkName = network.name === 'homestead' ? 'mainnet' : network.name;

  const taggrBaseUri = isProd
    ? 'https://us-central1-taggr-nft.cloudfunctions.net/api/meta'
    : 'https://us-central1-taggr-nft-staging.cloudfunctions.net/api/meta';

  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  log('Taggr - Account Creation');
  log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');

  log(`  Using Network: ${chainNameById(chainId)} (${chainId})`);
  log('  Using Accounts:');
  log('  - Deployer:          ', deployer);
  log('  - Owner:             ', protocolOwner);
  log(' ');

  log('  Loading Taggr from: ', ddTaggr.address);
  const Taggr = await ethers.getContractFactory('Taggr');
  const taggr = await Taggr.attach(ddTaggr.address);

  log('  Loading CustomerSettings from: ', ddCustomerSettings.address);
  const CustomerSettings = await ethers.getContractFactory('CustomerSettings');
  const customerSettings = await CustomerSettings.attach(ddCustomerSettings.address);

  let fakeUSDC;
  if (!isProd) {
    log('  Loading FakeUSDC from: ', ddFakeUSDC.address);
    const FakeUSDC = await ethers.getContractFactory('FakeUSDC');
    fakeUSDC = await FakeUSDC.attach(ddFakeUSDC.address);
  }


  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Customer: Taggr
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  project = {
    customer        : 'Taggr',
    customerAddress : protocolOwner,
    planType        : MEMBERSHIP_PLAN_TYPE.business,
    projectId       : 'FUTURIST-CONF',
    name            : 'Taggr - Futurist Conference Swag',
    symbol          : 'TAGGR-FC',
    baseTokenUri    : `${taggrBaseUri}/FUTURIST-CONF/`,
    // baseTokenUri    : 'https://us-central1-taggr-nft-staging.cloudfunctions.net/api/meta/TAGGR-TAG-SWAG/',
    nftFactoryId    : CONTRACT_TYPE.Lazy721,
    max             : 100000,
    royalties       : 200,  // 2%
    selfServe       : true,
    purchaseToken   : isProd ? '__USDC__' : fakeUSDC.address,
    purchaseFee     : toUSDC('350'),
  };
  await _createCustomer('1', taggr, project);
  await _deployProject('2', taggr, customerSettings, project, chainId, networkName);

  project = {
    customer        : 'Taggr',
    customerAddress : protocolOwner,
    planType        : MEMBERSHIP_PLAN_TYPE.business,
    projectId       : 'DIRTY-NERD',
    name            : 'Taggr - Dirty Nerd Exclusive',
    symbol          : 'TAGGR-DN',
    baseTokenUri    : `${taggrBaseUri}/DIRTY-NERD/`,
    nftFactoryId    : CONTRACT_TYPE.Lazy721,
    max             : 100000,
    royalties       : 200,  // 2%
    selfServe       : true,
    purchaseToken   : isProd ? '__USDC__' : fakeUSDC.address,
    purchaseFee     : toUSDC('350'),
  };
  await _deployProject('3', taggr, customerSettings, project, chainId, networkName);


  log(`\n  Account Creation Complete!`);
  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};

module.exports.tags = ['accounts']
