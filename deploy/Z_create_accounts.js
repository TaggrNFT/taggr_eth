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
  log(`[TX-${txId}-a] Taggr: Creating Customer: ${project.customer}`);
  tx = await taggr.managerUpdateCustomerAccount(project.customerAddress, project.planType);
  await tx.wait();

  if (project.selfServe) {
    log(`[TX-${txId}-b] Taggr: Enabling Self-Serve for: ${project.customer}`);
    tx = await taggr.toggleCustomerSelfServe(project.customerAddress, true);
    await tx.wait();
  }
};

const _deployProject = async (txId, taggr, project, networkName) => {
  log(`[TX-${txId}-a] Taggr: Launching Project for ${project.name}: ${project.projectId}`);
  const txData = await taggr.managerLaunchNewProject(
    project.customerAddress,
    project.projectId,
    project.name,
    project.symbol,
    project.baseTokenUri,
    project.nftFactoryId,
    project.max,
    project.royalties
  );
  const deployData = await txData.wait();

  const projectContract = await taggr.getProjectContract(project.projectId);
  deployData[project.projectId] = {
    abi: CONTRACT_ABI[project.type],
    address: projectContract,
    deployTransaction: deployData,
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

  const ddTaggr = getDeployData('Taggr', chainId);
  // if (isHardhat) { return; }

  const networkName = network.name === 'homestead' ? 'mainnet' : network.name;

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


  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Customer: Taggr
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  project = {
    customer        : 'Taggr',
    customerAddress : protocolOwner,
    planType        : MEMBERSHIP_PLAN_TYPE.free,
    projectId       : 'TAGGR-TAG-SWAG',
    name            : 'TaggdSwag',
    symbol          : 'SWAG',
    baseTokenUri    : '',
    nftFactoryId    : CONTRACT_TYPE.Lazy721,
    max             : 100000,
    royalties       : 100,  // 1%
    selfServe       : true,
  };
  _createCustomer('1', taggr, project);
  _deployProject('2', taggr, project, networkName);


  log(`\n  Account Creation Complete!`);
  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};

module.exports.tags = ['accounts']
