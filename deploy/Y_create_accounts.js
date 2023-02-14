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

const _setPurchaseFee = async (txId, customerSettings, project) => {
  log(`[TX-${txId}-a] Taggr: Setting Purchase Fee for Project ${project.name}: ${project.projectId}`);
  const tx = await customerSettings.setProjectPurchaseFee(project.projectId, project.purchaseToken, project.purchaseFee);
  await tx.wait();
}


module.exports = async () => {
  const { deployer, protocolOwner } = await getNamedAccounts();
  const network = await networkObj;
  const chainId = chainIdByName(network.name);
  const {isProd, isHardhat} = chainTypeById(chainId);
  let project;

  const toUSDC = v => ethers.utils.parseUnits(v, 6);

  const ddTaggr = getDeployData('Taggr', chainId);
  const ddCustomerSettings = getDeployData('CustomerSettings', chainId);
  const networkName = network.name === 'homestead' ? 'mainnet' : network.name;

  const taggrBaseUri = isProd
    ? 'https://us-central1-taggr-admin-prod.cloudfunctions.net/api/project-meta'
    : 'https://us-central1-taggr-admin-staging.cloudfunctions.net/api/project-meta';

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

  let usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // Mainnet
  if (!isProd) {
    const ddFakeUSDC = getDeployData('FakeUSDC', chainId);
    usdcAddress = ddFakeUSDC.address;
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Customer: Taggr
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  // project = {
  //   customer        : 'Taggr',
  //   customerAddress : protocolOwner, // MAINNET = 0x5Fd79eB99b7a0CF9c715538ac40074A7f187A28c
  //   planType        : MEMBERSHIP_PLAN_TYPE.business,
  //   projectId       : 'FUTURIST-CONF',
  //   name            : 'Taggr - Futurist Conference Swag',
  //   symbol          : 'TAGGR-FC',
  //   baseTokenUri    : `${taggrBaseUri}/FUTURIST-CONF/`,
  //   // baseTokenUri    : 'https://us-central1-taggr-nft-staging.cloudfunctions.net/api/meta/TAGGR-TAG-SWAG/',
  //   nftFactoryId    : CONTRACT_TYPE.Lazy721,
  //   max             : 100000,
  //   royalties       : 300,  // 3%
  //   selfServe       : true,
  //   purchaseToken   : usdcAddress,
  //   purchaseFee     : toUSDC('450'),
  // };
  // await _createCustomer('1', taggr, project);
  // await _deployProject('2', taggr, customerSettings, project, chainId, networkName);

  // project = {
  //   customer        : 'Taggr',
  //   customerAddress : protocolOwner, // MAINNET = 0x5Fd79eB99b7a0CF9c715538ac40074A7f187A28c
  //   planType        : MEMBERSHIP_PLAN_TYPE.business,
  //   projectId       : 'DIRTY-NERD',
  //   name            : 'Taggr - Dirty Nerd Exclusive',
  //   symbol          : 'TAGGR-DN',
  //   baseTokenUri    : `${taggrBaseUri}/DIRTY-NERD/`,
  //   nftFactoryId    : CONTRACT_TYPE.Lazy721,
  //   max             : 100000,
  //   royalties       : 200,  // 2%
  //   selfServe       : true,
  //   purchaseToken   : usdcAddress,
  //   purchaseFee     : toUSDC('450'),
  // };
  // await _deployProject('3', taggr, customerSettings, project, chainId, networkName);

  // project = {
  //   customer        : 'Rosa',
  //   customerAddress : '0x51D33ab709B04B235F84fd2333c93F747645Ceea',
  //   planType        : MEMBERSHIP_PLAN_TYPE.business,
  //   projectId       : 'ROYAL-ROSE-ART-GALLERY',
  //   name            : 'Royal Rose Art Gallery',
  //   symbol          : 'ROSART',
  //   baseTokenUri    : `${taggrBaseUri}/ROYAL-ROSE/`,
  //   nftFactoryId    : CONTRACT_TYPE.Lazy721,
  //   max             : 100000,
  //   royalties       : 700,  // 7%
  //   selfServe       : true,
  //   purchaseToken   : usdcAddress,
  //   purchaseFee     : toUSDC('100'),
  // };
  // await _createCustomer('4', taggr, project);
  // await _deployProject('5', taggr, customerSettings, project, chainId, networkName);

  // await _setPurchaseFee('6', customerSettings, project);

  // project = {
  //   customer        : 'UncleNate',
  //   customerAddress : '0xD90adE64094D73599CfA3F6353DA76cb64C029E9',
  //   planType        : MEMBERSHIP_PLAN_TYPE.business,
  //   projectId       : 'cortex-demo',
  //   name            : 'Cortex Glass Ape Demo',
  //   symbol          : 'CGAD',
  //   baseTokenUri    : `${taggrBaseUri}/cortex-demo/`,
  //   nftFactoryId    : CONTRACT_TYPE.Lazy721,
  //   max             : 100000,
  //   royalties       : 700,  // 7%
  //   selfServe       : true,
  //   purchaseToken   : usdcAddress,
  //   purchaseFee     : toUSDC('100'),
  // };
  // await _createCustomer('6', taggr, project);
  // await _deployProject('7', taggr, customerSettings, project, chainId, networkName);

  // project = {
  //   customer        : 'TaggrAuto',
  //   customerAddress : '0x39b68cBB39187091737B6b40e0B3a86DA0C150b4',
  //   planType        : MEMBERSHIP_PLAN_TYPE.business,
  //   projectId       : 'taggr-auto-demo',
  //   name            : 'Taggr Auto Demo',
  //   symbol          : 'TAUTOD',
  //   baseTokenUri    : `${taggrBaseUri}/taggr-auto-demo/`,
  //   nftFactoryId    : CONTRACT_TYPE.Lazy721,
  //   max             : 100000,
  //   royalties       : 700,  // 7%
  //   selfServe       : true,
  //   purchaseToken   : usdcAddress,
  //   purchaseFee     : toUSDC('100'),
  // };
  // await _createCustomer('6', taggr, project);
  // await _deployProject('7', taggr, customerSettings, project, chainId, networkName);


  log(`\n  Account Creation Complete!`);
  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};

module.exports.tags = ['accounts']
