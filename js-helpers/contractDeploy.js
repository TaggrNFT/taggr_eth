const { ethers, upgrades, getNamedAccounts, network } = require('hardhat');

const {
  saveDeploymentData,
  getContractAbi,
  getTxGasCost,
} = require('../js-helpers/deploy');

const {
  log,
  chainTypeById,
  chainNameById,
  chainIdByName,
} = require('../js-helpers/utils');

const _ = require('lodash');

const contractDeploy = async (args = {fromUnitTests: false}) => {
  const { deployer, protocolOwner } = await getNamedAccounts();
  const networkName = (await network).name;
  const deployData = {};

  const chainId = chainIdByName(networkName);
  const {isProd, isHardhat} = chainTypeById(chainId);

  if (!args.fromUnitTests) {
    log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    log('Taggr - Contract Deployment');
    log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');

    log(`  Using Network: ${chainNameById(chainId)} (${networkName}:${chainId})`);
    log('  Using Accounts:');
    log('  - Deployer:          ', deployer);
    log('  - Owner:             ', protocolOwner);
    log(' ');
  }

  //
  // Upgradeable Contracts
  //

  const Taggr = await ethers.getContractFactory('Taggr');
  let taggr;
  if (!args.fromUnitTests) {
    log('  Deploying Taggr...');
    const TaggrInstance = await upgrades.deployProxy(Taggr, [deployer]);
    taggr = await TaggrInstance.deployed();
  } else {
    taggr = await Taggr.deploy();
    await taggr.initialize(deployer);
  }
  deployData['Taggr'] = {
    abi: getContractAbi('Taggr'),
    address: taggr.address,
    deployTransaction: taggr.deployTransaction,
  }
  saveDeploymentData(chainId, deployData);
  if (!args.fromUnitTests) {
    log('  - Taggr:               ', taggr.address);
    log('     - Block:            ', taggr.deployTransaction.blockNumber);
    log('     - Gas Cost:         ', getTxGasCost({ deployTransaction: taggr.deployTransaction }));
  }


  const TaggrSettings = await ethers.getContractFactory('TaggrSettings');
  let taggrSettings;
  if (!args.fromUnitTests) {
    log('  Deploying TaggrSettings...');
    const TaggrSettingsInstance = await upgrades.deployProxy(TaggrSettings, [deployer]);
    taggrSettings = await TaggrSettingsInstance.deployed();
  } else {
    taggrSettings = await TaggrSettings.deploy();
    await taggrSettings.initialize(deployer);
  }
  deployData['TaggrSettings'] = {
    abi: getContractAbi('TaggrSettings'),
    address: taggrSettings.address,
    deployTransaction: taggrSettings.deployTransaction,
  }
  saveDeploymentData(chainId, deployData);
  if (!args.fromUnitTests) {
    log('  - TaggrSettings:       ', taggrSettings.address);
    log('     - Block:            ', taggrSettings.deployTransaction.blockNumber);
    log('     - Gas Cost:         ', getTxGasCost({ deployTransaction: taggrSettings.deployTransaction }));
  }


  const CustomerSettings = await ethers.getContractFactory('CustomerSettings');
  let customerSettings;
  if (!args.fromUnitTests) {
    log('  Deploying CustomerSettings...');
    const CustomerSettingsInstance = await upgrades.deployProxy(CustomerSettings, [deployer]);
    customerSettings = await CustomerSettingsInstance.deployed();
  } else {
    customerSettings = await CustomerSettings.deploy();
    await customerSettings.initialize(deployer);
  }
  deployData['CustomerSettings'] = {
    abi: getContractAbi('CustomerSettings'),
    address: customerSettings.address,
    deployTransaction: customerSettings.deployTransaction,
  }
  saveDeploymentData(chainId, deployData);
  if (!args.fromUnitTests) {
    log('  - CustomerSettings:    ', customerSettings.address);
    log('     - Block:            ', customerSettings.deployTransaction.blockNumber);
    log('     - Gas Cost:         ', getTxGasCost({ deployTransaction: customerSettings.deployTransaction }));
  }


  const NftDistributor = await ethers.getContractFactory('NftDistributor');
  let nftDistributor;
  if (!args.fromUnitTests) {
    log('  Deploying NftDistributor...');
    const NftDistributorInstance = await upgrades.deployProxy(NftDistributor, [deployer]);
    nftDistributor = await NftDistributorInstance.deployed();
  } else {
    nftDistributor = await NftDistributor.deploy();
    await nftDistributor.initialize(deployer);
  }
  deployData['NftDistributor'] = {
    abi: getContractAbi('NftDistributor'),
    address: nftDistributor.address,
    deployTransaction: nftDistributor.deployTransaction,
  }
  saveDeploymentData(chainId, deployData);
  if (!args.fromUnitTests) {
    log('  - NftDistributor:      ', nftDistributor.address);
    log('     - Block:            ', nftDistributor.deployTransaction.blockNumber);
    log('     - Gas Cost:         ', getTxGasCost({ deployTransaction: nftDistributor.deployTransaction }));
  }


  const TokenEscrow = await ethers.getContractFactory('TokenEscrow');
  let tokenEscrow;
  if (!args.fromUnitTests) {
    log('  Deploying TokenEscrow...');
    const TokenEscrowInstance = await upgrades.deployProxy(TokenEscrow, [deployer]);
    tokenEscrow = await TokenEscrowInstance.deployed();
  } else {
    tokenEscrow = await TokenEscrow.deploy();
    await tokenEscrow.initialize(deployer);
  }
  deployData['TokenEscrow'] = {
    abi: getContractAbi('TokenEscrow'),
    address: tokenEscrow.address,
    deployTransaction: tokenEscrow.deployTransaction,
  }
  saveDeploymentData(chainId, deployData);
  if (!args.fromUnitTests) {
    log('  - TokenEscrow:         ', tokenEscrow.address);
    log('     - Block:            ', tokenEscrow.deployTransaction.blockNumber);
    log('     - Gas Cost:         ', getTxGasCost({ deployTransaction: tokenEscrow.deployTransaction }));
  }

  const NftRelay = await ethers.getContractFactory('TaggrNftRelay');
  let nftRelay;
  if (!args.fromUnitTests) {
    log('  Deploying nft relay...');
    const NftRelayInstance = await upgrades.deployProxy(NftRelay, [deployer]);
    nftRelay = await NftRelayInstance.deployed();
  } else {
    nftRelay = await NftRelay.deploy();
    // await nftRelay.initialize(deployer);
  }
  deployData['TaggrNftRelay'] = {
    abi: getContractAbi('TaggrNftRelay'),
    address: nftRelay.address,
    deployTransaction: nftRelay.deployTransaction,
  }
  saveDeploymentData(chainId, deployData);
  if (!args.fromUnitTests) {
    log('  - NftRelay:         ', nftRelay.address);
    log('     - Block:            ', nftRelay.deployTransaction.blockNumber);
    log('     - Gas Cost:         ', getTxGasCost({ deployTransaction: nftRelay.deployTransaction }));
  }

  const TaggrFactoryLazy721 = await ethers.getContractFactory('TaggrFactoryLazy721');
  let taggrFactoryLazy721;
  if (!args.fromUnitTests) {
    log('  Deploying TaggrFactoryLazy721...');
    const TaggrFactoryLazy721Instance = await upgrades.deployProxy(TaggrFactoryLazy721, [deployer]);
    taggrFactoryLazy721 = await TaggrFactoryLazy721Instance.deployed();
  } else {
    taggrFactoryLazy721 = await TaggrFactoryLazy721.deploy();
    await taggrFactoryLazy721.initialize(deployer);
  }
  deployData['TaggrFactoryLazy721'] = {
    abi: getContractAbi('TaggrFactoryLazy721'),
    address: taggrFactoryLazy721.address,
    deployTransaction: taggrFactoryLazy721.deployTransaction,
  }
  saveDeploymentData(chainId, deployData);
  if (!args.fromUnitTests) {
    log('  - TaggrFactoryLazy721: ', taggrFactoryLazy721.address);
    log('     - Block:            ', taggrFactoryLazy721.deployTransaction.blockNumber);
    log('     - Gas Cost:         ', getTxGasCost({ deployTransaction: taggrFactoryLazy721.deployTransaction }));
  }



  //
  // Deploy NFT contracts in order to pre-verify the Byte-Code
  // this way the Minimal Proxies that are deployed are auto-verified.
  //

  if (!args.fromUnitTests) {
    log('  Deploying TaggrLazy721...');
  }
  const TaggrLazy721 = await ethers.getContractFactory('TaggrLazy721');
  const TaggrLazy721Instance = await TaggrLazy721.deploy();
  const taggrLazy721 = await TaggrLazy721Instance.deployed();
  deployData['TaggrLazy721'] = {
    abi: getContractAbi('TaggrLazy721'),
    address: taggrLazy721.address,
    deployTransaction: taggrLazy721.deployTransaction
  }
  saveDeploymentData(chainId, deployData);
  if (!args.fromUnitTests) {
    log('  - TaggrLazy721: ', taggrLazy721.address);
    log('     - Block:         ', taggrLazy721.deployTransaction.blockNumber);
    log('     - Gas Cost:      ', getTxGasCost({ deployTransaction: taggrLazy721.deployTransaction }));
  }


  //
  // Deploy Fake USDC with Premint for Testing/QA
  //

  let fakeUSDC;
  if (!isProd) {
    const FakeUSDC = await ethers.getContractFactory('FakeUSDC');
    if (!args.fromUnitTests) {
      log('  Deploying FakeUSDC...');
      const FakeUSDCInstance = await FakeUSDC.deploy();
      fakeUSDC = await FakeUSDCInstance.deployed();
    } else {
      fakeUSDC = await FakeUSDC.deploy();
    }
    deployData['FakeUSDC'] = {
      abi: getContractAbi('FakeUSDC'),
      address: fakeUSDC.address,
      deployTransaction: fakeUSDC.deployTransaction,
    }
    saveDeploymentData(chainId, deployData);
    if (!args.fromUnitTests) {
      log('  - FakeUSDC: ', fakeUSDC.address);
      log('     - Block:            ', fakeUSDC.deployTransaction.blockNumber);
      log('     - Gas Cost:         ', getTxGasCost({ deployTransaction: fakeUSDC.deployTransaction }));
    }
  }



  if (!args.fromUnitTests) {
    log('\n  Contract Deployment Data saved to "deployments" directory.');
    log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
  }

  const exportObj = {
    taggr,
    nftRelay,
    taggrSettings,
    customerSettings,
    nftDistributor,
    tokenEscrow,
    taggrFactoryLazy721,
  };

  if (!isProd) {
    exportObj['fakeUSDC'] = fakeUSDC;
  }

  return exportObj;
};

module.exports = {
  contractDeploy
};
